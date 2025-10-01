/**
 * Creative Template Metadata
 *
 * Template information and default customizations.
 */

import { TemplateMetadata, Customizations } from '@/types/template'
import { createDefaultCustomizations } from '@/types/template'

/**
 * Creative template metadata
 */
export const creativeMetadata: TemplateMetadata = {
  id: 'creative',
  name: 'Creative',
  category: 'creative',
  description:
    'Bold, visual-first design with large headings and optional two-column layout. Perfect for creative professionals.',
  thumbnail: '/templates/creative-thumb.svg',
  features: ['Bold headings', 'Two-column layout', 'Icons enabled', 'Modern design'],
  version: '1.0.0',
  atsScore: 82,
}

/**
 * Default customizations for Creative template
 */
export const creativeDefaults: Customizations = {
  ...createDefaultCustomizations(),
  spacing: {
    sectionGap: 28,
    itemGap: 16,
    pagePadding: 48,
  },
  icons: {
    enabled: true,
    style: 'solid',
    size: 16,
    color: 'currentColor',
  },
  layout: {
    columns: 2,
    sidebarPosition: 'left',
    headerAlignment: 'left',
    photoPosition: 'sidebar',
  },
}
