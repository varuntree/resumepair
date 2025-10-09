/**
 * Resume Generation Schema (AI Streaming)
 *
 * A permissive/coercive variant of the storage schema used only during
 * AI generation to avoid hard stops from unit/shape mismatches.
 * - Coerces layout.margin (inches → px) and clamps to storage limits
 * - Ensures important arrays exist (defaults to []) so final object always
 *   contains top-level section keys
 * - Makes settings/appearance optional; normalization fills sane defaults
 */

import { z } from 'zod'
import {
  ProfileSchema,
  EducationSchema,
  ProjectSchema,
  SkillGroupSchema,
  CertificationSchema,
  AwardSchema,
  LanguageSchema,
  ExtraSchema,
  ResumeAppearanceSchema,
} from './resume'

// Build a permissive appearance schema with margin coercion/clamping
const GenerationAppearanceSchema = ResumeAppearanceSchema.extend({
  layout_settings: ResumeAppearanceSchema.shape.layout_settings.extend({
    // Accept numbers like 0.75 (inches) and coerce to px (≈96 dpi), then clamp
    margin: z
      .coerce
      .number()
      .transform((n) => (n < 3 ? Math.round(n * 96) : Math.round(n)))
      .pipe(z.number().min(8).max(144)),
  }),
})

// Permissive profile for generation: allow missing/invalid email during streaming
const GenerationProfileSchema = ProfileSchema.extend({
  email: ProfileSchema.shape.email.optional(),
})

// Permissive work experience for generation: accept YYYY-MM or YYYY-MM-DD
const GenerationWorkExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}(?:-\d{2})?$/, 'Invalid date (use YYYY-MM or YYYY-MM-DD)'),
  endDate: z
    .union([
      z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?$/),
      z.literal('Present'),
      z.null(),
    ])
    .optional(),
  descriptionBullets: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
})

// Permissive education for generation: accept YYYY-MM or YYYY-MM-DD
const GenerationEducationSchema = EducationSchema.extend({
  startDate: z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}(?:-\d{2})?$/).optional(),
})

export const ResumeGenerationSchema = z.object({
  profile: GenerationProfileSchema,
  summary: z.string().optional(),
  // Encourage the model to include these sections but never block completion
  work: z.array(GenerationWorkExperienceSchema).optional().default([]),
  education: z.array(GenerationEducationSchema).optional().default([]),
  projects: z.array(ProjectSchema).optional().default([]),
  skills: z.array(SkillGroupSchema).optional().default([]),
  // Optional sections may be empty but should not block completion
  certifications: z.array(CertificationSchema).optional().default([]),
  awards: z.array(AwardSchema).optional().default([]),
  languages: z.array(LanguageSchema).optional().default([]),
  extras: z.array(ExtraSchema).optional().default([]),
  // Settings intentionally omitted here (handled by editor & normalization)
  // If model includes appearance, accept permissively with margin coercion
  appearance: GenerationAppearanceSchema.optional(),
  // Allow arbitrary additional keys to pass through without blocking
}).passthrough()

export type ResumeGeneration = z.infer<typeof ResumeGenerationSchema>
