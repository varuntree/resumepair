/**
 * Creative Bold Template Metadata
 *
 * Template information and default customizations.
 */

import {
  CoverLetterTemplateMetadata,
  CoverLetterCustomizations,
  createDefaultCoverLetterCustomizations,
} from '@/types/cover-letter-template'

/**
 * Creative Bold template metadata
 */
export const creativeBoldMetadata: CoverLetterTemplateMetadata = {
  id: 'creative-bold',
  name: 'Creative Bold',
  category: 'creative',
  description:
    'Bold, expressive design with accent colors. Perfect for creative professionals and designers.',
  thumbnail: '/templates/cover-letter/creative-bold-thumb.svg',
  features: ['Bold typography', 'Accent colors', 'Creative layout', 'Designer-friendly'],
  version: '1.0.0',
  atsScore: 88,
}

/**
 * Default customizations for Creative Bold template
 */
export const creativeBoldDefaults: CoverLetterCustomizations = {
  ...createDefaultCoverLetterCustomizations(),
  typography: {
    fontFamily: 'Inter',
    fontSize: 1.05,
    lineHeight: 1.6,
    fontWeight: 400,
  },
  spacing: {
    sectionGap: 32,
    paragraphGap: 14,
    pagePadding: 56,
  },
  colors: {
    primary: '225 52% 8%', // Navy dark
    secondary: '226 36% 16%', // Navy medium
    accent: '73 100% 50%', // Lime (more prominent in this template)
    text: '210 11% 15%', // Gray 900
    background: '0 0% 100%', // White
    muted: '210 11% 46%', // Gray 500
    border: '210 16% 93%', // Gray 200
  },
}
