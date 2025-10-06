/**
 * Sample Cover Letter Data
 *
 * Centralized dummy CoverLetterJson used for previews and thumbnail generation.
 */

import type { CoverLetterJson } from '@/types/cover-letter'
import { createDefaultCoverLetterSettings } from '@/types/cover-letter'

export const coverLetterSample: CoverLetterJson = {
  from: {
    fullName: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    location: { city: 'San Francisco', region: 'CA', postal: '94105', country: 'USA' },
  },
  to: {
    recipientName: 'Jane Smith',
    recipientTitle: 'Hiring Manager',
    companyName: 'Acme Corp',
    companyAddress: { city: 'San Francisco', region: 'CA', postal: '94103', country: 'USA' },
  },
  date: new Date('2024-09-15').toISOString(),
  salutation: 'Dear Hiring Manager,',
  body: [
    {
      type: 'paragraph',
      content: [
        {
          text:
            'I am excited to apply for the Senior Software Engineer role at Acme Corp. With 8+ years of experience building performant web platforms, I would bring immediate impact to your team.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          text:
            'At Acme, I led a Next.js migration improving TTFB by 35% and implemented a design-system that reduced CSS bundle size by 28%. I enjoy collaborating across functions to deliver measurable outcomes.',
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        {
          text:
            'I would welcome the opportunity to discuss how my experience can support Acme’s roadmap. Thank you for your time and consideration.',
        },
      ],
    },
  ],
  closing: 'Sincerely,',
  settings: {
    ...createDefaultCoverLetterSettings('en-US', 'US', 'Letter'),
    includeDate: true,
    showLetterhead: true,
  },
}

export default coverLetterSample
