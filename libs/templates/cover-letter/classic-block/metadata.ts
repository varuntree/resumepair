/**
 * Classic Block Template Metadata
 *
 * Template information and default customizations.
 */

import {
  CoverLetterTemplateMetadata,
  CoverLetterCustomizations,
  createDefaultCoverLetterCustomizations,
} from '@/types/cover-letter-template'

/**
 * Classic Block template metadata
 */
export const classicBlockMetadata: CoverLetterTemplateMetadata = {
  id: 'classic-block',
  name: 'Classic Block',
  category: 'classic',
  description:
    'Traditional business letter format with block alignment. Conservative and professional for all industries.',
  thumbnail: '/templates/cover-letter/classic-block-thumb.svg',
  features: ['Block format', 'Formal layout', 'ATS-friendly', 'Professional'],
  version: '1.0.0',
  atsScore: 98,
}

/**
 * Default customizations for Classic Block template
 */
export const classicBlockDefaults: CoverLetterCustomizations = {
  ...createDefaultCoverLetterCustomizations(),
  typography: {
    fontFamily: 'Source Serif 4',
    fontSize: 1.0,
    lineHeight: 1.5,
    fontWeight: 400,
  },
  spacing: {
    sectionGap: 24,
    paragraphGap: 12,
    pagePadding: 72,
  },
}
