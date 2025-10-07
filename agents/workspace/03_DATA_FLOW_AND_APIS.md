# Data Flow & APIs Analysis

**Date**: 2025-10-07
**Phase**: 3 - Data Flow & API Routes

## Overview

The system uses a RESTful API architecture with Supabase (PostgreSQL) as the database. All routes are protected with JWT auth middleware. The system supports:
- Resume/Cover Letter CRUD operations
- Version history and restore
- PDF export (async job queue)
- AI-powered generation (streaming)
- ATS scoring

---

## API Architecture

### Base Patterns

1. **Authentication**: `withAuth()` HOC wraps all protected routes
2. **Response Format**: Standardized via `apiSuccess()` / `apiError()`
3. **Validation**: Zod schemas at API boundary
4. **Repository Pattern**: Pure functions with dependency injection
5. **Error Handling**: Typed error codes (404, 409, 429, 500)

---

## Core API Routes

### Resume Operations

#### GET /api/v1/resumes
**File**: `/app/api/v1/resumes/route.ts:21-51`
**Purpose**: List user's resumes with pagination

**Query Parameters** (validated via `ResumeListQuerySchema`):
```typescript
{
  status?: 'draft' | 'active' | 'archived'
  search?: string              // Title search (ILIKE)
  sort?: 'updated_at' | 'created_at' | 'title'
  order?: 'asc' | 'desc'
  cursor?: string              // Base64-encoded composite cursor
  limit?: number               // 1-100, default 20
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    resumes: Resume[],
    nextCursor: string | null,
    total: number
  }
}
```

**Cursor Pagination**:
- Composite cursor: `{ v: sortFieldValue, id: resumeId }`
- Base64-encoded for opaque URLs
- Handles tie-breaking via ID (lexicographic order)
- Two-phase fetch: equal bucket + comparison bucket

---

#### POST /api/v1/resumes
**File**: `/app/api/v1/resumes/route.ts:57-109`
**Purpose**: Create new resume

**Request Body** (validated via `CreateResumeSchema`):
```typescript
{
  title: string,           // 1-100 chars
  template_id?: string     // UUID (currently unused)
}
```

**Flow**:
1. Validate input with Zod
2. Fetch user profile (for locale/date format)
3. Call `createEmptyResume(email, name, settings)`
4. Insert into `resumes` table with version=1
5. Return created resume

**Response**:
```typescript
{
  success: true,
  message: 'Resume created successfully',
  data: Resume
}
```

---

#### GET /api/v1/resumes/:id
**File**: `/app/api/v1/resumes/[id]/route.ts:20-42`
**Purpose**: Fetch single resume

**Flow**:
1. Call `getResume(supabase, id)`
2. RLS policy enforces ownership
3. Fire-and-forget update of `last_accessed_at`
4. Return resume

**Error Codes**:
- `404`: Resume not found
- `500`: Database error

---

#### PUT /api/v1/resumes/:id
**File**: `/app/api/v1/resumes/[id]/route.ts:48-101`
**Purpose**: Update resume with optimistic locking

**Request Body** (validated via `UpdateResumeSchema`):
```typescript
{
  title?: string,
  data?: Partial<ResumeJson>,
  version: number             // Required for locking
}
```

**Flow** (in `updateResume` repository function):
1. Fetch current document and version
2. Validate `currentVersion === expectedVersion`
3. Create snapshot in `resume_versions` table
4. Update `resumes` with version+1, WHERE version=currentVersion
5. Return updated document

**Error Codes**:
- `400`: Validation failed
- `404`: Resume not found
- `409`: Version conflict (concurrent edit)
- `500`: Database error

**Conflict Resolution**:
```
Client A: Reads version=5
Client B: Reads version=5
Client A: Updates (version=5) → Success, now version=6
Client B: Updates (version=5) → 409 CONFLICT
Client B: Must reload (now version=6) and retry
```

---

#### DELETE /api/v1/resumes/:id
**File**: `/app/api/v1/resumes/[id]/route.ts:107-123`
**Purpose**: Soft delete resume

**Flow**:
1. Update `is_deleted=true`, `deleted_at=NOW()`
2. Resume kept for 30 days (cleanup cron)
3. Filtered from normal queries via `is_deleted=false`

---

### Version History

#### GET /api/v1/resumes/:id/versions
**File**: `/app/api/v1/resumes/[id]/versions/route.ts`
**Purpose**: List all versions for a resume

**Response**:
```typescript
{
  versions: [
    {
      id: number,
      version_number: number,
      data: ResumeJson,
      created_at: string,
      created_by: string
    }
  ]
}
```

---

#### POST /api/v1/resumes/:id/versions/:versionNumber/restore
**File**: `/app/api/v1/resumes/[id]/versions/[versionNumber]/restore/route.ts`
**Purpose**: Restore a specific version

**Flow**:
1. Fetch version snapshot by `version_number`
2. Create new snapshot of current state
3. Update current document with historical data
4. Increment version
5. Return restored resume

---

### PDF Export System

#### POST /api/v1/export/pdf
**File**: `/app/api/v1/export/pdf/route.ts`
**Runtime**: `nodejs` (Puppeteer requires Node)
**Purpose**: Create async PDF export job

**Request Body** (validated via `ExportPdfSchema`):
```typescript
{
  documentId: string,                // UUID
  templateSlug?: string,             // Default: 'minimal'
  pageSize?: 'letter' | 'a4',       // Default: 'letter'
  margins?: {
    top: number,                     // 0-2 inches
    right: number,
    bottom: number,
    left: number
  },
  quality?: 'standard' | 'high'      // Default: 'standard'
}
```

**Rate Limiting**:
- Max 3 concurrent jobs per user (`MAX_CONCURRENT_JOBS`)
- Returns 429 if limit exceeded

**Flow**:
1. Validate request with Zod
2. Check rate limit via `countPendingJobs()`
3. Verify document ownership
4. Create export job in `export_jobs` table
5. Return job ID (status: 'queued')
6. Background worker processes job

**Job Processing** (inferred):
```
Job Queue (export_jobs table)
  ↓
Worker polls via fetchNextJob()
  ↓
1. Render HTML from template (templateRenderer)
2. Launch Puppeteer + Chromium
3. page.pdf() with options
4. Upload to Supabase Storage
5. Create export_history record
6. Update job status: 'completed'
```

**Response**:
```typescript
{
  jobId: string,
  status: 'queued',
  progress: 0,
  createdAt: string
}
```

---

#### GET /api/v1/export/job/:id
**File**: `/app/api/v1/export/job/[id]/route.ts`
**Purpose**: Poll job status

**Response**:
```typescript
{
  id: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  progress: number,              // 0-100
  downloadUrl?: string,          // When completed
  error?: string,                // When failed
  createdAt: string,
  completedAt?: string
}
```

**Client Pattern**:
```typescript
// 1. Create job
const { jobId } = await POST('/api/v1/export/pdf', { documentId, ... })

// 2. Poll status
const pollInterval = setInterval(async () => {
  const { status, downloadUrl } = await GET(`/api/v1/export/job/${jobId}`)
  if (status === 'completed') {
    clearInterval(pollInterval)
    window.open(downloadUrl)
  }
}, 2000) // Poll every 2s
```

---

#### GET /api/v1/export/download/:id
**File**: `/app/api/v1/export/download/[id]/route.ts`
**Purpose**: Download exported PDF

**Flow**:
1. Fetch export_history record
2. Verify ownership
3. Increment download_count
4. Return signed URL from Supabase Storage

---

### AI Integration

#### POST /api/v1/ai/unified
**File**: `/app/api/v1/ai/unified/route.ts`
**Runtime**: `edge`
**Max Duration**: 60s
**Purpose**: AI-powered resume/cover letter generation (streaming)

**Request Body** (validated via `UnifiedRequestSchema`):
```typescript
{
  docType: 'resume' | 'cover-letter',
  text?: string,                    // Up to 8000 chars
  personalInfo?: {
    name?: string,
    email?: string,
    phone?: string,
    location?: string
  },
  fileData?: string,                // Base64-encoded PDF (max 10MB)
  fileName?: string,
  mimeType?: 'application/pdf',
  editorData?: ResumeJson | CoverLetterJson  // Existing data for refinement
}
```

**Validation Rules**:
- At least one of `text`, `fileData`, or `editorData` required
- PDF size limit: 10MB
- Text limit: 8000 chars

**Quota System**:
- Daily quota checked via `checkDailyQuota(supabase, userId)`
- Returns 429 if exceeded
- Quota incremented via `incrementQuota()` after success

**Flow**:
1. Authenticate user
2. Validate input with Zod
3. Check daily quota
4. Build prompt based on input type:
   - `buildGenerationPrompt()` for text/form
   - `buildPDFExtractionPrompt()` for PDF upload
   - `buildCoverLetterGenerationPrompt()` for cover letters
5. Stream structured JSON via Vercel AI SDK:
   ```typescript
   streamObject({
     model: aiModel,
     schema: docType === 'resume' ? ResumeJsonSchema : CoverLetterJsonSchema,
     prompt: generatedPrompt,
   })
   ```
6. Record operation in `ai_operations` table (usage tracking)
7. Return SSE stream

**Response Format** (Server-Sent Events):
```
data: {"type":"object-delta","delta":{"profile":{"fullName":"John Doe"}}}

data: {"type":"object-delta","delta":{"work":[{"company":"Acme Corp"}]}}

data: {"type":"finish","object":{...complete ResumeJson...}}
```

**Client Pattern**:
```typescript
const response = await fetch('/api/v1/ai/unified', {
  method: 'POST',
  body: JSON.stringify({ docType: 'resume', text: '...' })
})

const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  // Parse SSE: data: {...}
  // Update UI with delta
}
```

---

### Scoring System

#### GET /api/v1/score/:resumeId
**File**: `/app/api/v1/score/[resumeId]/route.ts`
**Purpose**: Get ATS score for resume

**Response**:
```typescript
{
  overall_score: number,        // 0-100
  completeness_score: number,   // 0-100
  format_score: number,         // 0-100
  keyword_score: number,        // 0-100 (requires JD match)
  suggestions: [
    {
      category: string,
      severity: 'high' | 'medium' | 'low',
      message: string,
      fix?: string
    }
  ],
  metadata: {
    word_count: number,
    section_count: number,
    has_summary: boolean,
    has_quantified_achievements: boolean
  }
}
```

**Scoring Components**:
1. **Completeness** (40%): Essential sections present
2. **Format** (30%): ATS-friendly structure
3. **Content** (30%): Quality indicators (keywords, bullets, numbers)

---

## Repository Layer

### Pure Function Pattern

All repositories use dependency injection:
```typescript
export async function getResume(
  supabase: SupabaseClient,  // Injected dependency
  id: string
): Promise<Resume> {
  // ...
}
```

**Benefits**:
- Testable without mocking global state
- Supports different clients (user, admin)
- Type-safe with TypeScript
- Composable (can call from other repos)

---

### Key Repository Functions

#### getResume (`libs/repositories/documents.ts:162-189`)
```typescript
export async function getResume(supabase, id): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error || !data) throw new Error('Resume not found')

  // Fire-and-forget update
  supabase
    .from('resumes')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', id)
    .then() // No await

  return data as Resume
}
```

**Pattern**: Last accessed timestamp updated asynchronously (no await)

---

#### updateResume (`libs/repositories/documents.ts:233-295`)
```typescript
export async function updateResume(
  supabase,
  id,
  updates,
  currentVersion
): Promise<Resume> {
  // Step 1: Fetch current state
  const { data: current } = await supabase
    .from('resumes')
    .select('data, version, user_id')
    .eq('id', id)
    .single()

  // Step 2: Create version snapshot (best-effort)
  if (current) {
    try {
      await supabase.from('resume_versions').insert({
        resume_id: id,
        version_number: current.version,
        data: current.data,
        created_by: current.user_id,
      })
    } catch (err) {
      console.warn('Version snapshot failed (non-blocking):', err)
      // Continue with update
    }
  }

  // Step 3: Update with version check
  const { data, error } = await supabase
    .from('resumes')
    .update({
      ...updates,
      version: currentVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('version', currentVersion)  // Optimistic lock
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('CONFLICT: Document was updated by another process')
    }
    throw new Error(`Failed to update resume: ${error.message}`)
  }

  return data as Resume
}
```

**Key Features**:
- Version snapshot is best-effort (non-blocking)
- WHERE clause includes version check
- Returns CONFLICT error if version mismatch
- Increments version atomically

---

#### Pagination with Composite Cursor (`libs/repositories/documents.ts:25-154`)

**Encoding**:
```typescript
const encodeCursor = (value: unknown, id: string): string => {
  return Buffer.from(JSON.stringify({ v: value, id }), 'utf8').toString('base64')
}
```

**Decoding**:
```typescript
const decodeCursor = (cursor?: string): { v: string; id: string } | null => {
  if (!cursor) return null
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return { v: cursor, id: '' } // Backward compat
  }
}
```

**Two-Phase Fetch** (handles ties in sort field):
```typescript
// Phase 1: Equal bucket with id > cursor.id
const eqData = await supabase
  .from('resumes')
  .eq(sortField, cursor.v)
  .gt('id', cursor.id)
  .order(sortField, { ascending })
  .order('id', { ascending: true })
  .limit(limit)

// Phase 2: Next bucket if needed
if (eqData.length < limit) {
  const remaining = limit - eqData.length
  const cmpData = ascending
    ? await supabase.from('resumes').gt(sortField, cursor.v).limit(remaining)
    : await supabase.from('resumes').lt(sortField, cursor.v).limit(remaining)

  data = [...eqData, ...cmpData]
}
```

**Why Composite Cursor?**
- Handles non-unique sort fields (e.g., multiple resumes with same `updated_at`)
- ID provides lexicographic tie-breaker
- Prevents skipped/duplicate items in pagination

---

## PDF Generation Pipeline

### Components

1. **Template Renderer** (`libs/exporters/templateRenderer.ts`)
   - Renders React component to HTML string
   - Injects Tailwind CSS
   - Returns complete HTML document

2. **PDF Generator** (`libs/exporters/pdfGenerator.ts`)
   - Uses Puppeteer + Chromium
   - Configured for serverless (`@sparticuz/chromium`)
   - Generates PDF from HTML

3. **Storage Manager** (`libs/exporters/storageManager.ts`)
   - Uploads PDF to Supabase Storage
   - Generates signed download URLs
   - Manages expiration (7 days default)

4. **Export Queue** (`libs/exporters/exportQueue.ts`)
   - Job polling via `fetchNextJob()`
   - Status updates (queued → processing → completed)
   - Error handling and retry

---

### Template Rendering

**Flow** (`libs/exporters/templateRenderer.ts`):
```typescript
export async function renderResumeTemplate(
  resumeData: ResumeJson,
  options: { templateSlug, pageSize, margins }
): Promise<string> {
  // 1. Get template from registry
  const template = getTemplate(options.templateSlug)

  // 2. Render React component to HTML
  const Component = template.component
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    <Component
      data={resumeData}
      customizations={template.defaults}
      mode="print"
    />
  )

  // 3. Wrap in HTML document with styles
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${tailwindCSS}</style>
        <style>${customCSS}</style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `
}
```

**Template Props**:
```typescript
interface TemplateProps {
  data: ResumeJson,
  customizations?: Customizations,
  mode: 'edit' | 'preview' | 'print'
}
```

**Mode Behavior**:
- `edit`: Interactive (contentEditable)
- `preview`: Read-only live preview
- `print`: Static HTML for PDF (no interactivity)

---

### PDF Generation

**Flow** (`libs/exporters/pdfGenerator.ts:71-136`):
```typescript
export async function generateResumePdf(
  resumeData: ResumeJson,
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  let browser: Browser | null = null

  try {
    // 1. Render HTML
    const html = await renderResumeTemplate(resumeData, options)

    // 2. Launch browser
    browser = await launchBrowser() // Chromium

    // 3. Create page and load content
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // 4. Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.pageSize === 'a4' ? 'A4' : 'Letter',
      printBackground: true,
      margin: options.margins,
    })

    // 5. Calculate metadata
    const pageCount = await countPdfPages(page)
    const buffer = Buffer.from(pdfBuffer)

    return {
      buffer,
      pageCount,
      fileSize: buffer.length,
    }
  } finally {
    if (browser) await browser.close()
  }
}
```

**Chromium Setup**:
- **Local Dev**: Uses local Chrome/Chromium
- **Production**: Uses `@sparticuz/chromium` (optimized for serverless)
- Args: `--no-sandbox`, `--disable-setuid-sandbox` (required for containers)

---

### Template Registry

**File**: `/libs/templates/registry.ts`
**Pattern**: Lazy-loaded template components

```typescript
const TEMPLATE_REGISTRY: Record<TemplateSlug, ResumeTemplate> = {
  minimal: {
    component: require('./minimal/MinimalTemplate').default,
    metadata: require('./minimal/metadata').minimalMetadata,
    defaults: require('./minimal/metadata').minimalDefaults,
  },
  modern: { ... },
  classic: { ... },
  creative: { ... },
  technical: { ... },
  executive: { ... },
}
```

**Functions**:
- `getTemplate(slug)`: Returns full template definition
- `listTemplates()`: All templates (for picker)
- `listTemplateMetadata()`: Metadata only (lighter payload)
- `getDefaultTemplate()`: Returns 'minimal'

**Metadata Example**:
```typescript
export const minimalMetadata: TemplateMetadata = {
  id: 'minimal',
  name: 'Minimal',
  category: 'minimal',
  description: 'Clean and simple ATS-friendly template',
  thumbnail: '/templates/minimal-thumb.png',
  features: ['ATS-friendly', 'Single-column', 'No icons'],
  version: '1.0.0',
  atsScore: 95,
}
```

---

## Data Flow Diagrams

### Resume Creation Flow

```
User clicks "New Resume"
  ↓
POST /api/v1/resumes { title }
  ↓
withAuth middleware (validates JWT)
  ↓
Zod validation (CreateResumeSchema)
  ↓
getProfile(supabase, userId)
  → Fetch user locale/date format
  ↓
createEmptyResume(email, name, settings)
  → Factory function returns ResumeJson
  ↓
createResume(supabase, userId, title, data)
  → INSERT INTO resumes (version=1, status='draft')
  ↓
Return Resume object
  ↓
Client stores in documentStore
  ↓
EditorPage renders form + live preview
```

---

### Resume Update Flow (with Auto-Save)

```
User types in field
  ↓
React Hook Form detects change
  ↓
methods.watch() fires onChange callback
  ↓
EditorPage.handleChange(data)
  ↓
useDocumentStore.updateDocument(data)
  ↓
Store: Deep equality check (lodash/isEqual)
  ↓
If changed:
  - Update document state
  - Set isDirty = true
  - Clear existing timer
  - Set new timer (2s debounce)
  ↓
After 2 seconds (no new changes):
  ↓
Store: saveDocument()
  ↓
PUT /api/v1/resumes/:id
  Body: { title?, data?, version: 5 }
  ↓
withAuth + Zod validation
  ↓
updateResume(supabase, id, updates, version)
  ↓
1. Fetch current: { version: 5, data: {...} }
2. Create snapshot in resume_versions
3. UPDATE resumes SET version=6 WHERE id=:id AND version=5
4. If affected_rows=0 → 409 CONFLICT
5. Return updated resume (version=6)
  ↓
Store: Update state
  - document = response.data
  - documentVersion = 6
  - originalDocument = deep copy
  - isDirty = false
  - lastSaved = now
  ↓
UI: EditorHeader shows "Saved at 2:34 PM"
  ↓
LivePreview re-renders (RAF-batched, <120ms)
```

---

### PDF Export Flow

```
User clicks "Export PDF"
  ↓
POST /api/v1/export/pdf
  Body: { documentId, templateSlug, pageSize, margins }
  ↓
withAuth + Zod validation
  ↓
Check rate limit: countPendingJobs(userId)
  → If >= 3: Return 429 Too Many Requests
  ↓
Verify document ownership
  ↓
createExportJob(supabase, { user_id, document_id, format: 'pdf', options })
  → INSERT INTO export_jobs (status='queued')
  ↓
Return { jobId, status: 'queued' }
  ↓
Client polls: GET /api/v1/export/job/:id (every 2s)
  ↓
Background Worker (separate process):
  ↓
1. Poll: fetchNextJob(supabase)
   → SELECT * FROM export_jobs WHERE status='queued' ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED
  ↓
2. Update status: 'processing'
  ↓
3. Fetch document data: getResume(supabase, document_id)
  ↓
4. Render HTML: renderResumeTemplate(data, options)
  ↓
5. Launch Chromium
  ↓
6. Generate PDF: page.pdf({ format, margins })
  ↓
7. Upload to Supabase Storage: /exports/{userId}/{jobId}.pdf
  ↓
8. Create export_history record (with download URL)
  ↓
9. Update job: status='completed', download_url, completed_at
  ↓
Client receives 'completed' status
  ↓
GET /api/v1/export/download/:id
  → Return signed URL (24h expiry)
  ↓
Browser downloads PDF
```

---

### AI Generation Flow (Streaming)

```
User enters text/uploads PDF
  ↓
POST /api/v1/ai/unified
  Body: { docType: 'resume', text: '...', fileData: 'base64...' }
  ↓
withAuth + Zod validation
  ↓
checkDailyQuota(supabase, userId)
  → If exceeded: Return 429 with resetAt
  ↓
Build prompt:
  - If text: buildGenerationPrompt(text, personalInfo)
  - If PDF: buildPDFExtractionPrompt(buffer, personalInfo)
  - If editorData: Refinement prompt with existing data
  ↓
streamObject({
  model: aiModel,
  schema: ResumeJsonSchema,
  prompt: generatedPrompt,
})
  ↓
SSE Stream starts:
  data: {"type":"object-delta","delta":{"profile":{"fullName":"John"}}}
  data: {"type":"object-delta","delta":{"work":[{"company":"Acme"}]}}
  data: {"type":"finish","object":{...complete ResumeJson...}}
  ↓
Client (UnifiedAITool):
  ↓
1. Read SSE stream
2. Parse deltas
3. Update unifiedAIStore.partialData
4. Re-render preview in real-time
5. On finish: Show "Apply" button
  ↓
User clicks "Apply"
  ↓
useDocumentStore.updateDocument(partialData)
  → Merges AI result into editor
  → Triggers auto-save
  ↓
incrementQuota(supabase, userId)
  → Update daily usage counter
  ↓
createOperation(supabase, { user_id, operation_type, tokens, cost })
  → Track AI usage for billing
```

---

## Error Handling Patterns

### Standard Error Response

```typescript
{
  success: false,
  error: 'Short error code',
  message: 'Human-readable message',
  code?: 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'NOT_FOUND' | 'INTERNAL_ERROR'
}
```

### Status Code Mapping

- `400`: Validation failed (Zod errors)
- `401`: Unauthorized (no auth token)
- `403`: Forbidden (RLS policy violation)
- `404`: Resource not found
- `409`: Conflict (version mismatch, concurrent edit)
- `429`: Rate limited (too many requests, quota exceeded)
- `500`: Internal server error

### Example: Conflict Handling

**Server** (`updateResume`):
```typescript
if (error.code === 'PGRST116') {
  throw new Error('CONFLICT: Document was updated by another process')
}
```

**API Route**:
```typescript
catch (error) {
  if (message.includes('CONFLICT')) {
    return apiError(409, 'Resume was modified by another process. Please refresh.', message)
  }
}
```

**Client** (store):
```typescript
catch (error) {
  set({ saveError: error })
  // EditorHeader shows error toast
  // User must reload to get latest version
}
```

---

## Performance Optimizations

### 1. Cursor Pagination
- **Problem**: OFFSET becomes slow with large datasets
- **Solution**: Composite cursor (value + ID)
- **Result**: O(1) page fetches regardless of offset

### 2. Partial Indexes
```sql
CREATE INDEX resumes_user_status_idx
  ON resumes(user_id, status)
  WHERE is_deleted = false;
```
- Only indexes active resumes
- Smaller index size
- Faster queries

### 3. RAF-Batched Preview Updates
```typescript
rafId = requestAnimationFrame(() => {
  setPreviewData(document)
  // Target: <120ms per update
})
```
- Debounces rapid changes
- Maintains scroll position
- Prevents layout thrashing

### 4. Lazy Template Loading
```typescript
component: require('./minimal/MinimalTemplate').default
```
- Templates loaded on-demand
- Smaller initial bundle
- Faster page loads

### 5. Fire-and-Forget Updates
```typescript
supabase
  .from('resumes')
  .update({ last_accessed_at: NOW() })
  .then() // No await
```
- Non-critical updates don't block response
- Improves perceived latency

---

## File Reference Index

### API Routes
- `/app/api/v1/resumes/route.ts` - List/create (109 lines)
- `/app/api/v1/resumes/[id]/route.ts` - Get/update/delete (123 lines)
- `/app/api/v1/resumes/[id]/versions/route.ts` - Version list
- `/app/api/v1/resumes/[id]/versions/[versionNumber]/restore/route.ts` - Restore
- `/app/api/v1/export/pdf/route.ts` - Create export job (127 lines)
- `/app/api/v1/export/job/[id]/route.ts` - Poll job status
- `/app/api/v1/export/download/[id]/route.ts` - Download PDF
- `/app/api/v1/ai/unified/route.ts` - AI generation (100+ lines)
- `/app/api/v1/score/[resumeId]/route.ts` - ATS scoring

### Repositories
- `/libs/repositories/documents.ts` - Resume CRUD (300+ lines)
- `/libs/repositories/versions.ts` - Version history
- `/libs/repositories/exportJobs.ts` - Export queue
- `/libs/repositories/exportHistory.ts` - Export records
- `/libs/repositories/aiOperations.ts` - AI tracking

### Exporters
- `/libs/exporters/pdfGenerator.ts` - Puppeteer PDF (150+ lines)
- `/libs/exporters/templateRenderer.ts` - React to HTML
- `/libs/exporters/storageManager.ts` - Supabase Storage
- `/libs/exporters/exportQueue.ts` - Job polling

### Templates
- `/libs/templates/registry.ts` - Template registry (130 lines)
- `/libs/templates/minimal/MinimalTemplate.tsx`
- `/libs/templates/modern/ModernTemplate.tsx`
- `/libs/templates/classic/ClassicTemplate.tsx`
- `/libs/templates/creative/CreativeTemplate.tsx`
- `/libs/templates/technical/TechnicalTemplate.tsx`
- `/libs/templates/executive/ExecutiveTemplate.tsx`

---

## Observations & Gaps

### Strengths
1. **Clean API design**: RESTful, standardized responses
2. **Optimistic locking**: Prevents concurrent edit conflicts
3. **Async export**: Non-blocking PDF generation
4. **Streaming AI**: Real-time results via SSE
5. **Rate limiting**: Prevents abuse (concurrent jobs, daily quota)
6. **Cursor pagination**: Scalable to millions of records
7. **Dependency injection**: Testable repositories

### Gaps/Questions
1. **Background worker**: How are export jobs processed?
   - Likely a separate process/cron
   - Uses `fetchNextJob()` with `FOR UPDATE SKIP LOCKED`
   - Not fully documented in codebase
2. **Storage cleanup**: How are expired exports deleted?
   - Cron route exists: `/api/v1/cron/cleanup-exports`
   - Not explored in detail
3. **AI quota reset**: How is daily quota reset?
   - Likely midnight UTC via cron
   - Not seen in explored files
4. **Template customization persistence**: Where are custom colors/fonts stored?
   - Not in `resumes.data` (only contains ResumeJson)
   - Possibly separate table or JSONB column
5. **Version pruning**: How are old versions cleaned up?
   - Function exists: `pruneVersions()`
   - Not explored
