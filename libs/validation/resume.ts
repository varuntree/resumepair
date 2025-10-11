/**
 * Unified Resume Validation Schemas
 *
 * Exports both permissive (AI generation) and strict (storage/API) schemas from
 * a single module so downstream callers share one source of truth.
 */

import { z } from 'zod'

/**
 * Shared enums & primitives
 */
const ResumeTemplateIdSchema = z.enum([
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
])

const LinkTypeEnum = z.enum(['linkedin', 'github', 'portfolio', 'other'])

const LocationObjectSchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  postal: z.string().optional(),
})

const LooseLocationSchema = z.union([LocationObjectSchema, z.string()]).optional()

const StrictLinkSchema = z.object({
  type: LinkTypeEnum.optional(),
  label: z.string().optional(),
  url: z.string().url('Invalid URL'),
})

const LooseLinkSchema = z.object({
  type: LinkTypeEnum.optional(),
  label: z.string().optional(),
  url: z.string().optional(),
})

const StrictPhotoSchema = z.object({
  url: z.string().url('Invalid URL'),
  path: z.string(),
})

const LoosePhotoSchema = z.object({
  url: z.string().optional(),
  path: z.string().optional(),
}).partial()

/**
 * Profile
 */
export const ProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  headline: z.string().max(200, 'Headline too long').optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: LocationObjectSchema.optional(),
  links: z.array(StrictLinkSchema).optional(),
  photo: StrictPhotoSchema.optional(),
})

export const ResumeProfileLooseSchema = z.object({
  fullName: z.string().optional(),
  headline: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: LooseLocationSchema,
  links: z.array(LooseLinkSchema).optional(),
  photo: LoosePhotoSchema.optional(),
}).partial()

/**
 * Work Experience
 */
export const WorkExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
  endDate: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
      z.literal('Present'),
      z.null(),
    ])
    .optional(),
  descriptionBullets: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
})

const WorkExperienceLooseSchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  descriptionBullets: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
}).partial()

/**
 * Education
 */
export const EducationSchema = z.object({
  school: z.string().min(1, 'School name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  details: z.array(z.string()).optional(),
})

const EducationLooseSchema = z.object({
  school: z.string().optional(),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  details: z.array(z.string()).optional(),
}).partial()

/**
 * Projects
 */
export const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  link: z.string().url('Invalid URL').optional(),
  summary: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
})

const ProjectLooseSchema = z.object({
  name: z.string().optional(),
  link: z.string().optional(),
  summary: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
}).partial()

/**
 * Skills
 */
const SkillItemSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.number().min(0).max(5).optional(),
})

export const SkillGroupSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  items: z.array(SkillItemSchema),
})

const SkillItemLooseSchema = z.union([
  z.string(),
  z.object({
    name: z.string().optional(),
    level: z.number().optional(),
  }),
]).optional()

const SkillGroupLooseSchema = z.object({
  category: z.string().optional(),
  items: z.array(z.union([z.string(), z.object({
    name: z.string().optional(),
    level: z.number().optional(),
  })])).optional(),
}).partial()

/**
 * Certifications
 */
export const CertificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

const CertificationLooseSchema = z.object({
  name: z.string().optional(),
  issuer: z.string().optional(),
  date: z.string().optional(),
}).partial()

/**
 * Awards
 */
export const AwardSchema = z.object({
  name: z.string().min(1, 'Award name is required'),
  org: z.string().min(1, 'Organization is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  summary: z.string().optional(),
})

const AwardLooseSchema = z.object({
  name: z.string().optional(),
  org: z.string().optional(),
  date: z.string().optional(),
  summary: z.string().optional(),
}).partial()

/**
 * Languages
 */
export const LanguageSchema = z.object({
  name: z.string().min(1, 'Language name is required'),
  level: z.string().min(1, 'Proficiency level is required'),
})

const LanguageLooseSchema = z.object({
  name: z.string().optional(),
  level: z.string().optional(),
}).partial()

/**
 * Extra sections
 */
export const ExtraSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
})

const ExtraLooseSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
}).partial()

/**
 * Settings & appearance
 */
export const ResumeSettingsSchema = z.object({
  locale: z.string(),
  dateFormat: z.enum(['US', 'ISO', 'EU']),
  addressFormat: z.string().optional(),
  fontFamily: z.string(),
  fontSizeScale: z.number().min(0.8).max(1.2),
  lineSpacing: z.number().min(1.0).max(1.5),
  colorTheme: z.string(),
  iconSet: z.literal('lucide'),
  showIcons: z.boolean(),
  sectionOrder: z.array(z.string()),
  pageSize: z.enum(['A4', 'Letter']),
})

const ResumeSettingsLooseSchema = z.object({
  locale: z.string().optional(),
  dateFormat: z.string().optional(),
  addressFormat: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSizeScale: z.number().optional(),
  lineSpacing: z.number().optional(),
  colorTheme: z.string().optional(),
  iconSet: z.string().optional(),
  showIcons: z.boolean().optional(),
  sectionOrder: z.array(z.string()).optional(),
  pageSize: z.string().optional(),
})

const LayoutMatrixSchema = z.array(z.array(z.array(z.string().min(1)))).min(1)

const LayoutSettingsSchema = z.object({
  pageFormat: z.enum(['A4', 'Letter']),
  margin: z.number().min(8).max(144),
  showPageNumbers: z.boolean(),
})

export const ResumeAppearanceSchema = z.object({
  template: ResumeTemplateIdSchema.default('onyx'),
  layout: LayoutMatrixSchema.default([
    [
      ['summary', 'work', 'education', 'projects'],
      ['skills', 'certifications', 'languages', 'awards'],
    ],
  ]),
  theme: z.object({
    background: z.string(),
    text: z.string(),
    primary: z.string(),
  }),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.number().min(8).max(36),
    lineHeight: z.number().min(1.0).max(2.0),
  }),
  layout_settings: LayoutSettingsSchema,
  customCss: z.string().max(20000).optional(),
})

const ResumeAppearanceGenerativeSchema = z.object({
  template: z.string().optional(),
  layout: LayoutMatrixSchema.optional(),
  theme: ResumeAppearanceSchema.shape.theme.partial().optional(),
  typography: ResumeAppearanceSchema.shape.typography.partial().optional(),
  layout_settings: ResumeAppearanceSchema.shape.layout_settings.partial().optional(),
  customCss: z.string().optional(),
})

/**
 * Ultra-permissive resume schema (AI generation)
 * Accept ANYTHING the AI generates - validation happens later
 * This prevents the "could not parse response" error
 */
export const ResumeGenerativeSchema = z
  .object({
    profile: z.any().optional(),
    summary: z.string().optional(),
    work: z.any().optional(), // Accept array of anything
    education: z.any().optional(), // Accept array of anything
    projects: z.any().optional(), // Accept array of anything
    skills: z.any().optional(), // Accept array of anything
    certifications: z.any().optional(), // Accept array of anything
    awards: z.any().optional(), // Accept array of anything
    languages: z.any().optional(), // Accept array of anything
    extras: z.any().optional(), // Accept array of anything
    settings: z.any().optional(),
    appearance: z.any().optional(),
  })
  .passthrough() // Allow extra fields

/**
 * Alias kept for legacy import call sites (will be updated and cleaned later).
 */
export const ResumeGenerationSchema = ResumeGenerativeSchema

/**
 * Strict resume schema (storage & API)
 */
export const ResumeJsonSchema = z.object({
  profile: ProfileSchema,
  summary: z.string().optional(),
  work: z.array(WorkExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  skills: z.array(SkillGroupSchema).optional(),
  certifications: z.array(CertificationSchema).optional(),
  awards: z.array(AwardSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
  extras: z.array(ExtraSchema).optional(),
  settings: ResumeSettingsSchema,
  appearance: ResumeAppearanceSchema.optional(),
})

/**
 * Ancillary schemas (create/update/list) — unchanged shape
 */
export const CreateResumeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long (max 100 characters)'),
  template: ResumeTemplateIdSchema.optional(),
})

export const UpdateResumeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title too long (max 100 characters)')
    .optional(),
  data: ResumeJsonSchema.optional(),
  version: z.number().int().positive('Version must be positive'),
})

export const ResumeListQuerySchema = z.object({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  search: z.string().optional(),
  sort: z.enum(['updated_at', 'created_at', 'title']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
})

export const BulkOperationSchema = z.object({
  ids: z.array(z.string().uuid('Invalid ID')).min(1, 'At least one ID required'),
})

export const RestoreVersionSchema = z.object({
  version_number: z.number().int().positive('Version must be positive'),
})

/**
 * Type Exports
 */
export type ResumeGenerative = z.infer<typeof ResumeGenerativeSchema>
export type ResumeGeneration = z.infer<typeof ResumeGenerationSchema>
export type ResumeJsonInput = z.infer<typeof ResumeJsonSchema>
export type ProfileInput = z.infer<typeof ProfileSchema>
export type WorkExperienceInput = z.infer<typeof WorkExperienceSchema>
export type EducationInput = z.infer<typeof EducationSchema>
export type ProjectInput = z.infer<typeof ProjectSchema>
export type SkillGroupInput = z.infer<typeof SkillGroupSchema>
export type CertificationInput = z.infer<typeof CertificationSchema>
export type AwardInput = z.infer<typeof AwardSchema>
export type LanguageInput = z.infer<typeof LanguageSchema>
export type ExtraInput = z.infer<typeof ExtraSchema>
export type ResumeSettingsInput = z.infer<typeof ResumeSettingsSchema>
export type CreateResumeInput = z.infer<typeof CreateResumeSchema>
export type UpdateResumeInput = z.infer<typeof UpdateResumeSchema>
export type ResumeListQuery = z.infer<typeof ResumeListQuerySchema>
export type BulkOperationInput = z.infer<typeof BulkOperationSchema>
export type RestoreVersionInput = z.infer<typeof RestoreVersionSchema>
