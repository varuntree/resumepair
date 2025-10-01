/**
 * Executive Template Metadata
 *
 * Template information and default customizations.
 */

import { TemplateMetadata, Customizations } from '@/types/template'
import { createDefaultCustomizations } from '@/types/template'

/**
 * Executive template metadata
 */
export const executiveMetadata: TemplateMetadata = {
  id: 'executive',
  name: 'Executive',
  category: 'executive',
  description:
    'Premium serif design with subtle elegance. Perfect for senior professionals, executives, and leadership roles.',
  thumbnail: '/templates/executive-thumb.svg',
  features: ['Serif typography', 'Elegant design', 'Center-aligned header', 'Professional'],
  version: '1.0.0',
  atsScore: 90,
}

/**
 * Default customizations for Executive template
 */
export const executiveDefaults: Customizations = {
  ...createDefaultCustomizations(),
  typography: {
    fontFamily: 'Source Serif 4',
    fontSize: 1.05,
    lineHeight: 1.5,
    fontWeight: 400,
  },
  spacing: {
    sectionGap: 36,
    itemGap: 18,
    pagePadding: 56,
  },
  icons: {
    enabled: false,
    style: 'outline',
    size: 16,
    color: 'currentColor',
  },
  layout: {
    columns: 1,
    sidebarPosition: null,
    headerAlignment: 'center',
    photoPosition: null,
  },
}
