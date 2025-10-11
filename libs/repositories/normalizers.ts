import {
  createDefaultAppearance,
  createDefaultSettings,
  type ResumeJson,
  type ResumeTemplateId,
  type SkillGroup,
} from '@/types/resume'
import { createDefaultCoverLetterAppearance, type CoverLetterJson } from '@/types/cover-letter'
import type { ResumeGenerative } from '@/libs/validation/resume'

const RESUME_TEMPLATES: ResumeTemplateId[] = [
  'azurill',
  'bronzor',
  'chikorita',
  'ditto',
  'gengar',
  'glalie',
  'kakuna',
  'leafish',
  'nosepass',
  'onyx',
  'pikachu',
  'rhyhorn',
]

const LANGUAGE_LEVELS = new Set(['Elementary', 'Conversational', 'Professional', 'Fluent', 'Native'])

const DEFAULT_LANGUAGE_LEVEL = 'Conversational'

function clampNumber(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function coerceTemplate(template: unknown): ResumeTemplateId {
  if (typeof template !== 'string') return 'onyx'
  const lower = template.toLowerCase()
  return (RESUME_TEMPLATES.find((candidate) => candidate === lower) ?? 'onyx') as ResumeTemplateId
}

function normalizeDate(value: unknown, allowPresent = false): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (allowPresent && trimmed.toLowerCase() === 'present') return 'Present'
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  return undefined
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

function normalizeStringArray(values: unknown): string[] | undefined {
  if (!Array.isArray(values)) return undefined
  const cleaned = values
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length)
  return cleaned.length ? cleaned : undefined
}

function normalizeSkillGroup(group: unknown): SkillGroup | null {
  if (!group || typeof group !== 'object') return null
  const raw = group as Record<string, unknown>
  const category = normalizeString(raw.category) || 'Skills'
  const rawItems = Array.isArray(raw.items) ? raw.items : []
  const items = rawItems
    .map((item) => {
      if (!item) return null
      if (typeof item === 'string') {
        const name = item.trim()
        return name ? { name, level: 3 } : null
      }
      if (typeof item === 'object') {
        const obj = item as Record<string, unknown>
        const name = normalizeString(obj.name)
        if (!name) return null
        const level = typeof obj.level === 'number' ? clampNumber(obj.level, 0, 5) : 3
        return { name, level }
      }
      return null
    })
    .filter(Boolean) as SkillGroup['items']

  if (!items.length) return null
  return { category, items }
}

function normalizeLanguages(languages: unknown): ResumeJson['languages'] {
  if (!Array.isArray(languages)) return undefined
  const normalized = languages
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const language = entry as Record<string, unknown>
      const name = normalizeString(language.name)
      if (!name) return null
      const level = typeof language.level === 'string' && LANGUAGE_LEVELS.has(language.level)
        ? language.level
        : DEFAULT_LANGUAGE_LEVEL
      return { name, level }
    })
    .filter((x): x is { name: string; level: string } => Boolean(x))
  return normalized.length ? (normalized as ResumeJson['languages']) : undefined
}

function normalizeWork(work: unknown): ResumeJson['work'] {
  if (!Array.isArray(work)) return undefined
  const normalized = work
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const company = normalizeString(raw.company)
      const role = normalizeString(raw.role)
      const startDate = normalizeDate(raw.startDate)
      if (!company || !role || !startDate) return null
      const location = normalizeString(raw.location)
      const endDate = normalizeDate(raw.endDate, true)
      const descriptionBullets = normalizeStringArray(raw.descriptionBullets)
      const achievements = normalizeStringArray(raw.achievements)
      const techStack = normalizeStringArray(raw.techStack)
      return {
        company,
        role,
        location,
        startDate,
        endDate: endDate ?? null,
        descriptionBullets,
        achievements,
        techStack,
      }
    })
    .filter(Boolean)
  return normalized.length ? (normalized as ResumeJson['work']) : undefined
}

function normalizeEducation(education: unknown): ResumeJson['education'] {
  if (!Array.isArray(education)) return undefined
  const normalized = education
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const school = normalizeString(raw.school)
      const degree = normalizeString(raw.degree)
      if (!school || !degree) return null
      const field = normalizeString(raw.field)
      const startDate = normalizeDate(raw.startDate)
      const endDate = normalizeDate(raw.endDate)
      const details = normalizeStringArray(raw.details)
      return { school, degree, field, startDate, endDate, details }
    })
    .filter(Boolean)
  return normalized.length ? (normalized as ResumeJson['education']) : undefined
}

function normalizeProjects(projects: unknown): ResumeJson['projects'] {
  if (!Array.isArray(projects)) return undefined
  const normalized = projects
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const name = normalizeString(raw.name)
      const summary = normalizeString(raw.summary)
      const bullets = normalizeStringArray(raw.bullets)
      const techStack = normalizeStringArray(raw.techStack)
      const link = typeof raw.link === 'string' ? raw.link : undefined
      if (!name && !summary && !bullets) return null
      return { name: name ?? 'Project', summary, bullets, techStack, link }
    })
    .filter(Boolean)
  return normalized.length ? (normalized as ResumeJson['projects']) : undefined
}

function normalizeCertifications(certifications: unknown): ResumeJson['certifications'] {
  if (!Array.isArray(certifications)) return undefined
  const normalized = certifications
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const name = normalizeString(raw.name)
      const issuer = normalizeString(raw.issuer)
      if (!name || !issuer) return null
      const date = normalizeDate(raw.date)
      return { name, issuer, date }
    })
    .filter(Boolean)
  return normalized.length ? (normalized as ResumeJson['certifications']) : undefined
}

function normalizeAwards(awards: unknown): ResumeJson['awards'] {
  if (!Array.isArray(awards)) return undefined
  const normalized = awards
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const name = normalizeString(raw.name)
      const org = normalizeString(raw.org)
      if (!name || !org) return null
      const date = normalizeDate(raw.date)
      const summary = normalizeString(raw.summary)
      return { name, org, date, summary }
    })
    .filter(Boolean)
  return normalized.length ? (normalized as ResumeJson['awards']) : undefined
}

function normalizeExtras(extras: unknown): ResumeJson['extras'] {
  if (!Array.isArray(extras)) return undefined
  const normalized = extras
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const raw = entry as Record<string, unknown>
      const title = normalizeString(raw.title)
      const content = normalizeString(raw.content)
      if (!title || !content) return null
      return { title, content }
    })
    .filter(Boolean)
  return normalized.length ? (normalized as ResumeJson['extras']) : undefined
}

function normalizeProfile(profile: unknown): ResumeJson['profile'] {
  const raw = typeof profile === 'object' && profile ? (profile as Record<string, unknown>) : {}
  const fullName = normalizeString(raw.fullName) || 'Untitled'
  const headline = normalizeString(raw.headline)
  const email = normalizeString(raw.email)
  const phone = normalizeString(raw.phone)
  let location: ResumeJson['profile']['location']
  if (typeof raw.location === 'string') {
    const city = normalizeString(raw.location)
    location = city ? { city } : undefined
  } else if (raw.location && typeof raw.location === 'object') {
    const loc = raw.location as Record<string, unknown>
    const city = normalizeString(loc.city)
    const region = normalizeString(loc.region)
    const country = normalizeString(loc.country)
    const postal = normalizeString(loc.postal)
    location = city || region || country || postal ? { city, region, country, postal } : undefined
  }
  const links = Array.isArray(raw.links)
    ? raw.links
        .map((link) => (link && typeof link === 'object' ? (link as Record<string, unknown>) : null))
        .filter((link): link is Record<string, unknown> => Boolean(link && typeof link.url === 'string'))
        .map((link) => ({
          type: typeof link.type === 'string' ? link.type : undefined,
          label: normalizeString(link.label),
          url: link.url as string,
        }))
    : undefined
  const photo = raw.photo && typeof raw.photo === 'object'
    ? ((): ResumeJson['profile']['photo'] | undefined => {
        const photoRaw = raw.photo as Record<string, unknown>
        if (typeof photoRaw.url !== 'string' || typeof photoRaw.path !== 'string') return undefined
        return { url: photoRaw.url, path: photoRaw.path }
      })()
    : undefined

  const profileObj: ResumeJson['profile'] = {
    fullName,
    headline,
    email: email ?? '',
    phone,
    location,
    links,
    photo,
  }

  return profileObj
}

export function normalizeResumeData(data: ResumeGenerative | ResumeJson): ResumeJson {
  const profile = normalizeProfile((data as any)?.profile)
  const summary = normalizeString((data as any)?.summary)
  const work = normalizeWork((data as any)?.work)
  const education = normalizeEducation((data as any)?.education)
  const projects = normalizeProjects((data as any)?.projects)
  const skills = Array.isArray((data as any)?.skills)
    ? ((data as any).skills
        .map((group: unknown) => normalizeSkillGroup(group))
        .filter(Boolean) as SkillGroup[])
    : undefined
  const certifications = normalizeCertifications((data as any)?.certifications)
  const awards = normalizeAwards((data as any)?.awards)
  const languages = normalizeLanguages((data as any)?.languages)
  const extras = normalizeExtras((data as any)?.extras)

  const rawSettings = (data as any)?.settings
  const rawAppearance = (data as any)?.appearance
  const pageSizeRaw = (rawSettings?.pageSize ?? rawAppearance?.layout_settings?.pageFormat) as 'A4' | 'Letter' | undefined
  const pageSize: 'A4' | 'Letter' = pageSizeRaw === 'A4' ? 'A4' : 'Letter'

  const settings = {
    ...createDefaultSettings(undefined, undefined, pageSize),
    ...(rawSettings ?? {}),
    pageSize,
  }

  const baseAppearance = createDefaultAppearance(pageSize)
  const appearance = {
    ...baseAppearance,
    ...(rawAppearance ?? {}),
    template: coerceTemplate(rawAppearance?.template),
    layout: Array.isArray(rawAppearance?.layout) && rawAppearance.layout.length
      ? (rawAppearance.layout as string[][][])
      : baseAppearance.layout,
    theme: {
      ...baseAppearance.theme,
      ...(rawAppearance?.theme ?? {}),
    },
    typography: {
      ...baseAppearance.typography,
      ...(rawAppearance?.typography ?? {}),
      fontSize: clampNumber(rawAppearance?.typography?.fontSize ?? baseAppearance.typography.fontSize, 8, 36),
      lineHeight: clampNumber(rawAppearance?.typography?.lineHeight ?? baseAppearance.typography.lineHeight, 1.0, 2.0),
    },
    layout_settings: {
      ...baseAppearance.layout_settings,
      ...(rawAppearance?.layout_settings ?? {}),
      margin: clampNumber(rawAppearance?.layout_settings?.margin ?? baseAppearance.layout_settings.margin, 8, 144),
      pageFormat: pageSize,
      showPageNumbers:
        typeof rawAppearance?.layout_settings?.showPageNumbers === 'boolean'
          ? rawAppearance.layout_settings.showPageNumbers
          : baseAppearance.layout_settings.showPageNumbers,
    },
  }

  return {
    profile,
    summary,
    work,
    education,
    projects,
    skills: skills && skills.length ? skills : undefined,
    certifications,
    awards,
    languages,
    extras,
    settings,
    appearance,
  }
}

export function normalizeCoverLetterData(data: CoverLetterJson): CoverLetterJson {
  const pageSize = data.settings?.pageSize === 'A4' ? 'A4' : 'Letter'
  const baseAppearance = createDefaultCoverLetterAppearance(pageSize)
  const appearance = {
    ...baseAppearance,
    ...(data.appearance ?? {}),
    theme: {
      ...baseAppearance.theme,
      ...(data.appearance?.theme ?? {}),
    },
    typography: {
      ...baseAppearance.typography,
      ...(data.appearance?.typography ?? {}),
      fontSize: clampNumber(data.appearance?.typography?.fontSize ?? baseAppearance.typography.fontSize, 8, 36),
      lineHeight: clampNumber(data.appearance?.typography?.lineHeight ?? baseAppearance.typography.lineHeight, 1.0, 2.0),
    },
    layout: {
      ...baseAppearance.layout,
      ...(data.appearance?.layout ?? {}),
      margin: clampNumber(data.appearance?.layout?.margin ?? baseAppearance.layout.margin, 16, 160),
      pageFormat: pageSize as 'A4' | 'Letter',
    },
  }

  return {
    ...data,
    appearance,
  }
}
