/**
 * Zod Validation Schemas for Cover Letter Data
 *
 * Validates all inputs for cover letter documents at API boundaries and form fields.
 *
 * @module validation/cover-letter
 */

import { z } from 'zod'

/**
 * Text run schema (inline formatted text)
 */
export const TextRunSchema = z.object({
  text: z.string(),
  marks: z.array(z.enum(['bold', 'italic', 'underline'])).optional(),
})

/**
 * Rich text block schema
 */
export const RichTextBlockSchema = z.object({
  type: z.enum(['paragraph', 'bullet_list', 'numbered_list']),
  content: z.array(TextRunSchema).min(1, 'Block must have at least one text run'),
})

/**
 * Sender information schema
 */
export const CoverLetterSenderSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  location: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      postal: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  linkedResumeId: z.string().uuid('Invalid resume ID').nullable().optional(),
})

/**
 * Recipient information schema
 */
export const CoverLetterRecipientSchema = z.object({
  recipientName: z.string().optional(),
  recipientTitle: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  companyAddress: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      region: z.string().optional(),
      postal: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
})

/**
 * Job information schema
 */
export const JobInfoSchema = z.object({
  jobTitle: z.string().optional(),
  jobId: z.string().optional(),
  source: z.string().optional(),
})

/**
 * Cover letter settings schema
 */
export const CoverLetterSettingsSchema = z.object({
  locale: z.string().min(1).default('en-US'),
  dateFormat: z.enum(['US', 'ISO', 'EU']).default('US'),
  fontFamily: z.string().min(1).default('Inter'),
  fontSizeScale: z.number().min(0.8).max(1.2).default(1.0),
  lineSpacing: z.number().min(1.0).max(1.8).default(1.4),
  colorTheme: z.string().min(1).default('default'),
  pageSize: z.enum(['A4', 'Letter']).default('Letter'),
  showLetterhead: z.boolean().default(true),
  includeDate: z.boolean().default(true),
})

/**
 * Complete cover letter JSON schema
 */
export const CoverLetterJsonSchema = z.object({
  from: CoverLetterSenderSchema,
  to: CoverLetterRecipientSchema,
  jobInfo: JobInfoSchema.optional(),
  date: z.string().datetime('Invalid date format (use ISO 8601)'),
  salutation: z.string().min(1, 'Salutation is required').max(100, 'Salutation too long'),
  body: z
    .array(RichTextBlockSchema)
    .min(1, 'Cover letter body must have at least one block')
    .max(50, 'Cover letter body too long (max 50 blocks)'),
  closing: z.string().min(1, 'Closing is required').max(100, 'Closing too long'),
  settings: CoverLetterSettingsSchema,
})

/**
 * Cover letter create input schema
 */
export const CoverLetterCreateInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  template_id: z.string().uuid('Invalid template ID').optional(),
  linked_resume_id: z.string().uuid('Invalid resume ID').optional(),
})

/**
 * Cover letter update input schema
 */
export const CoverLetterUpdateInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  data: CoverLetterJsonSchema.partial().optional(),
  linked_resume_id: z.string().uuid('Invalid resume ID').nullable().optional(),
  version: z.number().int('Version must be an integer').min(1, 'Version must be at least 1'),
})

/**
 * Cover letter list query schema
 */
export const CoverLetterListParamsSchema = z.object({
  status: z.enum(['draft', 'active', 'archived']).optional(),
  search: z.string().optional(),
  sort: z.enum(['updated_at', 'created_at', 'title']).default('updated_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  linked_resume_id: z.string().uuid('Invalid resume ID').optional(),
})
