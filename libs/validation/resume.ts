/**
 * Zod Validation Schemas for Resume Data
 *
 * Validates all inputs for resume documents at API boundaries and form fields.
 *
 * @module validation/resume
 */

import { z } from 'zod'

/**
 * Profile schema
 */
export const ProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  headline: z.string().max(200, 'Headline too long').optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z
    .object({
      city: z.string().optional(),
      region: z.string().optional(),
      country: z.string().optional(),
      postal: z.string().optional(),
    })
    .optional(),
  links: z
    .array(
      z.object({
        type: z.string().optional(),
        label: z.string().optional(),
        url: z.string().url('Invalid URL'),
      })
    )
    .optional(),
  photo: z
    .object({
      url: z.string().url('Invalid URL'),
      path: z.string(),
    })
    .optional(),
})

/**
 * Work experience schema
 */
export const WorkExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
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

/**
 * Education schema
 */
export const EducationSchema = z.object({
  school: z.string().min(1, 'School name is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  details: z.array(z.string()).optional(),
})

/**
 * Project schema
 */
export const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  link: z.string().url('Invalid URL').optional(),
  summary: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
})

/**
 * Skill group schema
 */
export const SkillGroupSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  items: z.array(z.string()),
})

/**
 * Certification schema
 */
export const CertificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/**
 * Award schema
 */
export const AwardSchema = z.object({
  name: z.string().min(1, 'Award name is required'),
  org: z.string().min(1, 'Organization is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  summary: z.string().optional(),
})

/**
 * Language schema
 */
export const LanguageSchema = z.object({
  name: z.string().min(1, 'Language name is required'),
  level: z.string().min(1, 'Proficiency level is required'),
})

/**
 * Extra section schema
 */
export const ExtraSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
})

/**
 * Resume settings schema
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

/**
 * Complete ResumeJson schema
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
})

/**
 * Create resume input schema
 */
export const CreateResumeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title too long (max 100 characters)'),
  template_id: z.string().uuid('Invalid template ID').optional(),
})

/**
 * Update resume input schema
 */
export const UpdateResumeSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title too long (max 100 characters)')
    .optional(),
  data: ResumeJsonSchema.partial().optional(),
  version: z.number().int().positive('Version must be positive'),
})

/**
 * Resume list query schema
 */
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

/**
 * Bulk operations schema
 */
export const BulkOperationSchema = z.object({
  ids: z.array(z.string().uuid('Invalid ID')).min(1, 'At least one ID required'),
})

/**
 * Restore from version schema
 */
export const RestoreVersionSchema = z.object({
  version_number: z.number().int().positive('Version must be positive'),
})

/**
 * Type exports (inferred from schemas)
 */
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
export type ResumeJsonInput = z.infer<typeof ResumeJsonSchema>
export type CreateResumeInput = z.infer<typeof CreateResumeSchema>
export type UpdateResumeInput = z.infer<typeof UpdateResumeSchema>
export type ResumeListQuery = z.infer<typeof ResumeListQuerySchema>
export type BulkOperationInput = z.infer<typeof BulkOperationSchema>
export type RestoreVersionInput = z.infer<typeof RestoreVersionSchema>