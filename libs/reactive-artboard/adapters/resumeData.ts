import type { ResumeJson, SkillGroup } from '@/types/resume'
import { deepClone } from '../utils/deepClone'
import {
  defaultResumeData,
  defaultMetadata,
  type ResumeData,
  type SectionKey,
} from '../schema'

const LANGUAGE_LEVEL_MAP: Record<string, number> = {
  native: 5,
  fluent: 4,
  professional: 4,
  conversational: 3,
  intermediate: 3,
  basic: 2,
  beginner: 1,
}

const LINK_ICON_MAP: Record<string, string> = {
  linkedin: 'linkedin',
  github: 'github',
  portfolio: 'globe',
  website: 'globe',
  twitter: 'twitter-logo',
  medium: 'medium-logo',
  dribbble: 'dribbble-logo',
  behance: 'behance-logo',
}

const SECTION_ALIAS: Record<string, SectionKey> = {
  profile: 'profiles',
  profiles: 'profiles',
  summary: 'summary',
  work: 'experience',
  experience: 'experience',
  experiences: 'experience',
  education: 'education',
  project: 'projects',
  projects: 'projects',
  volunteer: 'volunteer',
  volunteers: 'volunteer',
  references: 'references',
  skills: 'skills',
  languages: 'languages',
  certifications: 'certifications',
  awards: 'awards',
  interests: 'interests',
  publications: 'publications',
}

export function mapResumeJsonToResumeData(resume: ResumeJson): ResumeData {
  const data = deepClone(defaultResumeData)

  populateBasics(data, resume)
  populateSummary(data, resume)
  populateExperience(data, resume)
  populateEducation(data, resume)
  populateProjects(data, resume)
  populateSkills(data, resume)
  populateLanguages(data, resume)
  populateCertifications(data, resume)
  populateAwards(data, resume)
  populateProfiles(data, resume)
  populateExtras(data, resume)
  populateMetadata(data, resume)
  finalizeVisibility(data)

  return data
}

function populateBasics(data: ResumeData, resume: ResumeJson) {
  const { profile } = resume

  data.basics.name = profile.fullName || ''
  data.basics.headline = profile.headline || ''
  data.basics.email = profile.email || ''
  data.basics.phone = profile.phone || ''
  data.basics.location = joinLocation(profile.location)

  const [primaryLink, ...restLinks] = (profile.links ?? []).filter((link) => !!link?.url)
  data.basics.url = {
    label: primaryLink?.label ?? primaryLink?.url ?? '',
    href: primaryLink?.url ?? '',
  }

  data.basics.customFields = restLinks.map((link) => ({
    id: generateId(),
    icon: LINK_ICON_MAP[link.type ?? ''] || 'link',
    name: link.label || link.type || link.url,
    value: link.url,
  }))

  const photoUrl = profile.photo?.url || ''
  data.basics.picture.url = photoUrl
  data.basics.picture.effects.hidden = !photoUrl
}

function populateSummary(data: ResumeData, resume: ResumeJson) {
  const content = resume.summary?.trim() ?? ''
  data.sections.summary.content = content
  data.sections.summary.visible = content.length > 0
}

function populateExperience(data: ResumeData, resume: ResumeJson) {
  const items = resume.work?.map((work) => ({
    id: generateId(),
    visible: true,
    company: work.company ?? '',
    position: work.role ?? '',
    location: work.location ?? '',
    date: formatDateRange(work.startDate, work.endDate),
    summary: buildRichList([...toArray(work.descriptionBullets), ...toArray(work.achievements)]),
    url: {
      label: '',
      href: '',
    },
  })) ?? []

  data.sections.experience.items = items
  data.sections.experience.visible = items.length > 0
}

function populateEducation(data: ResumeData, resume: ResumeJson) {
  const items = resume.education?.map((education) => ({
    id: generateId(),
    visible: true,
    institution: education.school ?? '',
    studyType: education.degree ?? '',
    area: education.field ?? '',
    score: extractScore(education.details),
    date: formatDateRange(education.startDate, education.endDate),
    summary: buildRichList(toArray(education.details)),
    url: {
      label: '',
      href: '',
    },
  })) ?? []

  data.sections.education.items = items
  data.sections.education.visible = items.length > 0
}

function populateProjects(data: ResumeData, resume: ResumeJson) {
  const items = resume.projects?.map((project) => ({
    id: generateId(),
    visible: true,
    name: project.name ?? '',
    description: project.summary ?? '',
    date: '',
    summary: buildRichList(toArray(project.bullets)),
    keywords: project.techStack ?? [],
    url: {
      label: project.link ?? '',
      href: project.link ?? '',
    },
  })) ?? []

  data.sections.projects.items = items
  data.sections.projects.visible = items.length > 0
}

function populateSkills(data: ResumeData, resume: ResumeJson) {
  const skillItems = (resume.skills ?? []).flatMap((group) => mapSkillGroup(group))
  data.sections.skills.items = skillItems
  data.sections.skills.visible = skillItems.length > 0
}

function mapSkillGroup(group: SkillGroup) {
  return group.items.map((skill) => {
    const name = typeof skill === 'string' ? skill : skill.name
    const level = typeof skill === 'string' ? 3 : skill.level ?? 3
    return {
      id: generateId(),
      visible: true,
      name: name ?? '',
      description: group.category ?? '',
      level: clamp(level, 0, 5),
      keywords: [],
    }
  })
}

function populateLanguages(data: ResumeData, resume: ResumeJson) {
  const items = resume.languages?.map((language) => ({
    id: generateId(),
    visible: true,
    name: language.name ?? '',
    description: language.level ?? '',
    level: LANGUAGE_LEVEL_MAP[(language.level || '').toLowerCase()] ?? 2,
  })) ?? []

  data.sections.languages.items = items
  data.sections.languages.visible = items.length > 0
}

function populateCertifications(data: ResumeData, resume: ResumeJson) {
  const items = resume.certifications?.map((cert) => ({
    id: generateId(),
    visible: true,
    name: cert.name ?? '',
    issuer: cert.issuer ?? '',
    date: formatYear(cert.date),
    summary: '',
    url: {
      label: '',
      href: '',
    },
  })) ?? []

  data.sections.certifications.items = items
  data.sections.certifications.visible = items.length > 0
}

function populateAwards(data: ResumeData, resume: ResumeJson) {
  const items = resume.awards?.map((award) => ({
    id: generateId(),
    visible: true,
    title: award.name ?? '',
    awarder: award.org ?? '',
    date: formatYear(award.date),
    summary: award.summary ?? '',
    url: {
      label: '',
      href: '',
    },
  })) ?? []

  data.sections.awards.items = items
  data.sections.awards.visible = items.length > 0
}

function populateProfiles(data: ResumeData, resume: ResumeJson) {
  const links = resume.profile.links ?? []
  data.sections.profiles.items = links.map((link) => ({
    id: generateId(),
    visible: true,
    network: link.type ?? '',
    username: link.label ?? link.url,
    icon: LINK_ICON_MAP[link.type ?? ''] || 'link',
    url: {
      label: link.label ?? link.url,
      href: link.url,
    },
  }))
  data.sections.profiles.visible = data.sections.profiles.items.length > 0
}

function populateExtras(data: ResumeData, resume: ResumeJson) {
  if (!resume.extras?.length) {
    data.sections.custom = {}
    return
  }

  const customSections: ResumeData['sections']['custom'] = {}

  resume.extras.forEach((extra, index) => {
    const key = `custom-${index}`
    customSections[key] = {
      id: generateId(),
      name: extra.title ?? 'Additional Information',
      columns: 1,
      separateLinks: true,
      visible: true,
      items: [
        {
          id: generateId(),
          visible: true,
          name: extra.title ?? 'Details',
          description: '',
          date: '',
          location: '',
          summary: extra.content ?? '',
          keywords: [],
          url: {
            label: '',
            href: '',
          },
        },
      ],
    }
  })

  data.sections.custom = customSections
}

function populateMetadata(data: ResumeData, resume: ResumeJson) {
  const appearance = resume.appearance
  const settings = resume.settings

  const metadata = deepClone(defaultMetadata)

  metadata.template = appearance?.template ?? metadata.template
  metadata.theme = {
    background: appearance?.theme?.background ?? metadata.theme.background,
    text: appearance?.theme?.text ?? metadata.theme.text,
    primary: appearance?.theme?.primary ?? metadata.theme.primary,
  }

  metadata.typography.font.family = appearance?.typography?.fontFamily ?? metadata.typography.font.family
  metadata.typography.font.size = appearance?.typography?.fontSize ?? metadata.typography.font.size
  metadata.typography.lineHeight = appearance?.typography?.lineHeight ?? metadata.typography.lineHeight
  metadata.typography.hideIcons = settings.showIcons === false
  metadata.typography.underlineLinks = true

  const layoutSettings = appearance?.layout_settings
  if (layoutSettings) {
    metadata.page.format = layoutSettings.pageFormat.toLowerCase() === 'a4' ? 'a4' : 'letter'
    metadata.page.margin = clamp(Math.round(layoutSettings.margin / 3.78), 8, 64)
    metadata.page.options.pageNumbers = !!layoutSettings.showPageNumbers
  } else {
    metadata.page.format = settings.pageSize?.toLowerCase() === 'a4' ? 'a4' : 'letter'
    const fallbackMarginPx = typeof (settings as any)?.margin === 'number' ? (settings as any).margin : 48
    metadata.page.margin = clamp(Math.round(fallbackMarginPx / 3.78), 8, 64)
  }

  metadata.css = {
    value: appearance?.customCss ?? '',
    visible: !!appearance?.customCss,
  }

  metadata.layout = normalizeLayout(appearance?.layout)

  const customKeys = Object.keys(data.sections.custom ?? {})
  if (customKeys.length) {
    if (!metadata.layout.length) {
      metadata.layout = deepClone(defaultMetadata.layout)
    }
    const targetColumn = metadata.layout[metadata.layout.length - 1][0]
    customKeys.forEach((key) => {
      const sectionKey = `custom.${key}` as SectionKey
      if (!targetColumn.includes(sectionKey)) {
        targetColumn.push(sectionKey)
      }
    })
  }

  data.metadata = metadata
}

function finalizeVisibility(data: ResumeData) {
  const sections = data.sections

  const updateSection = (section: { visible: boolean; items?: any[]; content?: string }) => {
    if ('items' in section) {
      const items = Array.isArray(section.items) ? section.items : []
      section.visible = items.some((item) => item && item.visible !== false)
    } else if ('content' in section) {
      const content = section.content ?? ''
      section.visible = typeof content === 'string' && content.trim().length > 0
    }
  }

  updateSection(sections.summary)
  updateSection(sections.awards)
  updateSection(sections.certifications)
  updateSection(sections.education)
  updateSection(sections.experience)
  updateSection(sections.interests)
  updateSection(sections.languages)
  updateSection(sections.profiles)
  updateSection(sections.projects)
  updateSection(sections.publications)
  updateSection(sections.references)
  updateSection(sections.skills)
  updateSection(sections.volunteer)

  Object.values(sections.custom ?? {}).forEach((section) => updateSection(section))
}

function normalizeLayout(layout?: string[][][]): string[][][] {
  if (!layout?.length) {
    return deepClone(defaultMetadata.layout)
  }

  return layout.map((page) =>
    page.map((column) =>
      column
        .map((section) => SECTION_ALIAS[section.toLowerCase()] ?? section)
        .filter((section) => typeof section === 'string' && section.length > 0)
    )
  )
}

function formatDateRange(start?: string, end?: string | null): string {
  if (!start && !end) return ''

  const format = (value?: string | null) => {
    if (!value) return ''
    if (value === 'Present') return 'Present'
    const date = parseYearMonth(value)
    if (!date) return value
    return new Intl.DateTimeFormat('en', {
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const startLabel = format(start)
  const endLabel = format(end) || 'Present'
  if (!startLabel) return endLabel
  return `${startLabel} to ${endLabel}`
}

function formatYear(value?: string | null): string {
  if (!value) return ''
  const year = value.slice(0, 4)
  return year
}

function parseYearMonth(value?: string | null): Date | null {
  if (!value) return null
  const normalized = value.length === 7 ? `${value}-01` : value
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildRichList(items: string[]): string {
  if (!items.length) return ''
  const escaped = items.map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join('')
  return `<ul>${escaped}</ul>`
}

function joinLocation(location?: ResumeJson['profile']['location']): string {
  if (!location) return ''
  return [location.city, location.region, location.country].filter(Boolean).join(', ')
}

function extractScore(details?: string[]): string {
  if (!details?.length) return ''
  const scoreEntry = details.find((value) => /gpa/i.test(value))
  return scoreEntry ?? ''
}

function toArray<T>(value?: T[] | null): T[] {
  if (!value) return []
  return value.filter((item): item is T => item !== undefined && item !== null)
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 12)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
