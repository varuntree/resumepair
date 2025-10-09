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
  layout_settings: ResumeAppearanceSchema.shape.layout_settings.extend({
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
  // Encourage the model to include these sections; require at least one item
  work: z.array(WorkExperienceSchema).min(1),
  education: z.array(EducationSchema).min(1),
  projects: z.array(ProjectSchema).min(1),
  skills: z.array(SkillGroupSchema).min(1),
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
