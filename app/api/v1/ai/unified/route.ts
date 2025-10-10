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
// Storage schema remains strict; for generation we use a permissive variant
import { ResumeGenerationSchema } from '@/libs/validation/resume-generation'
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
// TEMP DEBUG LOGGING (remove after investigation)
const DEBUG_AI_SERVER = true
const SERVER_LOG_PREFIX = '[UnifiedAI]'

type ServerLogLevel = 'log' | 'warn' | 'error'

function serverLog(level: ServerLogLevel, traceId: string, event: string, payload: Record<string, unknown> = {}): void {
  if (!DEBUG_AI_SERVER && level === 'log') return
  try {
    const message = `${SERVER_LOG_PREFIX} ${traceId} ${event}`
    if (level === 'error') console.error(message, payload)
    else if (level === 'warn') console.warn(message, payload)
    else console.log(message, payload)
  } catch {
    // ignore logging errors to avoid throwing inside Edge runtime
  }
}

function obfuscateUserId(userId?: string | null): string | null {
  if (!userId) return null
  if (userId.length <= 8) return userId
  return `${userId.slice(0, 4)}…${userId.slice(-4)}`
}

function summarizeResumeSections(data: any) {
  if (!data || typeof data !== 'object') return null
  const arrLen = (value: any) => (Array.isArray(value) ? value.length : 0)
  return {
    profile: data.profile ? 1 : 0,
    summary: data.summary ? 1 : 0,
    work: arrLen(data.work),
    education: arrLen(data.education),
    projects: arrLen(data.projects),
    skills: arrLen(data.skills),
    certifications: arrLen(data.certifications),
    awards: arrLen(data.awards),
    languages: arrLen(data.languages),
    extras: arrLen(data.extras),
  }
}

function summarizeCoverLetterSections(data: any) {
  if (!data || typeof data !== 'object') return null
  const arrLen = (value: any) => (Array.isArray(value) ? value.length : 0)
  return {
    from: data.from ? 1 : 0,
    to: data.to ? 1 : 0,
    salutation: data.salutation ? 1 : 0,
    bodyBlocks: arrLen(data.body),
    closing: data.closing ? 1 : 0,
  }
}

function countDateCoercions(before?: any[], after?: any[]): number {
  if (!Array.isArray(before) || !Array.isArray(after)) return 0
  const get = (collection: any[], index: number, key: 'startDate' | 'endDate') => collection[index]?.[key]
  let count = 0
  for (let i = 0; i < after.length; i += 1) {
    const beforeStart = get(before, i, 'startDate')
    const afterStart = get(after, i, 'startDate')
    if (typeof beforeStart === 'string' && /^\d{4}-\d{2}$/.test(beforeStart) && afterStart === `${beforeStart}-01`) count += 1
    const beforeEnd = get(before, i, 'endDate')
    const afterEnd = get(after, i, 'endDate')
    if (typeof beforeEnd === 'string' && /^\d{4}-\d{2}$/.test(beforeEnd) && afterEnd === `${beforeEnd}-01`) count += 1
  }
  return count
}

function buildNormalizationSummary(before: any, after: any, isResume: boolean) {
  if (isResume) {
    const beforeProfileEmail = before?.profile?.email?.trim()
    const afterProfileEmail = after?.profile?.email?.trim()
    return {
      emailPlaceholderInserted: !beforeProfileEmail && afterProfileEmail === 'user@example.com',
      workDateCoercions: countDateCoercions(before?.work, after?.work),
      educationDateCoercions: countDateCoercions(before?.education, after?.education),
      template: after?.appearance?.template ?? null,
      pageFormat: after?.appearance?.layout_settings?.pageFormat ?? null,
      summary: summarizeResumeSections(after),
    }
  }
  return {
    summary: summarizeCoverLetterSections(after),
    pageFormat: after?.appearance?.layout?.pageFormat ?? null,
  }
}

// Create a trace ID for correlating logs across events
function createTraceId(): string {
  try {
    // @ts-ignore - crypto exists in Edge runtime
    return crypto.randomUUID()
  } catch {
    return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

// Edge-safe base64 -> Uint8Array (avoids Node Buffer)
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const length = binaryString.length
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Sanitize common data quality issues from AI-extracted resume data
 * Handles: malformed emails, invalid URLs, whitespace issues
 */
function sanitizeResumeData(data: any): any {
  if (!data || typeof data !== 'object') return data

  const sanitized = { ...data }

  // Sanitize profile fields
  if (sanitized.profile) {
    const profile = { ...sanitized.profile }

    // Clean email: remove all whitespace, validate basic format
    if (profile.email && typeof profile.email === 'string') {
      const cleaned = profile.email.replace(/\s+/g, '')
      // Basic validation: must have @ and . and reasonable length
      if (cleaned.includes('@') && cleaned.includes('.') && cleaned.length >= 5 && cleaned.length <= 100) {
        profile.email = cleaned
      } else {
        // Invalid email - remove the field entirely (undefined passes optional validation)
        delete profile.email
      }
    }

    // Clean phone: remove excessive whitespace (keep single spaces between parts)
    if (typeof profile.phone === 'string') {
      const p = profile.phone.trim()
      if (!p || /^null$/i.test(p) || /^undefined$/i.test(p) || /^n\/?a$/i.test(p)) delete profile.phone
      else profile.phone = p.replace(/\s+/g, ' ').trim()
    }

    // Clean location: normalize whitespace
    if (typeof profile.location === 'string') {
      const loc = profile.location.trim()
      if (!loc || /^null$/i.test(loc) || /^undefined$/i.test(loc)) delete profile.location
      else profile.location = loc.replace(/\s+/g, ' ').trim()
    }

    // Clean URLs in photo/website/social: drop photo if invalid
    if (profile.photo && typeof profile.photo === 'object') {
      const url = typeof profile.photo.url === 'string' ? profile.photo.url.trim() : ''
      if (!/^https?:\/\//i.test(url)) {
        delete profile.photo
      } else {
        profile.photo.url = url
      }
    }
    if (profile.website && typeof profile.website === 'string') {
      const w = profile.website.trim()
      profile.website = /^https?:\/\//i.test(w) ? w : undefined
    }

    sanitized.profile = profile
  }

  // Sanitize work experience URLs and locations
  if (Array.isArray(sanitized.work)) {
    sanitized.work = sanitized.work.map((item: any) => {
      const next = { ...item }
      next.location = item.location ? String(item.location).replace(/\s+/g, ' ').trim() : item.location
      next.url = item.url ? String(item.url).trim() : item.url
      // Clean dates: treat 'null'/'undefined' as missing
      const cleanDate = (v: any) => (typeof v === 'string' && (/^null$/i.test(v) || /^undefined$/i.test(v))) ? undefined : v
      next.startDate = cleanDate(item.startDate)
      next.endDate = cleanDate(item.endDate)
      return next
    })
  }

  // Sanitize education URLs and locations
  if (Array.isArray(sanitized.education)) {
    sanitized.education = sanitized.education.map((item: any) => {
      const next = { ...item }
      next.location = item.location ? String(item.location).replace(/\s+/g, ' ').trim() : item.location
      next.url = item.url ? String(item.url).trim() : item.url
      const cleanDate = (v: any) => (typeof v === 'string' && (/^null$/i.test(v) || /^undefined$/i.test(v))) ? undefined : v
      next.startDate = cleanDate(item.startDate)
      next.endDate = cleanDate(item.endDate)
      return next
    })
  }

  // Sanitize project URLs
  if (Array.isArray(sanitized.projects)) {
    sanitized.projects = sanitized.projects.map((item: any) => {
      const next = { ...item }
      next.url = item.url ? String(item.url).trim() : item.url
      if (typeof next.url === 'string' && !/^https?:\/\//i.test(next.url)) next.url = undefined
      return next
    })
  }

  return sanitized
}

/**
 * Sanitize cover letter data
 */
function sanitizeCoverLetterData(data: any): any {
  if (!data || typeof data !== 'object') return data

  const sanitized = { ...data }

  // Sanitize from field
  if (sanitized.from) {
    const from = { ...sanitized.from }

    // Clean email
    if (from.email && typeof from.email === 'string') {
      const cleaned = from.email.replace(/\s+/g, '')
      if (cleaned.includes('@') && cleaned.includes('.') && cleaned.length >= 5 && cleaned.length <= 100) {
        from.email = cleaned
      } else {
        delete from.email
      }
    }

    // Clean phone
    if (from.phone && typeof from.phone === 'string') {
      from.phone = from.phone.replace(/\s+/g, ' ').trim()
    }

    sanitized.from = from
  }

  // Sanitize to field
  if (sanitized.to) {
    const to = { ...sanitized.to }

    // Clean email
    if (to.email && typeof to.email === 'string') {
      const cleaned = to.email.replace(/\s+/g, '')
      if (cleaned.includes('@') && cleaned.includes('.') && cleaned.length >= 5 && cleaned.length <= 100) {
        to.email = cleaned
      } else {
        delete to.email
      }
    }

    sanitized.to = to
  }

  return sanitized
}

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
  const traceId = createTraceId()

  try {
    // Auth + quota
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    serverLog('log', traceId, 'auth-check', {
      authError: authError?.message,
      hasUser: Boolean(user),
      userId: obfuscateUserId(user?.id),
    })
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', message: 'Authentication required', traceId }),
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
          traceId,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { docType, text, personalInfo, fileData, mimeType, editorData } = parsed.data
    serverLog('log', traceId, 'request', {
      docType,
      hasText: Boolean(text && text.trim().length > 0),
      textLen: text?.length || 0,
      hasFile: Boolean(fileData),
      hasEditorData: Boolean(editorData),
      editorKeys: editorData ? Object.keys(editorData).slice(0, 20) : [],
    })

    // If file provided, validate size
    let buffer: Uint8Array | null = null
    if (fileData) {
      const b = base64ToUint8Array(fileData)
      if (b.byteLength > 10 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ success: false, error: 'File too large', message: 'PDF must be under 10MB', traceId }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
      buffer = b
      serverLog('log', traceId, 'file-decoded', {
        byteLength: b.byteLength,
        mimeType: mimeType || 'application/pdf',
        firstBytes: Array.from(b.subarray(0, 4)),
      })
    }

    // Quota (daily)
    const quota = await checkDailyQuota(supabase, user.id)
    serverLog('log', traceId, 'quota-check', {
      allowed: quota.allowed,
      remaining: quota.remaining,
      resetAt: quota.resetAt.toISOString(),
      error: quota.error,
    })
    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Quota exceeded',
          message: quota.error || 'Daily quota exceeded',
          resetAt: quota.resetAt.toISOString(),
          traceId,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build model call
    const encoder = new TextEncoder()

    // Decide schema + streaming config
    const isResume = docType === 'resume'
    // Use a permissive/coercive schema for generation to avoid hard stops
    // Storage schema remains strict; we normalize after generation
    const schema = isResume ? ResumeGenerationSchema : CoverLetterJsonSchema

    // Helper: build unified instruction text
    const editorHint = editorData
      ? `\n\nUSER-PROVIDED STRUCTURED DATA:\n${JSON.stringify(editorData).slice(0, 50_000)}`
      : ''

    // Modes:
    // 1) PDF present -> use multimodal messages (text + file [+ optional extra text])
    // 2) Text only -> use existing prompt builders
    // 3) Editor data only -> use generic instruction text
    let result: any

    if (buffer) {
      serverLog('log', traceId, 'mode.pdf', { mimeType, bufferSize: buffer?.length || 0, isResume })
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

      result = streamObject({
        model: aiModel,
        mode: 'json', // CRITICAL: Force JSON mode for Gemini to prevent premature stream termination
        schema: schema as any,
        messages: [{ role: 'user', content: parts }],
        temperature: isResume ? 0.3 : 0.6,
        topP: isResume ? 0.9 : 0.95,
        maxRetries: 2,
        maxOutputTokens: isResume ? 16000 : 3000,
        onError: ({ error }) => {
          serverLog('error', traceId, 'streamObject.onError', {
            message: error instanceof Error ? error.message : 'unknown',
            name: error instanceof Error ? error.name : undefined,
            stack: error instanceof Error ? error.stack : undefined,
          })
        }
      })
    } else if (text && text.trim().length > 0) {
      // Text-only
      const prompt = isResume
        ? buildGenerationPrompt(text, personalInfo as PersonalInfo | undefined)
        : buildCoverLetterGenerationPrompt(text)

      // If editorData exists, append minimal instruction
      const finalPrompt = editorData
        ? `${prompt}\n\nUse the structured fields below if present. Prefer explicit user-provided values when generating.\n${JSON.stringify(editorData).slice(0, 50_000)}`
        : prompt

      serverLog('log', traceId, 'mode.text', {
        isResume,
        textLen: text.length,
        hasEditorData: Boolean(editorData),
      })
      result = streamObject({
        model: aiModel,
        mode: 'json', // CRITICAL: Force JSON mode for Gemini to prevent premature stream termination
        schema: schema as any,
        prompt: finalPrompt,
        temperature: isResume ? 0.3 : 0.6,
        topP: isResume ? 0.9 : 0.95,
        maxRetries: 2,
        maxOutputTokens: isResume ? 16000 : 3000,
        onError: ({ error }) => {
          serverLog('error', traceId, 'streamObject.onError', {
            message: error instanceof Error ? error.message : 'unknown',
            name: error instanceof Error ? error.name : undefined,
            stack: error instanceof Error ? error.stack : undefined,
          })
        }
      })
    } else {
      // editorData only
      const base = isResume
        ? 'Generate a complete ResumeJson using only the provided structured fields. Fill reasonable gaps but do not fabricate personal identifiers.'
        : 'Generate a complete CoverLetterJson using only the provided structured fields. Fill reasonable gaps but keep placeholders if needed.'
      const prompt = `${base}\n\nSTRUCTURED DATA:\n${JSON.stringify(editorData).slice(0, 50_000)}`
      serverLog('log', traceId, 'mode.editorData', {
        isResume,
        editorKeys: Object.keys(editorData || {}).slice(0, 20),
      })
      result = streamObject({
        model: aiModel,
        mode: 'json', // CRITICAL: Force JSON mode for Gemini to prevent premature stream termination
        schema: schema as any,
        prompt,
        temperature: 0.3,
        topP: 0.9,
        maxRetries: 2,
        maxOutputTokens: isResume ? 16000 : 3000,
        onError: ({ error }) => {
          serverLog('error', traceId, 'streamObject.onError', {
            message: error instanceof Error ? error.message : 'unknown',
            name: error instanceof Error ? error.name : undefined,
            stack: error instanceof Error ? error.stack : undefined,
          })
        }
      })
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
          serverLog('log', traceId, 'stream.start', { isResume })
          let updateCount = 0
          let partialIndex = 0
          for await (const partial of result.partialObjectStream as AsyncIterable<Record<string, unknown>>) {
            Object.keys(partial).forEach((k) => {
              if ((isResume ? resumeSections : clSections).includes(k)) seen.add(k)
            })

            const progress = Math.min(seen.size / total, 0.95)
            updateCount += 1
            partialIndex += 1
            const keys = Object.keys(partial)
            const counts = {
              work: Array.isArray((partial as any).work) ? (partial as any).work.length : undefined,
              education: Array.isArray((partial as any).education) ? (partial as any).education.length : undefined,
              projects: Array.isArray((partial as any).projects) ? (partial as any).projects.length : undefined,
              skills: Array.isArray((partial as any).skills) ? (partial as any).skills.length : undefined,
            }
            serverLog('log', traceId, 'stream.partial', {
              partialIndex,
              updateCount,
              progress,
              keys,
              counts,
              seenSections: seen.size,
            })
            controller.enqueue(encoder.encode(
              `event: progress\n` + `data: ${JSON.stringify({ type: 'progress', progress, traceId })}\n\n`
            ))
            controller.enqueue(encoder.encode(
              `event: update\n` + `data: ${JSON.stringify({ type: 'update', data: partial, traceId })}\n\n`
            ))
          }

          // Graceful validation with sanitization and error recovery
          let finalObject: any
          let validationWarnings: string[] = []

          try {
            // Try to get the validated object from AI stream
            serverLog('log', traceId, 'awaiting_result.object', { updateCount, partialIndex })
            const rawObject = await result.object

            const keys = Object.keys(rawObject as Record<string, unknown>)
            const counts = {
              work: Array.isArray((rawObject as any).work) ? (rawObject as any).work.length : undefined,
              education: Array.isArray((rawObject as any).education) ? (rawObject as any).education.length : undefined,
              projects: Array.isArray((rawObject as any).projects) ? (rawObject as any).projects.length : undefined,
              skills: Array.isArray((rawObject as any).skills) ? (rawObject as any).skills.length : undefined,
              certifications: Array.isArray((rawObject as any).certifications) ? (rawObject as any).certifications.length : undefined,
              awards: Array.isArray((rawObject as any).awards) ? (rawObject as any).awards.length : undefined,
              languages: Array.isArray((rawObject as any).languages) ? (rawObject as any).languages.length : undefined,
              extras: Array.isArray((rawObject as any).extras) ? (rawObject as any).extras.length : undefined,
            }
            serverLog('log', traceId, 'complete.raw', { updateCount, keys, counts })

            // Apply sanitization before final validation
            finalObject = isResume
              ? sanitizeResumeData(rawObject)
              : sanitizeCoverLetterData(rawObject)

            serverLog('log', traceId, 'sanitization.applied', {})
          } catch (validationError) {
            // Validation failed - this is a critical issue
            // The AI SDK throws when schema validation fails
            serverLog('error', traceId, 'validation.failed', {
              message: validationError instanceof Error ? validationError.message : 'unknown',
              name: validationError instanceof Error ? validationError.name : undefined,
              errorType: typeof validationError,
              errorKeys: validationError && typeof validationError === 'object' ? Object.keys(validationError) : [],
              hasText: validationError && typeof validationError === 'object' && 'text' in validationError,
              updateCount,
              partialIndex,
            })

            // Check if this is a validation error with partial data we can recover
            if (validationError && typeof validationError === 'object' && 'text' in validationError) {
              try {
                // Try to parse the raw text response
                const rawText = (validationError as any).text
                const parsedData = JSON.parse(rawText)

                // Apply sanitization to the recovered data
                finalObject = isResume
                  ? sanitizeResumeData(parsedData)
                  : sanitizeCoverLetterData(parsedData)

                validationWarnings.push('Some fields were auto-corrected due to validation errors. Please review the extracted data.')

                serverLog('warn', traceId, 'validation.recovered', {
                  hasData: !!finalObject,
                  keys: Object.keys(finalObject || {}),
                })
              } catch (parseError) {
                // Couldn't recover - re-throw original error
                serverLog('error', traceId, 'validation.recovery_failed', {
                  message: parseError instanceof Error ? parseError.message : 'unknown',
                })
                throw validationError
              }
            } else {
              // No partial data available - re-throw
              throw validationError
            }
          }

          const duration = Date.now() - startTime

          // Usage + quota tracking
          try {
            const usage = await result.usage
            // CRITICAL FIX: Vercel AI SDK uses inputTokens/outputTokens, NOT promptTokens/completionTokens
            // See: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object
            const inputTokens = usage.inputTokens || 0
            const outputTokens = usage.outputTokens || 0
            const cost = calculateCost(inputTokens, outputTokens)

            // Enhanced logging for debugging
            serverLog('log', traceId, 'usage.raw', {
              usage,
              inputTokens,
              outputTokens,
              totalTokens: usage.totalTokens,
              reasoningTokens: usage.reasoningTokens,
              cachedInputTokens: usage.cachedInputTokens,
            })

            serverLog('log', traceId, 'usage', {
              inputTokens,
              outputTokens,
              cost,
            })
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
            serverLog('warn', traceId, 'usage.logging_failed', {
              message: e instanceof Error ? e.message : 'unknown',
              stack: e instanceof Error ? e.stack : undefined,
            })
          }

          const normalizedFinal = isResume
            ? normalizeResumeData(finalObject as ResumeJson)
            : normalizeCoverLetterData(finalObject as CoverLetterJson)
          serverLog('log', traceId, 'complete.normalized', {
            keys: Object.keys(normalizedFinal as unknown as Record<string, unknown>),
            counts: {
              work: Array.isArray((normalizedFinal as any).work) ? (normalizedFinal as any).work.length : undefined,
              education: Array.isArray((normalizedFinal as any).education) ? (normalizedFinal as any).education.length : undefined,
              projects: Array.isArray((normalizedFinal as any).projects) ? (normalizedFinal as any).projects.length : undefined,
              skills: Array.isArray((normalizedFinal as any).skills) ? (normalizedFinal as any).skills.length : undefined,
              certifications: Array.isArray((normalizedFinal as any).certifications) ? (normalizedFinal as any).certifications.length : undefined,
              awards: Array.isArray((normalizedFinal as any).awards) ? (normalizedFinal as any).awards.length : undefined,
              languages: Array.isArray((normalizedFinal as any).languages) ? (normalizedFinal as any).languages.length : undefined,
              extras: Array.isArray((normalizedFinal as any).extras) ? (normalizedFinal as any).extras.length : undefined,
            },
            normalization: buildNormalizationSummary(finalObject, normalizedFinal, isResume),
          })

          // Send complete event with optional warnings
          const completePayload: any = {
            type: 'complete',
            data: normalizedFinal,
            duration,
            docType,
            traceId,
          }

          if (validationWarnings.length > 0) {
            completePayload.warnings = validationWarnings
            serverLog('warn', traceId, 'complete.warnings', {
              warnings: validationWarnings,
            })
          }

          controller.enqueue(
            encoder.encode(
              `event: complete\n` +
                `data: ${JSON.stringify(completePayload)}\n\n`
            )
          )
          controller.close()
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Streaming failed'
          serverLog('error', traceId, 'stream.error', { message })

          // Log failed op
          try {
            await createOperation(supabase, {
              user_id: user.id,
              operation_type: 'generate',
              duration_ms: Date.now() - startTime,
              success: false,
              error_message: message,
            })
          } catch (opError) {
            serverLog('warn', traceId, 'stream.error_oplog_failed', {
              message: opError instanceof Error ? opError.message : 'unknown',
            })
          }

          controller.enqueue(encoder.encode(`event: error\n` + `data: ${JSON.stringify({ type: 'error', message, traceId })}\n\n`))
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
        'X-Trace-Id': traceId,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal error'
    serverLog('error', traceId, 'request.error', { message })
    return new Response(JSON.stringify({ success: false, error: 'Internal server error', message, traceId }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
