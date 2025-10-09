/**
 * Resume JSON Schema Types
 *
 * Canonical data structure for resume documents.
 * This is the single source of truth for all resume data.
 *
 * @module types/resume
 */

/**
 * Profile section - personal information and contact details
 */
export interface Profile {
  fullName: string
  headline?: string
  email: string
  phone?: string
  location?: {
    city?: string
    region?: string
    country?: string
    postal?: string
  }
  links?: Array<{
    type?: string // e.g., "LinkedIn", "GitHub", "Website"
    label?: string // Display text
    url: string
  }>
  photo?: {
    url: string // Public URL
    path: string // Storage path
  }
}

/**
 * Work experience entry
 */
export interface WorkExperience {
  company: string
  role: string
  location?: string
  startDate: string // ISO date string
  endDate?: string | null | 'Present'
  descriptionBullets?: string[]
  achievements?: string[]
  techStack?: string[]
}

/**
 * Education entry
 */
export interface Education {
  school: string
  degree: string
  field?: string
  startDate?: string
  endDate?: string
  details?: string[]
}

/**
 * Project entry
 */
export interface Project {
  name: string
  link?: string
  summary?: string
  bullets?: string[]
  techStack?: string[]
}

/**
 * Skill group
 */
export interface SkillItem {
  name: string
  level?: number // 0-5 scale
}

export interface SkillGroup {
  category: string // e.g., "Programming", "Tools", "Soft Skills"
  items: SkillItem[]
}

export type ResumeTemplateId =
  | 'azurill'
  | 'bronzor'
  | 'chikorita'
  | 'ditto'
  | 'gengar'
  | 'glalie'
  | 'kakuna'
  | 'leafish'
  | 'nosepass'
  | 'onyx'
  | 'pikachu'
  | 'rhyhorn'

/**
 * Certification entry
 */
export interface Certification {
  name: string
  issuer: string
  date?: string
}

/**
 * Award entry
 */
export interface Award {
  name: string
  org: string
  date?: string
  summary?: string
}

/**
 * Language proficiency
 */
export interface Language {
  name: string
  level: string // e.g., "Native", "Fluent", "Conversational"
}

/**
 * Extra section (flexible)
 */
export interface Extra {
  title: string
  content: string
}

/**
 * Document settings
 */
export interface ResumeSettings {
  locale: string // e.g., "en-US", "en-GB"
  dateFormat: 'US' | 'ISO' | 'EU' // MMM YYYY | YYYY-MM | DD MMM YYYY
  addressFormat?: string // Country-specific formatting rules
  fontFamily: string // e.g., "Inter", "Source Sans 3"
  fontSizeScale: number // 0.8 to 1.2
  lineSpacing: number // 1.0 to 1.5
  colorTheme: string // Template-specific theme
  iconSet: 'lucide' // Icon library (Lucide only for v1)
  showIcons: boolean // Toggle icons in template
  sectionOrder: string[] // e.g., ["profile", "summary", "work", ...]
  pageSize: 'A4' | 'Letter' // US: Letter, others: A4
}

export interface ResumeAppearance {
  template: ResumeTemplateId
  layout: string[][][]
  theme: {
    background: string
    text: string
    primary: string
  }
  typography: {
    fontFamily: string
    fontSize: number
    lineHeight: number
  }
  layout_settings: {
    pageFormat: 'A4' | 'Letter'
    margin: number
    showPageNumbers: boolean
  }
  customCss?: string
}

/**
 * Complete Resume JSON structure (canonical schema)
 */
export interface ResumeJson {
  profile: Profile
  summary?: string
  work?: WorkExperience[]
  education?: Education[]
  projects?: Project[]
  skills?: SkillGroup[]
  certifications?: Certification[]
  awards?: Award[]
  languages?: Language[]
  extras?: Extra[]
  settings: ResumeSettings
  appearance?: ResumeAppearance
}

/**
 * Database representation of a resume document
 */
export interface Resume {
  id: string
  user_id: string
  title: string
  slug: string | null
  version: number
  schema_version: string // "resume.v1"
  data: ResumeJson
  status: 'draft' | 'active' | 'archived'
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  last_accessed_at: string | null
}

/**
 * Version history entry
 */
export interface ResumeVersion {
  id: number
  resume_id: string
  version_number: number
  data: ResumeJson
  created_at: string
  created_by: string
}

/**
 * Resume template
 */
export interface ResumeTemplate {
  id: string
  name: string
  description: string | null
  category: string | null
  data: ResumeJson
  thumbnail_url: string | null
  is_default: boolean
  created_at: string
}

/**
 * Resume create input
 */
export interface ResumeCreateInput {
  title: string
  template?: ResumeTemplateId
}

/**
 * Resume update input
 */
export interface ResumeUpdateInput {
  title?: string
  data?: ResumeJson
  version: number // Required for optimistic locking
}

/**
 * Resume list query parameters
 */
export interface ResumeListParams {
  status?: 'draft' | 'active' | 'archived'
  search?: string
  sort?: 'updated_at' | 'created_at' | 'title'
  order?: 'asc' | 'desc'
  cursor?: string
  limit?: number
}

/**
 * Resume list response
 */
export interface ResumeListResponse {
  resumes: Resume[]
  nextCursor: string | null
  total: number
}

/**
 * Default resume settings factory
 */
export function createDefaultSettings(
  userLocale?: string,
  userDateFormat?: 'US' | 'ISO' | 'EU',
  userPageSize?: 'A4' | 'Letter'
): ResumeSettings {
  return {
    locale: userLocale || 'en-US',
    dateFormat: userDateFormat || 'US',
    fontFamily: 'Inter',
    fontSizeScale: 1.0,
    lineSpacing: 1.2,
    colorTheme: 'default',
    iconSet: 'lucide',
    showIcons: false,
    sectionOrder: ['profile', 'summary', 'work', 'education', 'projects', 'skills'],
    pageSize: userPageSize || 'Letter',
  }
}

export function createDefaultLayout(): string[][][] {
  return [
    [
      ['profiles', 'summary', 'experience', 'education', 'projects', 'volunteer', 'references'],
      ['skills', 'interests', 'certifications', 'awards', 'publications', 'languages'],
    ],
  ]
}

export function createDefaultAppearance(pageSize: 'A4' | 'Letter' = 'Letter'): ResumeAppearance {
  return {
    template: 'onyx',
    layout: createDefaultLayout(),
    theme: {
      background: '#ffffff',
      text: '#111827',
      primary: '#2563eb',
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 16,
      lineHeight: 1.4,
    },
    layout_settings: {
      pageFormat: pageSize,
      margin: 48,
      showPageNumbers: false,
    },
    customCss: undefined,
  }
}

/**
 * Create empty ResumeJson
 */
export function createEmptyResume(
  email: string,
  fullName?: string,
  settings?: Partial<ResumeSettings>,
  template?: ResumeTemplateId
): ResumeJson {
  const mergedSettings = {
    ...createDefaultSettings(),
    ...settings,
  }

  const appearance = createDefaultAppearance(mergedSettings.pageSize)
  if (template) {
    appearance.template = template
  }

  return {
    profile: {
      fullName: fullName || '',
      email: email,
    },
    settings: mergedSettings,
    appearance,
  }
}
