/**
 * Template Registry
 *
 * Central registry for all resume templates.
 * Provides functions to retrieve templates and their metadata.
 *
 * @module libs/templates/registry
 */

import { ResumeTemplate, TemplateSlug } from '@/types/template'

/**
 * Global template registry
 * Maps template slugs to template definitions
 *
 * Templates are lazy-loaded to reduce initial bundle size.
 * Only the selected template is loaded at runtime.
 */
const TEMPLATE_REGISTRY: Record<TemplateSlug, ResumeTemplate> = {
  minimal: {
    component: require('./minimal/MinimalTemplate').default,
    metadata: require('./minimal/metadata').minimalMetadata,
    defaults: require('./minimal/metadata').minimalDefaults,
  },
  modern: {
    component: require('./modern/ModernTemplate').default,
    metadata: require('./modern/metadata').modernMetadata,
    defaults: require('./modern/metadata').modernDefaults,
  },
  classic: {
    component: require('./classic/ClassicTemplate').default,
    metadata: require('./classic/metadata').classicMetadata,
    defaults: require('./classic/metadata').classicDefaults,
  },
  // Phase 3C: Creative, Technical, Executive templates
  creative: {
    component: require('./creative/CreativeTemplate').default,
    metadata: require('./creative/metadata').creativeMetadata,
    defaults: require('./creative/metadata').creativeDefaults,
  },
  technical: {
    component: require('./technical/TechnicalTemplate').default,
    metadata: require('./technical/metadata').technicalMetadata,
    defaults: require('./technical/metadata').technicalDefaults,
  },
  executive: {
    component: require('./executive/ExecutiveTemplate').default,
    metadata: require('./executive/metadata').executiveMetadata,
    defaults: require('./executive/metadata').executiveDefaults,
  },
}

/**
 * Get a specific template by slug
 *
 * @param slug - Template identifier
 * @returns Template definition with component, metadata, and defaults
 * @throws Error if template not found
 */
export function getTemplate(slug: TemplateSlug): ResumeTemplate {
  const template = TEMPLATE_REGISTRY[slug]

  if (!template) {
    throw new Error(`Template "${slug}" not found in registry`)
  }

  return template
}

/**
 * Get all available templates
 *
 * @returns Array of all template definitions
 */
export function listTemplates(): ResumeTemplate[] {
  return Object.values(TEMPLATE_REGISTRY)
}

/**
 * Get all template metadata (without components)
 *
 * Useful for template picker UI where we only need metadata,
 * not the full components.
 *
 * @returns Array of template metadata
 */
export function listTemplateMetadata() {
  return Object.values(TEMPLATE_REGISTRY).map((template) => template.metadata)
}

/**
 * Check if a template exists
 *
 * @param slug - Template identifier
 * @returns True if template exists
 */
export function hasTemplate(slug: string): slug is TemplateSlug {
  return slug in TEMPLATE_REGISTRY
}

/**
 * Get template by category
 *
 * @param category - Template category
 * @returns Array of templates in the category
 */
export function getTemplatesByCategory(category: string): ResumeTemplate[] {
  return Object.values(TEMPLATE_REGISTRY).filter(
    (template) => template.metadata.category === category
  )
}

/**
 * Get default template
 *
 * @returns The default template (minimal)
 */
export function getDefaultTemplate(): ResumeTemplate {
  return TEMPLATE_REGISTRY.minimal
}

/**
 * Get default template slug
 *
 * @returns The default template slug
 */
export function getDefaultTemplateSlug(): TemplateSlug {
  return 'minimal'
}
