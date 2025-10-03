/**
 * Cover Letter Template System Types
 *
 * Type definitions for cover letter templates, customizations, and rendering modes.
 * Mirrors resume template system but adapted for cover letters.
 *
 * @module types/cover-letter-template
 */

import { CoverLetterJson } from './cover-letter'

/**
 * Template category for organization and filtering
 */
export type CoverLetterTemplateCategory = 'classic' | 'modern' | 'creative' | 'executive'

/**
 * Template slug - unique identifier for each cover letter template
 */
export type CoverLetterTemplateSlug =
  | 'classic-block'
  | 'modern-minimal'
  | 'creative-bold'
  | 'executive-formal'

/**
 * Rendering mode for templates
 * - edit: Interactive editing mode (live preview)
 * - preview: Read-only preview mode
 * - print: Print/PDF export mode
 */
export type CoverLetterTemplateMode = 'edit' | 'preview' | 'print'

/**
 * Color scheme customization
 * All colors stored as HSL values in space-separated format: "h s% l%"
 * Example: "225 52% 8%" for navy
 */
export interface CoverLetterColorScheme {
  primary: string // Main heading color
  secondary: string // Subheading color
  accent: string // Accent color (links, borders)
  text: string // Body text color
  background: string // Background color
  muted: string // Muted text color (dates, meta)
  border: string // Border/divider color
}

/**
 * Typography customization
 */
export interface CoverLetterTypography {
  fontFamily: string // Font family name (e.g., 'Inter', 'Source Serif 4')
  fontSize: number // Font size scale multiplier (0.8 to 1.2)
  lineHeight: number // Line height multiplier (1.0 to 1.5)
  fontWeight: number // Base font weight (400, 500, 600)
}

/**
 * Spacing customization
 * All values in pixels
 */
export interface CoverLetterSpacing {
  sectionGap: number // Gap between sections (12-48px)
  paragraphGap: number // Gap between paragraphs (8-20px)
  pagePadding: number // Page margins (24-72px)
}

/**
 * Complete customizations object
 * Stored in cover_letters.customizations JSONB column
 */
export interface CoverLetterCustomizations {
  colors: CoverLetterColorScheme
  typography: CoverLetterTypography
  spacing: CoverLetterSpacing
}

/**
 * Template metadata
 * Describes a template for display in template picker
 */
export interface CoverLetterTemplateMetadata {
  id: CoverLetterTemplateSlug
  name: string
  category: CoverLetterTemplateCategory
  description: string
  thumbnail: string // Path to thumbnail image
  features: string[] // List of key features
  version: string // Template version (semver)
  atsScore?: number // Pre-calculated ATS friendliness score (0-100)
}

/**
 * Template component props
 * Passed to all cover letter template components
 */
export interface CoverLetterTemplateProps {
  data: CoverLetterJson
  customizations?: CoverLetterCustomizations
  mode?: CoverLetterTemplateMode
}

/**
 * Template registry entry
 * Combines component reference with metadata
 */
export interface CoverLetterTemplate {
  component: React.ComponentType<CoverLetterTemplateProps>
  metadata: CoverLetterTemplateMetadata
  defaults: CoverLetterCustomizations // Default customizations for this template
}

/**
 * Default customizations factory
 * Creates default customizations matching the Ramp design system
 */
export function createDefaultCoverLetterCustomizations(): CoverLetterCustomizations {
  return {
    colors: {
      primary: '225 52% 8%', // Navy dark
      secondary: '226 36% 16%', // Navy medium
      accent: '73 100% 50%', // Lime
      text: '210 11% 15%', // Gray 900
      background: '0 0% 100%', // White
      muted: '210 11% 46%', // Gray 500
      border: '210 16% 93%', // Gray 200
    },
    typography: {
      fontFamily: 'Inter',
      fontSize: 1.0,
      lineHeight: 1.5, // Slightly more spacing than resume for readability
      fontWeight: 400,
    },
    spacing: {
      sectionGap: 24,
      paragraphGap: 12,
      pagePadding: 72, // More padding for formal business letter look
    },
  }
}
