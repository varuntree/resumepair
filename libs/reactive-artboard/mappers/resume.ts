import type { ResumeJson, SkillGroup, ResumeAppearance } from '@/types/resume'
import { createDefaultAppearance } from '@/types/resume'
import { ArtboardDocument, ArtboardRichTextBlock, ArtboardSection, ArtboardMetadata } from '../types'

const DEFAULT_COLORS = {
  background: '#ffffff',
  text: '#111827',
  primary: '#2563eb',
}

const COLOR_THEMES: Record<string, typeof DEFAULT_COLORS> = {
  ocean: { background: '#ffffff', text: '#0f172a', primary: '#2563eb' },
  forest: { background: '#ffffff', text: '#0b1d17', primary: '#059669' },
  charcoal: { background: '#0f172a', text: '#f8fafc', primary: '#38bdf8' },
}

const FONT_FAMILY_MAP: Record<string, string> = {
  inter: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  'source sans 3': '"Source Sans 3", system-ui, sans-serif',
  georgia: 'Georgia, serif',
}

export function mapResumeToArtboardDocument(resume: ResumeJson): ArtboardDocument {
  const metadata = createMetadata(resume)

  const sections: ArtboardSection[] = []

  const summaryBlocks = resume.summary ? htmlToArtboardBlocks(resume.summary) : []
  if (summaryBlocks.length) {
    sections.push({
      id: 'summary',
      title: 'Summary',
      type: 'summary',
      visible: true,
      blocks: summaryBlocks,
    })
  }

  if (resume.work?.length) {
    sections.push({
      id: 'experience',
      title: 'Experience',
      type: 'experience',
      visible: true,
      items: resume.work.map((item) => ({
        company: item.company,
        role: item.role,
        location: item.location,
        startDate: item.startDate,
        endDate: item.endDate && item.endDate !== 'Present' ? item.endDate : undefined,
        summary: joinBlocks(item.descriptionBullets, item.achievements),
      })),
    })
  }

  if (resume.education?.length) {
    sections.push({
      id: 'education',
      title: 'Education',
      type: 'education',
      visible: true,
      items: resume.education.map((item) => ({
        school: item.school,
        degree: item.degree,
        field: item.field,
        startDate: item.startDate,
        endDate: item.endDate,
        summary: createOptionalListBlock(item.details),
      })),
    })
  }

  if (resume.skills?.length) {
    sections.push({
      id: 'skills',
      title: 'Skills',
      type: 'skills',
      visible: true,
      items: flattenSkillGroups(resume.skills),
    })
  }

  if (resume.languages?.length) {
    sections.push({
      id: 'languages',
      title: 'Languages',
      type: 'custom',
      visible: true,
      blocks: [
        {
          type: 'list',
          content: resume.languages
            .map((language) => formatLanguageLine(language.name, language.level))
            .filter((value) => value.length > 0),
        },
      ],
    })
  }

  const customSections = buildCustomSections(resume)
  sections.push(...customSections)

  const profileLocation = [
    resume.profile.location?.city,
    resume.profile.location?.region,
    resume.profile.location?.country,
  ]
    .filter(Boolean)
    .join(', ')

  return {
    template: appearanceTemplate(resume),
    profile: {
      fullName: resume.profile.fullName,
      headline: resume.profile.headline,
      summary: resume.summary,
      email: resume.profile.email,
      phone: resume.profile.phone,
      location: profileLocation || undefined,
      links: (resume.profile.links ?? []).map((link) => ({
        label: link.label || link.type || link.url,
        url: link.url,
      })),
    },
    sections,
    metadata,
  }
}

function createMetadata(resume: ResumeJson): ArtboardMetadata {
  const appearance: ResumeAppearance =
    resume.appearance ?? createDefaultAppearance(resume.settings.pageSize)

  const colors = appearance.theme ?? DEFAULT_COLORS
  const typography = appearance.typography ?? {
    fontFamily: 'Inter, system-ui',
    fontSize: Math.round(16 * (resume.settings.fontSizeScale || 1)),
    lineHeight: resume.settings.lineSpacing || 1.4,
  }
  const layout = appearance.layout ?? {
    pageFormat: resume.settings.pageSize || 'Letter',
    margin: 48,
    showPageNumbers: false,
  }

  const colorTheme = resume.settings.colorTheme?.toLowerCase()
  const themeColors = COLOR_THEMES[colorTheme ?? ''] || DEFAULT_COLORS

  const fontFamilyKey = typography.fontFamily?.toLowerCase()
  const fallbackFontFamily = FONT_FAMILY_MAP[fontFamilyKey ?? ''] || typography.fontFamily

  return {
    colors: {
      background: colors.background ?? themeColors.background,
      text: colors.text ?? themeColors.text,
      primary: colors.primary ?? themeColors.primary,
    },
    typography: {
      fontFamily: fallbackFontFamily,
      fontSize: typography.fontSize ?? Math.round(16 * (resume.settings.fontSizeScale || 1)),
      lineHeight: typography.lineHeight ?? (resume.settings.lineSpacing || 1.4),
    },
    page: {
      format: layout.pageFormat ?? 'Letter',
      margin: layout.margin ?? 48,
      showPageNumbers: layout.showPageNumbers ?? false,
    },
    customCss: appearance.customCss,
  }
}

function appearanceTemplate(resume: ResumeJson): string {
  const appearance = resume.appearance
  if (appearance && appearance.template) {
    return appearance.template
  }
  return 'onyx'
}

function createParagraphBlock(text: string): ArtboardRichTextBlock {
  return {
    type: 'paragraph',
    content: [text.trim()],
  }
}

function createListBlock(items: string[]): ArtboardRichTextBlock {
  return {
    type: 'list',
    content: items,
  }
}

function createOptionalListBlock(items?: string[]): ArtboardRichTextBlock[] | undefined {
  if (!items?.length) return undefined
  return [createListBlock(items)]
}

function joinBlocks(...groups: (string[] | undefined)[]): ArtboardRichTextBlock[] | undefined {
  const blocks: ArtboardRichTextBlock[] = []

  for (const group of groups) {
    if (group?.length) {
      blocks.push(createListBlock(group))
    }
  }

  return blocks.length ? blocks : undefined
}

function flattenSkillGroups(groups: SkillGroup[]) {
  const items: { label: string; level?: number }[] = []
  groups.forEach((group) => {
    group.items.forEach((item) => {
      const normalized = typeof item === 'string' ? { name: item } : item
      const labelBase = normalized.name || ''
      const label = group.category ? `${group.category}: ${labelBase}` : labelBase
      const level = typeof normalized.level === 'number' ? normalized.level : undefined
      items.push({ label, level })
    })
  })
  return items
}

function formatLanguageLine(name?: string, level?: string): string {
  if (!name) return ''
  if (level) {
    return `${name} — ${level}`
  }
  return name
}

function buildCustomSections(resume: ResumeJson): ArtboardSection[] {
  const sections: ArtboardSection[] = []

  if (resume.projects?.length) {
    sections.push({
      id: 'projects',
      title: 'Projects',
      type: 'custom',
      visible: true,
      blocks: resume.projects.map((project) =>
        createParagraphBlock(
          [project.name, project.summary, project.link ? `Link: ${project.link}` : '']
            .filter(Boolean)
            .join(' — ')
        )
      ),
    })
  }

  if (resume.certifications?.length) {
    sections.push({
      id: 'certifications',
      title: 'Certifications',
      type: 'custom',
      visible: true,
      blocks: resume.certifications.map((item) =>
        createParagraphBlock([item.name, item.issuer, item.date].filter(Boolean).join(' • '))
      ),
    })
  }

  if (resume.awards?.length) {
    sections.push({
      id: 'awards',
      title: 'Awards',
      type: 'custom',
      visible: true,
      blocks: resume.awards.map((item) =>
        createParagraphBlock([item.name, item.org, item.date, item.summary].filter(Boolean).join(' • '))
      ),
    })
  }

  if (resume.languages?.length) {
    sections.push({
      id: 'languages',
      title: 'Languages',
      type: 'custom',
      visible: true,
      blocks: [
        createParagraphBlock(
          resume.languages.map((lang) => `${lang.name}${lang.level ? ` (${lang.level})` : ''}`).join(' • ')
        ),
      ],
    })
  }

  if (resume.extras?.length) {
    resume.extras.forEach((extra, index) => {
      sections.push({
        id: `extra-${index}`,
        title: extra.title,
        type: 'custom',
        visible: true,
        blocks: [createParagraphBlock(extra.content)],
      })
    })
  }

  return sections
}

function htmlToArtboardBlocks(html: string): ArtboardRichTextBlock[] {
  const trimmed = html?.trim()
  if (!trimmed) return []

  const blocks: ArtboardRichTextBlock[] = []

  const listMatches: string[] = []
  const listRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let listMatch: RegExpExecArray | null
  while ((listMatch = listRegex.exec(trimmed)) !== null) {
    listMatches.push(listMatch[1])
  }

  if (listMatches.length) {
    const items = listMatches
      .map((content) => decodeEntities(stripHtml(content)))
      .filter((item) => item.length > 0)
    if (items.length) {
      blocks.push({
        type: 'list',
        content: items,
      })
    }
  }

  const paragraphParts = trimmed
    .replace(/<ul[\s\S]*?<\/ul>/gi, ' ')
    .split(/<\/p>/gi)
    .map((segment) => decodeEntities(stripHtml(segment)))
    .map((segment) => segment.trim())
    .filter(Boolean)

  paragraphParts.forEach((part) => {
    blocks.push(createParagraphBlock(part))
  })

  if (blocks.length === 0) {
    const text = decodeEntities(stripHtml(trimmed))
    if (text) {
      blocks.push(createParagraphBlock(text))
    }
  }

  return blocks
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ')
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
