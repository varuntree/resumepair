/**
 * Cover Letter Template Registry
 *
 * Central registry for all cover letter templates.
 * Provides functions to retrieve templates and their metadata.
 *
 * @module libs/templates/cover-letter/registry
 */

import {
  CoverLetterTemplate,
  CoverLetterTemplateSlug,
} from '@/types/cover-letter-template'

/**
 * Global cover letter template registry
 * Maps template slugs to template definitions
 *
 * Templates are lazy-loaded to reduce initial bundle size.
 * Only the selected template is loaded at runtime.
 */
const COVER_LETTER_TEMPLATE_REGISTRY: Record<
  CoverLetterTemplateSlug,
  CoverLetterTemplate
> = {
  'classic-block': {
    component: require('./classic-block/ClassicBlockTemplate').default,
    metadata: require('./classic-block/metadata').classicBlockMetadata,
    defaults: require('./classic-block/metadata').classicBlockDefaults,
  },
  'modern-minimal': {
    component: require('./modern-minimal/ModernMinimalTemplate').default,
    metadata: require('./modern-minimal/metadata').modernMinimalMetadata,
    defaults: require('./modern-minimal/metadata').modernMinimalDefaults,
  },
  'creative-bold': {
    component: require('./creative-bold/CreativeBoldTemplate').default,
    metadata: require('./creative-bold/metadata').creativeBoldMetadata,
    defaults: require('./creative-bold/metadata').creativeBoldDefaults,
  },
  'executive-formal': {
    component: require('./executive-formal/ExecutiveFormalTemplate').default,
    metadata: require('./executive-formal/metadata').executiveFormalMetadata,
    defaults: require('./executive-formal/metadata').executiveFormalDefaults,
  },
}

/**
 * Get a specific cover letter template by slug
 *
 * @param slug - Template identifier
 * @returns Template definition with component, metadata, and defaults
 * @throws Error if template not found
 */
export function getCoverLetterTemplate(
  slug: CoverLetterTemplateSlug
): CoverLetterTemplate {
  const template = COVER_LETTER_TEMPLATE_REGISTRY[slug]

  if (!template) {
    throw new Error(`Cover letter template "${slug}" not found in registry`)
  }

  return template
}

/**
 * Get all available cover letter templates
 *
 * @returns Array of all template definitions
 */
export function listCoverLetterTemplates(): CoverLetterTemplate[] {
  return Object.values(COVER_LETTER_TEMPLATE_REGISTRY)
}

/**
 * Get all cover letter template metadata (without components)
 *
 * Useful for template picker UI where we only need metadata,
 * not the full components.
 *
 * @returns Array of template metadata
 */
export function listCoverLetterTemplateMetadata() {
  return Object.values(COVER_LETTER_TEMPLATE_REGISTRY).map(
    (template) => template.metadata
  )
}

/**
 * Check if a cover letter template exists
 *
 * @param slug - Template identifier
 * @returns True if template exists
 */
export function hasCoverLetterTemplate(
  slug: string
): slug is CoverLetterTemplateSlug {
  return slug in COVER_LETTER_TEMPLATE_REGISTRY
}

/**
 * Get cover letter templates by category
 *
 * @param category - Template category
 * @returns Array of templates in the category
 */
export function getCoverLetterTemplatesByCategory(
  category: string
): CoverLetterTemplate[] {
  return Object.values(COVER_LETTER_TEMPLATE_REGISTRY).filter(
    (template) => template.metadata.category === category
  )
}

/**
 * Get default cover letter template
 *
 * @returns The default template (classic-block)
 */
export function getDefaultCoverLetterTemplate(): CoverLetterTemplate {
  return COVER_LETTER_TEMPLATE_REGISTRY['classic-block']
}

/**
 * Get default cover letter template slug
 *
 * @returns The default template slug
 */
export function getDefaultCoverLetterTemplateSlug(): CoverLetterTemplateSlug {
  return 'classic-block'
}
