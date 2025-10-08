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
  WorkExperienceSchema,
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
  layout: ResumeAppearanceSchema.shape.layout.extend({
    // Accept numbers like 0.75 (inches) and coerce to px (≈96 dpi), then clamp
    margin: z
      .coerce
      .number()
      .transform((n) => (n < 3 ? Math.round(n * 96) : Math.round(n)))
      .pipe(z.number().min(8).max(144)),
  }),
})

export const ResumeGenerationSchema = z.object({
  profile: ProfileSchema,
  summary: z.string().optional(),
  work: z.array(WorkExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  skills: z.array(SkillGroupSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  awards: z.array(AwardSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
  extras: z.array(ExtraSchema).default([]),
  // Settings intentionally omitted here (handled by editor & normalization)
  // If model includes appearance, accept permissively with margin coercion
  appearance: GenerationAppearanceSchema.optional(),
  // Allow arbitrary additional keys to pass through without blocking
}).passthrough()

export type ResumeGeneration = z.infer<typeof ResumeGenerationSchema>

