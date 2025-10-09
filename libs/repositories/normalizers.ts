import {
  createDefaultAppearance,
  createDefaultLayout,
  createDefaultSettings,
  type ResumeJson,
  type SkillGroup,
  type ResumeTemplateId,
} from '@/types/resume'
import { createDefaultCoverLetterAppearance, type CoverLetterJson } from '@/types/cover-letter'

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

function coerceTemplate(template?: string | null): ResumeTemplateId {
  if (!template) return 'onyx'
  const lower = template.toLowerCase()
  const found = RESUME_TEMPLATES.find((value) => value === lower)
  return (found ?? 'onyx') as ResumeTemplateId
}

function normalizeSkillGroup(group: SkillGroup | Record<string, any>): SkillGroup | null {
  const rawCategory = (group as any)?.category
  const category = typeof rawCategory === 'string' ? rawCategory.trim() : ''
  const rawItems = Array.isArray((group as any)?.items) ? (group as any).items : []
  const items = rawItems.map((item: any) => {
    if (!item) return null
    if (typeof item === 'string') {
      const name = item.trim()
      if (!name) return null
      return { name, level: 3 }
    }
    const name = (item.name || '').trim()
    if (!name) return null
    const levelRaw = typeof item.level === 'number' ? item.level : 3
    const level = Math.max(0, Math.min(5, Math.round(levelRaw)))
    return { name, level }
  }).filter((value: { name: string; level: number } | null): value is { name: string; level: number } => value !== null) as SkillGroup['items']

  if (!items.length) return null
  return {
    category,
    items,
  }
}

function normalizeLanguages(languages: ResumeJson['languages']): ResumeJson['languages'] {
  if (!languages) return undefined
  const normalized = languages
    .map((language) => {
      if (!language) return null
      const name = typeof language.name === 'string' ? language.name.trim() : ''
      if (!name) return null
      const level = typeof language.level === 'string' && LANGUAGE_LEVELS.has(language.level) ? language.level : 'Conversational'
      return { name, level }
    })
    .filter((value: { name: string; level: string } | null): value is { name: string; level: string } => value !== null)
  return normalized.length ? normalized : undefined
}

export function normalizeResumeData(data: ResumeJson): ResumeJson {
  const pageSize = data.settings?.pageSize ?? data.appearance?.layout_settings?.pageFormat ?? 'Letter'
  // Ensure settings exist to satisfy storage schema and preview mapping
  const baseSettings = createDefaultSettings(undefined, undefined, pageSize as 'A4' | 'Letter')
  const settings = {
    ...baseSettings,
    ...(data as any).settings,
    pageSize: (data as any).settings?.pageSize ?? baseSettings.pageSize,
  }
  const baseAppearance = createDefaultAppearance(pageSize as 'A4' | 'Letter')
  const appearance = {
    ...baseAppearance,
    ...data.appearance,
    template: coerceTemplate((data.appearance as any)?.template),
    layout: Array.isArray(data.appearance?.layout) && data.appearance?.layout.length
      ? (data.appearance?.layout as string[][][])
      : baseAppearance.layout ?? createDefaultLayout(),
    theme: {
      ...baseAppearance.theme,
      ...(data.appearance?.theme ?? {}),
    },
    typography: {
      ...baseAppearance.typography,
      ...(data.appearance?.typography ?? {}),
      fontSize: clampNumber(
        data.appearance?.typography?.fontSize ?? baseAppearance.typography.fontSize,
        8,
        36
      ),
      lineHeight: clampNumber(
        data.appearance?.typography?.lineHeight ?? baseAppearance.typography.lineHeight,
        1.0,
        2.0
      ),
    },
    layout_settings: {
      ...baseAppearance.layout_settings,
      ...(data.appearance?.layout_settings ?? {}),
      margin: clampNumber(
        data.appearance?.layout_settings?.margin ?? baseAppearance.layout_settings.margin,
        8,
        144
      ),
      pageFormat: (data.appearance?.layout_settings?.pageFormat === 'A4' ? 'A4' : 'Letter') as 'A4' | 'Letter',
    },
  }

  const skills = data.skills
    ?.map((group) => normalizeSkillGroup(group))
    .filter(Boolean) as SkillGroup[] | undefined

  return {
    ...data,
    settings,
    appearance,
    skills,
    languages: normalizeLanguages(data.languages),
  }
}

export function normalizeCoverLetterData(data: CoverLetterJson): CoverLetterJson {
  const pageSize = data.settings?.pageSize ?? 'Letter'
  const baseAppearance = createDefaultCoverLetterAppearance(pageSize as 'A4' | 'Letter')
  const appearance = {
    ...baseAppearance,
    ...data.appearance,
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
      pageFormat: (data.appearance?.layout?.pageFormat === 'A4' ? 'A4' : 'Letter') as 'A4' | 'Letter',
    },
  }

  return {
    ...data,
    appearance,
  }
}

function clampNumber(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}
