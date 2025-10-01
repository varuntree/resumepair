/**
 * Modern Template Metadata
 */

import { TemplateMetadata, Customizations } from '@/types/template'
import { createDefaultCustomizations } from '@/types/template'

export const modernMetadata: TemplateMetadata = {
  id: 'modern',
  name: 'Modern',
  category: 'modern',
  description: 'Contemporary design with accent colors and icons. Visual and professional.',
  thumbnail: '/templates/modern-thumb.svg',
  features: ['ATS-friendly', 'Visual hierarchy', 'Icons enabled', 'Accent colors'],
  version: '1.0.0',
  atsScore: 90,
}

export const modernDefaults: Customizations = {
  ...createDefaultCustomizations(),
  spacing: {
    sectionGap: 28,
    itemGap: 12,
    pagePadding: 48,
  },
  icons: {
    enabled: true,
    style: 'outline',
    size: 16,
    color: 'currentColor',
  },
}
