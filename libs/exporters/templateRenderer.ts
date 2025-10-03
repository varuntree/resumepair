/**
 * Template Renderer
 *
 * Generates print-ready HTML from resume JSON using template components.
 * Injects document-scoped CSS variables and styles for PDF rendering.
 *
 * @module libs/exporters/templateRenderer
 */

import { ResumeJson } from '@/types/resume'
import { CoverLetterJson, RichTextBlock, TextRun } from '@/types/cover-letter'
import { ExportOptions } from '@/libs/repositories/exportJobs'

// ============================================
// TYPES
// ============================================

interface RenderOptions {
  templateSlug: string
  pageSize: 'letter' | 'a4'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MARGINS = {
  letter: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  a4: { top: 1.27, right: 1.27, bottom: 1.27, left: 1.27 },
}

const PAGE_DIMENSIONS = {
  letter: { width: '8.5in', height: '11in' },
  a4: { width: '210mm', height: '297mm' },
}

// ============================================
// TEMPLATE RENDERING
// ============================================

/**
 * Render resume JSON to print-ready HTML
 *
 * NOTE: This is a simplified implementation. In a full implementation,
 * you would import actual template components and render them server-side.
 * For now, we generate a basic HTML structure.
 */
export async function renderResumeTemplate(
  resumeData: ResumeJson,
  options: RenderOptions
): Promise<string> {
  const { templateSlug, pageSize, margins } = options
  const finalMargins = margins || DEFAULT_MARGINS[pageSize]
  const dimensions = PAGE_DIMENSIONS[pageSize]

  // Generate CSS for print layout
  const printStyles = generatePrintStyles(pageSize, finalMargins)

  // Generate HTML content (simplified version)
  const content = generateResumeHTML(resumeData, templateSlug)

  // Combine into complete HTML document
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${resumeData.profile?.fullName || 'Resume'}</title>
  <style>
    ${printStyles}
  </style>
</head>
<body>
  <div class="resume-container">
    ${content}
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate print-optimized CSS
 */
function generatePrintStyles(
  pageSize: 'letter' | 'a4',
  margins: { top: number; right: number; bottom: number; left: number }
): string {
  const dimensions = PAGE_DIMENSIONS[pageSize]

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: ${dimensions.width} ${dimensions.height};
      margin: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
    }

    html, body {
      width: 100%;
      height: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .resume-container {
      width: 100%;
      max-width: ${dimensions.width};
      margin: 0 auto;
    }

    /* Typography */
    h1 { font-size: 24pt; font-weight: 700; margin-bottom: 8pt; }
    h2 { font-size: 14pt; font-weight: 600; margin-bottom: 6pt; border-bottom: 1pt solid #000; padding-bottom: 4pt; }
    h3 { font-size: 12pt; font-weight: 600; margin-bottom: 4pt; }
    p { margin-bottom: 6pt; }

    /* Sections */
    .section { margin-bottom: 16pt; page-break-inside: avoid; }
    .section-title { font-size: 14pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5pt; margin-bottom: 8pt; border-bottom: 1pt solid #000; padding-bottom: 4pt; }

    /* Profile */
    .profile { text-align: center; margin-bottom: 16pt; }
    .profile-name { font-size: 28pt; font-weight: 700; margin-bottom: 4pt; }
    .profile-contact { font-size: 10pt; margin-bottom: 2pt; }

    /* Work Experience */
    .work-item { margin-bottom: 12pt; page-break-inside: avoid; }
    .work-header { margin-bottom: 4pt; }
    .work-title { font-size: 12pt; font-weight: 600; }
    .work-company { font-size: 11pt; font-weight: 500; }
    .work-date { font-size: 10pt; color: #666; }
    .work-description { margin-top: 4pt; }
    .work-bullet { margin-left: 16pt; margin-bottom: 2pt; }

    /* Education */
    .education-item { margin-bottom: 8pt; page-break-inside: avoid; }
    .education-degree { font-weight: 600; }
    .education-school { font-weight: 500; }
    .education-date { font-size: 10pt; color: #666; }

    /* Skills */
    .skills-list { display: flex; flex-wrap: wrap; gap: 8pt; }
    .skill-item { padding: 4pt 8pt; background: #f0f0f0; border-radius: 4pt; font-size: 10pt; }

    /* Links */
    a { color: #000; text-decoration: none; }

    /* Print optimization */
    @media print {
      body { margin: 0; }
      .page-break { page-break-after: always; }
      .no-break { page-break-inside: avoid; }
    }
  `
}

/**
 * Generate HTML content from resume data
 * This is a simplified implementation - full version would use actual templates
 */
function generateResumeHTML(data: ResumeJson, templateSlug: string): string {
  const sections: string[] = []

  // Profile section
  if (data.profile) {
    const locationStr = data.profile.location
      ? [data.profile.location.city, data.profile.location.region, data.profile.location.country]
          .filter(Boolean)
          .join(', ')
      : ''

    sections.push(`
      <div class="profile">
        <div class="profile-name">${escapeHtml(data.profile.fullName || '')}</div>
        ${data.profile.email ? `<div class="profile-contact">${escapeHtml(data.profile.email)}</div>` : ''}
        ${data.profile.phone ? `<div class="profile-contact">${escapeHtml(data.profile.phone)}</div>` : ''}
        ${locationStr ? `<div class="profile-contact">${escapeHtml(locationStr)}</div>` : ''}
      </div>
    `)
  }

  // Summary section
  if (data.summary) {
    sections.push(`
      <div class="section">
        <div class="section-title">Summary</div>
        <p>${escapeHtml(data.summary)}</p>
      </div>
    `)
  }

  // Work experience
  if (data.work && data.work.length > 0) {
    const workItems = data.work
      .map(
        (item) => `
      <div class="work-item">
        <div class="work-header">
          <div class="work-title">${escapeHtml(item.role || '')}</div>
          <div class="work-company">${escapeHtml(item.company || '')}</div>
          <div class="work-date">${formatDateRange(item.startDate, item.endDate)}</div>
        </div>
        ${
          item.descriptionBullets && item.descriptionBullets.length > 0
            ? `
          <div class="work-description">
            ${item.descriptionBullets.map((h) => `<div class="work-bullet">• ${escapeHtml(h)}</div>`).join('')}
          </div>
        `
            : ''
        }
      </div>
    `
      )
      .join('')

    sections.push(`
      <div class="section">
        <div class="section-title">Experience</div>
        ${workItems}
      </div>
    `)
  }

  // Education
  if (data.education && data.education.length > 0) {
    const eduItems = data.education
      .map(
        (item) => `
      <div class="education-item">
        <div class="education-degree">${escapeHtml(item.degree || '')}</div>
        <div class="education-school">${escapeHtml(item.school || '')}</div>
        <div class="education-date">${formatDateRange(item.startDate, item.endDate)}</div>
      </div>
    `
      )
      .join('')

    sections.push(`
      <div class="section">
        <div class="section-title">Education</div>
        ${eduItems}
      </div>
    `)
  }

  // Skills
  if (data.skills && data.skills.length > 0) {
    const skillGroups = data.skills.map((group) => {
      const skillItems = group.items.join(', ')
      return `<div class="skill-group"><strong>${escapeHtml(group.category || 'Skills')}:</strong> ${escapeHtml(skillItems)}</div>`
    }).join('')

    sections.push(`
      <div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-list">
          ${skillGroups}
        </div>
      </div>
    `)
  }

  return sections.join('\n')
}

/**
 * Format date range for display
 */
function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return ''

  const formatDate = (date?: string | null) => {
    if (!date) return ''
    try {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    } catch {
      return date
    }
  }

  const startStr = formatDate(start)
  const endStr = end ? formatDate(end) : 'Present'

  return `${startStr} - ${endStr}`
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = { textContent: text } as HTMLElement
  return div.textContent || ''
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ============================================
// COVER LETTER RENDERING
// ============================================

/**
 * Render cover letter JSON to print-ready HTML
 */
export async function renderCoverLetterTemplate(
  coverLetterData: CoverLetterJson,
  options: RenderOptions
): Promise<string> {
  const { templateSlug, pageSize, margins } = options
  const finalMargins = margins || DEFAULT_MARGINS[pageSize]
  const dimensions = PAGE_DIMENSIONS[pageSize]

  // Generate CSS for print layout
  const printStyles = generateCoverLetterPrintStyles(pageSize, finalMargins)

  // Generate HTML content
  const content = generateCoverLetterHTML(coverLetterData, templateSlug)

  // Combine into complete HTML document
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${coverLetterData.from?.fullName || 'Cover Letter'}</title>
  <style>
    ${printStyles}
  </style>
</head>
<body>
  <div class="cover-letter-container">
    ${content}
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate print-optimized CSS for cover letters
 */
function generateCoverLetterPrintStyles(
  pageSize: 'letter' | 'a4',
  margins: { top: number; right: number; bottom: number; left: number }
): string {
  const dimensions = PAGE_DIMENSIONS[pageSize]

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: ${dimensions.width} ${dimensions.height};
      margin: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
    }

    html, body {
      width: 100%;
      height: 100%;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .cover-letter-container {
      width: 100%;
      max-width: ${dimensions.width};
      margin: 0 auto;
    }

    /* Letterhead */
    .letterhead { margin-bottom: 24pt; }
    .sender-name { font-size: 14pt; font-weight: 600; margin-bottom: 4pt; }
    .sender-address, .sender-contact { font-size: 10pt; margin-bottom: 2pt; }

    /* Date */
    .date { margin-bottom: 24pt; font-size: 11pt; }

    /* Recipient */
    .recipient { margin-bottom: 24pt; line-height: 1.4; }
    .recipient-name { font-weight: 500; }
    .recipient-title { font-style: italic; }

    /* Salutation */
    .salutation { margin-bottom: 12pt; font-weight: 500; }

    /* Body */
    .body { margin-bottom: 24pt; }
    .body p { margin-bottom: 12pt; text-align: justify; }
    .body p:last-child { margin-bottom: 0; }
    .body ul, .body ol { margin-left: 20pt; margin-bottom: 12pt; }
    .body li { margin-bottom: 4pt; }
    .body strong { font-weight: 600; }
    .body em { font-style: italic; }
    .body u { text-decoration: underline; }

    /* Closing */
    .closing { margin-top: 24pt; }
    .closing-phrase { margin-bottom: 4pt; }
    .signature-space { height: 48pt; }
    .signature-name { font-weight: 500; }

    /* Print optimization */
    @media print {
      body { margin: 0; }
      .page-break { page-break-after: always; }
      .no-break { page-break-inside: avoid; }
    }
  `
}

/**
 * Generate HTML content from cover letter data
 */
function generateCoverLetterHTML(data: CoverLetterJson, templateSlug: string): string {
  const sections: string[] = []

  // Letterhead (sender info)
  if (data.settings?.showLetterhead && data.from) {
    const locationStr = data.from.location
      ? [
          data.from.location.city,
          data.from.location.region,
          data.from.location.postal,
          data.from.location.country,
        ]
          .filter(Boolean)
          .join(', ')
      : ''

    sections.push(`
      <div class="letterhead">
        <div class="sender-name">${escapeHtml(data.from.fullName || '')}</div>
        ${locationStr ? `<div class="sender-address">${escapeHtml(locationStr)}</div>` : ''}
        ${data.from.phone ? `<div class="sender-contact">${escapeHtml(data.from.phone)}</div>` : ''}
        ${data.from.email ? `<div class="sender-contact">${escapeHtml(data.from.email)}</div>` : ''}
      </div>
    `)
  }

  // Date
  if (data.settings?.includeDate && data.date) {
    const formattedDate = formatCoverLetterDate(data.date)
    sections.push(`<div class="date">${escapeHtml(formattedDate)}</div>`)
  }

  // Recipient
  if (data.to) {
    const recipientAddress = data.to.companyAddress
      ? [
          data.to.companyAddress.city,
          data.to.companyAddress.region,
          data.to.companyAddress.postal,
          data.to.companyAddress.country,
        ]
          .filter(Boolean)
          .join(', ')
      : ''

    sections.push(`
      <div class="recipient">
        ${data.to.recipientName ? `<div class="recipient-name">${escapeHtml(data.to.recipientName)}</div>` : ''}
        ${data.to.recipientTitle ? `<div class="recipient-title">${escapeHtml(data.to.recipientTitle)}</div>` : ''}
        <div class="recipient-company">${escapeHtml(data.to.companyName || '')}</div>
        ${recipientAddress ? `<div class="recipient-address">${escapeHtml(recipientAddress)}</div>` : ''}
      </div>
    `)
  }

  // Salutation
  if (data.salutation) {
    sections.push(`<div class="salutation">${escapeHtml(data.salutation)}</div>`)
  }

  // Body (rich text blocks)
  if (data.body && data.body.length > 0) {
    const bodyHTML = renderRichTextBlocks(data.body)
    sections.push(`<div class="body">${bodyHTML}</div>`)
  }

  // Closing
  if (data.closing && data.from) {
    sections.push(`
      <div class="closing">
        <div class="closing-phrase">${escapeHtml(data.closing)}</div>
        <div class="signature-space"></div>
        <div class="signature-name">${escapeHtml(data.from.fullName || '')}</div>
      </div>
    `)
  }

  return sections.join('\n')
}

/**
 * Render RichTextBlock[] to HTML
 */
function renderRichTextBlocks(blocks: RichTextBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return `<p>${renderTextRuns(block.content)}</p>`
        case 'bullet_list':
          return `<ul>${block.content.map((run) => `<li>${escapeHtml(run.text)}</li>`).join('')}</ul>`
        case 'numbered_list':
          return `<ol>${block.content.map((run) => `<li>${escapeHtml(run.text)}</li>`).join('')}</ol>`
        default:
          return ''
      }
    })
    .join('')
}

/**
 * Render TextRun[] with formatting marks
 */
function renderTextRuns(runs: TextRun[]): string {
  return runs
    .map((run) => {
      let text = escapeHtml(run.text)

      if (run.marks?.includes('bold')) {
        text = `<strong>${text}</strong>`
      }
      if (run.marks?.includes('italic')) {
        text = `<em>${text}</em>`
      }
      if (run.marks?.includes('underline')) {
        text = `<u>${text}</u>`
      }

      return text
    })
    .join('')
}

/**
 * Format cover letter date
 */
function formatCoverLetterDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}
