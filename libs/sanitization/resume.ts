import { type ResumeGenerative, ResumeGenerativeSchema } from '@/libs/validation/resume'
import type { CoverLetterJson } from '@/types/cover-letter'
import { z } from 'zod'

type UnknownRecord = Record<string, unknown>

const LooseResumeSchema = ResumeGenerativeSchema.catchall(z.any())

const INVALID_PLACEHOLDER_PATTERN = /^(null|undefined|n\/?a)$/i

function sanitizeEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = value.replace(/\s+/g, '')
  if (!cleaned.includes('@') || !cleaned.includes('.')) return undefined
  if (cleaned.length < 5 || cleaned.length > 100) return undefined
  return cleaned
}

function sanitizePhone(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed || INVALID_PLACEHOLDER_PATTERN.test(trimmed)) return undefined
  return trimmed.replace(/\s+/g, ' ').trim()
}

function sanitizeURL(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!/^https?:\/\//i.test(trimmed)) return undefined
  return trimmed
}

function sanitizeDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (INVALID_PLACEHOLDER_PATTERN.test(value)) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function sanitizeLinks(links: unknown): UnknownRecord[] | undefined {
  if (!Array.isArray(links)) return undefined
  const cleaned = links
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const obj = { ...(entry as UnknownRecord) }
      if (obj.url) {
        const url = sanitizeURL(obj.url)
        if (!url) return null
        obj.url = url
      }
      if (obj.label && typeof obj.label === 'string') {
        obj.label = obj.label.trim()
      }
      return obj
    })
    .filter(Boolean) as UnknownRecord[]
  return cleaned.length ? cleaned : undefined
}

function sanitizeCollection(collection: unknown, mapFn: (entry: UnknownRecord) => UnknownRecord | null): UnknownRecord[] | undefined {
  if (!Array.isArray(collection)) return undefined
  const cleaned = collection
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      return mapFn(entry as UnknownRecord)
    })
    .filter(Boolean) as UnknownRecord[]
  return cleaned.length ? cleaned : undefined
}

export function sanitizeResumeData(data: unknown): ResumeGenerative {
  const parsed = LooseResumeSchema.safeParse(data)
  const base: UnknownRecord = parsed.success ? { ...parsed.data } : {}

  const profile = base.profile && typeof base.profile === 'object' ? { ...(base.profile as UnknownRecord) } : {}
  if (profile.email) profile.email = sanitizeEmail(profile.email)
  if (profile.phone) profile.phone = sanitizePhone(profile.phone)
  if (profile.location && typeof profile.location === 'string') {
    const trimmed = profile.location.trim()
    profile.location = trimmed && !INVALID_PLACEHOLDER_PATTERN.test(trimmed)
      ? trimmed.replace(/\s+/g, ' ').trim()
      : undefined
  }
  if (profile.photo && typeof profile.photo === 'object') {
    const photo = { ...(profile.photo as UnknownRecord) }
    const url = sanitizeURL(photo.url)
    profile.photo = url ? { ...photo, url } : undefined
  }
  if (profile.links) profile.links = sanitizeLinks(profile.links)
  base.profile = profile

  base.work = sanitizeCollection(base.work, (item) => {
    const next: UnknownRecord = { ...item }
    if (next.location && typeof next.location === 'string') {
      next.location = next.location.replace(/\s+/g, ' ').trim()
    }
    next.startDate = sanitizeDate(next.startDate)
    next.endDate = sanitizeDate(next.endDate)
    if (Array.isArray(next.descriptionBullets)) {
      next.descriptionBullets = next.descriptionBullets.slice(0, 6)
    }
    if (Array.isArray(next.achievements)) {
      next.achievements = next.achievements.slice(0, 4)
    }
    if (Array.isArray(next.techStack)) {
      next.techStack = next.techStack.slice(0, 12)
    }
    return next
  })

  base.education = sanitizeCollection(base.education, (item) => {
    const next: UnknownRecord = { ...item }
    if (next.location && typeof next.location === 'string') {
      next.location = next.location.replace(/\s+/g, ' ').trim()
    }
    next.startDate = sanitizeDate(next.startDate)
    next.endDate = sanitizeDate(next.endDate)
    return next
  })

  base.projects = sanitizeCollection(base.projects, (item) => {
    const next: UnknownRecord = { ...item }
    next.link = sanitizeURL(next.link)
    if (Array.isArray(next.bullets)) {
      next.bullets = next.bullets.slice(0, 6)
    }
    if (Array.isArray(next.techStack)) {
      next.techStack = next.techStack.slice(0, 10)
    }
    return next
  })

  base.certifications = sanitizeCollection(base.certifications, (item) => {
    const next: UnknownRecord = { ...item }
    next.date = sanitizeDate(next.date)
    return next
  })

  base.awards = sanitizeCollection(base.awards, (item) => {
    const next: UnknownRecord = { ...item }
    next.date = sanitizeDate(next.date)
    return next
  })

  base.languages = sanitizeCollection(base.languages, (item) => ({ ...item }))
  base.extras = sanitizeCollection(base.extras, (item) => ({ ...item }))

  if (Array.isArray(base.skills)) {
    base.skills = base.skills.slice(0, 8)
  }
  if (Array.isArray(base.work)) {
    base.work = base.work.slice(0, 8)
  }
  if (Array.isArray(base.education)) {
    base.education = base.education.slice(0, 6)
  }
  if (Array.isArray(base.projects)) {
    base.projects = base.projects.slice(0, 6)
  }
  if (Array.isArray(base.certifications)) {
    base.certifications = base.certifications.slice(0, 6)
  }
  if (Array.isArray(base.awards)) {
    base.awards = base.awards.slice(0, 6)
  }
  if (Array.isArray(base.languages)) {
    base.languages = base.languages.slice(0, 6)
  }
  if (Array.isArray(base.extras)) {
    base.extras = base.extras.slice(0, 6)
  }

  return base as ResumeGenerative
}

export function sanitizeCoverLetterData(data: CoverLetterJson | undefined | null): CoverLetterJson | undefined {
  if (!data || typeof data !== 'object') return undefined
  const base: UnknownRecord = { ...data }

  if (base.from && typeof base.from === 'object') {
    const from = { ...(base.from as UnknownRecord) }
    from.email = sanitizeEmail(from.email)
    from.phone = sanitizePhone(from.phone)
    base.from = from
  }

  if (base.to && typeof base.to === 'object') {
    const to = { ...(base.to as UnknownRecord) }
    to.email = sanitizeEmail(to.email)
    base.to = to
  }

  return (base as unknown) as CoverLetterJson
}
