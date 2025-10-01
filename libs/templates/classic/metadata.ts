/**
 * Classic Template Metadata
 */

import { TemplateMetadata, Customizations } from '@/types/template'
import { createDefaultCustomizations } from '@/types/template'

export const classicMetadata: TemplateMetadata = {
  id: 'classic',
  name: 'Classic',
  category: 'classic',
  description: 'Traditional serif design for conservative industries. Timeless and professional.',
  thumbnail: '/templates/classic-thumb.svg',
  features: ['ATS-friendly', 'Traditional serif', 'Conservative layout', 'Center-aligned header'],
  version: '1.0.0',
  atsScore: 92,
}

export const classicDefaults: Customizations = {
  ...createDefaultCustomizations(),
  typography: {
    fontFamily: 'Source Serif 4',
    fontSize: 1.0,
    lineHeight: 1.5,
    fontWeight: 400,
  },
  spacing: {
    sectionGap: 20,
    itemGap: 12,
    pagePadding: 48,
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
