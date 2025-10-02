# Phase 5: Export System

## Phase Objective
Build a robust export system that generates high-quality PDF documents from resume templates, with support for multiple page sizes, batch operations, ATS optimization, and reliable serverless PDF generation using Puppeteer.

## Phase Validation Gate

**This phase is complete only when ALL of the following are verified:**

### Playbook Execution (~20-30 minutes)
- [ ] **PDF Export Playbook** (to be created in `ai_docs/testing/playbooks/phase_5_pdf_export.md`)
  - PDF generation working (Puppeteer + Chrome)
  - High-quality print output (300 DPI)
  - Font embedding correct
  - Template rendering accurate
  - Metadata embedded correctly
- [ ] **Export Options Playbook** (to be created in `ai_docs/testing/playbooks/phase_5_options.md`)
  - Page sizes supported (Letter, A4)
  - Margin controls working
  - Color vs B&W options
  - Compression settings functional
- [ ] **Batch Export Playbook** (to be created in `ai_docs/testing/playbooks/phase_5_batch.md`)
  - Multi-document export working
  - ZIP generation functional
  - Progress tracking visible
  - Error handling for failures

### Visual Verification (~10 minutes)
- [ ] **Desktop screenshots** (1440px) for export UI
- [ ] **Mobile screenshots** (375px) for export options
- [ ] All export features meet visual quality standards:
  - Export button clearly visible
  - Progress indicators intuitive
  - Download confirmation clear
  - Error states helpful
  - Design tokens used throughout

### Performance Validation
- [ ] PDF export completes within 2.5 seconds (2 pages)
- [ ] Batch export handles multiple documents efficiently
- [ ] No performance regressions from Phase 4

### Quality Validation
- [ ] PDF output opens correctly in Adobe Reader, Chrome
- [ ] ATS parsing test passes (copy-paste test)
- [ ] Print quality acceptable (300 DPI)

### Documentation
- [ ] Screenshots saved to `ai_docs/progress/phase_5/screenshots/`
- [ ] `visual_review.md` completed
- [ ] `playbook_results.md` completed
- [ ] All critical issues resolved

**Reference**: See `ai_docs/testing/README.md` for complete testing workflow

## Comprehensive Scope

### Core Features
1. **PDF Generation**
   - Puppeteer with headless Chrome
   - Serverless function (Node runtime)
   - High-quality print output (300 DPI)
   - Accurate template rendering
   - Font embedding
   - Vector graphics support
   - Metadata embedding
   - Compression options

2. **Export Options**
   - Page sizes (A4, Letter, Legal)
   - Orientation (Portrait, Landscape)
   - Margins customization
   - Quality settings (web, print, professional)
   - File naming patterns
   - Metadata inclusion
   - Watermark options (free tier)
   - Color modes (color, grayscale)

3. **Batch Operations**
   - Multiple document export
   - Bulk download as ZIP
   - Queue management
   - Progress tracking
   - Concurrent limits
   - Error recovery
   - Partial success handling

4. **Export Management**
   - Export history tracking
   - Download links (temporary)
   - Re-export capability
   - Version tracking
   - Storage management
   - Cleanup policies
   - Usage analytics
   - Cost tracking

5. **ATS Optimization**
   - Text layer verification
   - Font compatibility
   - Simple structure
   - No images in critical areas
   - Proper heading hierarchy
   - Machine-readable format
   - Keyword preservation
   - Testing validation

### Supporting Infrastructure
- **UI Components**: Export dialog, format selector, options panel, progress indicators
- **Settings Pages**: Default export preferences, naming patterns
- **Error Handling**: Generation failures, timeout handling, retry mechanisms
- **Queue System**: Export queue display, priority management
- **Notifications**: Export complete, failure alerts, ready for download
- **Storage**: Temporary file storage, cleanup jobs

### User Flows Covered
1. **Single Export**
   - Resume → Export button → Choose format → Select options → Generate → Download

2. **Batch Export**
   - Select documents → Export all → Choose formats → Queue processing → Download ZIP

3. **Re-export**
   - Export history → Find previous → Re-export → Updated version → Download

4. **Export Customization**
   - Export dialog → Advanced options → Preview settings → Generate → Download

## Test Specifications

### Unit Tests Required
```typescript
// tests/phase5/unit/

describe('Component: ExportDialog', () => {
  test('shows format options')
  test('displays size selector')
  test('shows quality settings')
  test('validates selections')
  test('shows estimated time')
  test('handles loading state')
})

describe('Component: ExportQueue', () => {
  test('displays queue items')
  test('shows progress bars')
  test('allows cancellation')
  test('handles errors')
  test('clears completed items')
})

describe('Component: ExportHistory', () => {
  test('lists past exports')
  test('shows download links')
  test('filters by date')
  test('allows re-export')
  test('handles expired links')
})

describe('Service: PDFGenerator', () => {
  test('initializes Puppeteer')
  test('renders HTML correctly')
  test('applies print styles')
  test('sets page size')
  test('embeds fonts')
  test('adds metadata')
  test('handles timeout')
})


describe('Utils: exportQueue', () => {
  test('adds to queue')
  test('processes in order')
  test('handles priority')
  test('limits concurrency')
  test('retries failures')
  test('emits progress events')
})

describe('Utils: fileStorage', () => {
  test('saves generated files')
  test('creates signed URLs')
  test('handles cleanup')
  test('tracks storage usage')
  test('enforces limits')
})

describe('Store: exportStore', () => {
  test('tracks export jobs')
  test('manages queue state')
  test('stores history')
  test('calculates progress')
  test('handles failures')
})
```

### Integration Tests Required
```typescript
// tests/phase5/integration/

describe('Feature: PDF Export', () => {
  test('generates valid PDF')
  test('preserves template design')
  test('includes all content')
  test('text is selectable')
  test('fonts embedded correctly')
  test('metadata present')
})


describe('API Route: /api/v1/export/pdf', () => {
  test('accepts export request')
  test('validates parameters')
  test('returns PDF file')
  test('handles large documents')
  test('enforces timeouts')
})


describe('API Route: /api/v1/export/batch', () => {
  test('queues multiple exports')
  test('tracks progress')
  test('returns ZIP file')
  test('handles partial failures')
})

describe('Feature: Export Queue', () => {
  test('processes jobs sequentially')
  test('handles concurrent limit')
  test('retries failed jobs')
  test('cleans up completed jobs')
})

describe('Feature: ATS Optimization', () => {
  test('PDF has text layer')
  test('no parsing errors')
  test('keywords preserved')
})
```

### E2E Tests Required
```typescript
// tests/phase5/e2e/

describe('User Journey: Export Resume', () => {
  test('user exports as PDF')
  test('selects options')
  test('downloads file')
  test('file opens correctly')
})

describe('User Journey: Batch Export', () => {
  test('selects multiple resumes')
  test('monitors progress')
  test('downloads ZIP')
})

describe('User Journey: Re-export', () => {
  test('views export history')
  test('re-exports document')
  test('gets updated version')
})

describe('Critical Path: Large Document', () => {
  test('exports 5+ page resume')
  test('maintains quality')
  test('completes within timeout')
})
```

### Performance Benchmarks
```typescript
describe('Performance: Export Generation', () => {
  test('PDF 1 page < 1.5s')
  test('PDF 2 pages < 2.5s')
  test('PDF 5 pages < 5s')
  test('batch of 5 < 15s')
})

describe('Performance: Serverless', () => {
  test('cold start < 3s')
  test('warm execution < 1s')
  test('memory usage < 512MB')
  test('no memory leaks')
})
```

## Technical Implementation Scope

### Export Architecture
```typescript
// Serverless PDF Generation
interface PDFConfig {
  pageSize: 'A4' | 'Letter' | 'Legal'
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    bottom: number
    left: number
    right: number
  }
  quality: 'draft' | 'normal' | 'high'
  colorMode: 'color' | 'grayscale'
  metadata: {
    title: string
    author: string
    subject: string
    keywords: string[]
    creator: 'ResumePair'
  }
}


// Export Queue
interface ExportJob {
  id: string
  userId: string
  documentId: string
  format: 'pdf'
  options: PDFConfig
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: {
    url: string
    size: number
    pages?: number
  }
  error?: string
  createdAt: Date
  completedAt?: Date
}
```

### Database Updates
```sql
Tables/Collections:
- export_jobs: Track export operations
  - id: uuid (primary key)
  - user_id: uuid (references profiles.id)
  - document_id: uuid (references resumes.id)
  - format: text ('pdf')
  - options: jsonb
  - status: text
  - progress: integer (0-100)
  - result_url: text
  - file_size: integer
  - page_count: integer
  - error_message: text
  - started_at: timestamp
  - completed_at: timestamp
  - created_at: timestamp

- export_history: Historical exports
  - id: uuid (primary key)
  - user_id: uuid
  - document_id: uuid
  - document_version: integer
  - format: text
  - file_name: text
  - file_size: integer
  - download_count: integer
  - expires_at: timestamp
  - created_at: timestamp

- export_templates: Template export settings
  - template_id: text (primary key)
  - pdf_config: jsonb
  - special_rules: jsonb

Migrations Required:
- 013_create_export_jobs_table.sql
- 014_create_export_history_table.sql
- 015_create_export_templates_table.sql
```

### API Endpoints
```
Export Operations:
- POST /api/v1/export/pdf - Generate PDF
  Body: { documentId, options: PDFConfig }
  Response: { jobId } or stream file

- POST /api/v1/export/batch - Batch export
  Body: { documentIds[], options }
  Response: { jobIds[] }

- GET /api/v1/export/job/:id - Get job status
  Response: ExportJob

- GET /api/v1/export/download/:id - Download file
  Response: File stream

- GET /api/v1/export/history - Export history
  Query: ?documentId=xxx&limit=20
  Response: ExportHistory[]

Queue Management:
- GET /api/v1/export/queue - User's queue
  Response: ExportJob[]

- DELETE /api/v1/export/job/:id - Cancel job
  Response: { success: boolean }

- POST /api/v1/export/retry/:id - Retry failed job
  Response: { jobId }
```

### Frontend Components

#### Page Components
```
/app/
├── export/
│   ├── page.tsx - Export options page
│   ├── queue/
│   │   └── page.tsx - Export queue view
│   └── history/
│       └── page.tsx - Export history
```

#### Export Components
```
/components/export/
├── ExportDialog.tsx - Main export modal
├── ExportOptions.tsx - Format options
├── ExportFormatSelector.tsx - PDF format selector
├── ExportPageSize.tsx - Size selector
├── ExportQuality.tsx - Quality settings
├── ExportAdvanced.tsx - Advanced options
├── ExportProgress.tsx - Progress display
├── ExportQueue.tsx - Queue display
├── ExportQueueItem.tsx - Queue item
├── ExportHistory.tsx - History list
├── ExportHistoryItem.tsx - History item
├── BatchExportDialog.tsx - Batch export UI
├── ExportError.tsx - Error display
└── DownloadButton.tsx - Download UI
```

### PDF Generation Service
```typescript
// api/v1/export/pdf/route.ts
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export async function POST(req: Request) {
  const { documentId, options } = await req.json()

  // Load document and template
  const document = await documentRepository.get(documentId)
  const template = templates[document.templateId]

  // Generate HTML
  const html = template.render(document.data, document.customizations)
  const css = combineStyles(template.styles, template.printStyles)

  // Launch Puppeteer
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })

  try {
    const page = await browser.newPage()

    // Set content
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>${html}</body>
      </html>
    `, { waitUntil: 'networkidle0' })

    // Generate PDF
    const pdf = await page.pdf({
      format: options.pageSize,
      printBackground: true,
      margin: options.margins,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    })

    // Save to storage
    const fileName = `exports/${userId}/${documentId}_${Date.now()}.pdf`
    const url = await storageRepository.upload(pdf, fileName)

    // Track in database
    await exportRepository.create({
      documentId,
      format: 'pdf',
      url,
      size: pdf.length,
    })

    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume.pdf"`,
      },
    })
  } finally {
    await browser.close()
  }
}
```

### Export Queue Management
```typescript
// libs/export/exportQueue.ts
export class ExportQueue {
  private queue: ExportJob[] = []
  private processing: Map<string, ExportJob> = new Map()
  private concurrency = 3

  async add(job: ExportJob): Promise<void> {
    this.queue.push(job)
    await this.process()
  }

  private async process(): Promise<void> {
    while (
      this.queue.length > 0 &&
      this.processing.size < this.concurrency
    ) {
      const job = this.queue.shift()!
      this.processing.set(job.id, job)

      this.executeJob(job)
        .then(() => this.onComplete(job))
        .catch((error) => this.onError(job, error))
        .finally(() => this.processing.delete(job.id))
    }
  }

  private async executeJob(job: ExportJob): Promise<void> {
    await this.updateStatus(job.id, 'processing')

    await this.generatePDF(job)
  }

  private async onComplete(job: ExportJob): Promise<void> {
    await this.updateStatus(job.id, 'completed')
    await this.sendNotification(job.userId, 'Export ready')
  }

  private async onError(job: ExportJob, error: Error): Promise<void> {
    console.error(`Export failed for job ${job.id}:`, error)
    await this.updateStatus(job.id, 'failed', error.message)

    if (job.retryCount < 3) {
      await this.retry(job)
    }
  }
}
```

### State Management
```typescript
// stores/exportStore.ts
interface ExportStore {
  // State
  activeJobs: ExportJob[]
  completedJobs: ExportJob[]
  exportHistory: ExportHistory[]
  isExporting: boolean
  exportProgress: Map<string, number>

  // Actions
  exportPDF(documentId: string, options: PDFConfig): Promise<void>
  batchExport(documentIds: string[]): Promise<void>
  cancelExport(jobId: string): Promise<void>
  retryExport(jobId: string): Promise<void>
  downloadExport(jobId: string): void
  loadHistory(): Promise<void>

  // Queue management
  updateJobProgress(jobId: string, progress: number): void
  updateJobStatus(jobId: string, status: string): void
  clearCompletedJobs(): void

  // Computed
  hasActiveJobs: boolean
  totalProgress: number
  canExport: boolean
}
```

## Edge Cases & Completeness Checklist

### User Scenarios (All Need Tests)
- [ ] Very long resume (10+ pages) → Test: large_document_export
- [ ] Special characters in content → Test: special_char_handling
- [ ] Non-Latin scripts → Test: unicode_support
- [ ] Export during editing → Test: concurrent_operations
- [ ] Network failure during export → Test: network_recovery
- [ ] Browser closed during export → Test: background_processing
- [ ] Multiple simultaneous exports → Test: queue_management
- [ ] Storage quota exceeded → Test: storage_limits

### Technical Considerations (Test Requirements)
- [ ] Puppeteer timeout handling → Test: timeout_recovery
- [ ] Memory limits in serverless → Test: memory_management
- [ ] Font loading failures → Test: font_fallback
- [ ] CSS print media queries → Test: print_styles
- [ ] File size limits → Test: size_constraints
- [ ] Temporary file cleanup → Test: storage_cleanup
- [ ] Signed URL expiration → Test: url_expiry

## Phase Exit Criteria

### Test Suite Requirements
```yaml
Unit Tests:
  Total: 68
  Passing: 68
  Coverage: >85%

Integration Tests:
  Total: 32
  Passing: 32
  Coverage: All export paths

E2E Tests:
  Total: 12
  Passing: 12
  Coverage: Export workflows

Performance:
  PDF 2 pages: <2.5s
  Batch 5: <15s

Accessibility:
  Download UI: PASS
  Progress announced: YES

Security:
  Path traversal: BLOCKED
  File sanitization: ACTIVE
```

### Phase Gate Checklist
- [ ] PDF export fully functional
- [ ] All page sizes supported
- [ ] Batch export operational
- [ ] Export queue processing
- [ ] History tracking working
- [ ] ATS optimization verified
- [ ] Performance targets met
- [ ] Error recovery working
- [ ] Downloads successful

## Known Constraints & Decisions
- **Serverless Puppeteer**: Using trimmed Chromium for size limits
- **Temporary storage**: Files deleted after 24 hours
- **Queue limits**: Max 10 concurrent exports per user
- **File size limits**: Max 10MB per export
- **No email delivery**: Direct download only in v1
- **No custom fonts**: System fonts only for compatibility
- **Synchronous single exports**: Queue for batch only

## Phase Completion Definition
This phase is complete when:
1. **ALL tests are passing (100%)**
2. PDF export generates high-quality documents
3. Multiple page sizes supported
4. Batch export working smoothly
5. Export queue processing reliably
6. History tracking functional
7. ATS optimization verified
8. Performance benchmarks met
9. **Gate check approved for Phase 6**