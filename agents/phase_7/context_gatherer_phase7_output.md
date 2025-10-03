# Phase 7: Cover Letters & Extended Documents - Definitive Context Document

**Phase**: 7 - Cover Letters & Extended Documents
**Objective**: Extend ResumePair from resume-only to comprehensive job application document system
**Complexity**: HIGH - Rich text editing, document linking, multi-document management
**Date**: 2025-10-03
**Author**: Context Gatherer Agent

---

## Table of Contents

1. [Phase 7 Scope Summary](#1-phase-7-scope-summary)
2. [Feature Requirements Deep Dive](#2-feature-requirements-deep-dive)
3. [Technical Architecture Context](#3-technical-architecture-context)
4. [Constraints & Decisions](#4-constraints--decisions)
5. [Current System State](#5-current-system-state)
6. [Critical Implementation Paths](#6-critical-implementation-paths)
7. [Edge Cases & Validation](#7-edge-cases--validation)
8. [Success Metrics](#8-success-metrics)

---

## 1. Phase 7 Scope Summary

### High-Level Overview

Phase 7 transforms ResumePair from a resume-only tool into a **comprehensive job application document builder** by adding:

1. **Cover Letter Data Model** - CoverLetterJson schema with rich text support
2. **Rich Text Editor** - ContentEditable-based editor with formatting (bold, italic, underline, lists)
3. **Cover Letter Templates** - 4 minimum templates (Classic, Modern, Creative, Executive)
4. **AI-Powered Generation** - Generate cover letters from job descriptions + resume data
5. **Resume Data Linking** - One-way sync from resume to cover letter (contact info, profile)
6. **Multi-Document Management** - Unified dashboard, filtering, search, document packages

### 6 Major Feature Areas

| Feature Area | Purpose | Complexity |
|--------------|---------|------------|
| Cover Letter Data Model | Define CoverLetterJson schema, database tables | Medium |
| Rich Text Editor | Implement safe rich text editing with XSS prevention | High |
| Cover Letter Templates | Create 4 templates matching resume template system | Medium |
| AI Generation | Generate cover letters from JD + resume using Gemini | Medium |
| Document Linking | Link resumes to cover letters with data sync | Medium |
| Multi-Document Management | Dashboard, filtering, search, packages | High |

### Success Criteria

**Phase 7 is complete when:**

1. Users can create, edit, save cover letters with rich text formatting
2. Cover letters use same template system as resumes (schema-driven)
3. AI can generate cover letters from job description + linked resume
4. Cover letters can be linked to resumes with automatic data sync
5. Dashboard shows both resumes and cover letters with filtering
6. Document packages (resume + cover letter) can be created and exported
7. All cover letter operations match resume performance budgets
8. XSS prevention is active and tested for rich text content
9. 4 migration files created (not applied until user approval)
10. Visual verification completed for all UI components

---

## 2. Feature Requirements Deep Dive

### 2.1 Cover Letter Data Model

**Objective**: Define the canonical CoverLetterJson schema matching ResumeJson pattern.

#### CoverLetterJson Schema (v1)

```typescript
interface CoverLetterJson {
  from: {
    fullName: string
    email: string
    phone?: string
    address?: Address
    linkedResumeId?: string  // Reference to linked resume
  }
  to: {
    companyName: string
    hiringManager?: string
    title?: string           // Hiring manager title
    department?: string
    address?: Address
  }
  jobInfo: {
    title: string            // Job title
    reference?: string       // Job posting reference number
    source?: string          // Where job was found (e.g., "LinkedIn")
    applicationDate?: string // ISO date
  }
  date: string               // ISO format, formatted via Intl
  salutation: string         // "Dear Hiring Manager," etc.
  body: RichTextBlock[]      // Rich text content (see 2.2)
  closing: {
    phrase: string           // "Sincerely," etc.
    name: string
    signatureImage?: string  // Optional signature (Storage URL)
  }
  settings: CoverLetterSettings
}

interface Address {
  street?: string
  city: string
  region: string
  postal: string
  country: string
}

interface CoverLetterSettings {
  template: string           // Template slug
  fontFamily: string
  fontSize: number           // 10-12pt typical
  lineSpacing: number        // 1.0-1.5
  colorTheme: string
  margins: Margins
}

interface Margins {
  top: number    // inches or cm
  right: number
  bottom: number
  left: number
}
```

**Key Constraints:**

- `from.linkedResumeId` is optional (cover letters can be standalone)
- `body` uses RichTextBlock[] (NOT plain string) - see 2.2 for structure
- `settings` matches ResumeSettings pattern (same customization knobs)
- All dates stored as ISO strings, formatted via `Intl.DateTimeFormat` at render
- Addresses formatted using i18n utilities (same as resumes)

**Schema Version**: `cover-letter.v1`

**Storage**: JSONB column in `cover_letters` table (same pattern as `resumes` table)

---

### 2.2 Rich Text Editor

**Objective**: Implement safe rich text editing with limited formatting for professional cover letters.

#### Rich Text Data Structure

```typescript
interface RichTextBlock {
  type: 'paragraph' | 'bullet_list' | 'numbered_list'
  content: TextRun[]
}

interface TextRun {
  text: string
  marks?: Array<'bold' | 'italic' | 'underline' | 'link'>
  href?: string  // For link marks only
}
```

**Example:**

```typescript
// "I am **excited** to apply for this role."
{
  type: 'paragraph',
  content: [
    { text: 'I am ' },
    { text: 'excited', marks: ['bold'] },
    { text: ' to apply for this role.' }
  ]
}

// Bullet list:
{
  type: 'bullet_list',
  content: [
    { text: '5+ years of experience' },
    { text: 'Led team of 10 engineers' }
  ]
}
```

#### Editor Implementation Strategy

**Technology Choice**: ContentEditable + `document.execCommand` (simple, no dependencies)

**Why NOT use Lexical/Slate/TipTap?**
- Phase 7 requirement: "Simple rich text: Bold, italic, underline, lists only (no complex formatting)"
- ContentEditable is sufficient for this limited scope
- Zero dependencies (aligns with "keep it simple" philosophy)
- Easier to sanitize and control output

**Editor Architecture**:

```typescript
// components/rich-text/RichTextEditor.tsx
export function RichTextEditor({
  value: RichTextBlock[],
  onChange: (blocks: RichTextBlock[]) => void,
  placeholder?: string,
  maxLength?: number,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  // Convert RichTextBlock[] → HTML for contentEditable
  const blocksToHtml = (blocks: RichTextBlock[]): string => { /* ... */ }

  // Convert HTML → RichTextBlock[] (sanitized)
  const parseHtmlToBlocks = (html: string): RichTextBlock[] => { /* ... */ }

  // Apply formatting
  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    document.execCommand(format, false)
    handleChange()
  }

  const insertList = (type: 'bullet' | 'numbered') => {
    const command = type === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList'
    document.execCommand(command, false)
    handleChange()
  }

  const handleChange = () => {
    const html = editorRef.current!.innerHTML
    const sanitized = sanitizeHtml(html)  // XSS prevention
    const blocks = parseHtmlToBlocks(sanitized)
    onChange(blocks)
  }

  return (
    <div className="border rounded-lg">
      <RichTextToolbar
        onBold={() => applyFormat('bold')}
        onItalic={() => applyFormat('italic')}
        onUnderline={() => applyFormat('underline')}
        onBulletList={() => insertList('bullet')}
        onNumberedList={() => insertList('numbered')}
      />
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[300px] focus:outline-none"
        onInput={handleChange}
        onKeyDown={handleKeyboardShortcuts}
        dangerouslySetInnerHTML={{ __html: blocksToHtml(value) }}
      />
      <CharacterCount content={value} max={maxLength} />
    </div>
  )
}
```

#### XSS Prevention (CRITICAL)

**Sanitization Rules**:

```typescript
// libs/sanitizer/richTextSanitizer.ts

// ALLOWED tags
const SAFE_TAGS = ['p', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'br', 'a']

// ALLOWED attributes
const SAFE_ATTRIBUTES = {
  'a': ['href', 'title']  // Links only
}

// DANGEROUS tags (strip completely)
const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'style']

export function sanitizeHtml(html: string): string {
  // 1. Strip dangerous tags
  // 2. Remove unsafe attributes (onclick, onerror, etc.)
  // 3. Whitelist only SAFE_TAGS
  // 4. Validate href values (no javascript: protocol)
  // 5. Return sanitized HTML
}
```

**Two-Layer Defense**:
1. **Client-side sanitization**: Before storing in Zustand state
2. **Server-side validation**: Validate RichTextBlock[] structure via Zod schema in API routes

**Zod Schema for Validation**:

```typescript
const TextRunSchema = z.object({
  text: z.string(),
  marks: z.array(z.enum(['bold', 'italic', 'underline', 'link'])).optional(),
  href: z.string().url().optional(),
})

const RichTextBlockSchema = z.object({
  type: z.enum(['paragraph', 'bullet_list', 'numbered_list']),
  content: z.array(TextRunSchema),
})

const CoverLetterBodySchema = z.array(RichTextBlockSchema)
```

#### Keyboard Shortcuts

- `Cmd/Ctrl + B`: Bold
- `Cmd/Ctrl + I`: Italic
- `Cmd/Ctrl + U`: Underline
- `Cmd/Ctrl + Z`: Undo (via Zustand zundo)
- `Cmd/Ctrl + Shift + Z`: Redo

#### Performance Budget

- **Keystroke → preview paint**: p95 ≤ 100ms (FASTER than resume, simpler content)
- **Character count**: Updates in real-time
- **Undo/redo**: Integrated with Zustand temporal store (same as resumes)

---

### 2.3 Cover Letter Templates

**Objective**: Create 4 minimum templates matching resume template architecture.

#### Template Requirements

**Minimum 4 Templates** (expandable in future):

1. **Classic Block** - Traditional business letter format
   - Formal, left-aligned
   - Professional spacing
   - Standard font (serif)
   - ATS-safe

2. **Modern Minimal** - Contemporary, clean
   - Sans-serif font
   - Generous whitespace
   - Subtle accents
   - Similar to Modern Resume template

3. **Creative Bold** - Designer-friendly
   - Eye-catching header
   - Color accents
   - Modern typography
   - Matches Creative Resume template

4. **Executive Formal** - Senior professional
   - Elegant serif font
   - Professional tone
   - Traditional layout
   - Matches Executive Resume template

#### Template Implementation Pattern

**Location**: `libs/templates/cover-letter/{slug}/`

**Structure** (matches resume templates):

```
libs/templates/cover-letter/
├── classic-block/
│   ├── index.tsx           # Template component
│   └── styles.module.css   # Template-specific styles
├── modern-minimal/
├── creative-bold/
└── executive-formal/
```

**Template Contract**:

```typescript
// libs/templates/cover-letter/types.ts
export interface CoverLetterTemplateProps {
  data: CoverLetterJson
  preview?: boolean      // True = preview, false = export
}

// libs/templates/cover-letter/classic-block/index.tsx
export default function ClassicBlockTemplate({
  data,
  preview = false,
}: CoverLetterTemplateProps): React.ReactElement {
  return (
    <div className="doc-theme">  {/* MUST wrap in .doc-theme */}
      <div className="bg-doc-surface text-doc-foreground p-doc-gutter">
        {/* Template content using ONLY --doc-* tokens */}
        <header>
          {data.from.fullName}
          {data.from.address && <Address address={data.from.address} />}
        </header>
        <div className="mt-6">
          {formatDate(data.date, data.settings.locale)}
        </div>
        {/* Recipient block */}
        <div className="mt-4">
          {data.to.hiringManager && <div>{data.to.hiringManager}</div>}
          <div>{data.to.companyName}</div>
        </div>
        {/* Salutation */}
        <div className="mt-6">{data.salutation}</div>
        {/* Body - render RichTextBlock[] */}
        <div className="mt-4">
          <RichTextRenderer blocks={data.body} />
        </div>
        {/* Closing */}
        <div className="mt-6">
          <div>{data.closing.phrase}</div>
          <div className="mt-4">{data.closing.name}</div>
        </div>
      </div>
    </div>
  )
}
```

**Critical Rules**:

1. Templates MUST wrap in `.doc-theme` class (dual-token architecture)
2. Templates MUST use only `--doc-*` tokens (NEVER `--app-*` tokens)
3. Templates are **pure React components** (no side effects, no API calls)
4. Templates NEVER modify schema (read-only)
5. Templates handle pagination with `break-inside: avoid` for print

**RichTextRenderer Component**:

```typescript
// components/rich-text/RichTextRenderer.tsx
export function RichTextRenderer({
  blocks,
}: {
  blocks: RichTextBlock[]
}): React.ReactElement {
  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === 'paragraph') {
          return (
            <p key={idx} className="mb-4">
              {block.content.map((run, i) => (
                <TextRun key={i} run={run} />
              ))}
            </p>
          )
        }
        if (block.type === 'bullet_list') {
          return (
            <ul key={idx} className="list-disc ml-6 mb-4">
              {block.content.map((run, i) => (
                <li key={i}><TextRun run={run} /></li>
              ))}
            </ul>
          )
        }
        if (block.type === 'numbered_list') {
          return (
            <ol key={idx} className="list-decimal ml-6 mb-4">
              {block.content.map((run, i) => (
                <li key={i}><TextRun run={run} /></li>
              ))}
            </ol>
          )
        }
      })}
    </>
  )
}

function TextRun({ run }: { run: TextRun }) {
  let element = <span>{run.text}</span>

  if (run.marks?.includes('bold')) {
    element = <strong>{element}</strong>
  }
  if (run.marks?.includes('italic')) {
    element = <em>{element}</em>
  }
  if (run.marks?.includes('underline')) {
    element = <u>{element}</u>
  }
  if (run.marks?.includes('link') && run.href) {
    element = <a href={run.href} target="_blank" rel="noopener">{element}</a>
  }

  return element
}
```

---

### 2.4 AI-Powered Generation

**Objective**: Generate cover letters from job description + resume data using Gemini 2.0 Flash.

#### Generation Flow

**User Input**:
1. Job description (textarea, required)
2. Linked resume (select from user's resumes, optional but recommended)
3. Tone (select: formal, friendly, enthusiastic)
4. Length (select: concise [3 paragraphs], standard [4-5 paragraphs], detailed [6+ paragraphs])

**API Route**: `POST /api/v1/cover-letters/generate` (Edge runtime, SSE streaming)

**Prompt Structure**:

```typescript
// libs/ai/prompts/p-coverletter-draft.ts

export const COVER_LETTER_DRAFT_PROMPT = `
You are an expert cover letter writer. Generate a professional cover letter based on:

JOB DESCRIPTION:
{jobDescription}

RESUME DATA (if provided):
{resumeData}

TONE: {tone}
LENGTH: {length}

INSTRUCTIONS:
1. Extract key requirements from job description
2. Match candidate's experience from resume to job requirements
3. Write compelling opening paragraph (hook + job title)
4. Body paragraphs: 2-3 specific examples showing fit
5. Closing paragraph: enthusiasm + call to action
6. Use {tone} tone throughout
7. Target {length} length
8. NO FABRICATION - only use information from resume
9. Output as structured JSON matching CoverLetterJson schema

RULES:
- Be specific (quantify achievements when possible)
- Show personality while maintaining professionalism
- Address company name and hiring manager if provided
- Use action verbs and concrete examples
- Avoid clichés ("passionate," "team player" without evidence)
- Each paragraph should connect resume experience to job requirement
`

export async function generateCoverLetter({
  jobDescription,
  resumeData,
  tone,
  length,
}: GenerateCoverLetterInput): Promise<CoverLetterJson> {
  const response = await generateObject({
    model: gemini('gemini-2.0-flash'),
    schema: CoverLetterJsonSchema,  // Zod schema
    prompt: COVER_LETTER_DRAFT_PROMPT.replace('{jobDescription}', jobDescription)
      .replace('{resumeData}', JSON.stringify(resumeData))
      .replace('{tone}', tone)
      .replace('{length}', length),
    temperature: 0.7,  // Slightly creative for writing
  })

  return response.object
}
```

#### Streaming Implementation

**API Route** (Edge):

```typescript
// app/api/v1/cover-letters/generate/route.ts
import { streamObject } from 'ai'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const user = await getUser(req)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { jobDescription, resumeId, tone, length } = await req.json()

  // Load resume data if linked
  let resumeData = null
  if (resumeId) {
    const resume = await getResume(resumeId, user.id)
    resumeData = resume.data
  }

  // Stream generation
  const stream = await streamObject({
    model: gemini('gemini-2.0-flash'),
    schema: CoverLetterJsonSchema,
    prompt: buildPrompt(jobDescription, resumeData, tone, length),
    temperature: 0.7,
  })

  // Return SSE stream
  return new Response(stream.toTextStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
```

**Client Integration**:

```typescript
// In CoverLetterGenerationPanel component
const handleGenerate = async () => {
  const response = await fetch('/api/v1/cover-letters/generate', {
    method: 'POST',
    body: JSON.stringify({ jobDescription, resumeId, tone, length }),
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    // Parse SSE events and update preview in real-time
    const delta = parseSSEChunk(chunk)
    updateCoverLetterStore(delta)
  }
}
```

#### Tone Options

1. **Formal** - Traditional business tone
2. **Friendly** - Warm but professional
3. **Enthusiastic** - Energetic and passionate

**Implementation**: Adjust prompt instructions + temperature slightly

#### Performance Budget

- **Generation time**: <5s for complete cover letter (Phase 7 spec)
- **Streaming**: First delta in <1s
- **Preview updates**: Real-time (SSE streaming)

---

### 2.5 Resume Data Linking

**Objective**: Link cover letters to resumes with one-way data sync (resume → cover letter).

#### Linking Mechanism

**Data Flow**: Resume → Cover Letter (ONE-WAY only)

**Synced Fields**:
- `from.fullName` ← `resume.profile.fullName`
- `from.email` ← `resume.profile.email`
- `from.phone` ← `resume.profile.phone`
- `from.address` ← `resume.profile.location` (if complete)

**NOT Synced** (cover letter specific):
- `body` (rich text content)
- `to` (recipient info)
- `jobInfo` (job details)
- `closing` (signature)
- `settings` (template, fonts)

#### Database Relationship

**Table**: `document_relationships`

```sql
CREATE TABLE document_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,        -- Resume ID
  source_type TEXT NOT NULL,       -- 'resume'
  target_id UUID NOT NULL,         -- Cover Letter ID
  target_type TEXT NOT NULL,       -- 'cover_letter'
  relationship_type TEXT NOT NULL, -- 'linked' | 'package' | 'variant'
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_relationships_source ON document_relationships(source_id);
CREATE INDEX idx_relationships_target ON document_relationships(target_id);
```

**RLS Policies**:
```sql
-- SELECT: Read own relationships
CREATE POLICY "relationships_select_own" ON document_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cover_letters cl
      WHERE cl.id = target_id AND cl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM resumes r
      WHERE r.id = source_id AND r.user_id = auth.uid()
    )
  );

-- INSERT: Create relationships for own documents
CREATE POLICY "relationships_insert_own" ON document_relationships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cover_letters cl
      WHERE cl.id = target_id AND cl.user_id = auth.uid()
    )
  );
```

#### Sync Implementation

**API Route**: `POST /api/v1/cover-letters/:id/link`

```typescript
// app/api/v1/cover-letters/[id]/link/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  const { resumeId } = await req.json()

  // 1. Verify ownership
  const coverLetter = await getCoverLetter(params.id, user.id)
  const resume = await getResume(resumeId, user.id)

  // 2. Create relationship
  await db.from('document_relationships').insert({
    source_id: resumeId,
    source_type: 'resume',
    target_id: params.id,
    target_type: 'cover_letter',
    relationship_type: 'linked',
  })

  // 3. Sync data
  const updatedData = {
    ...coverLetter.data,
    from: {
      ...coverLetter.data.from,
      fullName: resume.data.profile.fullName,
      email: resume.data.profile.email,
      phone: resume.data.profile.phone,
      address: resume.data.profile.location,
      linkedResumeId: resumeId,
    },
  }

  // 4. Update cover letter
  await updateCoverLetter(params.id, { data: updatedData })

  return apiSuccess({ linked: true })
}
```

#### Cascade Rules

**When resume is deleted**:
- **Do NOT delete linked cover letters** (cover letters can be standalone)
- **Set `linkedResumeId` to null** in cover letter
- **Delete relationship record**
- **Notify user**: "Resume deleted. Cover letter is now standalone."

**When resume is updated**:
- **Option 1** (recommended): Manual sync only (user clicks "Sync from Resume" button)
- **Option 2**: Auto-sync (but provide undo/warning)

**Phase 7 Decision**: **Manual sync only** (safer, user has control)

---

### 2.6 Multi-Document Management

**Objective**: Unified dashboard showing both resumes and cover letters with filtering, search, and package creation.

#### Unified Dashboard

**Route**: `/app/documents/page.tsx` (new page)

**Features**:
1. Document grid (both resumes and cover letters)
2. Type filter (All, Resumes, Cover Letters)
3. Status filter (Draft, Active, Archived)
4. Search (title, content)
5. Sort (Updated, Created, Title)
6. Bulk operations (Delete, Archive, Export)
7. Linked status indicator (show linked documents)
8. Package view (resume + cover letter bundles)

#### Document Filter Component

```typescript
// components/documents/DocumentFilter.tsx
export function DocumentFilter({
  activeType,
  onTypeChange,
}: DocumentFilterProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={activeType === 'all' ? 'default' : 'outline'}
        onClick={() => onTypeChange('all')}
      >
        All Documents
      </Button>
      <Button
        variant={activeType === 'resume' ? 'default' : 'outline'}
        onClick={() => onTypeChange('resume')}
      >
        Resumes
      </Button>
      <Button
        variant={activeType === 'cover-letter' ? 'default' : 'outline'}
        onClick={() => onTypeChange('cover-letter')}
      >
        Cover Letters
      </Button>
    </div>
  )
}
```

#### Document Grid Component

```typescript
// components/documents/DocumentGrid.tsx
export function DocumentGrid({
  documents,
  onSelect,
}: DocumentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onClick={() => onSelect(doc)}
        />
      ))}
    </div>
  )
}

function DocumentCard({ document }: { document: Document }) {
  const isResume = document.type === 'resume'
  const Icon = isResume ? FileText : Mail

  return (
    <Card className="hover-lift cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Icon className="h-5 w-5 text-muted-foreground" />
          {document.linkedDocumentId && (
            <Badge variant="outline">Linked</Badge>
          )}
        </div>
        <CardTitle className="mt-4">{document.title}</CardTitle>
        <CardDescription>
          Updated {formatRelativeTime(document.updated_at)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">Edit</Button>
          <Button size="sm" variant="outline">Preview</Button>
          <Button size="sm" variant="outline">Export</Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Search Implementation

**API Route**: `GET /api/v1/documents?search={query}`

```typescript
// app/api/v1/documents/route.ts
export async function GET(req: NextRequest) {
  const user = await getUser(req)
  const { searchParams } = new URL(req.url)

  const search = searchParams.get('search')
  const type = searchParams.get('type')  // 'all' | 'resume' | 'cover-letter'
  const status = searchParams.get('status')

  // Search across both resumes and cover_letters tables
  let query = db.from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (search) {
    // Search title AND content (JSONB)
    query = query.or(`title.ilike.%${search}%,data->profile->fullName.ilike.%${search}%`)
  }

  const resumes = await query

  // Repeat for cover_letters
  // Merge and sort by updated_at

  return apiSuccess({ documents, total })
}
```

#### Document Packages

**Table**: `document_packages`

```sql
CREATE TABLE document_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resume_id UUID NOT NULL REFERENCES resumes(id),
  cover_letter_id UUID NOT NULL REFERENCES cover_letters(id),
  additional_docs JSONB,  -- Future: portfolio items, etc.
  job_application_id TEXT,  -- External tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_packages_user ON document_packages(user_id);
```

**API Route**: `POST /api/v1/documents/package`

```typescript
// Create package
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  const { name, resumeId, coverLetterId } = await req.json()

  const package = await db.from('document_packages').insert({
    user_id: user.id,
    name,
    resume_id: resumeId,
    cover_letter_id: coverLetterId,
  }).select().single()

  return apiSuccess(package)
}
```

**Export Package**: `POST /api/v1/export/package`

```typescript
// Generate PDF for resume + cover letter in single file or ZIP
export async function POST(req: NextRequest) {
  const user = await getUser(req)
  const { packageId } = await req.json()

  const pkg = await getPackage(packageId, user.id)

  // Export resume PDF
  const resumePdf = await exportResumePDF(pkg.resume_id)

  // Export cover letter PDF
  const coverLetterPdf = await exportCoverLetterPDF(pkg.cover_letter_id)

  // Combine into ZIP or single PDF (user preference)
  const archive = createZip()
  archive.append(resumePdf, { name: 'resume.pdf' })
  archive.append(coverLetterPdf, { name: 'cover_letter.pdf' })

  return new Response(archive.toBuffer(), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${pkg.name}.zip"`,
    },
  })
}
```

---

## 3. Technical Architecture Context

### 3.1 Database Schema (4 New Tables)

#### Migration Files (Phase 7)

**Location**: `migrations/phase7/`

**Migration List**:

1. **020_create_cover_letters_table.sql**
2. **021_create_relationships_table.sql**
3. **022_create_packages_table.sql**
4. **023_create_cover_letter_templates.sql**

#### 020_create_cover_letters_table.sql

```sql
-- Cover letter documents table
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1),
  slug TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  schema_version TEXT NOT NULL DEFAULT 'cover-letter.v1',
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_cover_letters_user ON public.cover_letters(user_id);
CREATE INDEX idx_cover_letters_status ON public.cover_letters(user_id, status) WHERE is_deleted = false;
CREATE INDEX idx_cover_letters_updated ON public.cover_letters(user_id, updated_at DESC) WHERE is_deleted = false;
CREATE UNIQUE INDEX idx_cover_letters_slug ON public.cover_letters(user_id, slug) WHERE slug IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_on_cover_letters
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE PROCEDURE public.tg_set_updated_at();

-- RLS policies
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

-- SELECT: Read own cover letters
CREATE POLICY "cover_letters_select_own" ON public.cover_letters
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: Create own cover letters
CREATE POLICY "cover_letters_insert_own" ON public.cover_letters
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: Modify own cover letters
CREATE POLICY "cover_letters_update_own" ON public.cover_letters
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Remove own cover letters
CREATE POLICY "cover_letters_delete_own" ON public.cover_letters
  FOR DELETE USING (user_id = auth.uid());
```

**Key Constraints**:
- Same structure as `resumes` table (consistency)
- `schema_version` defaults to `'cover-letter.v1'`
- Optimistic locking via `version` column
- Soft delete via `deleted_at`
- 4 CRUD RLS policies (Phase 6 learning applied)

#### 021_create_relationships_table.sql

```sql
-- Document relationships (resume ↔ cover letter linking)
CREATE TABLE IF NOT EXISTS public.document_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('resume', 'cover_letter')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('resume', 'cover_letter')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('linked', 'package', 'variant')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_relationships_source ON public.document_relationships(source_id);
CREATE INDEX idx_relationships_target ON public.document_relationships(target_id);
CREATE INDEX idx_relationships_type ON public.document_relationships(relationship_type);

-- RLS policies
ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;

-- SELECT: Read relationships for own documents
CREATE POLICY "relationships_select_own" ON public.document_relationships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.cover_letters cl
      WHERE cl.id = target_id AND cl.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = source_id AND r.user_id = auth.uid()
    )
  );

-- INSERT: Create relationships for own documents
CREATE POLICY "relationships_insert_own" ON public.document_relationships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cover_letters cl
      WHERE cl.id = target_id AND cl.user_id = auth.uid()
    )
  );
```

**Key Design**:
- Generic source/target structure (future: support resume→resume variants)
- `relationship_type`: 'linked' (one-way sync), 'package' (bundle), 'variant' (A/B versions)
- No UPDATE/DELETE policies (append-only for audit trail; delete via CASCADE)

#### 022_create_packages_table.sql

```sql
-- Document packages (application bundles)
CREATE TABLE IF NOT EXISTS public.document_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  cover_letter_id UUID NOT NULL REFERENCES public.cover_letters(id) ON DELETE CASCADE,
  additional_docs JSONB,  -- Future: [{ type, id, order }]
  job_application_id TEXT,  -- External tracking (e.g., ATS ID)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_packages_user ON public.document_packages(user_id);
CREATE INDEX idx_packages_resume ON public.document_packages(resume_id);
CREATE INDEX idx_packages_cover_letter ON public.document_packages(cover_letter_id);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_on_packages
  BEFORE UPDATE ON public.document_packages
  FOR EACH ROW EXECUTE PROCEDURE public.tg_set_updated_at();

-- RLS policies
ALTER TABLE public.document_packages ENABLE ROW LEVEL SECURITY;

-- 4 CRUD policies
CREATE POLICY "packages_select_own" ON public.document_packages
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "packages_insert_own" ON public.document_packages
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "packages_update_own" ON public.document_packages
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "packages_delete_own" ON public.document_packages
  FOR DELETE USING (user_id = auth.uid());
```

**Key Design**:
- **Denormalized `user_id`** (Phase 6 learning: RLS performance without joins)
- `additional_docs` JSONB for future extensibility (portfolio items, references)
- Cascade delete: If resume or cover letter deleted, package is deleted

#### 023_create_cover_letter_templates.sql

```sql
-- Cover letter template catalog (read-only public data)
CREATE TABLE IF NOT EXISTS public.cover_letter_templates (
  id TEXT PRIMARY KEY,  -- Slug (e.g., 'classic-block')
  name TEXT NOT NULL,
  category TEXT,  -- 'traditional', 'modern', 'creative', 'executive'
  structure JSONB,  -- Template metadata (layout, sections)
  styles JSONB,  -- Default styles (font, spacing, colors)
  thumbnail TEXT,  -- Preview image URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 4 default templates
INSERT INTO public.cover_letter_templates (id, name, category, structure, styles) VALUES
  ('classic-block', 'Classic Block', 'traditional', '{"layout": "block"}', '{"font": "serif"}'),
  ('modern-minimal', 'Modern Minimal', 'modern', '{"layout": "minimal"}', '{"font": "sans"}'),
  ('creative-bold', 'Creative Bold', 'creative', '{"layout": "bold"}', '{"font": "sans"}'),
  ('executive-formal', 'Executive Formal', 'executive', '{"layout": "formal"}', '{"font": "serif"}')
ON CONFLICT (id) DO NOTHING;

-- RLS: Public read-only (no INSERT/UPDATE/DELETE for users)
ALTER TABLE public.cover_letter_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_public_read" ON public.cover_letter_templates
  FOR SELECT USING (true);  -- Public read
```

**Key Design**:
- **Public read-only** (RLS disabled for SELECT, enabled for mutations)
- Templates stored in DB for easy management (vs hardcoded)
- `structure` and `styles` JSONB for flexibility
- Seeded with 4 templates (Phase 7 minimum requirement)

---

### 3.2 API Endpoints

**Pattern**: Follow existing API route pattern (`withAuth`, `apiSuccess`, `apiError`)

#### Cover Letter CRUD

**Base**: `/api/v1/cover-letters`

| Method | Endpoint | Description | Runtime |
|--------|----------|-------------|---------|
| GET | `/api/v1/cover-letters` | List user's cover letters | Edge |
| POST | `/api/v1/cover-letters` | Create new cover letter | Edge |
| GET | `/api/v1/cover-letters/:id` | Get specific cover letter | Edge |
| PUT | `/api/v1/cover-letters/:id` | Update cover letter (with optimistic locking) | Edge |
| DELETE | `/api/v1/cover-letters/:id` | Soft-delete cover letter | Edge |
| POST | `/api/v1/cover-letters/:id/link` | Link to resume | Edge |

**Implementation Example** (`POST /api/v1/cover-letters`):

```typescript
// app/api/v1/cover-letters/route.ts
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { CoverLetterJsonSchema } from '@/libs/validation/cover-letter'

export const runtime = 'edge'

export const POST = withAuth(async (req: NextRequest, { user }: { user: User }) => {
  const body = await req.json()

  // Validate input
  const validation = CoverLetterJsonSchema.safeParse(body.data)
  if (!validation.success) {
    return apiError(400, 'Invalid cover letter data', validation.error)
  }

  // Create cover letter
  const coverLetter = await createCoverLetter({
    user_id: user.id,
    title: body.title || 'Untitled Cover Letter',
    data: validation.data,
    schema_version: 'cover-letter.v1',
  })

  return apiSuccess(coverLetter)
})
```

#### AI Generation

**Endpoint**: `POST /api/v1/cover-letters/generate`

```typescript
// app/api/v1/cover-letters/generate/route.ts
import { streamObject } from 'ai'
import { gemini } from '@ai-sdk/google'

export const runtime = 'edge'

export const POST = withAuth(async (req: NextRequest, { user }: { user: User }) => {
  const { jobDescription, resumeId, tone, length } = await req.json()

  // Load resume if provided
  let resumeData = null
  if (resumeId) {
    const resume = await getResume(resumeId, user.id)
    resumeData = resume.data
  }

  // Stream generation
  const stream = await streamObject({
    model: gemini('gemini-2.0-flash'),
    schema: CoverLetterJsonSchema,
    prompt: buildGenerationPrompt(jobDescription, resumeData, tone, length),
    temperature: 0.7,
  })

  return new Response(stream.toTextStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
})
```

#### Document Management

**Endpoint**: `GET /api/v1/documents`

```typescript
// app/api/v1/documents/route.ts
export const GET = withAuth(async (req: NextRequest, { user }: { user: User }) => {
  const { searchParams } = new URL(req.url)

  const type = searchParams.get('type') || 'all'  // all | resume | cover_letter
  const search = searchParams.get('search')
  const status = searchParams.get('status')

  // Fetch resumes
  let resumes = []
  if (type === 'all' || type === 'resume') {
    resumes = await listResumes({ user_id: user.id, search, status })
  }

  // Fetch cover letters
  let coverLetters = []
  if (type === 'all' || type === 'cover_letter') {
    coverLetters = await listCoverLetters({ user_id: user.id, search, status })
  }

  // Merge and sort
  const documents = [...resumes, ...coverLetters].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  return apiSuccess({ documents, total: documents.length })
})
```

#### Templates

**Endpoint**: `GET /api/v1/cover-letter-templates`

```typescript
// app/api/v1/cover-letter-templates/route.ts
export const GET = withApiHandler(async (req: NextRequest) => {
  const templates = await db.from('cover_letter_templates')
    .select('*')
    .order('name')

  return apiSuccess(templates)
})
```

---

### 3.3 Component Architecture

#### Page Components

**New Pages**:

1. **`/app/cover-letters/page.tsx`** - Cover letter list
2. **`/app/cover-letters/new/page.tsx`** - Create new cover letter
3. **`/app/cover-letters/[id]/page.tsx`** - Cover letter editor
4. **`/app/cover-letters/[id]/preview/page.tsx`** - Cover letter preview
5. **`/app/documents/page.tsx`** - Unified document dashboard
6. **`/app/documents/packages/page.tsx`** - Package management

#### Cover Letter Components

**Location**: `/components/cover-letters/`

**Component List**:

1. **CoverLetterEditor.tsx** - Main editor wrapper (tabs: Edit, Preview, Customize)
2. **RecipientForm.tsx** - "To" section form (company, hiring manager, address)
3. **SalutationSelector.tsx** - Greeting dropdown (Dear Hiring Manager, Dear [Name], etc.)
4. **RichTextEditor.tsx** - Body content editor (see 2.2)
5. **ClosingSelector.tsx** - Sign-off dropdown (Sincerely, Best regards, etc.)
6. **CoverLetterPreview.tsx** - Template-based preview
7. **CoverLetterTemplates.tsx** - Template gallery/selector
8. **ToneSelector.tsx** - AI generation tone picker
9. **JobInfoForm.tsx** - Job details form (title, reference, source)
10. **LinkedResumeSelector.tsx** - Dropdown to select resume to link

**Example: CoverLetterEditor.tsx**

```typescript
// app/cover-letters/[id]/page.tsx
'use client'

export default function CoverLetterEditorPage() {
  const params = useParams()
  const coverLetterId = params.id as string

  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'customize'>('edit')

  const {
    coverLetter,
    isLoading,
    updateCoverLetter,
    saveCoverLetter,
  } = useCoverLetterStore()

  // Load cover letter on mount
  useEffect(() => {
    loadCoverLetter(coverLetterId)
  }, [coverLetterId])

  return (
    <EditorLayout
      header={<CoverLetterEditorHeader />}
      sidebar={<CoverLetterSidebar />}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <div className="space-y-6 p-6">
            <RecipientForm />
            <SalutationSelector />
            <RichTextEditor
              value={coverLetter.body}
              onChange={(body) => updateCoverLetter({ body })}
            />
            <ClosingSelector />
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <CoverLetterPreview />
        </TabsContent>

        <TabsContent value="customize">
          <CustomizationPanel />
        </TabsContent>
      </Tabs>
    </EditorLayout>
  )
}
```

#### Rich Text Components

**Location**: `/components/rich-text/`

1. **RichTextEditor.tsx** - Main editor (ContentEditable wrapper)
2. **RichTextToolbar.tsx** - Formatting toolbar (Bold, Italic, etc.)
3. **FormatButton.tsx** - Individual format button
4. **ListControls.tsx** - Bullet/numbered list buttons
5. **LinkDialog.tsx** - Insert link modal
6. **CharacterCount.tsx** - Character/word counter
7. **RichTextRenderer.tsx** - Read-only renderer for preview/export

#### Document Management Components

**Location**: `/components/documents/`

1. **DocumentGrid.tsx** - Grid of document cards (resumes + cover letters)
2. **DocumentCard.tsx** - Individual document card
3. **DocumentFilter.tsx** - Type/status filter buttons
4. **DocumentSearch.tsx** - Search input with debounce
5. **DocumentRelations.tsx** - Show linked documents
6. **PackageCreator.tsx** - Package creation dialog
7. **BulkOperations.tsx** - Multi-select toolbar (delete, archive, export)

---

### 3.4 State Management

#### Cover Letter Store

**Location**: `/stores/coverLetterStore.ts`

**Pattern**: Zustand + zundo (same as documentStore)

```typescript
// stores/coverLetterStore.ts
import { create } from 'zustand'
import { temporal } from 'zundo'

interface CoverLetterState {
  // Current cover letter
  coverLetter: CoverLetterJson | null
  coverLetterId: string | null
  coverLetterVersion: number | null
  coverLetterTitle: string | null

  // Linked resume
  linkedResume: ResumeJson | null
  linkedResumeId: string | null

  // Loading/saving state
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null

  // Actions
  loadCoverLetter: (id: string) => Promise<void>
  updateCoverLetter: (updates: Partial<CoverLetterJson>) => void
  setTitle: (title: string) => void
  saveCoverLetter: () => Promise<void>
  linkToResume: (resumeId: string) => Promise<void>
  unlinkFromResume: () => Promise<void>

  // Computed
  hasLinkedResume: boolean
  wordCount: number
  characterCount: number
}

export const useCoverLetterStore = create<CoverLetterState>()(
  temporal(
    (set, get) => ({
      // Initial state
      coverLetter: null,
      coverLetterId: null,
      coverLetterVersion: null,
      coverLetterTitle: null,
      linkedResume: null,
      linkedResumeId: null,
      isLoading: false,
      isSaving: false,
      lastSaved: null,
      saveError: null,
      hasLinkedResume: false,
      wordCount: 0,
      characterCount: 0,

      // Actions (same pattern as documentStore)
      loadCoverLetter: async (id: string) => {
        set({ isLoading: true })
        const response = await fetch(`/api/v1/cover-letters/${id}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message)
        }

        const coverLetter = result.data
        set({
          coverLetter: coverLetter.data,
          coverLetterId: coverLetter.id,
          coverLetterVersion: coverLetter.version,
          coverLetterTitle: coverLetter.title,
          linkedResumeId: coverLetter.data.from.linkedResumeId,
          isLoading: false,
        })
      },

      updateCoverLetter: (updates: Partial<CoverLetterJson>) => {
        // Same debounced autosave pattern as documentStore
        const current = get().coverLetter
        const next = { ...current, ...updates }
        set({ coverLetter: next })

        // Trigger autosave after 2s
        debouncedSave()
      },

      linkToResume: async (resumeId: string) => {
        const id = get().coverLetterId
        const response = await fetch(`/api/v1/cover-letters/${id}/link`, {
          method: 'POST',
          body: JSON.stringify({ resumeId }),
        })

        // Reload cover letter to get synced data
        await get().loadCoverLetter(id!)
      },
    }),
    {
      limit: 50,  // 50-step undo history
      partialize: (state) => ({
        coverLetter: state.coverLetter,
      }),
    }
  )
)
```

#### Multi-Document Store

**Location**: `/stores/multiDocumentStore.ts`

```typescript
// stores/multiDocumentStore.ts
interface MultiDocumentState {
  // Documents (resumes + cover letters)
  documents: Array<Resume | CoverLetter>

  // Filters
  typeFilter: 'all' | 'resume' | 'cover_letter'
  statusFilter: 'all' | 'draft' | 'active' | 'archived'
  searchQuery: string
  sortBy: 'updated_at' | 'created_at' | 'title'
  sortOrder: 'asc' | 'desc'

  // Selection
  selectedIds: Set<string>

  // Packages
  packages: DocumentPackage[]

  // Loading state
  isLoading: boolean

  // Actions
  loadDocuments: () => Promise<void>
  setTypeFilter: (type: 'all' | 'resume' | 'cover_letter') => void
  setStatusFilter: (status: 'all' | 'draft' | 'active' | 'archived') => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: 'updated_at' | 'created_at' | 'title') => void
  selectDocument: (id: string) => void
  deselectDocument: (id: string) => void
  clearSelection: () => void
  createPackage: (resumeId: string, coverLetterId: string) => Promise<void>
  bulkDelete: (ids: string[]) => Promise<void>
  bulkArchive: (ids: string[]) => Promise<void>

  // Computed
  filteredDocuments: Array<Resume | CoverLetter>
  hasSelection: boolean
}
```

---

## 4. Constraints & Decisions

### 4.1 Fixed Technology Decisions

**From `development_decisions.md`:**

1. **Auth**: Google OAuth only (Supabase Auth)
2. **Database**: Supabase only (Postgres with RLS)
3. **UI**: Tailwind CSS + shadcn/ui only (NO other UI libraries)
4. **Icons**: Lucide React only
5. **State**: Zustand + zundo only
6. **AI**: Gemini 2.0 Flash via AI SDK (structured outputs)
7. **Testing**: Puppeteer MCP + manual playbooks (NO automated tests)
8. **Deployment**: Handled by user (NOT by agents)
9. **Package Manager**: npm only

### 4.2 Performance Budgets

**From PRD and Phase 7 spec:**

| Operation | Budget | Notes |
|-----------|--------|-------|
| Rich text keystroke → preview | ≤100ms | Faster than resume (simpler content) |
| Cover letter editor load | ≤200ms | Same as resume editor |
| AI generation (streaming) | <5s | First delta in <1s |
| Template switch | ≤200ms | Same as resume |
| PDF export (cover letter) | ≤2s | Single page, faster than resume |
| Document dashboard load | ≤500ms | List query with pagination |
| Search (cross-document) | ≤300ms | ILIKE query on indexed columns |
| Filtering | ≤100ms | Client-side after initial load |

### 4.3 Security Requirements

**XSS Prevention**:
- Client-side sanitization (before Zustand state)
- Server-side validation (Zod schema in API routes)
- ContentEditable output sanitized (allowlist tags/attributes)
- No `javascript:` or `data:` URLs in links

**RLS Policies**:
- 4 CRUD policies per user-scoped table (Phase 6 learning)
- Denormalized `user_id` in child tables (Phase 6 learning)
- All queries pass through RLS (no service role in runtime)

**Content Logging**:
- NEVER log cover letter body content
- Only log: user_id, cover_letter_id, action, timestamp, error_code

### 4.4 Testing Approach

**From `development_decisions.md` and Phase 6:**

- **Puppeteer MCP + manual playbooks** (NO automated tests)
- **Visual verification mandatory** for all UI features
- **4 playbooks required** (see Phase 7 spec):
  1. `phase_7_cover_letters.md` - CRUD operations
  2. `phase_7_editor.md` - Rich text editing
  3. `phase_7_templates.md` - Template switching/export
  4. `phase_7_ai_generation.md` - AI generation flow

**Visual Verification Workflow** (11-step):
1. Build feature with design tokens
2. Start dev server (`npm run dev`)
3. Navigate to feature page (Puppeteer MCP)
4. Capture desktop screenshot (1440px)
5. Capture mobile screenshot (375px)
6. Analyze against Visual Quality Checklist
7. Refine if needed (spacing, hierarchy, colors)
8. Re-capture screenshots
9. Document results in `visual_review.md`
10. Save screenshots to `ai_docs/progress/phase_7/screenshots/`
11. Mark phase complete

### 4.5 Migration Workflow

**From `coding_patterns.md`:**

1. **Phase Development**: Create migration SQL files ONLY
2. **User Review**: User reviews all migration files
3. **Explicit Permission**: User gives permission to apply
4. **Database Application**: Use MCP tools to apply migrations

**CRITICAL**: **NEVER** apply migrations automatically during phase development.

**Phase 7 Migration Files**:
- `migrations/phase7/020_create_cover_letters_table.sql`
- `migrations/phase7/021_create_relationships_table.sql`
- `migrations/phase7/022_create_packages_table.sql`
- `migrations/phase7/023_create_cover_letter_templates.sql`

---

## 5. Current System State

### 5.1 What Exists After Phase 6

**Completed Phases**:

- **Phase 1**: Foundation (auth, profiles, storage)
- **Phase 2**: Resume editor (CRUD, autosave, undo/redo, version history)
- **Phase 3**: Template system (3 resume templates, customization panel)
- **Phase 4**: AI import (PDF → ResumeJson via Gemini multimodal + SSE)
- **Phase 5**: Export system (PDF generation, batch export, storage with signed URLs)
- **Phase 6**: Scoring system (deterministic + LLM rubric, dashboard, suggestions)

**Key Files/Patterns Established**:

1. **Editor Pattern**: `app/editor/[id]/page.tsx`
   - Tabs: Edit, Preview, Customize, Score
   - EditorLayout wrapper
   - Zustand + zundo for state
   - Autosave (2s debounce)
   - Optimistic locking (version field)

2. **API Route Pattern**: `app/api/v1/resumes/route.ts`
   - `withAuth` middleware
   - `apiSuccess` / `apiError` responses
   - Zod validation
   - Edge runtime for light operations
   - Node runtime for PDF/file processing

3. **Template Pattern**: `libs/templates/resume/{slug}/index.tsx`
   - Pure React components
   - Schema-driven (read-only)
   - Dual-token architecture (--doc-* tokens)
   - Pagination-friendly (break-inside: avoid)

4. **Store Pattern**: `stores/documentStore.ts`
   - Zustand + temporal (zundo)
   - 50-step undo history
   - 2s debounced autosave
   - Optimistic locking
   - Error handling

5. **Export Pattern**: `app/api/v1/export/pdf/route.ts`
   - Node runtime (Puppeteer)
   - Supabase Storage with signed URLs
   - Export jobs table (tracking)
   - Cleanup cron job

### 5.2 What Can Be Reused

**Directly Reusable**:

1. **EditorLayout** - Same layout for cover letter editor
2. **CustomizationPanel** - Font, spacing, color settings (same knobs)
3. **withAuth** / **apiSuccess** / **apiError** - API utilities
4. **Export infrastructure** - PDF generation, storage, signed URLs
5. **Template registration system** - Add cover letter templates to same registry
6. **Zustand temporal pattern** - Copy documentStore → coverLetterStore
7. **i18n utilities** - Date/address formatting (same)
8. **Design system** - All CSS tokens (--app-*, --doc-*)

**Needs Adaptation**:

1. **EditorForm** - New form for cover letter sections (recipient, body, closing)
2. **Preview system** - Support RichTextRenderer for body
3. **AI generation** - New prompt for cover letters (different from resume generation)
4. **Dashboard** - Extend to show both resumes and cover letters

**New Components Needed**:

1. **RichTextEditor** - NO existing editor for rich text
2. **RichTextRenderer** - NO existing renderer for RichTextBlock[]
3. **DocumentFilter** - NO existing multi-type filter
4. **PackageCreator** - NO existing package management UI

### 5.3 Integration Points Available

**Database**:
- `auth.users` table exists (user_id references)
- `resumes` table exists (for linking)
- Helper functions exist (`tg_set_updated_at`)
- Storage bucket pattern exists (`exports` bucket)

**API**:
- `/api/v1/resumes` endpoints exist (pattern to follow)
- `/api/v1/ai/generate` exists (SSE streaming pattern)
- `/api/v1/export/pdf` exists (export pattern)
- `/api/v1/me` exists (user profile)

**UI**:
- Dashboard navigation exists (`/app/dashboard`)
- Editor layout exists (`components/editor/EditorLayout.tsx`)
- Template gallery exists (`components/customization/TemplateGallery.tsx`)
- Score panel exists (`components/score/ScorePanel.tsx`)

**Stores**:
- `documentStore` exists (pattern for coverLetterStore)
- `documentListStore` exists (pattern for multiDocumentStore)
- `exportStore` exists (pattern for package export)
- `templateStore` exists (pattern for cover letter templates)

### 5.4 Patterns to Follow

**From Phase 6 Learnings** (applied to documentation):

1. **RLS Policy Completeness**: 4 CRUD policies for ALL user-scoped tables
2. **User ID Denormalization**: Add `user_id` to child tables for RLS performance
3. **Component Composition**: Break complex features into small, focused components (<100 lines each)
4. **Domain-Specific Types**: Use explicit types (e.g., `CoverLetterJson`) vs generic objects
5. **Simple Algorithms First**: Start simple, optimize only when performance budgets missed
6. **Design Token Compliance**: Use CSS variables, no hardcoded values
7. **Empty Catch Blocks**: NEVER use empty catch (always log or re-throw)

**From API Pattern**:
```typescript
// ALWAYS use this pattern
export const POST = withAuth(async (req: NextRequest, { user }: { user: User }) => {
  // 1. Parse body
  const body = await req.json()

  // 2. Validate with Zod
  const validation = Schema.safeParse(body)
  if (!validation.success) {
    return apiError(400, 'Validation failed', validation.error)
  }

  // 3. Repository function (pure, DI)
  const result = await createEntity(supabase, user.id, validation.data)

  // 4. Return standard response
  return apiSuccess(result)
})
```

---

## 6. Critical Implementation Paths

### 6.1 Database → API → Components → State Flow

**Sequence for Cover Letter Creation**:

1. **User clicks "New Cover Letter"** → `/app/cover-letters/new/page.tsx`
2. **Select template** → `POST /api/v1/cover-letters` with template slug
3. **API creates record** → `cover_letters` table (INSERT)
4. **Redirect to editor** → `/app/cover-letters/[id]/page.tsx`
5. **Load cover letter** → `GET /api/v1/cover-letters/:id`
6. **Store in Zustand** → `useCoverLetterStore().loadCoverLetter(id)`
7. **Render editor** → `<RecipientForm />`, `<RichTextEditor />`, `<ClosingSelector />`
8. **User types** → `updateCoverLetter()` (Zustand)
9. **Debounced autosave** → `PUT /api/v1/cover-letters/:id` (2s delay)
10. **Save to database** → `cover_letters` table (UPDATE with optimistic locking)

**Critical Path Components**:

```
User Input
  ↓
RichTextEditor (ContentEditable)
  ↓
onChange → parseHtmlToBlocks → sanitize
  ↓
coverLetterStore.updateCoverLetter({ body: blocks })
  ↓
Zustand state update → zundo history push
  ↓
Debounced autosave (2s)
  ↓
PUT /api/v1/cover-letters/:id
  ↓
Zod validation (server)
  ↓
UPDATE cover_letters SET data = $1, version = version + 1
  WHERE id = $2 AND user_id = $3 AND version = $4
  ↓
Return updated cover letter
  ↓
Update Zustand state (lastSaved, version)
```

### 6.2 Rich Text: Editor → Sanitize → Store → Export

**Detailed Flow**:

1. **User types in ContentEditable**:
   ```typescript
   <div
     contentEditable
     onInput={handleChange}
     dangerouslySetInnerHTML={{ __html: blocksToHtml(value) }}
   />
   ```

2. **onChange handler**:
   ```typescript
   const handleChange = () => {
     const html = editorRef.current!.innerHTML  // Raw HTML from ContentEditable
     const sanitized = sanitizeHtml(html)        // XSS prevention (client-side)
     const blocks = parseHtmlToBlocks(sanitized) // Convert to RichTextBlock[]
     onChange(blocks)                            // Update parent state
   }
   ```

3. **Sanitize function**:
   ```typescript
   function sanitizeHtml(html: string): string {
     // 1. Strip <script>, <iframe>, <object>, <embed>, <style>
     // 2. Remove event handlers (onclick, onerror, etc.)
     // 3. Whitelist tags: p, strong, em, u, ul, ol, li, br, a
     // 4. Whitelist attributes: href (links only), validate no javascript:
     // 5. Return clean HTML
   }
   ```

4. **Parse to blocks**:
   ```typescript
   function parseHtmlToBlocks(html: string): RichTextBlock[] {
     const parser = new DOMParser()
     const doc = parser.parseFromString(html, 'text/html')
     const blocks: RichTextBlock[] = []

     doc.body.childNodes.forEach(node => {
       if (node.nodeName === 'P') {
         blocks.push({
           type: 'paragraph',
           content: parseTextRuns(node),
         })
       } else if (node.nodeName === 'UL') {
         blocks.push({
           type: 'bullet_list',
           content: Array.from(node.childNodes).map(li => parseTextRuns(li)),
         })
       }
       // ... handle OL, etc.
     })

     return blocks
   }
   ```

5. **Store in Zustand**:
   ```typescript
   updateCoverLetter({ body: blocks })
   ```

6. **Save to database** (after 2s debounce):
   ```typescript
   PUT /api/v1/cover-letters/:id
   Body: { data: { ...coverLetter, body: blocks }, version: 3 }
   ```

7. **Server validation** (Zod):
   ```typescript
   const CoverLetterBodySchema = z.array(RichTextBlockSchema)
   const validation = CoverLetterBodySchema.safeParse(body.data.body)
   if (!validation.success) {
     return apiError(400, 'Invalid body content', validation.error)
   }
   ```

8. **Export to PDF**:
   ```typescript
   // In template renderer
   <RichTextRenderer blocks={coverLetter.body} />

   // Puppeteer captures rendered HTML → PDF
   const pdf = await page.pdf({ format: 'Letter' })
   ```

**Key XSS Prevention Points**:
- ✅ Client-side sanitization (before state)
- ✅ Server-side validation (Zod schema)
- ✅ Allowlist tags/attributes only
- ✅ No javascript: or data: URLs
- ✅ ContentEditable isolation (not eval'd)

### 6.3 Linking: Select Resume → Sync Data → Update Cover Letter

**User Flow**:

1. **User opens cover letter editor** → `/app/cover-letters/[id]/page.tsx`
2. **Click "Link to Resume" button** → Opens `<LinkedResumeSelector>` modal
3. **Select resume from dropdown** → Shows user's resumes
4. **Click "Link"** → API call

**API Flow**:

```typescript
// POST /api/v1/cover-letters/:id/link
async function linkToResume(coverLetterId: string, resumeId: string, userId: string) {
  // 1. Verify ownership
  const coverLetter = await getCoverLetter(coverLetterId, userId)
  const resume = await getResume(resumeId, userId)

  if (!coverLetter || !resume) {
    throw new Error('Document not found or unauthorized')
  }

  // 2. Create relationship
  await db.from('document_relationships').insert({
    source_id: resumeId,
    source_type: 'resume',
    target_id: coverLetterId,
    target_type: 'cover_letter',
    relationship_type: 'linked',
    metadata: { synced_at: new Date().toISOString() },
  })

  // 3. Sync data (one-way: resume → cover letter)
  const syncedData = {
    ...coverLetter.data,
    from: {
      ...coverLetter.data.from,
      fullName: resume.data.profile.fullName,
      email: resume.data.profile.email,
      phone: resume.data.profile.phone,
      address: resume.data.profile.location,
      linkedResumeId: resumeId,
    },
  }

  // 4. Update cover letter
  await updateCoverLetter(coverLetterId, userId, {
    data: syncedData,
    version: coverLetter.version,  // Optimistic locking
  })

  return { linked: true, resume, coverLetter }
}
```

**UI Update**:

```typescript
// In LinkedResumeSelector component
const handleLink = async (resumeId: string) => {
  setIsLinking(true)

  try {
    await fetch(`/api/v1/cover-letters/${coverLetterId}/link`, {
      method: 'POST',
      body: JSON.stringify({ resumeId }),
    })

    // Reload cover letter to show synced data
    await loadCoverLetter(coverLetterId)

    toast({
      title: 'Linked',
      description: 'Contact info synced from resume',
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to link resume',
    })
  } finally {
    setIsLinking(false)
  }
}
```

**Sync Indicator in UI**:

```typescript
// In RecipientForm component
{linkedResumeId && (
  <Alert>
    <CheckCircle className="h-4 w-4" />
    <AlertTitle>Linked to Resume</AlertTitle>
    <AlertDescription>
      Contact info syncs from your resume.
      <Button variant="link" onClick={handleUnlink}>Unlink</Button>
    </AlertDescription>
  </Alert>
)}
```

**Cascade Rules** (when resume deleted):

```sql
-- In 021_create_relationships_table.sql
-- Add trigger to handle resume deletion
CREATE OR REPLACE FUNCTION handle_resume_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update linked cover letters to set linkedResumeId to null
  UPDATE cover_letters
  SET data = jsonb_set(
    data,
    '{from,linkedResumeId}',
    'null'::jsonb
  )
  WHERE data->'from'->>'linkedResumeId' = OLD.id::text;

  -- Delete relationship records
  DELETE FROM document_relationships
  WHERE source_id = OLD.id AND source_type = 'resume';

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_resume_delete
  BEFORE DELETE ON resumes
  FOR EACH ROW EXECUTE FUNCTION handle_resume_deletion();
```

### 6.4 AI: Job Description → Generate → Stream → Save

**User Flow**:

1. **User clicks "Generate with AI"** → Opens `<GenerationPanel>`
2. **Paste job description** → Textarea
3. **Select resume to reference** → Optional dropdown
4. **Select tone + length** → Dropdowns (formal/friendly/enthusiastic, concise/standard/detailed)
5. **Click "Generate"** → API call with SSE streaming

**API Flow** (Edge runtime):

```typescript
// POST /api/v1/cover-letters/generate
export const POST = withAuth(async (req: NextRequest, { user }: { user: User }) => {
  const { jobDescription, resumeId, tone, length } = await req.json()

  // Validate inputs
  if (!jobDescription || jobDescription.length < 50) {
    return apiError(400, 'Job description too short (min 50 chars)')
  }

  // Load resume if provided
  let resumeData = null
  if (resumeId) {
    const resume = await getResume(resumeId, user.id)
    resumeData = resume.data
  }

  // Build prompt
  const prompt = buildCoverLetterPrompt({
    jobDescription,
    resumeData,
    tone,
    length,
    candidateName: user.email,  // Fallback if no resume
  })

  // Stream generation
  const stream = await streamObject({
    model: gemini('gemini-2.0-flash'),
    schema: CoverLetterJsonSchema,
    prompt,
    temperature: 0.7,  // Slightly creative for writing
  })

  // Return SSE stream
  return new Response(stream.toTextStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
})
```

**Client Streaming**:

```typescript
// In GenerationPanel component
const handleGenerate = async () => {
  setIsGenerating(true)

  const response = await fetch('/api/v1/cover-letters/generate', {
    method: 'POST',
    body: JSON.stringify({
      jobDescription,
      resumeId,
      tone,
      length,
    }),
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Parse SSE chunks (format: data: {...}\n\n)
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''  // Keep incomplete chunk

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))

        // Update preview in real-time
        updateCoverLetterStore(data)
      }
    }
  }

  setIsGenerating(false)
  toast({
    title: 'Generated',
    description: 'Review and edit the cover letter',
  })
}
```

**Prompt Structure**:

```typescript
function buildCoverLetterPrompt({
  jobDescription,
  resumeData,
  tone,
  length,
  candidateName,
}: PromptInput): string {
  const toneInstructions = {
    formal: 'Use formal, traditional business language. Avoid contractions.',
    friendly: 'Use warm, personable language while remaining professional.',
    enthusiastic: 'Use energetic, passionate language showing genuine interest.',
  }

  const lengthInstructions = {
    concise: '3 short paragraphs (200-250 words total)',
    standard: '4-5 medium paragraphs (300-400 words total)',
    detailed: '6+ paragraphs with detailed examples (450-600 words total)',
  }

  return `
You are an expert cover letter writer. Generate a professional cover letter.

JOB DESCRIPTION:
${jobDescription}

${resumeData ? `RESUME DATA (use this to personalize):
${JSON.stringify(resumeData, null, 2)}` : `CANDIDATE: ${candidateName}`}

TONE: ${toneInstructions[tone]}
LENGTH: ${lengthInstructions[length]}

OUTPUT STRUCTURE:
1. Opening paragraph: Hook + specific job title + why you're interested
2. Body paragraphs (2-4): Match resume experience to job requirements
   - Use specific examples from resume
   - Quantify achievements when possible
   - Connect each example to a job requirement
3. Closing paragraph: Enthusiasm + call to action

RULES:
- NO FABRICATION: Only use information from the resume
- Be specific: "Led team of 10 engineers" NOT "strong leadership"
- Show personality while maintaining professionalism
- Address company name if mentioned in job description
- Use action verbs: led, built, achieved, designed, etc.
- Avoid clichés: passionate, team player, hard worker (without evidence)
- Each paragraph should tell a story connecting resume to job

Generate the cover letter as CoverLetterJson with:
- Appropriate salutation (extract hiring manager name if in JD)
- Rich text body (RichTextBlock[] format)
- Professional closing
`
}
```

**Performance Expectations**:

- **First delta**: <1s (streaming begins immediately)
- **Full generation**: <5s (Phase 7 spec)
- **Preview updates**: Real-time (SSE chunks update Zustand every ~200ms)

---

## 7. Edge Cases & Validation

### 7.1 User Scenarios (All Need Handling)

**Cover letter without linked resume**:
- **Scenario**: User creates standalone cover letter
- **Handling**: All fields editable, no sync warnings
- **Validation**: Require manual entry of `from` fields
- **Test**: `standalone_cover_letter` playbook item

**Resume deletion with linked cover letter**:
- **Scenario**: User deletes resume, cover letter links to it
- **Handling**: Trigger sets `linkedResumeId` to null, delete relationship
- **Validation**: Cover letter still accessible, shows "Unlinked" badge
- **Test**: `cascade_handling` playbook item

**Rich text paste from external sources**:
- **Scenario**: User pastes from Word/Google Docs (complex HTML)
- **Handling**: Sanitizer strips all non-allowed tags/attributes
- **Validation**: Only preserve text + allowed formatting (bold, italic, underline, lists)
- **Test**: `paste_cleanup` playbook item

**Very long cover letter**:
- **Scenario**: User writes 1000+ words (excessive)
- **Handling**: Character counter shows warning at 800 words, error at 1000+
- **Validation**: Server accepts up to 2000 words (hard limit)
- **Test**: `length_limits` playbook item

**Multiple cover letters per job**:
- **Scenario**: User creates 3 versions for same job
- **Handling**: Support via `jobInfo.reference` field (same ref = variants)
- **Validation**: Dashboard shows grouped by job reference
- **Test**: `variant_management` playbook item

**Package with missing documents**:
- **Scenario**: User deletes resume in package
- **Handling**: Package DELETE cascades (resume FK with ON DELETE CASCADE)
- **Validation**: User warned before deleting: "This resume is in 2 packages"
- **Test**: `incomplete_package` playbook item

**Circular document relationships**:
- **Scenario**: Resume A links to cover letter B, B links to resume A
- **Handling**: PREVENTED - only one-way linking allowed (resume → cover letter)
- **Validation**: Server rejects if relationship already exists in reverse
- **Test**: `circular_prevention` playbook item

**Rich text XSS attempts**:
- **Scenario**: User pastes `<script>alert('XSS')</script>` or `<img onerror="alert('XSS')">`
- **Handling**: Sanitizer strips all dangerous tags/attributes
- **Validation**: Server validates with Zod (rejects if dangerous tags present)
- **Test**: `xss_prevention` playbook item

### 7.2 Technical Considerations (Validation Requirements)

**Rich text sanitization**:
- **Client**: Sanitize on every `onInput` event
- **Server**: Validate RichTextBlock[] structure via Zod
- **Test**: Unit test with malicious HTML payloads

**Format preservation**:
- **Storage**: RichTextBlock[] in JSONB (structure preserved)
- **Rendering**: RichTextRenderer converts to HTML for display
- **Export**: Same renderer for PDF (Puppeteer captures HTML)
- **Test**: Round-trip test (edit → save → reload → export → visual diff)

**Document sync performance**:
- **Query**: Single JOIN on `document_relationships` table
- **Index**: `idx_relationships_target` on `target_id`
- **Budget**: <100ms for sync operation
- **Test**: Performance test with 100 linked documents

**Relationship integrity**:
- **Constraint**: FK on `source_id` and `target_id`
- **Cascade**: ON DELETE CASCADE for relationships table
- **Validation**: Server checks ownership before creating relationship
- **Test**: Attempt to link documents from different users (should fail)

**Search across types**:
- **Implementation**: UNION query (resumes + cover_letters)
- **Index**: `idx_cover_letters_title_trgm` for fuzzy search
- **Budget**: <300ms for search with 1000 documents
- **Test**: Search for partial match across both types

**Export with rich text**:
- **Rendering**: RichTextRenderer → HTML → Puppeteer → PDF
- **Validation**: Visual diff between preview and PDF
- **Test**: Export cover letter with all formatting types (bold, italic, lists)

**Template switching**:
- **Behavior**: Template change preserves `data` (only updates `settings.template`)
- **Validation**: Body content unchanged after switch
- **Test**: Switch templates, verify body content identical

**Concurrent editing**:
- **Conflict**: Two tabs editing same cover letter
- **Handling**: Optimistic locking (version field)
- **Resolution**: Last write wins (with version check), loser gets 409 Conflict
- **Test**: Open 2 tabs, edit in both, save both (second should fail)

---

## 8. Success Metrics

### 8.1 Feature Completeness Checklist

**Cover Letter CRUD**:
- [ ] Create cover letter (from template or blank)
- [ ] Load cover letter in editor
- [ ] Edit all sections (recipient, salutation, body, closing)
- [ ] Autosave (2s debounce)
- [ ] Undo/redo (Zustand temporal)
- [ ] Version history (same as resumes)
- [ ] Delete cover letter (soft delete)

**Rich Text Editor**:
- [ ] Bold formatting works
- [ ] Italic formatting works
- [ ] Underline formatting works
- [ ] Bullet lists work
- [ ] Numbered lists work
- [ ] Keyboard shortcuts work (Cmd+B, Cmd+I, Cmd+U)
- [ ] Character/word count updates in real-time
- [ ] Paste from external sources (sanitized)
- [ ] XSS prevention active (dangerous tags stripped)

**Cover Letter Templates**:
- [ ] 4 templates created (Classic, Modern, Creative, Executive)
- [ ] Template gallery shows all templates
- [ ] Template preview before selection
- [ ] Template switching preserves content
- [ ] Customization works (font, spacing, colors)
- [ ] Export to PDF matches preview

**AI Generation**:
- [ ] Generate from job description only
- [ ] Generate from job description + linked resume
- [ ] Tone customization works (formal, friendly, enthusiastic)
- [ ] Length customization works (concise, standard, detailed)
- [ ] Streaming works (real-time preview updates)
- [ ] Generated content references resume data (if linked)
- [ ] No fabrication (only uses resume data)

**Document Linking**:
- [ ] Link cover letter to resume
- [ ] Contact info syncs from resume
- [ ] Linked status visible in UI
- [ ] Unlink works
- [ ] Manual sync button works
- [ ] Resume deletion handled (cover letter stays, link removed)

**Multi-Document Management**:
- [ ] Dashboard shows both resumes and cover letters
- [ ] Type filter works (All, Resumes, Cover Letters)
- [ ] Status filter works (Draft, Active, Archived)
- [ ] Search works across both types
- [ ] Sort works (Updated, Created, Title)
- [ ] Linked status indicator visible
- [ ] Document packages can be created
- [ ] Package export works (ZIP with resume + cover letter PDFs)

### 8.2 Performance Targets

**Editor Performance**:
- [ ] Rich text keystroke → preview: ≤100ms (p95)
- [ ] Cover letter load: ≤200ms
- [ ] Template switch: ≤200ms
- [ ] Undo/redo: <50ms

**AI Performance**:
- [ ] Generation first delta: <1s
- [ ] Generation complete: <5s
- [ ] Streaming smooth (no jitter)

**Export Performance**:
- [ ] Cover letter PDF: ≤2s
- [ ] Package export (resume + cover letter): ≤4s

**Dashboard Performance**:
- [ ] Document list load: ≤500ms
- [ ] Search: ≤300ms
- [ ] Filter: ≤100ms

### 8.3 Security Validation

**XSS Prevention**:
- [ ] Client sanitization active
- [ ] Server validation active (Zod)
- [ ] No dangerous tags in stored data
- [ ] No dangerous tags in rendered output
- [ ] Links validated (no javascript: protocol)

**RLS Enforcement**:
- [ ] 4 CRUD policies on `cover_letters` table
- [ ] 2 policies on `document_relationships` table
- [ ] 4 CRUD policies on `document_packages` table
- [ ] User can only access own documents
- [ ] Cross-user linking prevented

**Content Security**:
- [ ] Cover letter body NEVER logged
- [ ] Only metadata logged (user_id, cover_letter_id, action)
- [ ] Error messages don't leak content

### 8.4 Testing Requirements

**4 Playbooks**:
- [ ] `phase_7_cover_letters.md` - CRUD operations (~20 items)
- [ ] `phase_7_editor.md` - Rich text editing (~15 items)
- [ ] `phase_7_templates.md` - Template system (~10 items)
- [ ] `phase_7_ai_generation.md` - AI generation (~12 items)

**Visual Verification**:
- [ ] Desktop screenshots (1440px) for all new pages
- [ ] Mobile screenshots (375px) for all new pages
- [ ] All screenshots pass Visual Quality Checklist
- [ ] Screenshots saved to `ai_docs/progress/phase_7/screenshots/`
- [ ] `visual_review.md` completed

**Documentation**:
- [ ] 4 migration files created (NOT applied)
- [ ] All files follow naming convention
- [ ] RLS policies complete (4 per user-scoped table)
- [ ] Phase summary document created

### 8.5 Phase Gate Checklist

**Before marking Phase 7 complete**:

- [ ] All feature completeness items checked
- [ ] All performance targets met (measured)
- [ ] All security validation items checked
- [ ] All 4 playbooks executed and passing
- [ ] Visual verification completed for all UI
- [ ] Screenshots saved and documented
- [ ] No critical issues remaining
- [ ] Build passing (`npm run build`)
- [ ] No TypeScript errors
- [ ] User approval received

**Phase 7 Exit Criteria** (from phase document):
1. ✅ Cover letter CRUD working
2. ✅ Rich text editor functional
3. ✅ Templates rendering correctly
4. ✅ AI generation operational
5. ✅ Document linking working
6. ✅ Multi-document dashboard complete
7. ✅ Package management functional
8. ✅ Export preserving formatting
9. ✅ Performance targets met
10. ✅ Security validated

---

## Summary

This context document provides a complete, unambiguous specification for Phase 7 implementation. All questions from the critical questions list have been answered with exact specifications, constraints, and patterns.

**Key Takeaways**:

1. **6 major feature areas** - Cover letter model, rich text editor, templates, AI generation, linking, multi-document management
2. **4 new database tables** - `cover_letters`, `document_relationships`, `document_packages`, `cover_letter_templates`
3. **XSS prevention critical** - Two-layer defense (client sanitization + server validation)
4. **Rich text structure** - RichTextBlock[] with TextRun[] (NOT plain HTML)
5. **One-way linking** - Resume → Cover Letter (manual sync only)
6. **Reuse existing patterns** - Editor layout, API routes, Zustand stores, export system
7. **4 playbooks required** - CRUD, editor, templates, AI generation
8. **Visual verification mandatory** - Desktop + mobile screenshots for all UI

**Phase 7 Complexity**: HIGH (rich text editing, XSS prevention, multi-document management)

**Estimated Effort**: 40-50 hours (systems research + planning + implementation + testing)

**Next Steps**: Systems researcher agent will analyze technical approaches for rich text editing and document linking, planner-architect will design the implementation plan, and implementer agents will build following this definitive context.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-03
**Total Word Count**: ~7,800 words
**Status**: COMPLETE & READY FOR HANDOFF
