import { z } from 'zod'
import { createClient } from '@/libs/supabase/server'
import { checkDailyQuota, incrementQuota } from '@/libs/ai/rateLimiter'
import { calculateCost, createOperation } from '@/libs/repositories/aiOperations'
import { buildResumePDFPrompt, buildResumeTextPrompt, buildResumeEditorPrompt, type PersonalInfo } from '@/libs/ai/prompts'
import { buildCoverLetterGenerationPrompt } from '@/libs/ai/prompts/cover-letter'
import { generateResume, generateCoverLetter, ResumeGenerationError, type ResumeGenerationUsage, type AIMessagePart } from '@/libs/ai/resumeGenerator'
import type { ResumeJson } from '@/types/resume'
import type { CoverLetterJson } from '@/types/cover-letter'

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
    fileData: z.string().optional(),
    mimeType: z.literal('application/pdf').optional(),
    editorData: z.any().optional(),
  })
  .refine(
    (value) => Boolean((value.text && value.text.trim().length > 0) || value.fileData || value.editorData),
    { message: 'Provide at least one of text, fileData, or editorData' }
  )

const SERVER_LOG_PREFIX = '[UnifiedAI]'
const DEBUG_AI_SERVER = process.env.NODE_ENV !== 'production'

function createTraceId(): string {
  try {
    // @ts-ignore Edge runtime crypto
    return crypto.randomUUID()
  } catch {
    return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  }
}

function serverLog(level: 'log' | 'warn' | 'error', traceId: string, event: string, payload: Record<string, unknown> = {}): void {
  if (!DEBUG_AI_SERVER && level === 'log') return
  try {
    const message = `${SERVER_LOG_PREFIX} ${traceId} ${event}`
    if (level === 'error') console.error(message, payload)
    else if (level === 'warn') console.warn(message, payload)
    else console.log(message, payload)
  } catch {
    // noop
  }
}

function obfuscateUserId(userId?: string | null): string | null {
  if (!userId) return null
  return userId.length <= 8 ? userId : `${userId.slice(0, 4)}…${userId.slice(-4)}`
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const length = binary.length
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function summarizeResume(resume: ResumeJson): Record<string, number> {
  return {
    work: resume.work?.length ?? 0,
    education: resume.education?.length ?? 0,
    projects: resume.projects?.length ?? 0,
    skills: resume.skills?.length ?? 0,
  }
}

function collectResumeWarnings(resume: ResumeJson): string[] {
  const warnings: string[] = []
  if (!resume.work || resume.work.length === 0) warnings.push('No work experience detected.')
  if (!resume.education || resume.education.length === 0) warnings.push('No education entries detected.')
  if (!resume.skills || resume.skills.length === 0) warnings.push('No skill groups detected.')
  if (!resume.summary || resume.summary.trim().length === 0) warnings.push('Summary is empty.')
  return warnings
}

function collectCoverLetterWarnings(letter: CoverLetterJson): string[] {
  const warnings: string[] = []
  if (!letter.body || letter.body.length === 0) warnings.push('Cover letter body is empty.')
  return warnings
}

async function persistUsage(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  operation: 'import' | 'generate',
  usage: ResumeGenerationUsage,
  durationMs: number,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const inputTokens = usage.inputTokens ?? 0
  const outputTokens = usage.outputTokens ?? 0
  const totalTokens = usage.totalTokens ?? inputTokens + outputTokens
  const cost = inputTokens || outputTokens ? calculateCost(inputTokens, outputTokens) : 0

  await createOperation(supabase, {
    user_id: userId,
    operation_type: operation,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost,
    duration_ms: durationMs,
    success,
    error_message: errorMessage,
  })

  if (success) {
    await incrementQuota(supabase, userId, totalTokens, cost)
  }
}

async function handleResumeGeneration(
  traceId: string,
  userId: string,
  supabase: ReturnType<typeof createClient>,
  parsed: z.infer<typeof UnifiedRequestSchema>,
  startTime: number
): Promise<Response> {
  const { text, fileData, mimeType, editorData, personalInfo } = parsed

  const promptOptions = {
    personalInfo: personalInfo as PersonalInfo | undefined,
    editorData,
  }

  let parts: AIMessagePart[] | undefined
  let prompt: string | undefined

  if (fileData) {
    const buffer = base64ToUint8Array(fileData)
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return jsonError('File too large (max 10MB)', 400, traceId)
    }
    const pdfPrompt = buildResumePDFPrompt({ ...promptOptions, userInstructions: text })
    serverLog('log', traceId, 'prompt.pdf', {
      promptLength: pdfPrompt.length,
      promptPreview: pdfPrompt.slice(0, 200),
      bufferSize: buffer.byteLength,
    })
    parts = [
      { type: 'text', text: pdfPrompt },
      { type: 'file', data: buffer, mediaType: mimeType ?? 'application/pdf' },
    ]
  } else if (text) {
    prompt = buildResumeTextPrompt({ ...promptOptions, jobDescription: text })
    serverLog('log', traceId, 'prompt.text', {
      promptLength: prompt.length,
      promptPreview: prompt.slice(0, 200),
      jobDescLength: text.length,
    })
  } else if (editorData) {
    prompt = buildResumeEditorPrompt(promptOptions)
    serverLog('log', traceId, 'prompt.editor', {
      promptLength: prompt.length,
      hasEditorData: Boolean(editorData),
    })
  } else {
    return jsonError('No input provided', 400, traceId)
  }

  let usage: ResumeGenerationUsage = {}

  try {
    const result = await generateResume({
      traceId,
      prompt,
      parts,
      onUsage: (summary) => {
        usage = summary
      },
    })

    serverLog('log', traceId, 'ai.response.received', {
      hasResume: Boolean(result.resume),
      sections: {
        profile: Boolean(result.resume.profile),
        summary: Boolean(result.resume.summary),
        work: result.resume.work?.length || 0,
        education: result.resume.education?.length || 0,
        projects: result.resume.projects?.length || 0,
        skills: result.resume.skills?.length || 0,
        certifications: result.resume.certifications?.length || 0,
        awards: result.resume.awards?.length || 0,
        languages: result.resume.languages?.length || 0,
        extras: result.resume.extras?.length || 0,
      },
    })

    const warnings = collectResumeWarnings(result.resume)
    const durationMs = Date.now() - startTime

    await persistUsage(supabase, userId, fileData ? 'import' : 'generate', usage, durationMs, true)

    serverLog('log', traceId, 'response.success', {
      durationMs,
      warnings: warnings.length,
      summary: summarizeResume(result.resume),
    })

    return jsonSuccess(
      {
        data: result.resume,
        warnings,
        usage,
        summary: summarizeResume(result.resume),
        traceId,
        durationMs,
      },
      traceId
    )
  } catch (error) {
    serverLog('error', traceId, 'resume.generate.failed', { message: (error as Error).message })
    const durationMs = Date.now() - startTime
    await persistUsage(supabase, userId, fileData ? 'import' : 'generate', usage, durationMs, false, (error as Error).message)

    if (error instanceof ResumeGenerationError) {
      const status = error.code === 'VALIDATION_FAILED' ? 422 : 502
      return jsonError(error.message, status, traceId)
    }

    return jsonError('Resume generation failed', 502, traceId)
  }
}

async function handleCoverLetterGeneration(
  traceId: string,
  userId: string,
  supabase: ReturnType<typeof createClient>,
  parsed: z.infer<typeof UnifiedRequestSchema>,
  startTime: number
): Promise<Response> {
  const { text } = parsed
  if (!text || text.trim().length === 0) {
    return jsonError('Job description text is required for cover letter generation', 400, traceId)
  }

  const prompt = buildCoverLetterGenerationPrompt(text, undefined)

  let usage: ResumeGenerationUsage = {}

  try {
    const result = await generateCoverLetter({
      traceId,
      prompt,
      onUsage: (summary) => {
        usage = summary
      },
    })

    const warnings = collectCoverLetterWarnings(result.coverLetter)
    const durationMs = Date.now() - startTime

    await persistUsage(supabase, userId, 'generate', usage, durationMs, true)

    return jsonSuccess(
      {
        data: result.coverLetter,
        warnings,
        usage,
        traceId,
        durationMs,
      },
      traceId
    )
  } catch (error) {
    serverLog('error', traceId, 'cover-letter.generate.failed', { message: (error as Error).message })
    const durationMs = Date.now() - startTime
    await persistUsage(supabase, userId, 'generate', usage, durationMs, false, (error as Error).message)

    if (error instanceof ResumeGenerationError) {
      const status = error.code === 'VALIDATION_FAILED' ? 422 : 502
      return jsonError(error.message, status, traceId)
    }

    return jsonError('Cover letter generation failed', 502, traceId)
  }
}

function jsonSuccess(payload: Record<string, unknown>, traceId: string): Response {
  return new Response(
    JSON.stringify({ success: true, traceId, ...payload }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

function jsonError(message: string, status: number, traceId: string): Response {
  return new Response(
    JSON.stringify({ success: false, error: message, traceId }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}

export async function POST(req: Request) {
  const startTime = Date.now()
  const traceId = createTraceId()

  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  serverLog('log', traceId, 'auth.check', {
    hasUser: Boolean(user),
    authError: authError?.message,
    userId: obfuscateUserId(user?.id),
  })

  if (authError || !user) {
    return jsonError('Authentication required', 401, traceId)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch (error) {
    return jsonError('Invalid JSON body', 400, traceId)
  }

  serverLog('log', traceId, 'request.body', {
    docType: (body as any)?.docType,
    hasText: Boolean((body as any)?.text),
    textLength: (body as any)?.text?.length,
    hasFileData: Boolean((body as any)?.fileData),
    fileDataLength: (body as any)?.fileData?.length,
    hasEditorData: Boolean((body as any)?.editorData),
    hasPersonalInfo: Boolean((body as any)?.personalInfo),
  })

  const parsed = UnifiedRequestSchema.safeParse(body)
  if (!parsed.success) {
    serverLog('error', traceId, 'validation.failed', { errors: parsed.error.errors })
    return jsonError(parsed.error.message, 400, traceId)
  }

  const quota = await checkDailyQuota(supabase, user.id)
  if (!quota.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: quota.error || 'Daily quota exceeded',
        traceId,
        remaining: quota.remaining,
        resetAt: quota.resetAt.toISOString(),
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  serverLog('log', traceId, 'quota.allowed', { remaining: quota.remaining })

  if (parsed.data.docType === 'resume') {
    return handleResumeGeneration(traceId, user.id, supabase, parsed.data, startTime)
  }

  return handleCoverLetterGeneration(traceId, user.id, supabase, parsed.data, startTime)
}
