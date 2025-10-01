/**
 * Technical Template Metadata
 *
 * Template information and default customizations.
 */

import { TemplateMetadata, Customizations } from '@/types/template'
import { createDefaultCustomizations } from '@/types/template'

/**
 * Technical template metadata
 */
export const technicalMetadata: TemplateMetadata = {
  id: 'technical',
  name: 'Technical',
  category: 'technical',
  description:
    'Code-focused design with monospace accents. Perfect for developers, engineers, and technical professionals.',
  thumbnail: '/templates/technical-thumb.svg',
  features: ['Monospace accents', 'Code block styling', 'Technical aesthetics', 'ATS-friendly'],
  version: '1.0.0',
  atsScore: 88,
}

/**
 * Default customizations for Technical template
 */
export const technicalDefaults: Customizations = {
  ...createDefaultCustomizations(),
  typography: {
    fontFamily: 'JetBrains Mono',
    fontSize: 0.95,
    lineHeight: 1.5,
    fontWeight: 400,
  },
  spacing: {
    sectionGap: 24,
    itemGap: 14,
    pagePadding: 48,
  },
  icons: {
    enabled: true,
    style: 'outline',
    size: 16,
    color: 'currentColor',
  },
  layout: {
    columns: 1,
    sidebarPosition: null,
    headerAlignment: 'left',
    photoPosition: null,
  },
}
