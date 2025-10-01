/**
 * Minimal Template Metadata
 *
 * Template information and default customizations.
 */

import { TemplateMetadata, Customizations } from '@/types/template'
import { createDefaultCustomizations } from '@/types/template'

/**
 * Minimal template metadata
 */
export const minimalMetadata: TemplateMetadata = {
  id: 'minimal',
  name: 'Minimal',
  category: 'minimal',
  description: 'Clean, whitespace-focused design for maximum readability. Perfect for ATS systems.',
  thumbnail: '/templates/minimal-thumb.svg',
  features: ['ATS-friendly', 'Clean layout', 'Focus on content', 'Maximum readability'],
  version: '1.0.0',
  atsScore: 95,
}

/**
 * Default customizations for Minimal template
 */
export const minimalDefaults: Customizations = {
  ...createDefaultCustomizations(),
  spacing: {
    sectionGap: 32,
    itemGap: 12,
    pagePadding: 48,
  },
  icons: {
    enabled: false,
    style: 'outline',
    size: 16,
    color: 'currentColor',
  },
}
