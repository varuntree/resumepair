/**
 * Cover Letter JSON Schema Types
 *
 * Canonical data structure for cover letter documents.
 * This is the single source of truth for all cover letter data.
 *
 * Pattern: Same structure as ResumeJson but adapted for cover letter content.
 *
 * @module types/cover-letter
 */

/**
 * Rich text run (inline formatted text)
 * Used within paragraphs, list items, etc.
 */
export interface TextRun {
  text: string
  marks?: ('bold' | 'italic' | 'underline')[] // Optional formatting marks
}

/**
 * Rich text block (paragraph or list)
 * Represents one structural block of content in the cover letter body
 */
export interface RichTextBlock {
  type: 'paragraph' | 'bullet_list' | 'numbered_list'
  content: TextRun[] // Array of text runs with formatting
}

/**
 * Sender information (user's contact details)
 */
export interface CoverLetterSender {
  fullName: string
  email: string
  phone?: string
  location?: {
    street?: string
    city?: string
    region?: string
    postal?: string
    country?: string
  }
  linkedResumeId?: string | null // Optional FK to resumes table
}

/**
 * Recipient information (company/hiring manager)
 */
export interface CoverLetterRecipient {
  recipientName?: string // Hiring manager name (if known)
  recipientTitle?: string // Job title (e.g., "Hiring Manager")
  companyName: string
  companyAddress?: {
    street?: string
    city?: string
    region?: string
    postal?: string
    country?: string
  }
}

/**
 * Job application context (optional but recommended)
 */
export interface JobInfo {
  jobTitle?: string // Position applying for
  jobId?: string // Job posting ID or reference number
  source?: string // Where found (e.g., "LinkedIn", "Indeed", company website)
}

/**
 * Document settings (similar to resume settings)
 */
export interface CoverLetterSettings {
  locale: string // e.g., "en-US", "en-GB"
  dateFormat: 'US' | 'ISO' | 'EU' // MMM DD, YYYY | YYYY-MM-DD | DD MMM YYYY
  fontFamily: string // e.g., "Inter", "Source Sans 3"
  fontSizeScale: number // 0.8 to 1.2
  lineSpacing: number // 1.0 to 1.5
  colorTheme: string // Template-specific theme
  pageSize: 'A4' | 'Letter' // US: Letter, others: A4
  showLetterhead: boolean // Toggle sender info header
  includeDate: boolean // Toggle date field
}

export interface CoverLetterAppearance {
  theme: {
    background: string
    text: string
    primary: string
  }
  typography: {
    fontFamily: string
    fontSize: number
    lineHeight: number
  }
  layout: {
    pageFormat: 'A4' | 'Letter'
    margin: number
    showPageNumbers: boolean
  }
  customCss?: string
}

/**
 * Complete Cover Letter JSON structure (canonical schema)
 */
export interface CoverLetterJson {
  from: CoverLetterSender
  to: CoverLetterRecipient
  jobInfo?: JobInfo // Optional job context
  date: string // ISO date string (when letter written)
  salutation: string // e.g., "Dear Hiring Manager,", "Dear Dr. Smith,"
  body: RichTextBlock[] // Rich text content (paragraphs + lists)
  closing: string // e.g., "Sincerely,", "Best regards,"
  settings: CoverLetterSettings
  appearance?: CoverLetterAppearance
}

/**
 * Database representation of a cover letter document
 */
export interface CoverLetter {
  id: string
  user_id: string
  title: string
  slug: string | null
  version: number
  schema_version: string // "cover-letter.v1"
  data: CoverLetterJson
  linked_resume_id: string | null // FK to resumes (for one-way sync)
  status: 'draft' | 'active' | 'archived'
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  last_accessed_at: string | null
}

/**
 * Version history entry
 */
export interface CoverLetterVersion {
  id: number
  cover_letter_id: string
  version_number: number
  data: CoverLetterJson
  created_at: string
  created_by: string
}

/**
 * Cover letter create input
 */
export interface CoverLetterCreateInput {
  title: string
  linked_resume_id?: string // Optional: link to existing resume
}

/**
 * Cover letter update input
 */
export interface CoverLetterUpdateInput {
  title?: string
  data?: CoverLetterJson
  linked_resume_id?: string | null
  version: number // Required for optimistic locking
}

/**
 * Cover letter list query parameters
 */
export interface CoverLetterListParams {
  status?: 'draft' | 'active' | 'archived'
  search?: string
  sort?: 'updated_at' | 'created_at' | 'title'
  order?: 'asc' | 'desc'
  cursor?: string
  limit?: number
  linked_resume_id?: string // Filter by linked resume
}

/**
 * Cover letter list response
 */
export interface CoverLetterListResponse {
  cover_letters: CoverLetter[]
  nextCursor: string | null
  total: number
}

/**
 * Default cover letter settings factory
 */
export function createDefaultCoverLetterSettings(
  userLocale?: string,
  userDateFormat?: 'US' | 'ISO' | 'EU',
  userPageSize?: 'A4' | 'Letter'
): CoverLetterSettings {
  return {
    locale: userLocale || 'en-US',
    dateFormat: userDateFormat || 'US',
    fontFamily: 'Inter',
    fontSizeScale: 1.0,
    lineSpacing: 1.4, // Slightly more spacing than resume (readability)
    colorTheme: 'default',
    pageSize: userPageSize || 'Letter',
    showLetterhead: true,
    includeDate: true,
  }
}

export function createDefaultCoverLetterAppearance(pageSize: 'A4' | 'Letter' = 'Letter'): CoverLetterAppearance {
  return {
    theme: {
      background: '#ffffff',
      text: '#1f2937',
      primary: '#1d4ed8',
    },
    typography: {
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 16,
      lineHeight: 1.5,
    },
    layout: {
      pageFormat: pageSize,
      margin: 64,
      showPageNumbers: false,
    },
    customCss: undefined,
  }
}

/**
 * Create empty cover letter JSON
 */
export function createEmptyCoverLetter(
  email: string,
  fullName?: string,
  settings?: Partial<CoverLetterSettings>
): CoverLetterJson {
  const mergedSettings = {
    ...createDefaultCoverLetterSettings(),
    ...settings,
  }

  return {
    from: {
      fullName: fullName || 'Your Name',
      email: email,
    },
    to: {
      companyName: 'Company Name',
    },
    date: new Date().toISOString(),
    salutation: 'Dear Hiring Manager,',
    body: [
      {
        type: 'paragraph',
        content: [
          {
            text: 'I am writing to express my strong interest in the [Position Title] role at [Company Name]. With my background in [relevant experience], I am confident I can contribute to your team.',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            text: '[Highlight your key achievements and how they align with the job requirements.]',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            text: 'I would welcome the opportunity to discuss how my skills and experience can benefit [Company Name]. Thank you for your consideration.',
          },
        ],
      },
    ],
    closing: 'Sincerely,',
    settings: mergedSettings,
    appearance: createDefaultCoverLetterAppearance(mergedSettings.pageSize),
  }
}

/**
 * Create cover letter from resume data (for sync/generation)
 */
export function createCoverLetterFromResume(
  resumeProfile: { fullName: string; email: string; phone?: string; location?: any },
  settings?: Partial<CoverLetterSettings>
): Partial<CoverLetterJson> {
  return {
    from: {
      fullName: resumeProfile.fullName,
      email: resumeProfile.email,
      phone: resumeProfile.phone,
      location: resumeProfile.location,
    },
    date: new Date().toISOString(),
    salutation: 'Dear Hiring Manager,',
    closing: 'Sincerely,',
    settings: {
      ...createDefaultCoverLetterSettings(),
      ...settings,
    },
    appearance: createDefaultCoverLetterAppearance((settings?.pageSize || 'Letter') as 'A4' | 'Letter'),
  }
}
