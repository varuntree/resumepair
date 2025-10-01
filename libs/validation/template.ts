/**
 * Template Validation Schemas
 *
 * Zod schemas for validating template customizations and metadata.
 * Used for API input validation and type-safe parsing.
 *
 * @module libs/validation/template
 */

import { z } from 'zod'

/**
 * HSL color string validation
 * Format: "h s% l%" (space-separated, no commas)
 * Example: "225 52% 8%"
 */
const hslColorSchema = z.string().regex(
  /^\d{1,3}\s+\d{1,3}%\s+\d{1,3}%$/,
  'Color must be in HSL format: "h s% l%" (e.g., "225 52% 8%")'
)

/**
 * Template slug validation
 */
export const TemplateSlugSchema = z.enum([
  'minimal',
  'modern',
  'classic',
  'creative',
  'technical',
  'executive',
])

/**
 * Template category validation
 */
export const TemplateCategorySchema = z.enum([
  'minimal',
  'modern',
  'classic',
  'creative',
  'technical',
  'executive',
])

/**
 * Template mode validation
 */
export const TemplateModeSchema = z.enum(['edit', 'preview', 'print'])

/**
 * Color scheme validation
 */
export const ColorSchemeSchema = z.object({
  primary: hslColorSchema,
  secondary: hslColorSchema,
  accent: hslColorSchema,
  text: hslColorSchema,
  background: hslColorSchema,
  muted: hslColorSchema,
  border: hslColorSchema,
})

/**
 * Typography validation
 */
export const TypographySchema = z.object({
  fontFamily: z.string().min(1, 'Font family is required'),
  fontSize: z.number().min(0.8).max(1.2),
  lineHeight: z.number().min(1.0).max(1.5),
  fontWeight: z.number().int().min(100).max(900).multipleOf(100),
})

/**
 * Spacing validation
 */
export const SpacingSchema = z.object({
  sectionGap: z.number().int().min(12).max(48),
  itemGap: z.number().int().min(8).max(24),
  pagePadding: z.number().int().min(24).max(72),
})

/**
 * Icon settings validation
 */
export const IconSettingsSchema = z.object({
  enabled: z.boolean(),
  style: z.enum(['outline', 'solid']),
  size: z.number().int().min(12).max(20),
  color: z.union([
    z.literal('currentColor'),
    hslColorSchema,
  ]),
})

/**
 * Layout settings validation
 */
export const LayoutSettingsSchema = z.object({
  columns: z.union([z.literal(1), z.literal(2)]),
  sidebarPosition: z.enum(['left', 'right']).nullable(),
  headerAlignment: z.enum(['left', 'center']),
  photoPosition: z.enum(['header', 'sidebar']).nullable(),
})

/**
 * Complete customizations validation
 */
export const CustomizationsSchema = z.object({
  colors: ColorSchemeSchema,
  typography: TypographySchema,
  spacing: SpacingSchema,
  icons: IconSettingsSchema,
  layout: LayoutSettingsSchema,
})

/**
 * Partial customizations (for updates)
 */
export const PartialCustomizationsSchema = z.object({
  colors: ColorSchemeSchema.partial().optional(),
  typography: TypographySchema.partial().optional(),
  spacing: SpacingSchema.partial().optional(),
  icons: IconSettingsSchema.partial().optional(),
  layout: LayoutSettingsSchema.partial().optional(),
})

/**
 * Template metadata validation
 */
export const TemplateMetadataSchema = z.object({
  id: TemplateSlugSchema,
  name: z.string().min(1),
  category: TemplateCategorySchema,
  description: z.string().min(1),
  thumbnail: z.string().min(1),
  features: z.array(z.string()),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., "1.0.0")'),
  atsScore: z.number().int().min(0).max(100).optional(),
})

/**
 * Infer TypeScript types from schemas
 */
export type ColorSchemeInput = z.infer<typeof ColorSchemeSchema>
export type TypographyInput = z.infer<typeof TypographySchema>
export type SpacingInput = z.infer<typeof SpacingSchema>
export type IconSettingsInput = z.infer<typeof IconSettingsSchema>
export type LayoutSettingsInput = z.infer<typeof LayoutSettingsSchema>
export type CustomizationsInput = z.infer<typeof CustomizationsSchema>
export type PartialCustomizationsInput = z.infer<typeof PartialCustomizationsSchema>
export type TemplateMetadataInput = z.infer<typeof TemplateMetadataSchema>
