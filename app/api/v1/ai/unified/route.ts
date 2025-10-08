/**
 * Unified AI Endpoint (Resume + Cover Letter)
 *
 * Streams structured ResumeJson or CoverLetterJson based on docType.
 * Accepts optional text instructions and/or PDF (base64) in one request.
 *
 * POST /api/v1/ai/unified
 */

import { streamObject } from 'ai'
import { z } from 'zod'
import { aiModel } from '@/libs/ai/provider'
import { ResumeJsonSchema } from '@/libs/validation/resume'
import { CoverLetterJsonSchema } from '@/libs/validation/cover-letter'
import { normalizeResumeData, normalizeCoverLetterData } from '@/libs/repositories/normalizers'
import type { ResumeJson } from '@/types/resume'
import type { CoverLetterJson } from '@/types/cover-letter'
import { buildGenerationPrompt, type PersonalInfo, buildPDFExtractionPrompt } from '@/libs/ai/prompts'
import { buildCoverLetterGenerationPrompt } from '@/libs/ai/prompts/cover-letter'
import { createClient } from '@/libs/supabase/server'
import { checkDailyQuota, incrementQuota } from '@/libs/ai/rateLimiter'
import { createOperation, calculateCost } from '@/libs/repositories/aiOperations'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const UnifiedRequestSchema = z
  .object({
    docType: z.enum(['resume', 'cover-letter']),
    text: z.string().max(8000).optional(),
    personalInfo: z
      .object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        location: z.string().optional(),
      })
      .optional(),
    fileData: z.string().optional(), // base64
    mimeType: z.literal('application/pdf').optional(),
    editorData: z.any().optional(),
  })
  .refine(
    (v) => Boolean((v.text && v.text.trim().length > 0) || v.fileData || v.editorData),
    { message: 'Provide at least one of text, fileData, or editorData' }
  )

export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    // Auth + quota
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const parsed = UnifiedRequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request',
          message: parsed.error.errors[0]?.message || 'Validation failed',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { docType, text, personalInfo, fileData, mimeType, editorData } = parsed.data

    // If file provided, validate size
    let buffer: Uint8Array | null = null
    if (fileData) {
      const b = Buffer.from(fileData, 'base64')
      if (b.length > 10 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ success: false, error: 'File too large', message: 'PDF must be under 10MB' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      buffer = b
    }

    // Quota (daily)
    const quota = await checkDailyQuota(supabase, user.id)
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Quota exceeded',
          message: quota.error || 'Daily quota exceeded',
          resetAt: quota.resetAt.toISOString(),
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build model call
    const encoder = new TextEncoder()

    // Decide schema + streaming config
    const isResume = docType === 'resume'
    const schema = isResume ? ResumeJsonSchema : CoverLetterJsonSchema

    // Helper: build unified instruction text
    const editorHint = editorData
      ? `\n\nUSER-PROVIDED STRUCTURED DATA:\n${JSON.stringify(editorData).slice(0, 50_000)}`
      : ''

    // Modes:
    // 1) PDF present -> use multimodal messages (text + file [+ optional extra text])
    // 2) Text only -> use existing prompt builders
    // 3) Editor data only -> use generic instruction text
    let result: ReturnType<typeof streamObject<any>>

    if (buffer) {
      const parts: Array<any> = []

      if (isResume) {
        parts.push({ type: 'text', text: buildPDFExtractionPrompt() })
        if (text && text.trim().length > 0) {
          parts.push({
            type: 'text',
            text:
              `Instructions from user:\n${text}\n\nUsing the PDF and these instructions, output ONLY a valid ResumeJson per schema. Do not include commentary.` +
              editorHint,
          })
        } else if (editorData) {
          parts.push({
            type: 'text',
            text:
              `Use the PDF to extract data and combine with the provided structured fields above. Output ONLY a valid ResumeJson.` +
              editorHint,
          })
        } else {
          parts.push({
            type: 'text',
            text: `Use the PDF to extract data and output ONLY a valid ResumeJson.`,
          })
        }
      } else {
        const clBase = `You are generating a professional cover letter. Use all provided inputs. Output ONLY a valid CoverLetterJson object.`
        parts.push({ type: 'text', text: clBase + editorHint + (text ? `\n\nInstructions from user:\n${text}` : '') })
      }

      if (buffer) {
        parts.push({ type: 'file', data: buffer, mediaType: mimeType || 'application/pdf' })
      }

      result = streamObject({ model: aiModel, schema, messages: [{ role: 'user', content: parts }], temperature: isResume ? 0.5 : 0.6, maxRetries: 1 })
    } else if (text && text.trim().length > 0) {
      // Text-only
      const prompt = isResume
        ? buildGenerationPrompt(text, personalInfo as PersonalInfo | undefined)
        : buildCoverLetterGenerationPrompt(text)

      // If editorData exists, append minimal instruction
      const finalPrompt = editorData
        ? `${prompt}\n\nUse the structured fields below if present. Prefer explicit user-provided values when generating.\n${JSON.stringify(editorData).slice(0, 50_000)}`
        : prompt

      result = streamObject({ model: aiModel, schema, prompt: finalPrompt, temperature: 0.6, maxRetries: 1 })
    } else {
      // editorData only
      const base = isResume
        ? 'Generate a complete ResumeJson using only the provided structured fields. Fill reasonable gaps but do not fabricate personal identifiers.'
        : 'Generate a complete CoverLetterJson using only the provided structured fields. Fill reasonable gaps but keep placeholders if needed.'
      const prompt = `${base}\n\nSTRUCTURED DATA:\n${JSON.stringify(editorData).slice(0, 50_000)}`
      result = streamObject({ model: aiModel, schema, prompt, temperature: 0.5, maxRetries: 1 })
    }

    // SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        // Track sections for progress
        const seen = new Set<string>()
        const resumeSections = ['profile', 'summary', 'work', 'education', 'projects', 'skills', 'certifications', 'awards', 'languages', 'extras']
        const clSections = ['from', 'to', 'salutation', 'body', 'closing']
        const total = isResume ? resumeSections.length : clSections.length

        try {
          for await (const partial of result.partialObjectStream as AsyncIterable<Record<string, unknown>>) {
            Object.keys(partial).forEach((k) => {
              if ((isResume ? resumeSections : clSections).includes(k)) seen.add(k)
            })

            const progress = Math.min(seen.size / total, 0.95)
            controller.enqueue(encoder.encode(`event: progress\n` + `data: ${JSON.stringify({ type: 'progress', progress })}\n\n`))
            controller.enqueue(encoder.encode(`event: update\n` + `data: ${JSON.stringify({ type: 'update', data: partial })}\n\n`))
          }

          const finalObject = await result.object
          const duration = Date.now() - startTime

          // Usage + quota tracking
          try {
            const usage = await result.usage
            const inputTokens = (usage as any).promptTokens || 0
            const outputTokens = (usage as any).completionTokens || 0
            const cost = calculateCost(inputTokens, outputTokens)
            await incrementQuota(supabase, user.id, inputTokens + outputTokens, cost)
            await createOperation(supabase, {
              user_id: user.id,
              operation_type: 'generate',
              input_tokens: inputTokens,
              output_tokens: outputTokens,
              cost,
              duration_ms: duration,
              success: true,
            })
          } catch (e) {
            console.warn('[UnifiedAI] usage/quota logging failed:', e)
          }

          const normalizedFinal = isResume
            ? normalizeResumeData(finalObject as ResumeJson)
            : normalizeCoverLetterData(finalObject as CoverLetterJson)

          controller.enqueue(
            encoder.encode(
              `event: complete\n` +
                `data: ${JSON.stringify({ type: 'complete', data: normalizedFinal, duration, docType })}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          console.error('[UnifiedAI] Stream error:', error)
          const message = error instanceof Error ? error.message : 'Streaming failed'

          // Log failed op
          try {
            await createOperation(supabase, {
              user_id: user.id,
              operation_type: 'generate',
              duration_ms: Date.now() - startTime,
              success: false,
              error_message: message,
            })
          } catch {
            // Ignore quota/operation logging errors so generation response still streams
          }

          controller.enqueue(encoder.encode(`event: error\n` + `data: ${JSON.stringify({ type: 'error', message })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('[UnifiedAI] Request error:', error)
    const message = error instanceof Error ? error.message : 'Internal error'
    return new Response(JSON.stringify({ success: false, error: 'Internal server error', message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
