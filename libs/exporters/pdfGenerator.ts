import puppeteer, { type Browser, type Page } from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import type { ResumeJson } from '@/types/resume'
import type { CoverLetterJson } from '@/types/cover-letter'
import type { ArtboardMetadata, ArtboardDocument } from '@/libs/reactive-artboard/types'
import {
  mapResumeToArtboardDocument,
  mapCoverLetterToArtboardDocument,
  mapResumeJsonToResumeData,
} from '@/libs/reactive-artboard'
import { renderArtboardToHtml } from '@/libs/reactive-artboard/server/renderToHtml'
import { retry } from '@/libs/utils/retry'

const DEFAULT_TIMEOUT = 30000
const IMAGE_WAIT_TIMEOUT = 5000

export interface PdfGenerationResult {
  buffer: Buffer
  pageCount: number
  fileSize: number
}

export interface PdfGenerationOptions {
  quality?: 'standard' | 'high'
  context?: {
    documentId?: string
    userId?: string
  }
}

export function validatePdfBuffer(buffer: Buffer | null | undefined): boolean {
  return Boolean(buffer && Buffer.isBuffer(buffer) && buffer.length > 0)
}

export function generateExportFilename(data: ResumeJson, format: string): string {
  const safeName = (data?.profile?.fullName || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const extension = format === 'pdf' ? 'pdf' : format
  return `${safeName || 'resume'}-${Date.now()}.${extension}`
}

export function generateCoverLetterFilename(data: CoverLetterJson, format: string): string {
  const company = data?.to?.companyName || 'cover-letter'
  const safeName = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const extension = format === 'pdf' ? 'pdf' : format
  return `${safeName || 'cover-letter'}-${Date.now()}.${extension}`
}

export function calculateStoragePath(userId: string, documentId: string, format: string): string {
  const extension = format === 'pdf' ? 'pdf' : format
  return `${userId}/${documentId}/${Date.now()}.${extension}`
}

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

type DocumentType = 'resume' | 'cover-letter'

type GeneratorInput<TData> = {
  type: DocumentType
  data: TData
  mapDocument: (data: TData) => ArtboardDocument
  options: PdfGenerationOptions
}

export async function generateResumePdf(
  resumeData: ResumeJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  return generatePdf({
    type: 'resume',
    data: resumeData,
    mapDocument: mapResumeToArtboardDocument,
    options,
  })
}

export async function generateResumePdfWithRetry(
  resumeData: ResumeJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  return retry(() => generateResumePdf(resumeData, options), {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 5000,
    onRetry: (error, attempt) => {
      console.warn(`[PDF] Resume retry attempt ${attempt} failed`, error)
    },
  })
}

export async function generateCoverLetterPdf(
  coverLetterData: CoverLetterJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  return generatePdf({
    type: 'cover-letter',
    data: coverLetterData,
    mapDocument: mapCoverLetterToArtboardDocument,
    options,
  })
}

export async function generateCoverLetterPdfWithRetry(
  coverLetterData: CoverLetterJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  return retry(() => generateCoverLetterPdf(coverLetterData, options), {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 5000,
    onRetry: (error, attempt) => {
      console.warn(`[PDF] Cover letter retry attempt ${attempt} failed`, error)
    },
  })
}

async function generatePdf<T>({ type, data, mapDocument, options }: GeneratorInput<T>) {
  const start = Date.now()
  let browser: Browser | null = null

  try {
    const artboardDocument = mapDocument(data)
    const resumeDataForStore =
      type === 'resume' ? mapResumeJsonToResumeData(data as ResumeJson) : undefined
    const html = await renderArtboardToHtml(artboardDocument, resumeDataForStore)

    browser = await launchBrowser()
    const page = await browser.newPage()
    await configurePage(page)

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: DEFAULT_TIMEOUT,
    })

    await waitForImages(page)
    await page.waitForFunction(
      () => document.body.dataset.paginationReady === 'true',
      { timeout: DEFAULT_TIMEOUT }
    )

    const pageBuffers = await capturePageBuffers(page, artboardDocument.metadata)
    const quality = options.quality ?? 'standard'

    let mergedBuffer: Buffer | null = null
    let usedMergeStrategy = false

    if (pageBuffers.length === 0) {
      // No page markers found; fall back to single-pass PDF
      const fallback = await page.pdf({
        ...PDF_QUALITY_SETTINGS[quality],
        format:
          String(artboardDocument.metadata.page.format).toLowerCase() === 'a4'
            ? 'A4'
            : 'Letter',
        margin: uniformMargin(artboardDocument.metadata.page.margin),
      })
      mergedBuffer = Buffer.from(fallback)
    } else if (pageBuffers.length === 1) {
      mergedBuffer = pageBuffers[0]
    } else {
      const merged = await mergePdfBuffers(pageBuffers)
      if (merged) {
        mergedBuffer = merged
        usedMergeStrategy = true
      } else {
        const fallback = await page.pdf({
          ...PDF_QUALITY_SETTINGS[quality],
          format:
            String(artboardDocument.metadata.page.format).toLowerCase() === 'a4'
              ? 'A4'
              : 'Letter',
          margin: uniformMargin(artboardDocument.metadata.page.margin),
        })
        mergedBuffer = Buffer.from(fallback)
      }
    }

    const pageCount = pageBuffers.length || (await countPdfPages(page))
    const duration = Date.now() - start

    console.info('[PDF]', type, {
      pageCount,
      usedMergeStrategy,
      duration,
      context: options.context,
    })

    return {
      buffer: mergedBuffer ?? Buffer.alloc(0),
      pageCount,
      fileSize: mergedBuffer?.length ?? 0,
    }
  } catch (error) {
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  } finally {
    if (browser) {
      try {
        await browser.close()
      } catch (cleanupError) {
        console.error('[PDF] Failed to close browser', cleanupError)
      }
    }
  }
}

async function launchBrowser(): Promise<Browser> {
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    try {
      return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
    } catch {
      // fall through
    }
  }

  return puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  })
}

async function configurePage(page: Page): Promise<void> {
  await page.setViewport({
    width: 1200,
    height: 1600,
    deviceScaleFactor: 2,
  })

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

async function waitForImages(page: Page, timeout = IMAGE_WAIT_TIMEOUT): Promise<void> {
  try {
    await page.evaluate(async (timeoutMs) => {
      const images = Array.from(document.images)
      if (!images.length) return

      await Promise.race([
        Promise.all(
          images.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve(), { once: true })
                  img.addEventListener('error', () => resolve(), { once: true })
                })
          )
        ),
        new Promise<void>((resolve) => setTimeout(() => resolve(), timeoutMs)),
      ])
    }, timeout)
  } catch (error) {
    console.warn('[PDF] waitForImages warning', error)
  }
}

async function capturePageBuffers(page: Page, metadata: ArtboardMetadata): Promise<Buffer[]> {
  const pageHandles = await page.$$('[data-page]')
  if (!pageHandles.length) {
    console.warn('[PDF] No page markers found; single-pass fallback will be used.')
    return []
  }

  const buffers: Buffer[] = []
  const originalHtml = await page.evaluate(() => document.body.innerHTML)
  const customCss = metadata.customCss ?? ''

  for (let index = 0; index < pageHandles.length; index++) {
    const metrics = await measurePage(page, index)
    if (!metrics) continue

    await isolatePage(page, index, customCss)

    await page.setViewport({
      width: Math.max(Math.ceil(metrics.width), 1),
      height: Math.max(Math.ceil(metrics.height), 1),
      deviceScaleFactor: 2,
    })

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      width: `${metrics.width}px`,
      height: `${metrics.height}px`,
      margin: uniformMargin(0),
    })

    buffers.push(Buffer.from(pdf))

    await restorePage(page, originalHtml)
  }

  await configurePage(page)

  return buffers
}

async function measurePage(page: Page, index: number) {
  return page.evaluate((pageIndex) => {
    const nodes = Array.from(document.querySelectorAll('[data-page]')) as HTMLElement[]
    const target = nodes[pageIndex]
    if (!target) return null
    const rect = target.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
    }
  }, index)
}

async function isolatePage(page: Page, index: number, customCss: string) {
  await page.evaluate(
    (pageIndex, css) => {
      const nodes = Array.from(document.querySelectorAll('[data-page]')) as HTMLElement[]
      const target = nodes[pageIndex]
      if (!target) throw new Error(`Page ${pageIndex + 1} not found`)

      const wrapper = target.cloneNode(true) as HTMLElement
      document.body.innerHTML = ''
      document.body.appendChild(wrapper)

      let style = document.getElementById('__artboard_custom_css')
      if (css && !style) {
        style = document.createElement('style')
        style.id = '__artboard_custom_css'
        style.textContent = css
        document.head.appendChild(style)
      }

      if (style && css) {
        style.textContent = css
      }
    },
    index,
    customCss
  )
}

async function restorePage(page: Page, originalHtml: string) {
  await page.evaluate((html) => {
    document.body.innerHTML = html
    const style = document.getElementById('__artboard_custom_css')
    if (style) style.remove()
  }, originalHtml)
}

async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer | null> {
  try {
    const pdfLib = await import('pdf-lib')
    const merged = await pdfLib.PDFDocument.create()

    for (const buffer of buffers) {
      const doc = await pdfLib.PDFDocument.load(buffer)
      const pageCount = doc.getPageCount()
      const indices = Array.from({ length: pageCount }, (_, i) => i)
      const copiedPages = await merged.copyPages(doc, indices)
      copiedPages.forEach((page) => merged.addPage(page))
    }

    const mergedBytes = await merged.save()
    return Buffer.from(mergedBytes)
  } catch (error) {
    console.warn('[PDF] pdf-lib unavailable, falling back to single-pass PDF', error)
    return null
  }
}

async function countPdfPages(page: Page): Promise<number> {
  try {
    const height = await page.evaluate(() => {
      const body = document.body
      const html = document.documentElement
      return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      )
    })

    const pageHeight = 11 * 96
    return Math.max(1, Math.ceil(height / pageHeight))
  } catch {
    return 1
  }
}

function uniformMargin(px: number) {
  const inches = Math.max(0, Number((px / 96).toFixed(3)))
  const value = `${inches}in`
  return {
    top: value,
    right: value,
    bottom: value,
    left: value,
  }
}
