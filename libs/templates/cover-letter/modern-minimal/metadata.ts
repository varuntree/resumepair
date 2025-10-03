/**
 * Modern Minimal Template Metadata
 *
 * Template information and default customizations.
 */

import {
  CoverLetterTemplateMetadata,
  CoverLetterCustomizations,
  createDefaultCoverLetterCustomizations,
} from '@/types/cover-letter-template'

/**
 * Modern Minimal template metadata
 */
export const modernMinimalMetadata: CoverLetterTemplateMetadata = {
  id: 'modern-minimal',
  name: 'Modern Minimal',
  category: 'modern',
  description:
    'Clean, contemporary design with subtle accents. Perfect for tech and creative industries.',
  thumbnail: '/templates/cover-letter/modern-minimal-thumb.svg',
  features: ['Clean layout', 'Accent colors', 'Modern typography', 'Generous whitespace'],
  version: '1.0.0',
  atsScore: 95,
}

/**
 * Default customizations for Modern Minimal template
 */
export const modernMinimalDefaults: CoverLetterCustomizations = {
  ...createDefaultCoverLetterCustomizations(),
  typography: {
    fontFamily: 'Inter',
    fontSize: 1.0,
    lineHeight: 1.5,
    fontWeight: 400,
  },
  spacing: {
    sectionGap: 28,
    paragraphGap: 14,
    pagePadding: 64,
  },
}
