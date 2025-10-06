// Thumbnail Generator
//
// Generates accurate preview images for templates by visiting internal preview routes
// and screenshotting a fixed viewport. Requires the Next app to be running.
//
// Usage:
//   BASE_URL=http://localhost:3000 node scripts/generate-thumbnails.mjs
//
// Outputs:
//   public/templates/{slug}-thumb.webp
//   public/templates/cover-letter/{slug}-thumb.webp

import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const OUT_DIR_RESUME = path.join(__dirname, '..', 'public', 'templates')
const OUT_DIR_CL = path.join(OUT_DIR_RESUME, 'cover-letter')

const RESUME_SLUGS = ['minimal', 'modern', 'classic', 'creative', 'technical', 'executive']
const COVER_LETTER_SLUGS = ['classic-block', 'modern-minimal', 'creative-bold', 'executive-formal']

async function ensureDirs() {
  fs.mkdirSync(OUT_DIR_RESUME, { recursive: true })
  fs.mkdirSync(OUT_DIR_CL, { recursive: true })
}

async function getExecutablePath() {
  const ep = await chromium.executablePath()
  if (ep) return ep
  // Fallbacks for local dev environments
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  throw new Error('Could not resolve Chrome/Chromium executable. Install Chrome or set PUPPETEER_EXECUTABLE_PATH.')
}

async function withBrowser(fn) {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (await getExecutablePath())
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: chromium.args,
    defaultViewport: { width: 1200, height: 1500, deviceScaleFactor: 1 },
  })
  try {
    return await fn(browser)
  } finally {
    await browser.close()
  }
}

async function waitRenderReady(page) {
  try {
    await page.waitForFunction('window.renderReady === true', { timeout: 15000 })
  } catch {
    // Fallback: small delay
    await page.waitForTimeout(2000)
  }
}

async function screenshotResume(browser, slug) {
  const page = await browser.newPage()
  const url = `${BASE_URL}/internal/preview/resume/${slug}`
  await page.goto(url, { waitUntil: 'networkidle2' })
  await waitRenderReady(page)
  const outPath = path.join(OUT_DIR_RESUME, `${slug}-thumb.webp`)
  await page.screenshot({ path: outPath, type: 'webp', quality: 80 })
  await page.close()
  return outPath
}

async function screenshotCoverLetter(browser, slug) {
  const page = await browser.newPage()
  const url = `${BASE_URL}/internal/preview/cover-letter/${slug}`
  await page.goto(url, { waitUntil: 'networkidle2' })
  await waitRenderReady(page)
  const outPath = path.join(OUT_DIR_CL, `${slug}-thumb.webp`)
  await page.screenshot({ path: outPath, type: 'webp', quality: 80 })
  await page.close()
  return outPath
}

async function main() {
  await ensureDirs()
  console.log(`Generating thumbnails from ${BASE_URL} ...`)
  await withBrowser(async (browser) => {
    // Resume templates
    for (const slug of RESUME_SLUGS) {
      process.stdout.write(`Resume: ${slug} ... `)
      const out = await screenshotResume(browser, slug)
      console.log(`done -> ${path.relative(process.cwd(), out)}`)
    }
    // Cover letters
    for (const slug of COVER_LETTER_SLUGS) {
      process.stdout.write(`Cover Letter: ${slug} ... `)
      const out = await screenshotCoverLetter(browser, slug)
      console.log(`done -> ${path.relative(process.cwd(), out)}`)
    }
  })
  console.log('All thumbnails generated.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
