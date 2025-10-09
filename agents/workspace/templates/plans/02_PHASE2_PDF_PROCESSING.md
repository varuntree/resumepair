# Phase 2: PDF Per-Page Processing

**⚠️ CONTEXT FOR IMPLEMENTER**

You are implementing Phase 2 of a 5-phase template system migration. This plan was written by someone else.

**Prerequisites**: Phase 1 must be complete and validated.

**Source Repository**: `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`

**Key Source File**: `apps/server/src/printer/printer.service.ts:93-233`

---

## Phase Overview

**Goal**: Replace single-pass PDF rendering with per-page processing to fix overflow and layout issues.

**Duration**: 3-4 days

**Why This Matters**: Our current PDF generation renders the entire document at once, causing overflow issues. The source repository processes each page separately and merges them, ensuring perfect pagination.

**Deliverables**:
1. Per-page DOM cloning and isolation logic
2. Multi-page PDF buffer array
3. pdf-lib integration for merging pages
4. Custom CSS injection per page
5. Image loading synchronization
6. Performance benchmarks

---

## Current vs. Target Approach

### Current Approach (Single-Pass)
```
ResumeJson → renderToHtml() → Puppeteer.setContent() → page.pdf() → Single PDF Buffer
```

**Problems**:
- Content overflows page boundaries
- No control over page breaks
- Hard to debug layout issues
- CSS page breaks don't work reliably

### Target Approach (Per-Page)
```
ResumeJson → renderToHtml() → Puppeteer.setContent()
    ↓
For each [data-page="N"]:
    ├─ Clone page element
    ├─ Isolate in body
    ├─ Inject custom CSS
    ├─ page.pdf() → Buffer N
    ├─ Restore original HTML
    └─ Next page
    ↓
Merge all buffers with pdf-lib → Final PDF
```

**Benefits**:
- Each page renders independently
- Exact dimensions for each page
- No overflow across pages
- Perfect layout control

---

## Step 1: Install pdf-lib

**Duration**: 5 minutes

```bash
npm install pdf-lib
```

**Validation**:
```bash
npm list pdf-lib
# Should show installed version
```

---

## Step 2: Study Source Implementation

**Duration**: 1-2 hours

**Source File**: `agents/repos/Reactive-Resume/apps/server/src/printer/printer.service.ts`

**Read lines 93-233 carefully**. Key patterns to understand:

1. **Navigate to preview page** (lines 143-148)
2. **Wait for content** (lines 150-152)
3. **Wait for images** (lines 154-168)
4. **Process each page** (lines 193-226)
5. **Merge PDFs** (lines 228-233)

**Key Insights**:
- They clone each `[data-page="N"]` element
- They replace `document.body.innerHTML` temporarily
- They inject custom CSS if enabled
- They use exact page dimensions from DOM
- They restore HTML after each page

---

## Step 3: Create Per-Page Processing Logic

**Duration**: 4-6 hours

### 3.1 Update PDF Generator

**File**: `libs/exporters/pdfGenerator.ts`

**Find** the `generateResumePdf()` function (around line 95-155)

**Replace** with per-page implementation:

```typescript
import puppeteer, { Browser, Page } from 'puppeteer'
import { PDFDocument } from 'pdf-lib'
import type { ResumeJson } from '@/types/resume'
import { mapResumeJsonToArtboardData } from '@/libs/reactive-artboard/adapters'

export interface PdfGenerationOptions {
  resumeId: string
  userId: string
}

export interface PdfGenerationResult {
  buffer: Buffer
  pageCount: number
  fileSize: number
  duration: number
}

export async function generateResumePdf(
  resumeData: ResumeJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  const startTime = performance.now()
  let browser: Browser | null = null

  try {
    // Step 1: Launch browser
    browser = await launchBrowser()
    const page = await browser.newPage()

    // Step 2: Configure page
    await configurePage(page)

    // Step 3: Navigate to preview page (local artboard app)
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/internal/preview/resume/${options.resumeId}`
    await page.goto(previewUrl, { waitUntil: 'domcontentloaded' })

    // Step 4: Inject resume data via localStorage
    const artboardData = mapResumeJsonToArtboardData(resumeData)
    await page.evaluate((data) => {
      window.localStorage.setItem('resume', JSON.stringify(data))
    }, artboardData)

    // Step 5: Reload to apply data
    await Promise.all([
      page.reload({ waitUntil: 'load' }),
      page.waitForSelector('[data-page="1"]', { timeout: 15_000 }),
    ])

    // Step 6: Wait for images to load (if any)
    if (artboardData.basics.picture.url && !artboardData.basics.picture.effects.hidden) {
      await waitForImages(page)
    }

    // Step 7: Get number of pages
    const pageCount = await getPageCount(page)
    console.log(`Processing ${pageCount} page(s)...`)

    // Step 8: Process each page individually
    const pageBuffers: Buffer[] = []
    for (let pageIndex = 1; pageIndex <= pageCount; pageIndex++) {
      console.log(`Processing page ${pageIndex}/${pageCount}...`)
      const buffer = await processPage(page, pageIndex, artboardData.metadata.css)
      pageBuffers.push(buffer)
    }

    // Step 9: Merge all page buffers into single PDF
    const finalBuffer = await mergePdfBuffers(pageBuffers)

    const duration = performance.now() - startTime
    console.log(`PDF generated in ${duration.toFixed(0)}ms`)

    return {
      buffer: finalBuffer,
      pageCount,
      fileSize: finalBuffer.length,
      duration: Math.round(duration),
    }
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Helper: Launch browser (reuse existing logic)
async function launchBrowser(): Promise<Browser> {
  // Use existing implementation from current pdfGenerator.ts
  // This should already handle dev vs prod, @sparticuz/chromium, etc.
  // Copy from lines 40-80 of current file
  throw new Error('TODO: Copy launchBrowser() from existing implementation')
}

// Helper: Configure page for PDF rendering
async function configurePage(page: Page): Promise<void> {
  // High DPI viewport for quality
  await page.setViewport({
    width: 1200,
    height: 1600,
    deviceScaleFactor: 2,
  })

  // Disable animations for faster rendering
  await page.evaluateOnNewDocument(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
    `
    document.head.appendChild(style)
  })
}

// Helper: Wait for all images to load
async function waitForImages(page: Page): Promise<void> {
  await page.waitForSelector('img[alt="Profile"]', { timeout: 5_000 }).catch(() => {
    console.warn('Profile image not found, continuing...')
  })

  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((img) => {
        if (img.complete) return Promise.resolve()
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve
        })
      })
    )
  )
}

// Helper: Get number of pages in document
async function getPageCount(page: Page): Promise<number> {
  const count = await page.evaluate(() => {
    return document.querySelectorAll('[data-page]').length
  })
  return count
}

// Helper: Process a single page
async function processPage(
  page: Page,
  pageIndex: number,
  customCss: { value: string; visible: boolean }
): Promise<Buffer> {
  // Get page element
  const pageElement = await page.$(`[data-page="${pageIndex}"]`)
  if (!pageElement) {
    throw new Error(`Page element [data-page="${pageIndex}"] not found`)
  }

  // Get page dimensions
  const width = (await (await pageElement.getProperty('scrollWidth'))?.jsonValue()) ?? 0
  const height = (await (await pageElement.getProperty('scrollHeight'))?.jsonValue()) ?? 0

  if (width === 0 || height === 0) {
    throw new Error(`Invalid page dimensions: ${width}x${height}`)
  }

  // Clone page HTML and isolate
  const originalHtml = await page.evaluate((element: HTMLDivElement) => {
    const clonedElement = element.cloneNode(true) as HTMLDivElement
    const originalHtml = document.body.innerHTML
    document.body.innerHTML = clonedElement.outerHTML
    return originalHtml
  }, pageElement)

  // Inject custom CSS if enabled
  if (customCss.visible && customCss.value) {
    await page.evaluate((cssValue: string) => {
      const styleTag = document.createElement('style')
      styleTag.id = 'custom-css-injection'
      styleTag.textContent = cssValue
      document.head.appendChild(styleTag)
    }, customCss.value)
  }

  // Generate PDF for this page
  const uint8array = await page.pdf({
    width: `${width}px`,
    height: `${height}px`,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  })

  const buffer = Buffer.from(uint8array)

  // Restore original HTML
  await page.evaluate((html: string) => {
    document.body.innerHTML = html
    // Remove injected custom CSS
    const customStyle = document.getElementById('custom-css-injection')
    if (customStyle) customStyle.remove()
  }, originalHtml)

  return buffer
}

// Helper: Merge multiple PDF buffers into one
async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create()

  for (const buffer of buffers) {
    const pdf = await PDFDocument.load(buffer)
    const [copiedPage] = await mergedPdf.copyPages(pdf, [0])
    mergedPdf.addPage(copiedPage)
  }

  const mergedBuffer = await mergedPdf.save()
  return Buffer.from(mergedBuffer)
}
```

---

## Step 4: Update Internal Preview Route

**Duration**: 1-2 hours

The per-page processing requires an internal preview route that renders the artboard app.

### 4.1 Verify Internal Preview Route Exists

**File**: `app/internal/preview/resume/[id]/page.tsx` (should already exist)

**Verify it renders**: `<ArtboardRenderer />`

### 4.2 Ensure Data Loading Works

**The preview route must**:
1. Fetch resume data from database
2. Map to artboard format
3. Render with `<Page>` wrapper for each page

**Example structure**:

```typescript
import { Page } from '@/libs/reactive-artboard/components'
import { mapResumeJsonToArtboardData } from '@/libs/reactive-artboard/adapters'
import { getTemplate } from '@/libs/reactive-artboard/templates'

export default async function PreviewPage({ params }: { params: { id: string } }) {
  // Fetch resume
  const resume = await fetchResume(params.id)

  // Map to artboard format
  const artboardData = mapResumeJsonToArtboardData(resume.data)

  // Get template component
  const Template = getTemplate(artboardData.metadata.template)

  // Render each page
  return (
    <>
      {artboardData.metadata.layout.map((columns, pageIndex) => (
        <Page key={pageIndex} mode="preview" pageNumber={pageIndex + 1}>
          <Template
            isFirstPage={pageIndex === 0}
            columns={columns as any}
          />
        </Page>
      ))}
    </>
  )
}
```

---

## Step 5: Test Per-Page Processing

**Duration**: 2-3 hours

### 5.1 Create Test Resume

Create a multi-page test resume with:
- 10+ work experiences
- 5+ education entries
- 20+ skills
- Several projects

**Goal**: Force 3-4 pages to validate multi-page processing

### 5.2 Test PDF Generation

```typescript
// In API route or test script
import { generateResumePdf } from '@/libs/exporters/pdfGenerator'

const result = await generateResumePdf(testResume, {
  resumeId: 'test-123',
  userId: 'user-123',
})

console.log('PDF Result:', {
  pageCount: result.pageCount,
  fileSize: result.fileSize,
  duration: result.duration,
})

// Save to file for inspection
fs.writeFileSync('test-output.pdf', result.buffer)
```

### 5.3 Validation Checklist

Open `test-output.pdf` and verify:

- [ ] All pages present (should match layout array length)
- [ ] No content overflow between pages
- [ ] Page dimensions correct (A4 or Letter)
- [ ] Colors render correctly
- [ ] Fonts load properly
- [ ] Custom CSS applies if set
- [ ] No white space gaps between content
- [ ] Text is crisp (not blurry)
- [ ] Icons render

### 5.4 Performance Benchmarks

Test with resumes of varying sizes:

| Resume Size | Page Count | Expected Time |
|-------------|------------|---------------|
| Small | 1 page | < 2 seconds |
| Medium | 2 pages | < 3 seconds |
| Large | 3-4 pages | < 5 seconds |

**Measure actual**:
```typescript
const start = performance.now()
await generateResumePdf(resume, options)
const duration = performance.now() - start
console.log(`Generation took ${duration}ms`)
```

---

## Step 6: Handle Edge Cases

**Duration**: 2-3 hours

### 6.1 Empty Sections

**Problem**: Empty sections might cause issues

**Solution**: Filter in template:
```typescript
const visibleSections = sections.filter(s => s.visible && s.items.length > 0)
```

### 6.2 Very Long Content

**Problem**: Single item (e.g., very long job description) might overflow

**Solution**: Add CSS break rules:
```css
.section-item {
  break-inside: avoid;
  page-break-inside: avoid;
}
```

### 6.3 Image Loading Failures

**Problem**: External images might fail to load

**Solution**: Add timeout and fallback:
```typescript
await waitForImages(page).catch((error) => {
  console.warn('Image loading timeout, proceeding anyway:', error)
})
```

### 6.4 Custom CSS Breaks Layout

**Problem**: User CSS might break pagination

**Solution**: Wrap in try-catch and validate:
```typescript
try {
  await page.evaluate((css) => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
  }, customCss)
} catch (error) {
  console.error('Custom CSS injection failed:', error)
  // Continue without custom CSS
}
```

---

## Step 7: Error Handling & Retries

**Duration**: 1-2 hours

### 7.1 Add Retry Logic

**Wrap PDF generation in retry utility**:

```typescript
import { retry } from '@/libs/utils/retry'

export async function generateResumePdfWithRetry(
  resumeData: ResumeJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  return retry(
    () => generateResumePdf(resumeData, options),
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        console.warn(`PDF generation attempt ${attempt} failed:`, error)
      },
    }
  )
}
```

### 7.2 Add Detailed Error Messages

```typescript
catch (error) {
  const errorMessage = [
    'PDF Generation Failed',
    `Resume ID: ${options.resumeId}`,
    `Page Count: ${pageCount}`,
    `Error: ${error.message}`,
    `Stack: ${error.stack}`,
  ].join('\n')

  console.error(errorMessage)
  throw new Error(errorMessage)
}
```

---

## Step 8: Update Export API Routes

**Duration**: 1 hour

### 8.1 Update Resume Export Route

**File**: `app/api/v1/export/resume/route.ts`

**Replace** old `generateResumePdf()` call with new one:

```typescript
import { generateResumePdfWithRetry } from '@/libs/exporters/pdfGenerator'

// In POST handler:
const result = await generateResumePdfWithRetry(resume.data, {
  resumeId: resume.id,
  userId: user.id,
})

console.log(`PDF generated: ${result.pageCount} pages, ${result.fileSize} bytes, ${result.duration}ms`)
```

### 8.2 Update Cover Letter Export (if applicable)

Same pattern for cover letter exports.

---

## Phase 2 Validation Checklist

Before moving to Phase 3:

- [ ] **Per-Page Processing**:
  - [ ] Each page cloned correctly from DOM
  - [ ] Page dimensions calculated accurately
  - [ ] Original HTML restored after each page
  - [ ] No cross-contamination between pages

- [ ] **PDF Merging**:
  - [ ] pdf-lib installed and working
  - [ ] Multiple page buffers merge correctly
  - [ ] Page order preserved
  - [ ] No extra blank pages

- [ ] **Custom CSS**:
  - [ ] Custom CSS injects per page if enabled
  - [ ] CSS removed after page processing
  - [ ] Invalid CSS doesn't break generation

- [ ] **Image Handling**:
  - [ ] Image loading waits for completion
  - [ ] Timeout doesn't break generation
  - [ ] Missing images handled gracefully

- [ ] **Performance**:
  - [ ] 1-page resume: < 2 seconds
  - [ ] 2-page resume: < 3 seconds
  - [ ] 4-page resume: < 5 seconds
  - [ ] Memory cleanup after each generation

- [ ] **Quality**:
  - [ ] PDF opens without errors
  - [ ] Content matches preview exactly
  - [ ] No overflow or clipping
  - [ ] Text is crisp and readable
  - [ ] Colors accurate

- [ ] **Error Handling**:
  - [ ] Retry logic works on failures
  - [ ] Errors logged with context
  - [ ] Browser cleanup on error
  - [ ] Graceful degradation

- [ ] **API Integration**:
  - [ ] Export API routes updated
  - [ ] Old PDF code removed
  - [ ] New code handles all edge cases

---

## Troubleshooting

### Issue: "Page element not found"
**Cause**: Preview route not rendering pages with `data-page` attribute
**Solution**: Ensure `<Page pageNumber={N}>` wrapper is used

### Issue: PDF pages are blank
**Cause**: Content not loaded before PDF generation
**Solution**: Increase `waitForSelector` timeout, check localStorage data

### Issue: Images not loading
**Cause**: External image blocked or slow
**Solution**: Add longer timeout or skip image wait

### Issue: Dimensions are 0x0
**Cause**: Page element not rendered or hidden
**Solution**: Check CSS, ensure page is visible

### Issue: Merge fails with "Invalid PDF"
**Cause**: Individual page buffer is corrupted
**Solution**: Log buffer sizes, validate each before merging

### Issue: Memory leak / browser doesn't close
**Cause**: Error thrown before `finally` block
**Solution**: Ensure `finally` always runs, use process timeout

---

## Performance Optimization Tips

1. **Reuse Browser Instance**: Keep browser alive for 5 minutes between exports
2. **Parallel Processing**: Process multiple resumes concurrently (limit: 3-5)
3. **Cache Fonts**: Pre-load common fonts in browser
4. **Optimize CSS**: Minify custom CSS before injection
5. **Image Optimization**: Compress images before embedding

---

## Next Steps

Once Phase 2 validation passes:
1. Commit all changes
2. Test with various resume sizes (1-5 pages)
3. Benchmark performance
4. **Proceed to Phase 3**: `03_PHASE3_TEMPLATES.md`

---

**Phase 2 Complete** ✓

You've solved the PDF overflow problem with per-page processing. Now templates can be migrated with confidence that PDFs will render correctly.
