/**
 * Cover Letter Template System Exports
 *
 * Public API for the cover letter template system.
 * Import from this file to access templates and utilities.
 *
 * @module libs/templates/cover-letter
 */

// Registry functions
export {
  getCoverLetterTemplate,
  listCoverLetterTemplates,
  listCoverLetterTemplateMetadata,
  hasCoverLetterTemplate,
  getCoverLetterTemplatesByCategory,
  getDefaultCoverLetterTemplate,
  getDefaultCoverLetterTemplateSlug,
} from './registry'

// Shared components (available for direct import if needed)
export { CoverLetterTemplateBase } from './shared/CoverLetterTemplateBase'

// Utilities
export * from './shared/CoverLetterTemplateUtils'

// Re-export types for convenience
export type {
  CoverLetterTemplateSlug,
  CoverLetterTemplateCategory,
  CoverLetterTemplateMode,
  CoverLetterTemplateProps,
  CoverLetterTemplateMetadata,
  CoverLetterTemplate,
  CoverLetterCustomizations,
  CoverLetterColorScheme,
  CoverLetterTypography,
  CoverLetterSpacing,
} from '@/types/cover-letter-template'
