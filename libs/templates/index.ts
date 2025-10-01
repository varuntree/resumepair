/**
 * Template System Exports
 *
 * Public API for the template system.
 * Import from this file to access templates and utilities.
 *
 * @module libs/templates
 */

// Registry functions
export {
  getTemplate,
  listTemplates,
  listTemplateMetadata,
  hasTemplate,
  getTemplatesByCategory,
  getDefaultTemplate,
  getDefaultTemplateSlug,
} from './registry'

// Shared components (available for direct import if needed)
export { TemplateBase } from './shared/TemplateBase'
export { TemplateSection } from './shared/TemplateSection'

// Icon components
export * from './shared/TemplateIcons'

// Utilities
export * from './shared/TemplateUtils'

// Re-export types for convenience
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
