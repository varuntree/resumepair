/**
 * PDF Generator
 *
 * Generates PDF files from HTML using Puppeteer and Chromium.
 * Optimized for serverless environments with @sparticuz/chromium.
 *
 * @module libs/exporters/pdfGenerator
 */

import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { renderResumeTemplate, renderCoverLetterTemplate } from './templateRenderer'
import { ResumeJson } from '@/types/resume'
import { CoverLetterJson } from '@/types/cover-letter'
import { ExportOptions } from '@/libs/repositories/exportJobs'

// ============================================
// TYPES
// ============================================

export interface PdfGenerationResult {
  buffer: Buffer
  pageCount: number
  fileSize: number
}

export interface PdfGenerationOptions {
  templateSlug: string
  pageSize: 'letter' | 'a4'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  quality?: 'standard' | 'high'
  documentType?: 'resume' | 'cover-letter' // Added for cover letter support
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_TIMEOUT = 30000 // 30 seconds
const PDF_QUALITY_SETTINGS = {
  standard: {
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1,
  },
  high: {
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1,
  },
}

// ============================================
// PDF GENERATION
// ============================================

/**
 * Generate PDF from resume JSON
 *
 * This function:
 * 1. Renders resume to HTML using template
 * 2. Launches headless Chromium browser
 * 3. Converts HTML to PDF
 * 4. Returns PDF buffer with metadata
 */
export async function generateResumePdf(
  resumeData: ResumeJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  let browser: Browser | null = null

  try {
    // Step 1: Render HTML from template
    const html = await renderResumeTemplate(resumeData, {
      templateSlug: options.templateSlug,
      pageSize: options.pageSize,
      margins: options.margins,
    })

    // Step 2: Launch browser
    browser = await launchBrowser()

    // Step 3: Create page and set content
    const page = await browser.newPage()
    await configurePage(page)
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: DEFAULT_TIMEOUT,
    })

    // Step 4: Generate PDF
    const quality = options.quality || 'standard'
    const pdfBuffer = await page.pdf({
      ...PDF_QUALITY_SETTINGS[quality],
      format: options.pageSize === 'a4' ? 'A4' : 'Letter',
      margin: options.margins
        ? {
            top: `${options.margins.top}in`,
            right: `${options.margins.right}in`,
            bottom: `${options.margins.bottom}in`,
            left: `${options.margins.left}in`,
          }
        : undefined,
    })

    // Step 5: Calculate metadata
    const pageCount = await countPdfPages(page)
    const buffer = Buffer.from(pdfBuffer)
    const fileSize = buffer.length

    return {
      buffer,
      pageCount,
      fileSize,
    }
  } catch (error) {
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  } finally {
    // Always clean up browser
    if (browser) {
      try {
        await browser.close()
      } catch (cleanupError) {
        console.error('Failed to close browser:', cleanupError)
        // Continue - browser will be GC'd eventually
      }
    }
  }
}

/**
 * Launch Puppeteer browser with Chromium
 * Optimized for serverless environments
 */
async function launchBrowser(): Promise<Browser> {
  const isDev = process.env.NODE_ENV === 'development'

  // In development, use local Chromium if available
  if (isDev) {
    try {
      return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
    } catch {
      // Fall through to production setup
    }
  }

  // Production: Use @sparticuz/chromium
  return await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })
}

/**
 * Configure page for optimal PDF rendering
 */
async function configurePage(page: Page): Promise<void> {
  // Set viewport for consistent rendering
  await page.setViewport({
    width: 1200,
    height: 1600,
    deviceScaleFactor: 2, // High DPI for better quality
  })

  // Disable animations for faster rendering
  await page.evaluateOnNewDocument(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
    document.head.appendChild(style)
  })
}

/**
 * Count pages in rendered PDF
 * Estimates based on content height and page size
 */
async function countPdfPages(page: Page): Promise<number> {
  try {
    const pageCount = await page.evaluate(() => {
      const body = document.body
      const html = document.documentElement
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      )

      // Approximate page height in pixels (letter size at 96 DPI)
      const pageHeight = 11 * 96 // 11 inches * 96 DPI
      return Math.ceil(height / pageHeight)
    })

    return Math.max(1, pageCount)
  } catch {
    // Default to 1 page if calculation fails
    return 1
  }
}

/**
 * Validate PDF buffer
 * Checks if buffer is a valid PDF file
 */
export function validatePdfBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length === 0) {
    return false
  }

  // Check PDF magic number (starts with %PDF-)
  const header = buffer.toString('ascii', 0, 5)
  return header === '%PDF-'
}

/**
 * Generate PDF from cover letter JSON
 */
export async function generateCoverLetterPdf(
  coverLetterData: CoverLetterJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  let browser: Browser | null = null

  try {
    // Step 1: Render HTML from template
    const html = await renderCoverLetterTemplate(coverLetterData, {
      templateSlug: options.templateSlug,
      pageSize: options.pageSize,
      margins: options.margins,
    })

    // Step 2: Launch browser
    browser = await launchBrowser()

    // Step 3: Create page and set content
    const page = await browser.newPage()
    await configurePage(page)
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: DEFAULT_TIMEOUT,
    })

    // Step 4: Generate PDF
    const quality = options.quality || 'standard'
    const pdfBuffer = await page.pdf({
      ...PDF_QUALITY_SETTINGS[quality],
      format: options.pageSize === 'a4' ? 'A4' : 'Letter',
      margin: options.margins
        ? {
            top: `${options.margins.top}in`,
            right: `${options.margins.right}in`,
            bottom: `${options.margins.bottom}in`,
            left: `${options.margins.left}in`,
          }
        : undefined,
    })

    // Step 5: Calculate metadata
    const pageCount = await countPdfPages(page)
    const buffer = Buffer.from(pdfBuffer)
    const fileSize = buffer.length

    return {
      buffer,
      pageCount,
      fileSize,
    }
  } catch (error) {
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  } finally {
    // Always clean up browser
    if (browser) {
      try {
        await browser.close()
      } catch (cleanupError) {
        console.error('Failed to close browser:', cleanupError)
        // Continue - browser will be GC'd eventually
      }
    }
  }
}

/**
 * Generate filename for resume export
 */
export function generateExportFilename(
  resumeData: ResumeJson,
  format: string = 'pdf'
): string {
  const name = resumeData.profile?.fullName || 'Resume'
  const sanitized = name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
  const timestamp = new Date().toISOString().split('T')[0]
  return `${sanitized}_${timestamp}.${format}`
}

/**
 * Generate filename for cover letter export
 */
export function generateCoverLetterFilename(
  coverLetterData: CoverLetterJson,
  format: string = 'pdf'
): string {
  const name = coverLetterData.from?.fullName || 'Cover_Letter'
  const company = coverLetterData.to?.companyName || ''
  const sanitized = name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
  const companySanitized = company.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')
  const timestamp = new Date().toISOString().split('T')[0]

  if (companySanitized) {
    return `${sanitized}_CoverLetter_${companySanitized}_${timestamp}.${format}`
  }
  return `${sanitized}_CoverLetter_${timestamp}.${format}`
}

/**
 * Calculate storage path for export file
 */
export function calculateStoragePath(
  userId: string,
  documentId: string,
  format: string = 'pdf'
): string {
  const timestamp = Date.now()
  return `exports/${userId}/${documentId}_${timestamp}.${format}`
}
