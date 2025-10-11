import { generateObject } from 'ai'
import { ZodError } from 'zod'
import { aiModel } from '@/libs/ai/provider'
import { ResumeGenerativeSchema, ResumeJsonSchema, type ResumeGenerative } from '@/libs/validation/resume'
import { sanitizeResumeData, sanitizeCoverLetterData } from '@/libs/sanitization/resume'
import { normalizeResumeData, normalizeCoverLetterData } from '@/libs/repositories/normalizers'
import type { ResumeJson } from '@/types/resume'
import type { CoverLetterJson } from '@/types/cover-letter'
import { CoverLetterJsonSchema } from '@/libs/validation/cover-letter'

export type AIMessagePart =
  | { type: 'text'; text: string }
  | { type: 'file'; data: Uint8Array; mediaType: string }

export interface ResumeGenerationOptions {
  traceId: string
  prompt?: string
  parts?: AIMessagePart[]
  temperature?: number
  topP?: number
  maxOutputTokens?: number
  onUsage?: (usage: ResumeGenerationUsage) => void | Promise<void>
}

export interface ResumeGenerationUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export interface ResumeGenerationResult {
  resume: ResumeJson
  raw: ResumeGenerative
  usage: ResumeGenerationUsage
  warnings: string[]
}

export interface CoverLetterGenerationResult {
  coverLetter: CoverLetterJson
  usage: ResumeGenerationUsage
  warnings: string[]
}

export class ResumeGenerationError extends Error {
  constructor(
    public code: 'VALIDATION_FAILED' | 'AI_ERROR',
    message: string,
    public cause?: unknown,
    public traceId?: string
  ) {
    super(message)
    this.name = 'ResumeGenerationError'
  }
}

export async function generateResume(options: ResumeGenerationOptions): Promise<ResumeGenerationResult> {
  if (!options.prompt && (!options.parts || options.parts.length === 0)) {
    throw new ResumeGenerationError('AI_ERROR', 'Prompt or parts are required for resume generation')
  }

  try {
    const callOptions: Record<string, unknown> = {
      model: aiModel,
      mode: 'json',
      schema: ResumeGenerativeSchema,
      temperature: options.temperature ?? 0.3,
      topP: options.topP ?? 0.9,
      maxOutputTokens: options.maxOutputTokens ?? 16000,
      maxRetries: 2,
    }

    if (options.parts && options.parts.length) {
      callOptions.messages = [{ role: 'user' as const, content: options.parts }]
    } else if (options.prompt) {
      callOptions.prompt = options.prompt
    } else {
      throw new ResumeGenerationError('AI_ERROR', 'Prompt or parts are required for resume generation', undefined, options.traceId)
    }

    console.log(`[ResumeGen] ${options.traceId} Starting generation with ${options.parts ? 'parts' : 'prompt'}`)
    if (options.prompt) {
      console.log(`[ResumeGen] ${options.traceId} Prompt length: ${options.prompt.length} chars`)
      console.log(`[ResumeGen] ${options.traceId} Prompt preview: ${options.prompt.slice(0, 300)}...`)
    }

    const result = await generateObject(callOptions as Parameters<typeof generateObject>[0])

    console.log(`[ResumeGen] ${options.traceId} AI returned object keys:`, Object.keys(result.object || {}))
    console.log(`[ResumeGen] ${options.traceId} Raw AI response (first 1000 chars):`, JSON.stringify(result.object, null, 2).slice(0, 1000))

    // Log section counts in raw AI response
    const aiResponse = result.object as any
    console.log(`[ResumeGen] ${options.traceId} Raw AI sections:`, {
      profile: Boolean(aiResponse?.profile),
      summary: Boolean(aiResponse?.summary),
      work: Array.isArray(aiResponse?.work) ? aiResponse.work.length : 0,
      education: Array.isArray(aiResponse?.education) ? aiResponse.education.length : 0,
      projects: Array.isArray(aiResponse?.projects) ? aiResponse.projects.length : 0,
      skills: Array.isArray(aiResponse?.skills) ? aiResponse.skills.length : 0,
      certifications: Array.isArray(aiResponse?.certifications) ? aiResponse.certifications.length : 0,
      awards: Array.isArray(aiResponse?.awards) ? aiResponse.awards.length : 0,
      languages: Array.isArray(aiResponse?.languages) ? aiResponse.languages.length : 0,
      extras: Array.isArray(aiResponse?.extras) ? aiResponse.extras.length : 0,
    })

    console.log(`[ResumeGen] ${options.traceId} Starting sanitization...`)
    const sanitized = sanitizeResumeData(result.object)
    console.log(`[ResumeGen] ${options.traceId} After sanitization sections:`, {
      work: Array.isArray(sanitized?.work) ? sanitized.work.length : 0,
      education: Array.isArray(sanitized?.education) ? sanitized.education.length : 0,
      projects: Array.isArray(sanitized?.projects) ? sanitized.projects.length : 0,
      skills: Array.isArray(sanitized?.skills) ? sanitized.skills.length : 0,
    })

    console.log(`[ResumeGen] ${options.traceId} Starting normalization...`)
    const normalized = normalizeResumeData(sanitized)
    console.log(`[ResumeGen] ${options.traceId} After normalization sections:`, {
      work: normalized.work?.length || 0,
      education: normalized.education?.length || 0,
      projects: normalized.projects?.length || 0,
      skills: normalized.skills?.length || 0,
    })

    console.log(`[ResumeGen] ${options.traceId} Starting final validation...`)
    const resume = ResumeJsonSchema.parse(normalized)
    console.log(`[ResumeGen] ${options.traceId} Final validated sections:`, {
      work: resume.work?.length || 0,
      education: resume.education?.length || 0,
      projects: resume.projects?.length || 0,
      skills: resume.skills?.length || 0,
    })

    const usage = result.usage || {}
    const inputTokens = (usage as any).inputTokens ?? (usage as any).promptTokens
    const outputTokens = (usage as any).outputTokens ?? (usage as any).completionTokens

    const usageSummary: ResumeGenerationUsage = {
      inputTokens: inputTokens ?? undefined,
      outputTokens: outputTokens ?? undefined,
      totalTokens:
        inputTokens && outputTokens
          ? inputTokens + outputTokens
          : (usage as any).totalTokens ?? undefined,
    }

    await options.onUsage?.(usageSummary)

    return {
      resume,
      raw,
      usage: usageSummary,
      warnings: [],
    }
  } catch (error) {
    console.error(`[ResumeGen] ${options.traceId} Error:`, error)
    if (error instanceof Error) {
      console.error(`[ResumeGen] ${options.traceId} Error message:`, error.message)
      console.error(`[ResumeGen] ${options.traceId} Error stack:`, error.stack?.slice(0, 500))
    }
    if (error instanceof ResumeGenerationError) throw error
    if (error instanceof ZodError) {
      console.error(`[ResumeGen] ${options.traceId} Zod errors:`, JSON.stringify(error.errors, null, 2))
      throw new ResumeGenerationError('VALIDATION_FAILED', 'Resume validation failed', error, options.traceId)
    }
    if (error instanceof Error) {
      throw new ResumeGenerationError('AI_ERROR', error.message, error, options.traceId)
    }
    throw new ResumeGenerationError('AI_ERROR', 'Unknown error during resume generation', error, options.traceId)
  }
}

export async function generateCoverLetter(options: ResumeGenerationOptions): Promise<CoverLetterGenerationResult> {
  if (!options.prompt && (!options.parts || options.parts.length === 0)) {
    throw new ResumeGenerationError('AI_ERROR', 'Prompt or parts are required for cover letter generation')
  }

  try {
    const callOptions: Record<string, unknown> = {
      model: aiModel,
      mode: 'json',
      schema: CoverLetterJsonSchema,
      temperature: options.temperature ?? 0.6,
      topP: options.topP ?? 0.95,
      maxOutputTokens: options.maxOutputTokens ?? 3000,
      maxRetries: 2,
    }

    if (options.parts && options.parts.length) {
      callOptions.messages = [{ role: 'user' as const, content: options.parts }]
    } else if (options.prompt) {
      callOptions.prompt = options.prompt
    } else {
      throw new ResumeGenerationError('AI_ERROR', 'Prompt or parts are required for cover letter generation', undefined, options.traceId)
    }

    const result = await generateObject(callOptions as Parameters<typeof generateObject>[0])

    const sanitized = sanitizeCoverLetterData(result.object as CoverLetterJson) ?? (result.object as CoverLetterJson)
    const normalized = normalizeCoverLetterData(sanitized)
    const coverLetter = CoverLetterJsonSchema.parse(normalized)

    const usage = result.usage || {}
    const inputTokens = (usage as any).inputTokens ?? (usage as any).promptTokens
    const outputTokens = (usage as any).outputTokens ?? (usage as any).completionTokens

    const usageSummary: ResumeGenerationUsage = {
      inputTokens: inputTokens ?? undefined,
      outputTokens: outputTokens ?? undefined,
      totalTokens:
        inputTokens && outputTokens
          ? inputTokens + outputTokens
          : (usage as any).totalTokens ?? undefined,
    }

    await options.onUsage?.(usageSummary)

    return {
      coverLetter,
      usage: usageSummary,
      warnings: [],
    }
  } catch (error) {
    if (error instanceof ResumeGenerationError) throw error
    if (error instanceof ZodError) {
      throw new ResumeGenerationError('VALIDATION_FAILED', 'Cover letter validation failed', error, options.traceId)
    }
    if (error instanceof Error) {
      throw new ResumeGenerationError('AI_ERROR', error.message, error, options.traceId)
    }
    throw new ResumeGenerationError('AI_ERROR', 'Unknown error during cover letter generation', error, options.traceId)
  }
}
