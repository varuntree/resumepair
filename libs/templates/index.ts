/**
 * Template System Exports
 *
 * Public API for the template system.
 * Import from this file to access templates and utilities.
 *
 * @module libs/templates
 */

// Resume template registry functions
export {
  getTemplate,
  listTemplates,
  listTemplateMetadata,
  hasTemplate,
  getTemplatesByCategory,
  getDefaultTemplate,
  getDefaultTemplateSlug,
} from './registry'

// Cover letter template registry functions
export {
  getCoverLetterTemplate,
  listCoverLetterTemplates,
  listCoverLetterTemplateMetadata,
  hasCoverLetterTemplate,
  getCoverLetterTemplatesByCategory,
  getDefaultCoverLetterTemplate,
  getDefaultCoverLetterTemplateSlug,
} from './cover-letter'

// Shared components (available for direct import if needed)
export { TemplateBase } from './shared/TemplateBase'
export { TemplateSection } from './shared/TemplateSection'
export { CoverLetterTemplateBase } from './cover-letter/shared/CoverLetterTemplateBase'

// Icon components
export * from './shared/TemplateIcons'

// Utilities
export * from './shared/TemplateUtils'

// Cover letter specific utilities (only export non-conflicting functions)
export {
  formatCoverLetterDate,
  formatAddressMultiline,
  formatEmailLink,
} from './cover-letter/shared/CoverLetterTemplateUtils'

// Re-export resume template types
export type {
  TemplateSlug,
  TemplateCategory,
  TemplateMode,
  TemplateProps,
  TemplateMetadata,
  ResumeTemplate,
  Customizations,
  ColorScheme,
  Typography,
  Spacing,
  IconSettings,
  LayoutSettings,
} from '@/types/template'

// Re-export cover letter template types
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
