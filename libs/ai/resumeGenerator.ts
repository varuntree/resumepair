import { generateObject, NoObjectGeneratedError, TypeValidationError } from 'ai'
import { google } from '@ai-sdk/google'
import {
  createDefaultAppearance,
  createDefaultLayout,
  createDefaultSettings,
  type ResumeJson,
} from '@/types/resume'
import type { CoverLetterJson } from '@/types/cover-letter'
import { CoverLetterJsonSchema } from '@/libs/validation/cover-letter'
import { normalizeCoverLetterData } from '@/libs/repositories/normalizers'
import { ResumeAIOutputSchema, type ResumeAIOutput } from '@/libs/validation/resume-ai'

// Single-flow AI generation: structured output + optional repair → normalized ResumeJson.

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
  raw: ResumeAIOutput
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

const SYSTEM_PROMPT = [
  'You are a professional resume engine. Read the provided inputs (text and/or PDF).',
  'Produce a complete resume JSON that matches the supplied schema.',
  'Rules:',
  '• Use crisp, ATS-friendly bullets.',
  '• Quantify impact when truthful.',
  '• Accept YYYY, YYYY-MM, or YYYY-MM-DD dates; use "Present" for current roles.',
  '• Never invent employers, degrees, or dates.',
  '• Respond with JSON only, no markdown or commentary.',
].join(' ')

const model = google('gemini-2.5-flash')

const MAX_SECTION_ITEMS = 12

const trim = (value?: string | null): string | undefined => {
  if (!value) return undefined
  const next = value.trim()
  return next ? next : undefined
}

const normalizeDate = (value?: string | null): string | undefined => {
  const next = trim(value)
  if (!next) return undefined
  if (/^(?:19|20)\d{2}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(next)) {
    return next
  }
  if (next === 'Present') return 'Present'
  const year = next.match(/\b(19|20)\d{2}\b/)
  return year ? year[0] : undefined
}

const clampList = <T,>(items: T[] | undefined, max = MAX_SECTION_ITEMS): T[] | undefined => {
  if (!items || !items.length) return undefined
  return items.slice(0, max)
}

const cleanStringArray = (items?: string[], max = MAX_SECTION_ITEMS): string[] | undefined => {
  if (!items) return undefined
  const cleaned = items
    .map((value) => trim(value))
    .filter((value): value is string => Boolean(value))
  return clampList(cleaned, max)
}

function stringifyLocation(location?: string): ResumeJson['profile']['location'] {
  const loc = trim(location)
  if (!loc) return undefined
  return { city: loc }
}

const attemptRepairObject = (text: string): ResumeAIOutput | null => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  const candidate = text.slice(start, end + 1)
  try {
    return ResumeAIOutputSchema.parse(JSON.parse(candidate))
  } catch {
    return null
  }
}

function toResumeJson(raw: ResumeAIOutput): { resume: ResumeJson; warnings: string[] } {
  const warnings: string[] = []

  const profile = (() => {
    const source = raw.profile ?? {}
    const email = trim(source.email)
    if (!email) warnings.push('Missing email; inserted placeholder.')

    const linksArray: Array<{ url: string; label?: string }> = []
    for (const link of source.links ?? []) {
      const url = trim(link.url)
      if (!url) continue
      const label = trim(link.label)
      linksArray.push({ url, label })
    }

    return {
      fullName: trim(source.fullName) ?? 'Anonymous Candidate',
      headline: trim(source.title),
      email: email ?? 'unknown@example.com',
      phone: trim(source.phone),
      location: stringifyLocation(source.location),
      links: linksArray.length ? linksArray : undefined,
    }
  })()

  const work = (raw.work ?? []).map((entry) => {
    const company = trim(entry.company) ?? 'Company'
    const role = trim(entry.title) ?? 'Role'
    const startDate = normalizeDate(entry.startDate) ?? '0000'
    const endDate = normalizeDate(entry.endDate) ?? null
    const bullets = cleanStringArray(entry.bullets, 8)
    const techStack = cleanStringArray(entry.techStack, 12)

    if (!entry.company || !entry.title) {
      warnings.push('Work item missing company or role; defaults applied.')
    }

    return {
      company,
      role,
      location: trim(entry.location),
      startDate,
      endDate,
      descriptionBullets: bullets,
      achievements: undefined,
      techStack,
    }
  }).filter((item) => item.company || item.role)

  const education = (raw.education ?? []).map((entry) => ({
    school: trim(entry.institution) ?? 'Institution',
    degree: trim(entry.degree) ?? 'Degree',
    field: trim(entry.area),
    startDate: normalizeDate(entry.startDate),
    endDate: normalizeDate(entry.endDate),
    details: cleanStringArray(entry.details, 6),
  }))

  const projects = (raw.projects ?? []).map((entry) => ({
    name: trim(entry.name) ?? 'Project',
    summary: undefined,
    link: trim(entry.link),
    bullets: cleanStringArray(entry.bullets, 6),
    techStack: cleanStringArray(entry.tech, 10),
  }))

  const skills = (raw.skills ?? []).map((group) => ({
    category: group.category,
    items: group.items.map((item) => ({ name: item })),
  }))

  const certifications = (raw.certifications ?? []).map((entry) => ({
    name: entry.name ?? 'Certification',
    issuer: entry.issuer ?? '',
    date: normalizeDate(entry.date),
  }))

  const awards = (raw.awards ?? []).map((entry) => ({
    name: entry.name ?? 'Award',
    org: entry.by ?? '',
    date: normalizeDate(entry.date),
    summary: trim(entry.summary),
  }))

  const languages = (raw.languages ?? []).map((entry) => ({
    name: entry.name ?? 'Language',
    level: entry.level ?? 'Professional',
  }))

  const extras = (raw.extras ?? []).map((content, index) => ({
    title: `Additional ${index + 1}`,
    content: trim(content) ?? '',
  })).filter((extra) => extra.content)

  if (!work.length) warnings.push('No work experience generated.')
  if (!education.length) warnings.push('No education entries generated.')
  if (!skills.length) warnings.push('No skill groups generated.')

  const settings = createDefaultSettings()
  const appearanceBase = createDefaultAppearance(settings.pageSize)

  const resume: ResumeJson = {
    profile,
    summary: trim(raw.summary),
    work: work.length ? work : undefined,
    education: education.length ? education : undefined,
    projects: projects.length ? projects : undefined,
    skills: skills.length ? skills : undefined,
    certifications: certifications.length ? certifications : undefined,
    awards: awards.length ? awards : undefined,
    languages: languages.length ? languages : undefined,
    extras: extras.length ? extras : undefined,
    settings,
    appearance: {
      ...appearanceBase,
      layout: createDefaultLayout(),
    },
  }

  return { resume, warnings }
}

const extractUsage = (value: unknown): ResumeGenerationUsage => {
  if (!value || typeof value !== 'object') return {}
  const asAny = value as Record<string, number | undefined>
  const inputTokens = asAny.inputTokens ?? asAny.promptTokens
  const outputTokens = asAny.outputTokens ?? asAny.completionTokens
  const totalTokens = asAny.totalTokens ?? (inputTokens && outputTokens ? inputTokens + outputTokens : undefined)
  return { inputTokens, outputTokens, totalTokens }
}

export async function generateResume(options: ResumeGenerationOptions): Promise<ResumeGenerationResult> {
  if (!options.prompt && (!options.parts || options.parts.length === 0)) {
    throw new ResumeGenerationError('AI_ERROR', 'Prompt or parts are required for resume generation', undefined, options.traceId)
  }

  const content: AIMessagePart[] = []
  if (options.prompt?.trim()) {
    content.push({ type: 'text', text: options.prompt })
  }
  if (options.parts?.length) {
    content.push(...options.parts)
  }
  if (!content.length) {
    throw new ResumeGenerationError('AI_ERROR', 'No content provided for resume generation', undefined, options.traceId)
  }
  const messages = [{ role: 'user' as const, content }]

  try {
    const result = await generateObject({
      model,
      system: SYSTEM_PROMPT,
      messages,
      schema: ResumeAIOutputSchema,
      temperature: options.temperature ?? 0.3,
      topP: options.topP,
      maxOutputTokens: options.maxOutputTokens ?? 16000,
      abortSignal: AbortSignal.timeout(60_000),
      maxRetries: 1,
    })

    const aiOut = result.object as ResumeAIOutput
    const { resume, warnings } = toResumeJson(aiOut)
    const usage = extractUsage(result.usage)
    if (options.onUsage) await options.onUsage(usage)

    return { resume, raw: aiOut, usage, warnings }
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) || TypeValidationError.isInstance(error)) {
      try {
        const originalText = typeof (error as any)?.text === 'string' ? (error as any).text : undefined
        if (!originalText) {
          throw new ResumeGenerationError('VALIDATION_FAILED', 'AI output missing text for repair', error, options.traceId)
        }
        const parsed = attemptRepairObject(originalText)
        if (!parsed) {
          throw new ResumeGenerationError('VALIDATION_FAILED', 'Unable to repair AI output', error, options.traceId)
        }
        const { resume, warnings } = toResumeJson(parsed)
        const usage = extractUsage(undefined)
        if (options.onUsage) await options.onUsage(usage)
        return { resume, raw: parsed, usage, warnings: ['Output repaired', ...warnings] }
      } catch (repairError) {
        throw new ResumeGenerationError('VALIDATION_FAILED', 'Failed to repair/validate AI output', repairError, options.traceId)
      }
    }
    throw new ResumeGenerationError('AI_ERROR', 'Resume generation failed', error, options.traceId)
  }
}

export async function generateCoverLetter(options: ResumeGenerationOptions): Promise<CoverLetterGenerationResult> {
  if (!options.prompt && (!options.parts || options.parts.length === 0)) {
    throw new ResumeGenerationError('AI_ERROR', 'Prompt or parts are required for cover letter generation', undefined, options.traceId)
  }

  const coverParts: AIMessagePart[] = []
  if (options.prompt?.trim()) {
    coverParts.push({ type: 'text', text: options.prompt })
  }
  if (options.parts?.length) {
    coverParts.push(...options.parts)
  }
  if (!coverParts.length) {
    throw new ResumeGenerationError('AI_ERROR', 'No content provided for cover letter generation', undefined, options.traceId)
  }
  const coverMessages = [{ role: 'user' as const, content: coverParts }]

  try {
    const result = await generateObject({
      model,
      system: 'You are a professional cover letter assistant. Return JSON matching the provided schema only.',
      messages: coverMessages,
      schema: CoverLetterJsonSchema,
      temperature: options.temperature ?? 0.6,
      topP: options.topP ?? 0.95,
      maxOutputTokens: options.maxOutputTokens ?? 3000,
      abortSignal: AbortSignal.timeout(45_000),
      maxRetries: 1,
    })

    const normalized = normalizeCoverLetterData(result.object as CoverLetterJson)
    const coverLetter = CoverLetterJsonSchema.parse(normalized)
    const usage = extractUsage(result.usage)
    if (options.onUsage) await options.onUsage(usage)

    return { coverLetter, usage, warnings: [] }
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) || TypeValidationError.isInstance(error)) {
      throw new ResumeGenerationError('VALIDATION_FAILED', 'Cover letter output invalid', error, options.traceId)
    }
    throw new ResumeGenerationError('AI_ERROR', 'Cover letter generation failed', error, options.traceId)
  }
}
