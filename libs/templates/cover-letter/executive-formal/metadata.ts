/**
 * Executive Formal Template Metadata
 *
 * Template information and default customizations.
 */

import {
  CoverLetterTemplateMetadata,
  CoverLetterCustomizations,
  createDefaultCoverLetterCustomizations,
} from '@/types/cover-letter-template'

/**
 * Executive Formal template metadata
 */
export const executiveFormalMetadata: CoverLetterTemplateMetadata = {
  id: 'executive-formal',
  name: 'Executive Formal',
  category: 'executive',
  description:
    'Prestigious, elegant design for senior professionals. Perfect for C-level and executive positions.',
  thumbnail: '/templates/cover-letter/executive-formal-thumb.svg',
  features: ['Centered header', 'Serif typography', 'Generous spacing', 'Executive-level'],
  version: '1.0.0',
  atsScore: 96,
}

/**
 * Default customizations for Executive Formal template
 */
export const executiveFormalDefaults: CoverLetterCustomizations = {
  ...createDefaultCoverLetterCustomizations(),
  typography: {
    fontFamily: 'Source Serif 4',
    fontSize: 1.05,
    lineHeight: 1.6,
    fontWeight: 400,
  },
  spacing: {
    sectionGap: 36,
    paragraphGap: 16,
    pagePadding: 80,
  },
}
