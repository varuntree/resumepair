# Phase 7: Cover Letters & Extended Documents - Implementation Plan

**Phase**: 7 - Cover Letters & Extended Documents
**Planner**: Planner-Architect Agent
**Date**: 2025-10-03
**Status**: READY FOR IMPLEMENTATION
**Estimated Effort**: 45-58 hours

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Reuse Mapping (CRITICAL)](#2-reuse-mapping-critical)
3. [Centralization Plan](#3-centralization-plan)
4. [Implementation Plan - 6 Major Areas](#4-implementation-plan---6-major-areas)
5. [File Structure Overview](#5-file-structure-overview)
6. [Database Schema (SQL)](#6-database-schema-sql)
7. [API Contract Summary](#7-api-contract-summary)
8. [Implementation Order](#8-implementation-order)
9. [Research Integration Summary](#9-research-integration-summary)
10. [Risk Assessment](#10-risk-assessment)

---

## 1. Executive Summary

### Phase 7 Scope Overview

Phase 7 implements **cover letters** as a first-class document type alongside resumes, plus introduces **multi-document management** capabilities. The implementation follows a **reuse-first, centralize-shared** strategy to minimize duplication while maintaining type safety.

**Core Features**:
1. Cover letter CRUD (mirrors resume CRUD patterns)
2. Rich text editor for cover letter body (ContentEditable + Custom Logic)
3. Document linking system (resume ↔ cover letter with manual sync)
4. Document packages (resume + cover letter bundles for job applications)
5. Unified document dashboard (search/filter both types)
6. Cross-document operations (bulk actions, export bundles)

**Key Architectural Decision**: Cover letters are **NOT a variation of resumes**. They are a separate entity with distinct schema (`CoverLetterJson`), distinct tables, but **shared infrastructure** (repositories, state management factories, UI components).

---

### Reuse Strategy

**What We Copy → Adapt**:
- Database pattern: `resumes` table → `cover_letters` table (same structure, different `data` JSONB)
- API routes: `/api/v1/resumes/*` → `/api/v1/cover-letters/*` (identical patterns)
- State: `documentStore.ts` → extract factory → create `resumeStore.ts` + `coverLetterStore.ts`
- Editor page: `/app/editor/[id]/page.tsx` → `/app/cover-letters/[id]/page.tsx` (same layout, different sections)
- Templates: `/libs/templates/resume/*` → `/libs/templates/cover-letter/*` (new renderers)

**What We Build New**:
- `CoverLetterJson` schema (distinct from `ResumeJson`)
- Rich text editor components (7 new components)
- Document linking repository + API
- Unified dashboard components (show both types)
- Package management system

---

### Centralization Strategy

**NEW Shared Utilities** (used by both resumes and cover letters):

1. **`libs/repositories/documents.ts`** - Generic CRUD for all document types
2. **`stores/createDocumentStore.ts`** - Factory function for Zustand stores
3. **`components/documents/`** - Unified dashboard components (grid, filter, search)
4. **`libs/repositories/documentLinker.ts`** - Relationship management
5. **`libs/repositories/packages.ts`** - Package CRUD
6. **`libs/rich-text/`** - Sanitizer, serializer (shared utilities)

**Rationale**: Phase 7 is the first time ResumePair has multiple document types. Centralizing shared logic now prevents duplication in future phases (e.g., Phase 8 might add portfolios or recommendation letters).

---

### Estimated Complexity

**Total**: 45-58 hours

**Breakdown by Area**:
- Database Schema & Migrations: 3-4 hours
- Centralized Utilities: 2-3 hours
- Rich Text Editor System: 8-10 hours
- Cover Letter CRUD System: 6-8 hours
- Cover Letter Templates: 5-6 hours
- Document Linking System: 7-9 hours
- Multi-Document Dashboard: 6-8 hours
- AI Generation (Cover Letters): 4-5 hours
- Export Extension (PDF bundles): 2-3 hours
- Testing Playbooks: 1-2 hours

**Critical Path**: Database → Centralized Utilities → Rich Text → CRUD → Templates

**Parallel Work Opportunities**:
- Rich Text Editor (independent, no DB dependencies)
- Templates (depends on CRUD, independent from linking)
- AI Generation (depends on CRUD, independent from linking)

---

## 2. Reuse Mapping (CRITICAL)

### Database Reuse

**Pattern**: Copy `resumes` table structure, adapt for `cover_letters`

**Resume Table (Existing)**:
```sql
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL CHECK (length(title) >= 1),
  schema_version TEXT NOT NULL DEFAULT 'resume.v1',
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Cover Letter Table (NEW)**:
```sql
CREATE TABLE cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),  -- DENORMALIZED (RLS performance)
  linked_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,  -- NEW: FK for primary relationship
  title TEXT NOT NULL CHECK (length(title) >= 1),
  schema_version TEXT NOT NULL DEFAULT 'cover_letter.v1',  -- Different schema
  data JSONB NOT NULL,  -- CoverLetterJson (not ResumeJson)
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Differences**:
- `linked_resume_id` column (NEW): FK to resumes table with `ON DELETE SET NULL`
- `schema_version`: `'cover_letter.v1'` (not `'resume.v1'`)
- `data`: Contains `CoverLetterJson` (different structure)

**Reuse**:
- Same indexes pattern (user_id, status, updated_at)
- Same RLS policies (4 CRUD policies)
- Same triggers (`tg_set_updated_at`)
- Same soft delete pattern (`is_deleted`, `deleted_at`)

---

### API Routes Reuse

**Pattern**: Copy `/api/v1/resumes/*` → `/api/v1/cover-letters/*`, adapt repository calls

**Resume Routes (Existing)**:
```
GET    /api/v1/resumes          - List (withAuth, Edge)
POST   /api/v1/resumes          - Create (withAuth, Edge)
GET    /api/v1/resumes/:id      - Read (withAuth, Edge)
PUT    /api/v1/resumes/:id      - Update (withAuth, Edge)
DELETE /api/v1/resumes/:id      - Delete (withAuth, Edge)
POST   /api/v1/resumes/:id/duplicate - Duplicate (withAuth, Edge)
```

**Cover Letter Routes (NEW)**:
```
GET    /api/v1/cover-letters          - List (withAuth, Edge)
POST   /api/v1/cover-letters          - Create (withAuth, Edge)
GET    /api/v1/cover-letters/:id      - Read (withAuth, Edge)
PUT    /api/v1/cover-letters/:id      - Update (withAuth, Edge)
DELETE /api/v1/cover-letters/:id      - Delete (withAuth, Edge)
POST   /api/v1/cover-letters/:id/link - Link to resume (NEW, withAuth, Edge)
POST   /api/v1/cover-letters/:id/sync - Sync from resume (NEW, withAuth, Edge)
```

**Reuse**:
- Identical `withAuth` wrapper usage
- Identical validation pattern (Zod schemas)
- Identical response format (`apiSuccess`, `apiError`)
- Identical repository pattern (pure functions with DI)

**NEW Endpoints**:
- `/link` - Create resume ↔ cover letter relationship
- `/sync` - Manual one-way sync (contact info from resume)

---

### State Management Reuse

**Pattern**: Extract factory from `documentStore.ts` → create type-specific stores

**Existing (documentStore.ts)**:
```typescript
// Monolithic store for resumes only
export const useDocumentStore = create<DocumentState>()(
  temporal((set, get) => ({
    document: null,  // ResumeJson
    loadDocument: async (resumeId) => { /* ... */ },
    updateDocument: (updates) => { /* ... */ },
    saveDocument: async () => { /* ... */ }
  }), { limit: 50 })
)
```

**NEW Factory (stores/createDocumentStore.ts)**:
```typescript
// Generic factory for any document type
export function createDocumentStore<T extends DocumentJson>(
  apiEndpoint: string,  // '/api/v1/resumes' or '/api/v1/cover-letters'
  schemaValidator: ZodSchema<T>
) {
  return create<DocumentState<T>>()(
    temporal((set, get) => ({
      document: null,
      loadDocument: async (id) => {
        const response = await fetch(`${apiEndpoint}/${id}`)
        // ... identical logic
      },
      updateDocument: (updates) => { /* ... identical logic ... */ },
      saveDocument: async () => { /* ... identical logic ... */ }
    }), { limit: 50 })
  )
}
```

**NEW Resume Store (stores/resumeStore.ts)**:
```typescript
import { createDocumentStore } from './createDocumentStore'
import { ResumeJsonSchema } from '@/libs/validation/resume'

export const useResumeStore = createDocumentStore<ResumeJson>(
  '/api/v1/resumes',
  ResumeJsonSchema
)

export const useResumeTemporalStore = () => useResumeStore.temporal.getState()
```

**NEW Cover Letter Store (stores/coverLetterStore.ts)**:
```typescript
import { createDocumentStore } from './createDocumentStore'
import { CoverLetterJsonSchema } from '@/libs/validation/coverLetter'

export const useCoverLetterStore = createDocumentStore<CoverLetterJson>(
  '/api/v1/cover-letters',
  CoverLetterJsonSchema
)

export const useCoverLetterTemporalStore = () => useCoverLetterStore.temporal.getState()
```

**Reuse**:
- Entire state logic (load, update, save, autosave, dirty tracking)
- Temporal middleware (undo/redo)
- Optimistic locking logic
- Error handling

**Migration Strategy**:
1. Create factory first (extract from existing `documentStore.ts`)
2. Create `resumeStore.ts` using factory
3. Deprecate old `useDocumentStore` (add comment: "Use useResumeStore instead")
4. Update existing components to use `useResumeStore`
5. Create `coverLetterStore.ts` using same factory

---

### Export Reuse

**Pattern**: Extend `/api/v1/export/pdf/route.ts` to handle `documentType` parameter

**Existing (Resumes Only)**:
```typescript
// app/api/v1/export/pdf/route.ts
export const POST = withAuth(async (req, user) => {
  const { resumeId } = await req.json()
  const resume = await getResume(supabase, resumeId)
  const pdf = await generateResumePDF(resume)
  // ... upload to storage, return signed URL
})
```

**NEW (Multi-Document)**:
```typescript
// app/api/v1/export/pdf/route.ts
export const POST = withAuth(async (req, user) => {
  const { documentId, documentType } = await req.json()
  // documentType: 'resume' | 'cover_letter' | 'package'

  if (documentType === 'resume') {
    const resume = await getResume(supabase, documentId)
    const pdf = await generateResumePDF(resume)
  } else if (documentType === 'cover_letter') {
    const coverLetter = await getCoverLetter(supabase, documentId)
    const pdf = await generateCoverLetterPDF(coverLetter)
  } else if (documentType === 'package') {
    const pkg = await getPackageDocuments(supabase, documentId, user.id)
    const zip = await generatePackageZIP(pkg)
    // Return ZIP with resume.pdf + cover_letter.pdf
  }

  // ... upload to storage, return signed URL
})
```

**Reuse**:
- Puppeteer setup logic
- Storage upload logic
- Signed URL generation
- Job tracking (if applicable)

**NEW**:
- `generateCoverLetterPDF()` renderer
- `generatePackageZIP()` for multi-file exports
- Package validation logic

---

### AI Generation Reuse

**Pattern**: Copy `/api/v1/ai/generate/route.ts` → `/api/v1/ai/generate-cover-letter/route.ts`

**Existing (Resume Generation)**:
```typescript
// app/api/v1/ai/generate/route.ts
export const POST = withAuth(async (req, user) => {
  const { prompt, jobDescription, format } = await req.json()

  const stream = await streamObject({
    model: gemini2FlashExp,
    schema: ResumeJsonSchema,
    prompt: generateResumePrompt(prompt, jobDescription),
    onFinish: ({ object }) => {
      // Save to database
    }
  })

  return new StreamingTextResponse(stream)
})
```

**NEW (Cover Letter Generation)**:
```typescript
// app/api/v1/ai/generate-cover-letter/route.ts
export const POST = withAuth(async (req, user) => {
  const { resumeId, jobDescription, tone } = await req.json()
  // tone: 'professional' | 'conversational' | 'formal'

  // Fetch resume for context
  const resume = await getResume(supabase, resumeId)

  const stream = await streamObject({
    model: gemini2FlashExp,
    schema: CoverLetterJsonSchema,
    prompt: generateCoverLetterPrompt(resume.data, jobDescription, tone),
    onFinish: ({ object }) => {
      // Auto-link to resume
    }
  })

  return new StreamingTextResponse(stream)
})
```

**Reuse**:
- SSE streaming infrastructure
- AI SDK `streamObject` pattern
- Zod schema validation
- Error handling

**NEW**:
- Cover letter prompt template (in `libs/ai/prompts/coverLetter.ts`)
- Resume context injection
- Auto-linking logic

---

### Templates Reuse

**Pattern**: Copy template structure, create new cover letter renderers

**Resume Template (Existing)**:
```
libs/templates/resume/
├── classic-ats/
│   ├── index.tsx          - Main renderer
│   ├── ProfileSection.tsx
│   ├── WorkSection.tsx
│   └── metadata.ts        - Template config
├── modern-minimal/
└── creative-bold/
```

**Cover Letter Templates (NEW)**:
```
libs/templates/cover-letter/
├── classic-block/
│   ├── index.tsx          - Main renderer (NEW)
│   ├── HeaderSection.tsx  - From/To/Date (NEW)
│   ├── BodySection.tsx    - RichTextBlock renderer (NEW)
│   └── metadata.ts        - Template config
├── modern-minimal/
├── creative-bold/
└── executive-formal/
```

**Reuse**:
- Dual-token architecture (`--app-*` vs `--doc-*`)
- Template registration pattern
- Print pagination handling (`break-inside: avoid`)
- Template switcher UI

**NEW**:
- `RichTextBlock[]` renderer (convert to styled HTML)
- Recipient address formatting
- Letter-specific layout (letterhead, signature)

---

## 3. Centralization Plan

### A. Generic Document Repository

**File**: `libs/repositories/documents.ts`

**Purpose**: Provide type-safe CRUD for all document types (resumes, cover letters, future types)

**Functions**:
```typescript
// Generic list function
export async function listDocuments<T extends DocumentJson>(
  supabase: SupabaseClient,
  userId: string,
  table: 'resumes' | 'cover_letters',
  options?: ListParams
): Promise<Document<T>[]>

// Generic get function
export async function getDocument<T extends DocumentJson>(
  supabase: SupabaseClient,
  table: 'resumes' | 'cover_letters',
  id: string
): Promise<Document<T>>

// Generic create function
export async function createDocument<T extends DocumentJson>(
  supabase: SupabaseClient,
  userId: string,
  table: 'resumes' | 'cover_letters',
  title: string,
  data: T,
  schemaVersion: string
): Promise<Document<T>>

// Generic update function
export async function updateDocument<T extends DocumentJson>(
  supabase: SupabaseClient,
  table: 'resumes' | 'cover_letters',
  id: string,
  updates: Partial<{ title: string; data: T; status: string }>,
  currentVersion: number
): Promise<Document<T>>

// Generic delete function
export async function deleteDocument(
  supabase: SupabaseClient,
  table: 'resumes' | 'cover_letters',
  id: string
): Promise<void>

// Cross-document search (UNION query)
export async function searchAllDocuments(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  filters?: {
    type?: 'resume' | 'cover_letter' | 'all'
    status?: string
    limit?: number
  }
): Promise<UnifiedDocument[]>
```

**Type Definitions**:
```typescript
interface Document<T extends DocumentJson> {
  id: string
  user_id: string
  title: string
  schema_version: string
  data: T
  version: number
  status: 'draft' | 'active' | 'archived'
  is_deleted: boolean
  created_at: string
  updated_at: string
}

type DocumentJson = ResumeJson | CoverLetterJson

interface UnifiedDocument {
  id: string
  type: 'resume' | 'cover_letter'
  title: string
  status: string
  updated_at: string
  preview?: string  // First 100 chars of content
}
```

**Why Centralize**:
- Eliminates duplication between resume/cover letter repositories
- Type-safe table switching
- Single source of truth for CRUD logic
- Easier to add new document types (portfolios, etc.)

**Usage**:
```typescript
// In resume API route
import { getDocument } from '@/libs/repositories/documents'
const resume = await getDocument<ResumeJson>(supabase, 'resumes', resumeId)

// In cover letter API route
import { getDocument } from '@/libs/repositories/documents'
const coverLetter = await getDocument<CoverLetterJson>(supabase, 'cover_letters', clId)

// In unified dashboard
import { searchAllDocuments } from '@/libs/repositories/documents'
const results = await searchAllDocuments(supabase, userId, 'engineer', { type: 'all' })
```

---

### B. Document Store Factory

**File**: `stores/createDocumentStore.ts`

**Purpose**: Generate Zustand stores with identical logic for different document types

**Factory Signature**:
```typescript
export function createDocumentStore<T extends DocumentJson>(config: {
  apiEndpoint: string         // e.g., '/api/v1/resumes'
  schemaValidator: ZodSchema<T>
  defaultDocument?: () => T
}) {
  return create<DocumentState<T>>()(
    temporal((set, get) => ({
      // ... all state/actions here (identical logic)
    }), {
      limit: 50,
      partialize: (state) => ({ document: state.document }),
      equality: (a, b) => JSON.stringify(a.document) === JSON.stringify(b.document)
    })
  )
}
```

**State Interface**:
```typescript
interface DocumentState<T extends DocumentJson> {
  document: T | null
  documentId: string | null
  documentVersion: number | null
  documentTitle: string | null
  isLoading: boolean
  originalDocument: T | null
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null
  hasChanges: boolean

  loadDocument: (id: string) => Promise<void>
  updateDocument: (updates: Partial<T>) => void
  setTitle: (title: string) => void
  saveDocument: () => Promise<void>
  resetChanges: () => void
  clearDocument: () => void
}
```

**Why Centralize**:
- Eliminates 300+ lines of duplicated code per store
- Guarantees identical behavior across document types
- Single place to fix autosave bugs
- Easier to add features (e.g., conflict resolution UI)

**Usage**:
```typescript
// stores/resumeStore.ts
import { createDocumentStore } from './createDocumentStore'
export const useResumeStore = createDocumentStore<ResumeJson>({
  apiEndpoint: '/api/v1/resumes',
  schemaValidator: ResumeJsonSchema,
  defaultDocument: createEmptyResume
})

// stores/coverLetterStore.ts
import { createDocumentStore } from './createDocumentStore'
export const useCoverLetterStore = createDocumentStore<CoverLetterJson>({
  apiEndpoint: '/api/v1/cover-letters',
  schemaValidator: CoverLetterJsonSchema,
  defaultDocument: createEmptyCoverLetter
})
```

---

### C. Unified Dashboard Components

**Directory**: `components/documents/`

**Purpose**: Shared UI for document list, grid, filter, search (both resumes and cover letters)

**Components**:

1. **`DocumentGrid.tsx`** - Grid layout for any document type
```typescript
interface DocumentGridProps {
  documents: UnifiedDocument[]
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  selectedIds: Set<string>
}
```

2. **`DocumentFilter.tsx`** - Type/status/date filter
```typescript
interface DocumentFilterProps {
  filters: {
    type: 'all' | 'resume' | 'cover_letter'
    status: 'all' | 'draft' | 'active' | 'archived'
    dateRange: 'all' | 'week' | 'month' | 'quarter'
  }
  onFilterChange: (key: string, value: string) => void
}
```

3. **`DocumentSearch.tsx`** - Cross-document search with autocomplete
```typescript
interface DocumentSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}
```

4. **`DocumentCard.tsx`** - Card for grid view (shows type badge)
```typescript
interface DocumentCardProps {
  document: UnifiedDocument
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onDelete: () => void
}
```

5. **`DocumentTypeIcon.tsx`** - Icon with badge (resume/cover letter)
```typescript
interface DocumentTypeIconProps {
  type: 'resume' | 'cover_letter'
  size?: 'sm' | 'md' | 'lg'
}
```

6. **`BulkActions.tsx`** - Toolbar for bulk operations
```typescript
interface BulkActionsProps {
  selectedCount: number
  onDelete: () => void
  onArchive: () => void
  onExport: () => void
  onPackage: () => void  // NEW: Create package from selected
}
```

**Why Centralize**:
- Single dashboard shows both resumes and cover letters
- Consistent UX across document types
- Shared filtering/search logic
- Easier to add new document types

**Usage**:
```typescript
// app/dashboard/page.tsx (Unified Dashboard)
import { DocumentGrid, DocumentFilter, DocumentSearch } from '@/components/documents'

export default function DashboardPage() {
  const documents = await searchAllDocuments(supabase, userId, '', { type: 'all' })

  return (
    <>
      <DocumentSearch onSearch={handleSearch} />
      <DocumentFilter filters={filters} onFilterChange={handleFilterChange} />
      <DocumentGrid documents={documents} onSelect={handleSelect} />
    </>
  )
}
```

---

### D. Document Linker Repository

**File**: `libs/repositories/documentLinker.ts`

**Purpose**: Manage resume ↔ cover letter relationships

**Functions**:
```typescript
// Create link
export async function linkCoverLetterToResume(
  supabase: SupabaseClient,
  coverLetterId: string,
  resumeId: string,
  userId: string
): Promise<void>

// Remove link
export async function unlinkCoverLetter(
  supabase: SupabaseClient,
  coverLetterId: string,
  userId: string
): Promise<void>

// Get linked documents
export async function getLinkedDocuments(
  supabase: SupabaseClient,
  documentId: string,
  documentType: 'resume' | 'cover_letter',
  userId: string
): Promise<UnifiedDocument[]>

// Sync contact info from resume to cover letter
export async function syncFromResume(
  supabase: SupabaseClient,
  coverLetterId: string,
  resumeId: string,
  userId: string,
  options?: {
    fields?: Array<'fullName' | 'email' | 'phone' | 'address'>
  }
): Promise<CoverLetterJson>
```

**Why Centralize**:
- Single source of truth for linking logic
- Used by multiple API routes (`/link`, `/sync`)
- Easier to add linking metadata (last synced, auto-sync flag)

---

### E. Package Management Repository

**File**: `libs/repositories/packages.ts`

**Purpose**: CRUD for document packages (resume + cover letter bundles)

**Functions**:
```typescript
export async function createPackage(
  supabase: SupabaseClient,
  name: string,
  resumeId: string,
  coverLetterId: string,
  userId: string,
  jobApplicationId?: string
): Promise<DocumentPackage>

export async function getPackage(
  supabase: SupabaseClient,
  packageId: string,
  userId: string
): Promise<DocumentPackage>

export async function getPackageDocuments(
  supabase: SupabaseClient,
  packageId: string,
  userId: string
): Promise<{ resume: Resume; coverLetter: CoverLetter }>

export async function listPackages(
  supabase: SupabaseClient,
  userId: string
): Promise<DocumentPackage[]>

export async function deletePackage(
  supabase: SupabaseClient,
  packageId: string,
  userId: string
): Promise<void>
```

**Type**:
```typescript
interface DocumentPackage {
  id: string
  user_id: string
  name: string
  resume_id: string
  cover_letter_id: string
  job_application_id?: string
  created_at: string
  updated_at: string
}
```

**Why Centralize**:
- Packages are a distinct concept (not resume, not cover letter)
- Used by export API, dashboard, job application tracking

---

### F. Rich Text Utilities

**Directory**: `libs/rich-text/`

**Files**:
1. `sanitizer.ts` - Two-layer XSS defense (client + server)
2. `serializer.ts` - HTML ↔ RichTextBlock[] conversion
3. `validator.ts` - Validate RichTextBlock structure

**Why Centralize**:
- Used by editor (client), API routes (server), templates (renderer)
- Single source of truth for allowed tags
- Consistent sanitization across all entry points

**Functions**:
```typescript
// sanitizer.ts
export function sanitizeHTML(html: string, context: 'client' | 'server'): string

// serializer.ts
export function htmlToRichTextBlocks(html: string): RichTextBlock[]
export function richTextBlocksToHTML(blocks: RichTextBlock[]): string

// validator.ts
export function validateRichTextBlocks(blocks: unknown): blocks is RichTextBlock[]
```

---

## 4. Implementation Plan - 6 Major Areas

### Area 1: Database Schema & Migrations (3-4 hours)

**Goal**: Create 4 migration files (NOT apply until user approval)

**Files to Create**:
```
migrations/phase7/
├── 020_create_cover_letters_table.sql        (1 hour)
├── 021_create_document_relationships_table.sql (1 hour)
├── 022_create_document_packages_table.sql     (30 min)
└── 023_seed_cover_letter_templates.sql        (30 min)
```

**Migration 1: Cover Letters Table**

Creates `cover_letters` table with:
- Same structure as `resumes` (copy pattern)
- `linked_resume_id` FK with `ON DELETE SET NULL`
- 4 CRUD RLS policies (identical to resumes)
- Indexes on `user_id`, `status`, `updated_at`, `linked_resume_id`
- Trigger for `updated_at` auto-update

**Migration 2: Document Relationships Table**

Creates hybrid FK + Junction pattern:
- `document_relationships` table (junction for metadata)
- Columns: `source_id`, `source_type`, `target_id`, `target_type`, `relationship_type`, `metadata` (JSONB)
- Unique constraint prevents duplicate relationships
- Indexes for fast lookups (source, target, composite)
- 2 RLS policies (SELECT, INSERT only - no UPDATE/DELETE for audit trail)

**Migration 3: Document Packages Table**

Creates packages for job applications:
- `document_packages` table
- Columns: `id`, `user_id`, `name`, `resume_id`, `cover_letter_id`, `job_application_id`
- FKs with `ON DELETE CASCADE` (strict integrity)
- 4 CRUD RLS policies
- Denormalized `user_id` (RLS performance)

**Migration 4: Seed Data**

Inserts 4 cover letter templates into `cover_letter_templates` table:
- Classic Block (default)
- Modern Minimal
- Creative Bold
- Executive Formal

**Research Applied**:
- Hybrid FK + Junction pattern (from document linking research)
- Denormalized user_id (Phase 6 learning)
- 4 CRUD RLS policies (Phase 6 learning)
- SET NULL cascade for optional relationships
- CASCADE DELETE for strict relationships (packages)

**Code Structure** (High-Level):

See Section 6 for complete SQL.

**Validation**:
- Run SQL through Supabase SQL editor (syntax check)
- Verify RLS policies with `EXPLAIN` (no sequential scans)
- Test FK cascades with dummy data
- Confirm indexes created (check `pg_indexes`)

---

### Area 2: Rich Text Editor System (8-10 hours)

**Goal**: Build ContentEditable-based rich text editor with sanitization and serialization

**Files to Create**:
```
components/rich-text/
├── RichTextEditor.tsx          (2 hours) - Main editor component
├── RichTextToolbar.tsx         (1.5 hours) - Format toolbar (B, I, U, Lists)
├── RichTextContent.tsx         (1 hour) - ContentEditable wrapper
├── RichTextFormatButton.tsx    (30 min) - Toolbar button component
├── RichTextSerializer.tsx      (1.5 hours) - HTML ↔ RichTextBlock[] converter
├── useRichTextEditor.ts        (2 hours) - Hook for editor state + commands
└── index.ts                    (15 min) - Exports

libs/rich-text/
├── sanitizer.ts                (1 hour) - isomorphic-dompurify wrapper
├── serializer.ts               (1.5 hours) - Core conversion logic
└── validator.ts                (30 min) - Zod schema for RichTextBlock[]
```

**Research Applied**:
- ContentEditable + Custom Logic approach (0 KB framework overhead)
- isomorphic-dompurify for two-layer sanitization (client + server)
- Custom JSON serialization (HTML → RichTextBlock[])

**Component Breakdown**:

**1. RichTextEditor.tsx** (Main Component)
```typescript
interface RichTextEditorProps {
  value: RichTextBlock[]
  onChange: (blocks: RichTextBlock[]) => void
  placeholder?: string
  autoFocus?: boolean
}

// Responsibilities:
// - Manages editor state (Zustand with zundo for undo/redo)
// - Renders toolbar + content
// - Handles sanitization on paste
// - Converts RichTextBlock[] ↔ HTML for display
```

**2. RichTextToolbar.tsx** (Format Controls)
```typescript
interface RichTextToolbarProps {
  onFormat: (command: FormatCommand) => void
  activeFormats: Set<'bold' | 'italic' | 'underline'>
}

// Responsibilities:
// - Render B, I, U buttons
// - Render bullet/numbered list buttons
// - Show active state (bold button highlighted when selection is bold)
// - Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+U)
```

**3. useRichTextEditor.ts** (Core Logic Hook)
```typescript
export function useRichTextEditor(initialBlocks: RichTextBlock[]) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [selection, setSelection] = useState<Range | null>(null)

  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    // Get current selection
    // Apply <strong>, <em>, or <u> tag
    // Update blocks
  }

  const toggleList = (type: 'bullet' | 'numbered') => {
    // Convert paragraph to list or vice versa
  }

  const handlePaste = (event: ClipboardEvent) => {
    // Get pasted HTML
    // Sanitize with dompurify
    // Convert to RichTextBlock[]
    // Insert at cursor position
  }

  return { blocks, applyFormat, toggleList, handlePaste }
}
```

**4. sanitizer.ts** (XSS Defense)
```typescript
import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = ['p', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'br']
const ALLOWED_ATTR: string[] = []  // No attributes needed

export function sanitizeHTML(html: string, context: 'client' | 'server'): string {
  const config = {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
  }

  const clean = DOMPurify.sanitize(html, config)

  if (context === 'server') {
    // Additional validation (e.g., max length)
    if (clean.length > 10000) {
      throw new Error('Content too long')
    }
  }

  return clean
}
```

**5. serializer.ts** (HTML ↔ JSON Conversion)
```typescript
export function htmlToRichTextBlocks(html: string): RichTextBlock[] {
  const sanitized = sanitizeHTML(html, 'client')
  const parser = new DOMParser()
  const doc = parser.parseFromString(sanitized, 'text/html')

  const blocks: RichTextBlock[] = []

  doc.body.childNodes.forEach(node => {
    if (node.nodeName === 'P') {
      blocks.push({
        type: 'paragraph',
        runs: parseTextRuns(node as HTMLElement)
      })
    } else if (node.nodeName === 'UL') {
      blocks.push({
        type: 'list',
        style: 'bullet',
        items: parseListItems(node as HTMLElement)
      })
    } else if (node.nodeName === 'OL') {
      blocks.push({
        type: 'list',
        style: 'numbered',
        items: parseListItems(node as HTMLElement)
      })
    }
  })

  return blocks
}

function parseTextRuns(element: HTMLElement): TextRun[] {
  const runs: TextRun[] = []

  element.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      runs.push({ text: node.textContent || '' })
    } else if (node.nodeName === 'STRONG') {
      runs.push({ text: node.textContent || '', bold: true })
    } else if (node.nodeName === 'EM') {
      runs.push({ text: node.textContent || '', italic: true })
    } else if (node.nodeName === 'U') {
      runs.push({ text: node.textContent || '', underline: true })
    }
  })

  return runs
}

export function richTextBlocksToHTML(blocks: RichTextBlock[]): string {
  return blocks.map(block => {
    if (block.type === 'paragraph') {
      const runs = block.runs.map(run => {
        let text = run.text
        if (run.bold) text = `<strong>${text}</strong>`
        if (run.italic) text = `<em>${text}</em>`
        if (run.underline) text = `<u>${text}</u>`
        return text
      }).join('')
      return `<p>${runs}</p>`
    } else if (block.type === 'list') {
      const tag = block.style === 'bullet' ? 'ul' : 'ol'
      const items = block.items.map(item => `<li>${item}</li>`).join('')
      return `<${tag}>${items}</${tag}>`
    }
    return ''
  }).join('')
}
```

**Performance Target**:
- Keystroke → UI update: <100ms (measured via React DevTools)
- Sanitization: <5ms (typical 200-500 char content)
- Serialization: <10ms (10 blocks with 50 runs each)

**Testing**:
- Paste attack vectors (script tags, onerror handlers)
- Long content (10,000 chars)
- Undo/redo (50 steps)
- Format combinations (bold + italic + underline)

---

### Area 3: Cover Letter CRUD System (6-8 hours)

**Goal**: Implement full CRUD for cover letters (API routes + repositories + UI)

**Files to Create**:
```
app/api/v1/cover-letters/
├── route.ts                         (1 hour) - GET (list), POST (create)
├── [id]/route.ts                    (1 hour) - GET, PUT, DELETE
├── [id]/link/route.ts               (1 hour) - POST (link to resume)
├── [id]/sync/route.ts               (1 hour) - POST (sync from resume)
└── [id]/duplicate/route.ts          (30 min) - POST (duplicate)

libs/repositories/
├── coverLetters.ts                  (2 hours) - CRUD functions
└── documentLinker.ts                (1.5 hours) - Link/sync functions

libs/validation/
└── coverLetter.ts                   (1 hour) - Zod schemas
```

**API Routes** (Copy from `/api/v1/resumes/*`)

**GET /api/v1/cover-letters** (List)
```typescript
import { withAuth } from '@/libs/api-utils/with-auth'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { getCoverLetters } from '@/libs/repositories/coverLetters'

export const GET = withAuth(async (req, user) => {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)

  const options = {
    status: searchParams.get('status') || undefined,
    search: searchParams.get('search') || undefined,
    cursor: searchParams.get('cursor') || undefined,
    limit: Number(searchParams.get('limit')) || 20,
  }

  const result = await getCoverLetters(supabase, user.id, options)
  return apiSuccess(result)
})
```

**POST /api/v1/cover-letters** (Create)
```typescript
export const POST = withAuth(async (req, user) => {
  const supabase = createClient()
  const { title, linkedResumeId } = await req.json()

  // Validate input
  const result = CreateCoverLetterSchema.safeParse({ title, linkedResumeId })
  if (!result.success) {
    return apiError(400, 'Validation failed', result.error.format())
  }

  // Get user profile for defaults
  const profile = await getProfile(supabase, user.id)

  // Create empty cover letter
  const initialData = createEmptyCoverLetter(
    user.email || '',
    profile.full_name || '',
    { locale: profile.locale }
  )

  const coverLetter = await createCoverLetter(
    supabase,
    user.id,
    title,
    initialData
  )

  // Auto-link if resumeId provided
  if (linkedResumeId) {
    await linkCoverLetterToResume(supabase, coverLetter.id, linkedResumeId, user.id)
  }

  return apiSuccess(coverLetter)
})
```

**POST /api/v1/cover-letters/:id/link** (Link to Resume)
```typescript
export const POST = withAuth(async (req, user) => {
  const supabase = createClient()
  const { id } = params
  const { resumeId } = await req.json()

  // Validate ownership of both documents
  await getCoverLetter(supabase, id)  // Throws if not owned
  await getResume(supabase, resumeId) // Throws if not owned

  // Create link
  await linkCoverLetterToResume(supabase, id, resumeId, user.id)

  return apiSuccess({ linked: true })
})
```

**POST /api/v1/cover-letters/:id/sync** (Sync from Resume)
```typescript
export const POST = withAuth(async (req, user) => {
  const supabase = createClient()
  const { id } = params
  const { fields } = await req.json()
  // fields: ['fullName', 'email', 'phone', 'address'] (optional)

  // Get cover letter
  const coverLetter = await getCoverLetter(supabase, id)

  if (!coverLetter.linked_resume_id) {
    return apiError(400, 'Cover letter not linked to a resume')
  }

  // Sync from linked resume
  const updated = await syncFromResume(
    supabase,
    id,
    coverLetter.linked_resume_id,
    user.id,
    { fields }
  )

  return apiSuccess(updated)
})
```

**Repository Functions** (Copy from `documents.ts`, adapt for cover letters)

```typescript
// libs/repositories/coverLetters.ts

export async function getCoverLetters(
  supabase: SupabaseClient,
  userId: string,
  options?: ListParams
): Promise<CoverLetterListResponse> {
  // Identical to getResumes(), just change table name
  const { data, error } = await supabase
    .from('cover_letters')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_deleted', false)
    // ... apply filters, sorting, pagination

  return { coverLetters: data, nextCursor, total }
}

export async function createCoverLetter(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  data: CoverLetterJson
): Promise<CoverLetter> {
  // Identical to createResume(), different table + schema
}

export async function updateCoverLetter(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<{ title: string; data: CoverLetterJson }>,
  currentVersion: number
): Promise<CoverLetter> {
  // Identical to updateResume(), with optimistic locking
}
```

**Linking Repository** (NEW)

```typescript
// libs/repositories/documentLinker.ts

export async function linkCoverLetterToResume(
  supabase: SupabaseClient,
  coverLetterId: string,
  resumeId: string,
  userId: string
): Promise<void> {
  // 1. Verify ownership (RLS will also enforce)
  const { data: coverLetter } = await supabase
    .from('cover_letters')
    .select('id')
    .eq('id', coverLetterId)
    .eq('user_id', userId)
    .single()

  if (!coverLetter) throw new Error('Cover letter not found')

  const { data: resume } = await supabase
    .from('resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single()

  if (!resume) throw new Error('Resume not found')

  // 2. Update FK in cover_letters
  await supabase
    .from('cover_letters')
    .update({ linked_resume_id: resumeId })
    .eq('id', coverLetterId)

  // 3. Create relationship record (for metadata)
  await supabase
    .from('document_relationships')
    .insert({
      source_id: resumeId,
      source_type: 'resume',
      target_id: coverLetterId,
      target_type: 'cover_letter',
      relationship_type: 'linked',
      metadata: { linked_at: new Date().toISOString() }
    })
}

export async function syncFromResume(
  supabase: SupabaseClient,
  coverLetterId: string,
  resumeId: string,
  userId: string,
  options?: { fields?: string[] }
): Promise<CoverLetterJson> {
  // 1. Fetch resume
  const { data: resume } = await supabase
    .from('resumes')
    .select('data')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single()

  if (!resume) throw new Error('Resume not found')

  // 2. Fetch cover letter
  const { data: coverLetter } = await supabase
    .from('cover_letters')
    .select('data, version')
    .eq('id', coverLetterId)
    .eq('user_id', userId)
    .single()

  if (!coverLetter) throw new Error('Cover letter not found')

  const resumeData = resume.data as ResumeJson
  const clData = coverLetter.data as CoverLetterJson

  // 3. Selective field sync (default: all contact fields)
  const fieldsToSync = options?.fields || ['fullName', 'email', 'phone', 'address']

  const syncedFrom: Partial<CoverLetterJson['from']> = {}

  if (fieldsToSync.includes('fullName')) {
    syncedFrom.fullName = resumeData.profile.fullName
  }
  if (fieldsToSync.includes('email')) {
    syncedFrom.email = resumeData.profile.email
  }
  if (fieldsToSync.includes('phone') && resumeData.profile.phone) {
    syncedFrom.phone = resumeData.profile.phone
  }
  if (fieldsToSync.includes('address') && resumeData.profile.location) {
    syncedFrom.address = {
      street: resumeData.profile.location.street,
      city: resumeData.profile.location.city,
      region: resumeData.profile.location.region,
      postal: resumeData.profile.location.postal,
      country: resumeData.profile.location.country,
    }
  }

  const updatedData: CoverLetterJson = {
    ...clData,
    from: { ...clData.from, ...syncedFrom },
  }

  // 4. Update with optimistic locking
  const { data: updated } = await supabase
    .from('cover_letters')
    .update({
      data: updatedData,
      version: coverLetter.version + 1,
    })
    .eq('id', coverLetterId)
    .eq('version', coverLetter.version)
    .select('data')
    .single()

  if (!updated) throw new Error('CONFLICT: Version mismatch')

  // 5. Update relationship metadata
  await supabase
    .from('document_relationships')
    .upsert({
      source_id: resumeId,
      source_type: 'resume',
      target_id: coverLetterId,
      target_type: 'cover_letter',
      relationship_type: 'linked',
      metadata: {
        synced_at: new Date().toISOString(),
        synced_fields: fieldsToSync,
      },
    }, {
      onConflict: 'source_id,source_type,target_id,target_type,relationship_type'
    })

  return updated.data as CoverLetterJson
}
```

**Validation Schemas** (NEW)

```typescript
// libs/validation/coverLetter.ts

import { z } from 'zod'

const TextRunSchema = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
})

const RichTextBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('paragraph'),
    runs: z.array(TextRunSchema),
  }),
  z.object({
    type: z.literal('list'),
    style: z.enum(['bullet', 'numbered']),
    items: z.array(z.string()),
  }),
])

export const CoverLetterJsonSchema = z.object({
  from: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string(),
      region: z.string(),
      postal: z.string().optional(),
      country: z.string(),
    }).optional(),
  }),
  to: z.object({
    companyName: z.string().min(1),
    hiringManagerName: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string(),
      region: z.string(),
      postal: z.string().optional(),
      country: z.string(),
    }).optional(),
  }),
  date: z.string(),  // ISO date string
  salutation: z.string().min(1),  // e.g., "Dear Hiring Manager,"
  body: z.array(RichTextBlockSchema),
  closing: z.string().min(1),  // e.g., "Sincerely,"
  settings: z.object({
    template: z.string(),
    fontSize: z.number().min(8).max(16).optional(),
    lineHeight: z.number().min(1).max(2).optional(),
    margins: z.object({
      top: z.number(),
      right: z.number(),
      bottom: z.number(),
      left: z.number(),
    }).optional(),
  }),
})

export const CreateCoverLetterSchema = z.object({
  title: z.string().min(1).max(200),
  linkedResumeId: z.string().uuid().optional(),
})

export const UpdateCoverLetterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  data: CoverLetterJsonSchema.optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  version: z.number().int().positive(),
})
```

**Centralization**:
- Use shared `createDocumentStore()` factory for `coverLetterStore.ts`
- Reuse `withAuth`, `apiSuccess`, `apiError` from existing API utils
- Reuse optimistic locking pattern from resume repository

**Research Applied**:
- Manual sync pattern (not automatic)
- Selective field sync (contact info only)
- Hybrid FK + Junction for linking

---

### Area 4: Cover Letter Templates (5-6 hours)

**Goal**: Create 4 cover letter templates that render `CoverLetterJson` to styled HTML

**Files to Create**:
```
libs/templates/cover-letter/
├── classic-block/
│   ├── index.tsx               (1.5 hours) - Main renderer
│   ├── HeaderSection.tsx       (1 hour) - From/To/Date
│   ├── BodySection.tsx         (1.5 hours) - RichTextBlock renderer
│   ├── ClosingSection.tsx      (30 min) - Closing + signature
│   └── metadata.ts             (15 min) - Template config
├── modern-minimal/             (1 hour) - Copy + style variations
├── creative-bold/              (1 hour) - Copy + style variations
└── executive-formal/           (1 hour) - Copy + style variations
```

**Template Structure** (Classic Block Example)

```typescript
// libs/templates/cover-letter/classic-block/index.tsx

import { CoverLetterJson } from '@/types/coverLetter'
import { HeaderSection } from './HeaderSection'
import { BodySection } from './BodySection'
import { ClosingSection } from './ClosingSection'

interface ClassicBlockTemplateProps {
  data: CoverLetterJson
}

export function ClassicBlockTemplate({ data }: ClassicBlockTemplateProps) {
  return (
    <div
      className="cover-letter-template"
      style={{
        fontFamily: 'var(--doc-font-family)',
        fontSize: 'var(--doc-font-size)',
        lineHeight: 'var(--doc-line-height)',
        color: 'var(--doc-text-primary)',
        backgroundColor: 'var(--doc-background)',
        padding: 'var(--doc-margin-top) var(--doc-margin-right) var(--doc-margin-bottom) var(--doc-margin-left)',
      }}
    >
      <HeaderSection from={data.from} to={data.to} date={data.date} />
      <BodySection salutation={data.salutation} body={data.body} />
      <ClosingSection closing={data.closing} from={data.from} />
    </div>
  )
}
```

**HeaderSection.tsx**
```typescript
interface HeaderSectionProps {
  from: CoverLetterJson['from']
  to: CoverLetterJson['to']
  date: string
}

export function HeaderSection({ from, to, date }: HeaderSectionProps) {
  return (
    <header style={{ marginBottom: 'var(--doc-spacing-lg)' }}>
      {/* From address (top-left) */}
      <div style={{ marginBottom: 'var(--doc-spacing-md)' }}>
        <div style={{ fontWeight: 600 }}>{from.fullName}</div>
        {from.address && (
          <div>
            {from.address.street && <div>{from.address.street}</div>}
            <div>{from.address.city}, {from.address.region} {from.address.postal}</div>
          </div>
        )}
        <div>{from.email}</div>
        {from.phone && <div>{from.phone}</div>}
      </div>

      {/* Date */}
      <div style={{ marginBottom: 'var(--doc-spacing-md)' }}>
        {new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>

      {/* To address */}
      <div>
        {to.hiringManagerName && <div>{to.hiringManagerName}</div>}
        <div>{to.companyName}</div>
        {to.address && (
          <div>
            {to.address.street && <div>{to.address.street}</div>}
            <div>{to.address.city}, {to.address.region} {to.address.postal}</div>
          </div>
        )}
      </div>
    </header>
  )
}
```

**BodySection.tsx** (RichTextBlock Renderer)
```typescript
interface BodySectionProps {
  salutation: string
  body: RichTextBlock[]
}

export function BodySection({ salutation, body }: BodySectionProps) {
  return (
    <section style={{ marginBottom: 'var(--doc-spacing-lg)' }}>
      {/* Salutation */}
      <p style={{ marginBottom: 'var(--doc-spacing-md)' }}>{salutation}</p>

      {/* Body paragraphs */}
      {body.map((block, index) => (
        <RichTextBlockRenderer key={index} block={block} />
      ))}
    </section>
  )
}

function RichTextBlockRenderer({ block }: { block: RichTextBlock }) {
  if (block.type === 'paragraph') {
    return (
      <p style={{ marginBottom: 'var(--doc-spacing-sm)' }}>
        {block.runs.map((run, i) => (
          <TextRunRenderer key={i} run={run} />
        ))}
      </p>
    )
  } else if (block.type === 'list') {
    const ListTag = block.style === 'bullet' ? 'ul' : 'ol'
    return (
      <ListTag style={{ marginBottom: 'var(--doc-spacing-sm)' }}>
        {block.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ListTag>
    )
  }
  return null
}

function TextRunRenderer({ run }: { run: TextRun }) {
  let text = <>{run.text}</>

  if (run.bold) text = <strong>{text}</strong>
  if (run.italic) text = <em>{text}</em>
  if (run.underline) text = <u>{text}</u>

  return text
}
```

**Design Token Usage**:
- Use `--doc-*` tokens ONLY (not `--app-*`)
- `--doc-font-family`, `--doc-font-size`, `--doc-line-height`
- `--doc-spacing-sm`, `--doc-spacing-md`, `--doc-spacing-lg`
- `--doc-margin-top`, `--doc-margin-right`, etc.

**Template Registration**:
```typescript
// libs/templates/cover-letter/index.ts

import { ClassicBlockTemplate } from './classic-block'
import { ModernMinimalTemplate } from './modern-minimal'
import { CreativeBoldTemplate } from './creative-bold'
import { ExecutiveFormalTemplate } from './executive-formal'

export const coverLetterTemplates = {
  'classic-block': ClassicBlockTemplate,
  'modern-minimal': ModernMinimalTemplate,
  'creative-bold': CreativeBoldTemplate,
  'executive-formal': ExecutiveFormalTemplate,
}

export function getCoverLetterTemplate(slug: string) {
  return coverLetterTemplates[slug] || coverLetterTemplates['classic-block']
}
```

**Reuse**:
- Dual-token architecture (from resume templates)
- Template switcher UI pattern
- Print styles (`@media print`)

---

### Area 5: Document Linking System (7-9 hours)

**Goal**: Implement resume ↔ cover letter linking with UI + sync functionality

**Files to Create**:
```
components/cover-letters/
├── LinkedResumeSelector.tsx    (2 hours) - Dropdown to select/link resume
├── SyncButton.tsx              (1 hour) - Manual sync trigger
├── SyncStatusIndicator.tsx     (1 hour) - Show last sync timestamp
├── RelatedDocumentsPanel.tsx   (2 hours) - List linked documents
└── UnlinkConfirmDialog.tsx     (1 hour) - Confirm unlink action

app/api/v1/cover-letters/[id]/
├── link/route.ts               (Already covered in Area 3)
└── sync/route.ts               (Already covered in Area 3)

libs/repositories/
└── documentLinker.ts           (Already covered in Area 3)
```

**UI Components**:

**LinkedResumeSelector.tsx**
```typescript
interface LinkedResumeSelectorProps {
  currentLinkedResumeId?: string | null
  onLink: (resumeId: string) => Promise<void>
  onUnlink: () => Promise<void>
}

export function LinkedResumeSelector({
  currentLinkedResumeId,
  onLink,
  onUnlink
}: LinkedResumeSelectorProps) {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch user's resumes
    fetch('/api/v1/resumes')
      .then(res => res.json())
      .then(data => setResumes(data.data.resumes))
  }, [])

  const handleLink = async (resumeId: string) => {
    setIsLoading(true)
    try {
      await onLink(resumeId)
      toast({ title: 'Linked', description: 'Resume linked successfully' })
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to link resume' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>Linked Resume</Label>
      <Select value={currentLinkedResumeId || ''} onValueChange={handleLink}>
        <SelectTrigger>
          <SelectValue placeholder="Select resume..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None</SelectItem>
          {resumes.map(resume => (
            <SelectItem key={resume.id} value={resume.id}>
              {resume.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {currentLinkedResumeId && (
        <Button variant="outline" size="sm" onClick={onUnlink}>
          Unlink Resume
        </Button>
      )}
    </div>
  )
}
```

**SyncButton.tsx**
```typescript
interface SyncButtonProps {
  coverLetterId: string
  linkedResumeId: string | null
  onSyncComplete: () => void
}

export function SyncButton({ coverLetterId, linkedResumeId, onSyncComplete }: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  if (!linkedResumeId) return null

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch(`/api/v1/cover-letters/${coverLetterId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: ['fullName', 'email', 'phone', 'address'] }),
      })

      if (!response.ok) throw new Error('Sync failed')

      toast({ title: 'Synced', description: 'Contact info synced from resume' })
      onSyncComplete()
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to sync' })
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync from Resume
        </>
      )}
    </Button>
  )
}
```

**Research Applied**:
- Manual sync (not automatic)
- Selective field sync (contact info only)
- Hybrid FK + Junction pattern
- SET NULL cascade (orphaned cover letters remain accessible)

**User Flow**:
1. User creates cover letter
2. User clicks "Link to Resume" → Dropdown appears
3. User selects resume → FK updated, relationship record created
4. User clicks "Sync from Resume" → Contact info copied
5. User can unlink → FK set to NULL, relationship deleted

---

### Area 6: Multi-Document Dashboard (6-8 hours)

**Goal**: Unified dashboard showing both resumes and cover letters

**Files to Create**:
```
app/documents/
└── page.tsx                    (2 hours) - Unified dashboard

components/documents/
├── DocumentGrid.tsx            (1.5 hours) - Grid for all document types
├── DocumentFilter.tsx          (1 hour) - Type/status/date filters
├── DocumentSearch.tsx          (1 hour) - Cross-document search
├── DocumentCard.tsx            (1 hour) - Card with type badge
├── DocumentTypeIcon.tsx        (30 min) - Icon for resume/cover letter
└── BulkActions.tsx             (1 hour) - Bulk operations toolbar

app/api/v1/documents/
├── route.ts                    (1 hour) - GET (unified search)
└── package/route.ts            (1 hour) - POST (create package)

libs/repositories/
└── packages.ts                 (Already covered in Area 3)
```

**Unified Dashboard Page**:

```typescript
// app/documents/page.tsx

import { DocumentGrid, DocumentFilter, DocumentSearch, BulkActions } from '@/components/documents'
import { searchAllDocuments } from '@/libs/repositories/documents'

export default async function DocumentsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Documents</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/resumes/new">
              <FileText className="h-4 w-4 mr-2" />
              New Resume
            </Link>
          </Button>
          <Button asChild>
            <Link href="/cover-letters/new">
              <Mail className="h-4 w-4 mr-2" />
              New Cover Letter
            </Link>
          </Button>
        </div>
      </div>

      <DocumentSearch onSearch={handleSearch} />
      <DocumentFilter filters={filters} onFilterChange={handleFilterChange} />
      <BulkActions selectedCount={selectedIds.size} onDelete={handleBulkDelete} onPackage={handleCreatePackage} />
      <DocumentGrid documents={documents} onSelect={handleSelect} selectedIds={selectedIds} />
    </div>
  )
}
```

**DocumentCard.tsx**:

```typescript
interface DocumentCardProps {
  document: UnifiedDocument
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onDelete: () => void
}

export function DocumentCard({ document, selected, onSelect, onOpen, onDelete }: DocumentCardProps) {
  return (
    <Card className={cn('cursor-pointer hover:shadow-lg transition', selected && 'ring-2 ring-primary')}>
      <CardHeader className="flex flex-row items-center gap-4">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
        <DocumentTypeIcon type={document.type} />
        <div className="flex-1">
          <CardTitle className="text-lg">{document.title}</CardTitle>
          <CardDescription>
            Updated {new Date(document.updated_at).toLocaleDateString()}
          </CardDescription>
        </div>
        <Badge variant={document.status === 'active' ? 'default' : 'secondary'}>
          {document.status}
        </Badge>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onOpen}>
          <Eye className="h-4 w-4 mr-2" />
          Open
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
```

**Cross-Document Search API**:

```typescript
// app/api/v1/documents/route.ts

export const GET = withAuth(async (req, user) => {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)

  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'
  const status = searchParams.get('status') || undefined

  const results = await searchAllDocuments(supabase, user.id, query, {
    type: type as 'resume' | 'cover_letter' | 'all',
    status,
    limit: 50,
  })

  return apiSuccess(results)
})
```

**Package Creation API**:

```typescript
// app/api/v1/documents/package/route.ts

export const POST = withAuth(async (req, user) => {
  const supabase = createClient()
  const { name, resumeId, coverLetterId, jobApplicationId } = await req.json()

  const pkg = await createPackage(
    supabase,
    name,
    resumeId,
    coverLetterId,
    user.id,
    jobApplicationId
  )

  return apiSuccess(pkg)
})
```

**Research Applied**:
- UNION query for cross-document search (no JOIN in RLS)
- Denormalized user_id (RLS performance)
- Package table with CASCADE DELETE

---

## 5. File Structure Overview

```
app/
  cover-letters/
    - page.tsx                              # List page (NEW)
    - new/page.tsx                          # Create page (NEW)
    - [id]/page.tsx                         # Editor page (NEW)
  documents/
    - page.tsx                              # Unified dashboard (NEW)
  api/v1/
    cover-letters/
      - route.ts                            # GET (list), POST (create) (NEW)
      - [id]/route.ts                       # GET, PUT, DELETE (NEW)
      - [id]/link/route.ts                  # POST (link to resume) (NEW)
      - [id]/sync/route.ts                  # POST (sync from resume) (NEW)
      - [id]/duplicate/route.ts             # POST (duplicate) (NEW)
    documents/
      - route.ts                            # GET (unified search) (NEW)
      - package/route.ts                    # POST (create package) (NEW)
    ai/
      - generate-cover-letter/route.ts      # POST (AI generation, SSE) (NEW)
    export/
      - pdf/route.ts                        # MODIFY (add cover letter + package support)

components/
  rich-text/
    - RichTextEditor.tsx                    # Main editor (NEW)
    - RichTextToolbar.tsx                   # Format toolbar (NEW)
    - RichTextContent.tsx                   # ContentEditable wrapper (NEW)
    - RichTextFormatButton.tsx              # Toolbar button (NEW)
    - RichTextSerializer.tsx                # HTML ↔ JSON converter (NEW)
    - useRichTextEditor.ts                  # Editor hook (NEW)
    - index.ts                              # Exports (NEW)
  cover-letters/
    - CoverLetterEditor.tsx                 # Main editor component (NEW)
    - RecipientForm.tsx                     # To/From/Date form (NEW)
    - SalutationInput.tsx                   # Salutation field (NEW)
    - BodyEditor.tsx                        # Rich text body editor (NEW)
    - ClosingInput.tsx                      # Closing field (NEW)
    - LinkedResumeSelector.tsx              # Link to resume (NEW)
    - SyncButton.tsx                        # Sync from resume (NEW)
    - SyncStatusIndicator.tsx               # Last sync timestamp (NEW)
    - RelatedDocumentsPanel.tsx             # Linked documents (NEW)
  documents/ (CENTRALIZED)
    - DocumentGrid.tsx                      # Grid for all types (NEW)
    - DocumentFilter.tsx                    # Type/status filter (NEW)
    - DocumentSearch.tsx                    # Cross-document search (NEW)
    - DocumentCard.tsx                      # Card with type badge (NEW)
    - DocumentTypeIcon.tsx                  # Icon for type (NEW)
    - BulkActions.tsx                       # Bulk operations (NEW)

libs/
  repositories/
    - documents.ts (CENTRALIZED)            # Generic CRUD (NEW)
    - coverLetters.ts                       # Cover letter CRUD (NEW)
    - documentLinker.ts (CENTRALIZED)       # Link/sync functions (NEW)
    - packages.ts (CENTRALIZED)             # Package CRUD (NEW)
  rich-text/
    - sanitizer.ts                          # isomorphic-dompurify wrapper (NEW)
    - serializer.ts                         # HTML ↔ RichTextBlock[] (NEW)
    - validator.ts                          # Zod schema validator (NEW)
  templates/
    cover-letter/
      - classic-block/
        - index.tsx                         # Main renderer (NEW)
        - HeaderSection.tsx                 # From/To/Date (NEW)
        - BodySection.tsx                   # RichTextBlock renderer (NEW)
        - ClosingSection.tsx                # Closing + signature (NEW)
        - metadata.ts                       # Template config (NEW)
      - modern-minimal/                     # (NEW)
      - creative-bold/                      # (NEW)
      - executive-formal/                   # (NEW)
  validation/
    - coverLetter.ts                        # Zod schemas (NEW)
  ai/
    prompts/
      - coverLetter.ts                      # AI generation prompt (NEW)

stores/
  - createDocumentStore.ts (CENTRALIZED)    # Store factory (NEW)
  - resumeStore.ts (REFACTOR)               # Use factory (MODIFY)
  - coverLetterStore.ts                     # Use factory (NEW)
  - documentStore.ts                        # DEPRECATED (mark for removal)

migrations/phase7/
  - 020_create_cover_letters_table.sql      # (NEW)
  - 021_create_document_relationships_table.sql # (NEW)
  - 022_create_document_packages_table.sql  # (NEW)
  - 023_seed_cover_letter_templates.sql     # (NEW)

types/
  - coverLetter.ts                          # CoverLetterJson, CoverLetter, etc. (NEW)
  - documents.ts                            # UnifiedDocument, DocumentJson (NEW)
  - richText.ts                             # RichTextBlock, TextRun (NEW)
```

---

## 6. Database Schema (SQL)

### Migration 020: Create Cover Letters Table

```sql
-- Migration: 020_create_cover_letters_table.sql
-- Description: Create cover_letters table with FK to resumes and RLS policies
-- Phase: 7 - Cover Letters & Extended Documents

-- Create cover_letters table
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linked_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  schema_version TEXT NOT NULL DEFAULT 'cover_letter.v1',
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_cover_letters_user_id ON public.cover_letters(user_id) WHERE is_deleted = false;
CREATE INDEX idx_cover_letters_status ON public.cover_letters(user_id, status) WHERE is_deleted = false;
CREATE INDEX idx_cover_letters_updated_at ON public.cover_letters(user_id, updated_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_cover_letters_linked_resume ON public.cover_letters(user_id, linked_resume_id) WHERE linked_resume_id IS NOT NULL;
CREATE INDEX idx_cover_letters_deleted ON public.cover_letters(user_id, deleted_at DESC) WHERE is_deleted = true;

-- Trigger for auto-updating updated_at
CREATE TRIGGER set_updated_at_on_cover_letters
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Enable RLS
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: SELECT (Read own cover letters)
CREATE POLICY "cover_letters_select_own" ON public.cover_letters
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- RLS Policy 2: INSERT (Create own cover letters)
CREATE POLICY "cover_letters_insert_own" ON public.cover_letters
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policy 3: UPDATE (Modify own cover letters)
CREATE POLICY "cover_letters_update_own" ON public.cover_letters
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policy 4: DELETE (Soft delete own cover letters)
CREATE POLICY "cover_letters_delete_own" ON public.cover_letters
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Comments
COMMENT ON TABLE public.cover_letters IS 'Cover letters for job applications (Phase 7)';
COMMENT ON COLUMN public.cover_letters.linked_resume_id IS 'FK to resumes table (ON DELETE SET NULL) - optional relationship';
COMMENT ON COLUMN public.cover_letters.data IS 'CoverLetterJson structure (from, to, date, salutation, body, closing, settings)';
```

---

### Migration 021: Create Document Relationships Table

```sql
-- Migration: 021_create_document_relationships_table.sql
-- Description: Junction table for resume↔cover letter relationships (hybrid FK + metadata)
-- Phase: 7 - Cover Letters & Extended Documents

-- Create document_relationships table (junction for metadata + extensibility)
CREATE TABLE IF NOT EXISTS public.document_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('resume', 'cover_letter')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('resume', 'cover_letter')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('linked', 'package', 'variant')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lookups
CREATE INDEX idx_relationships_source
  ON public.document_relationships(source_id, source_type);

CREATE INDEX idx_relationships_target
  ON public.document_relationships(target_id, target_type);

CREATE INDEX idx_relationships_type
  ON public.document_relationships(relationship_type);

CREATE INDEX idx_relationships_source_target
  ON public.document_relationships(source_id, target_id);

-- Prevent duplicate relationships
CREATE UNIQUE INDEX idx_relationships_unique
  ON public.document_relationships(source_id, source_type, target_id, target_type, relationship_type);

-- Enable RLS
ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: SELECT (Read relationships for own documents)
CREATE POLICY "relationships_select_own" ON public.document_relationships
  FOR SELECT USING (
    -- User owns the target document (cover letter)
    EXISTS (
      SELECT 1 FROM public.cover_letters cl
      WHERE cl.id = target_id
        AND cl.user_id = (SELECT auth.uid())
    )
    OR
    -- User owns the source document (resume)
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = source_id
        AND r.user_id = (SELECT auth.uid())
    )
  );

-- RLS Policy 2: INSERT (Create relationships for own documents only)
CREATE POLICY "relationships_insert_own" ON public.document_relationships
  FOR INSERT
  WITH CHECK (
    -- Verify user owns the target (cover letter being linked)
    EXISTS (
      SELECT 1 FROM public.cover_letters cl
      WHERE cl.id = target_id
        AND cl.user_id = (SELECT auth.uid())
    )
  );

-- NO UPDATE/DELETE policies (append-only for audit trail)
-- Deletes happen via CASCADE or triggers

-- Comments
COMMENT ON TABLE public.document_relationships IS 'Junction table for document relationships (resume↔cover letter linking, packages, variants)';
COMMENT ON COLUMN public.document_relationships.metadata IS 'JSONB for sync timestamps, synced fields, auto-sync flags, etc.';
```

---

### Migration 022: Create Document Packages Table

```sql
-- Migration: 022_create_document_packages_table.sql
-- Description: Document packages for job applications (resume + cover letter bundles)
-- Phase: 7 - Cover Letters & Extended Documents

-- Create document_packages table
CREATE TABLE IF NOT EXISTS public.document_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 200),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  cover_letter_id UUID NOT NULL REFERENCES public.cover_letters(id) ON DELETE CASCADE,
  additional_docs JSONB DEFAULT '[]'::jsonb,
  job_application_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_packages_user ON public.document_packages(user_id);
CREATE INDEX idx_packages_resume ON public.document_packages(resume_id);
CREATE INDEX idx_packages_cover_letter ON public.document_packages(cover_letter_id);
CREATE INDEX idx_packages_job_app ON public.document_packages(job_application_id)
  WHERE job_application_id IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_on_packages
  BEFORE UPDATE ON public.document_packages
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Enable RLS
ALTER TABLE public.document_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: SELECT (Read own packages)
CREATE POLICY "packages_select_own" ON public.document_packages
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- RLS Policy 2: INSERT (Create own packages)
CREATE POLICY "packages_insert_own" ON public.document_packages
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policy 3: UPDATE (Modify own packages)
CREATE POLICY "packages_update_own" ON public.document_packages
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- RLS Policy 4: DELETE (Remove own packages)
CREATE POLICY "packages_delete_own" ON public.document_packages
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- Comments
COMMENT ON TABLE public.document_packages IS 'Document packages for job applications (resume + cover letter bundles)';
COMMENT ON COLUMN public.document_packages.additional_docs IS 'JSONB array for future: [{ type, id, order }]';
COMMENT ON COLUMN public.document_packages.job_application_id IS 'External tracking ID (e.g., ATS ID, job board application ID)';
```

---

### Migration 023: Seed Cover Letter Templates

```sql
-- Migration: 023_seed_cover_letter_templates.sql
-- Description: Insert 4 default cover letter templates
-- Phase: 7 - Cover Letters & Extended Documents

-- Create cover_letter_templates table (if not exists)
CREATE TABLE IF NOT EXISTS public.cover_letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data
INSERT INTO public.cover_letter_templates (slug, name, description, is_premium) VALUES
  ('classic-block', 'Classic Block', 'Traditional block-style letter with formal layout', false),
  ('modern-minimal', 'Modern Minimal', 'Clean, minimal design with subtle accents', false),
  ('creative-bold', 'Creative Bold', 'Bold typography and creative layout for design roles', false),
  ('executive-formal', 'Executive Formal', 'Formal letterhead style for executive positions', false)
ON CONFLICT (slug) DO NOTHING;

-- Comments
COMMENT ON TABLE public.cover_letter_templates IS 'Available cover letter templates (Phase 7)';
```

---

## 7. API Contract Summary

### Cover Letter Endpoints

| Method | Endpoint | Auth | Runtime | Description |
|--------|----------|------|---------|-------------|
| GET | `/api/v1/cover-letters` | withAuth | Edge | List user's cover letters (pagination, filters) |
| POST | `/api/v1/cover-letters` | withAuth | Edge | Create new cover letter |
| GET | `/api/v1/cover-letters/:id` | withAuth | Edge | Get single cover letter by ID |
| PUT | `/api/v1/cover-letters/:id` | withAuth | Edge | Update cover letter (optimistic locking) |
| DELETE | `/api/v1/cover-letters/:id` | withAuth | Edge | Soft delete cover letter |
| POST | `/api/v1/cover-letters/:id/link` | withAuth | Edge | Link cover letter to resume |
| POST | `/api/v1/cover-letters/:id/sync` | withAuth | Edge | Sync contact info from linked resume |
| POST | `/api/v1/cover-letters/:id/duplicate` | withAuth | Edge | Duplicate cover letter |

### Document Endpoints (Unified)

| Method | Endpoint | Auth | Runtime | Description |
|--------|----------|------|---------|-------------|
| GET | `/api/v1/documents` | withAuth | Edge | Cross-document search (resumes + cover letters) |
| POST | `/api/v1/documents/package` | withAuth | Edge | Create document package (resume + cover letter) |

### AI Endpoints

| Method | Endpoint | Auth | Runtime | Description |
|--------|----------|------|---------|-------------|
| POST | `/api/v1/ai/generate-cover-letter` | withAuth | Edge (SSE) | Generate cover letter from resume + job description |

### Export Endpoints (Extended)

| Method | Endpoint | Auth | Runtime | Description |
|--------|----------|------|---------|-------------|
| POST | `/api/v1/export/pdf` | withAuth | Node | Export resume, cover letter, or package (ZIP) |

**Request/Response Examples**:

**POST /api/v1/cover-letters** (Create)
```json
// Request
{
  "title": "Cover Letter - Software Engineer at Google",
  "linkedResumeId": "uuid-123" // optional
}

// Response
{
  "success": true,
  "data": {
    "id": "uuid-456",
    "user_id": "uuid-789",
    "linked_resume_id": "uuid-123",
    "title": "Cover Letter - Software Engineer at Google",
    "schema_version": "cover_letter.v1",
    "data": { /* CoverLetterJson */ },
    "version": 1,
    "status": "draft",
    "created_at": "2025-10-03T12:00:00Z",
    "updated_at": "2025-10-03T12:00:00Z"
  }
}
```

**POST /api/v1/cover-letters/:id/sync** (Sync from Resume)
```json
// Request
{
  "fields": ["fullName", "email", "phone", "address"] // optional (defaults to all)
}

// Response
{
  "success": true,
  "data": { /* Updated CoverLetterJson with synced fields */ }
}
```

**POST /api/v1/ai/generate-cover-letter** (AI Generation)
```json
// Request
{
  "resumeId": "uuid-123",
  "jobDescription": "We are seeking a senior software engineer...",
  "tone": "professional" // 'professional' | 'conversational' | 'formal'
}

// Response (SSE Stream)
// event: progress
// data: {"percentage": 20, "message": "Analyzing resume..."}
//
// event: update
// data: {"from": {"fullName": "John Doe"}}
//
// event: complete
// data: { /* Complete CoverLetterJson */ }
```

---

## 8. Implementation Order

### Sequenced Timeline (45-58 hours)

**Phase 7A: Foundation (6-7 hours)**
- [ ] Database Schema (3-4 hours)
  - Create 4 migration files
  - Validate SQL syntax
  - Document RLS policies
- [ ] Centralized Utilities (2-3 hours)
  - Generic document repository
  - Store factory
  - Type definitions

**Phase 7B: Rich Text Editor (8-10 hours)**
- [ ] Rich Text Components (8-10 hours)
  - RichTextEditor.tsx
  - RichTextToolbar.tsx
  - useRichTextEditor.ts hook
  - Sanitizer + Serializer
  - Visual verification (desktop + mobile)

**Phase 7C: Cover Letter CRUD (6-8 hours)**
- [ ] API Routes (3-4 hours)
  - GET, POST, PUT, DELETE endpoints
  - Link and sync endpoints
- [ ] Repository Layer (2-3 hours)
  - coverLetters.ts functions
  - documentLinker.ts functions
- [ ] Validation (1 hour)
  - Zod schemas

**Phase 7D: Templates (5-6 hours)**
- [ ] Template Implementation (5-6 hours)
  - Classic Block (base template)
  - Modern Minimal (style variations)
  - Creative Bold (style variations)
  - Executive Formal (style variations)

**Phase 7E: Document Linking (7-9 hours)**
- [ ] UI Components (4-5 hours)
  - LinkedResumeSelector
  - SyncButton
  - RelatedDocumentsPanel
- [ ] Integration (2-3 hours)
  - Wire up components to API
  - Visual verification
- [ ] Testing (1 hour)
  - Link/unlink flows
  - Sync validation

**Phase 7F: Multi-Document Dashboard (6-8 hours)**
- [ ] Dashboard Components (4-5 hours)
  - DocumentGrid
  - DocumentFilter
  - DocumentSearch
  - BulkActions
- [ ] API Integration (2-3 hours)
  - Cross-document search endpoint
  - Package creation endpoint

**Phase 7G: AI & Export (6-8 hours)**
- [ ] AI Generation (4-5 hours)
  - Cover letter prompt template
  - SSE streaming endpoint
  - Resume context injection
- [ ] Export Extension (2-3 hours)
  - Cover letter PDF renderer
  - Package ZIP generator

**Phase 7H: Testing & Cleanup (1-2 hours)**
- [ ] Playbook Creation (1 hour)
  - Create cover letter flow
  - Link/sync flow
  - Package creation flow
  - Cross-document search flow
- [ ] Visual Verification (1 hour)
  - All UI components (desktop + mobile)
  - Screenshot documentation

---

### Dependency Graph

```
Database Schema (no deps)
    ↓
Centralized Utilities (no deps)
    ↓
├─→ Rich Text Editor (no deps)
│   ↓
├─→ Cover Letter CRUD (deps: DB, Utils)
│   ↓
│   ├─→ Templates (deps: CRUD)
│   │
│   ├─→ Document Linking (deps: CRUD)
│   │   ↓
│   └─→ Multi-Document Dashboard (deps: CRUD, Linking)
│       ↓
└─→ AI Generation (deps: CRUD)
    ↓
Export Extension (deps: Templates, CRUD)
    ↓
Testing Playbooks (deps: All)
```

**Parallel Work Opportunities**:
1. Rich Text Editor can be built independently (no DB dependencies)
2. Templates can be built in parallel with Document Linking
3. AI Generation can be built in parallel with Multi-Document Dashboard

---

## 9. Research Integration Summary

### Rich Text Editor

**Approach**: ContentEditable + Custom Logic (Hybrid)

**Bundle Size**: 13 KB (isomorphic-dompurify only)

**Performance**: <100ms keystroke response (60-80ms measured in research)

**Why Chosen**:
- Zero framework overhead (native contentEditable)
- Complete control over JSON serialization
- Meets all requirements (bold, italic, underline, lists)
- Libraries like Lexical (22 KB), TipTap (85 KB) are overkill

**Implementation**:
- ContentEditable for input
- Custom state management (Zustand + zundo for undo/redo)
- isomorphic-dompurify for XSS defense (client + server)
- Custom HTML ↔ RichTextBlock[] serialization

---

### Content Sanitization

**Approach**: isomorphic-dompurify (Two-Layer Defense)

**Why Chosen**:
- Works in Edge runtime (client + server)
- Industry-standard DOMPurify core (15.9k stars, Cure53-audited)
- 17 KB gzipped (acceptable for security-critical feature)
- Full TypeScript support

**Implementation**:
- Client-side sanitization (on input, paste, load)
- Server-side validation (API routes)
- Allowed tags: `p`, `strong`, `em`, `u`, `ul`, `ol`, `li`, `br`
- No attributes allowed (eliminates XSS surface area)

**Security Validated**:
- Script injection: blocked
- Event handlers: blocked
- Iframe/object tags: blocked
- Style injection: blocked

---

### Document Linking

**Approach**: Hybrid FK + Junction Pattern with Denormalized user_id

**Why Chosen**:
- FK provides referential integrity (resume↔cover letter)
- Junction enables metadata (sync timestamps, synced fields)
- Denormalized user_id avoids RLS JOIN penalty (Phase 6 learning)
- SET NULL cascade preserves orphaned cover letters (UX requirement)

**Implementation**:
- `cover_letters.linked_resume_id` FK with `ON DELETE SET NULL`
- `document_relationships` junction table for metadata
- Manual sync pattern (not automatic)
- Selective field sync (contact info only, not work history)

**Performance**:
- Link operation: <100ms (single FK update + junction insert)
- Sync operation: <200ms (fetch resume + update cover letter)
- No sequential scans (denormalized user_id + indexes)

---

### Search Strategy

**Approach**: UNION Query with Denormalized user_id

**Why Chosen**:
- Simple (2-3 document types max)
- No JOIN in RLS (denormalized user_id)
- Fast for <1000 documents (Phase 7 target)
- Type-safe results (discriminated unions)

**Implementation**:
```typescript
// Parallel queries (no JOIN)
const resumes = await supabase
  .from('resumes')
  .select('*')
  .eq('user_id', userId)
  .ilike('title', `%${query}%`)

const coverLetters = await supabase
  .from('cover_letters')
  .select('*')
  .eq('user_id', userId)
  .ilike('title', `%${query}%`)

// Merge + sort client-side
const results = [...resumes, ...coverLetters].sort((a, b) =>
  new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
)
```

**Performance**: <300ms for 1000 documents (within Phase 7 budget)

---

### Package Management

**Approach**: Dedicated Packages Table with CASCADE DELETE

**Why Chosen**:
- Strict integrity (packages meaningless without resume + cover letter)
- CASCADE DELETE automatically removes packages when either document deleted
- Denormalized user_id (RLS performance)
- Supports job application tracking (external ATS IDs)

**Implementation**:
- `document_packages` table with FK to both `resumes` and `cover_letters`
- Both FKs use `ON DELETE CASCADE`
- Export API fetches package → generates ZIP with resume.pdf + cover_letter.pdf

---

## 10. Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **Rich Text XSS** | Low | High | Two-layer sanitization (client + server), allowed tags only |
| **RLS Performance** | Low | Medium | Denormalized user_id (no JOIN), indexed RLS columns |
| **Orphaned Documents** | Medium | Low | SET NULL cascade + cleanup trigger, UI shows "Unlinked" badge |
| **Concurrent Sync** | Low | Medium | Optimistic locking via `version` column, 409 Conflict on mismatch |
| **Bundle Size** | Low | Low | isomorphic-dompurify is only 17 KB, no heavy frameworks |
| **Package Integrity** | Low | High | CASCADE DELETE + FK constraints, validate ownership |

### Implementation Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **Schema Migration Failure** | Low | Critical | Test on dev DB first, rollback plan, incremental migration |
| **RLS Policy Gaps** | Medium | Critical | 4 CRUD policies per table, explicit ownership checks in API |
| **Factory Pattern Bugs** | Medium | Medium | Comprehensive tests, gradual rollout (resume store first) |
| **Rich Text Editor Bugs** | Medium | Medium | Extensive testing (paste attacks, undo/redo, long content) |

### UX Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| **Unexpected Orphaned CLs** | High | Medium | Clear UI indicator ("Unlinked" badge), explain in tooltips |
| **Sync Confusion** | Medium | Medium | Manual sync only, clear "Sync" button, show last sync timestamp |
| **Package Deletion Surprise** | Medium | High | Warn before deleting resume: "This will delete X packages" |
| **Search Performance** | Low | Medium | <300ms budget, pagination, index optimization |

### Mitigation Actions

**Before Implementation**:
1. Review all RLS policies (no gaps)
2. Test migration rollback procedure
3. Validate sanitization against OWASP XSS vectors
4. Benchmark search performance (1000 documents)

**During Implementation**:
1. Add comprehensive error logging (no PII)
2. Implement fallback UI for failed syncs
3. Add confirmation dialogs for destructive actions
4. Visual verification at each milestone

**After Implementation**:
1. Run security audit (XSS, CSRF, RLS bypass attempts)
2. Performance testing (p95 latency for all endpoints)
3. User acceptance testing (create, link, sync, delete flows)
4. Documentation update (API docs, user guide)

---

## Success Criteria

**Phase 7 is complete when**:

✅ All 4 migrations created (NOT applied until user approval)
✅ Cover letter CRUD fully functional (create, edit, save, delete)
✅ Rich text editor works (bold, italic, underline, bullet/numbered lists)
✅ XSS sanitization validated (client + server)
✅ Document linking works (link, unlink, sync contact info)
✅ Unified dashboard shows both resumes and cover letters
✅ Cross-document search functional (<300ms)
✅ Package creation works (resume + cover letter ZIP export)
✅ AI generation works (cover letter from resume + job description)
✅ 4 cover letter templates render correctly (all design tokens used)
✅ All API endpoints return correct `ApiResponse` format
✅ All RLS policies in place (4 CRUD per table)
✅ Visual verification completed (desktop + mobile screenshots)
✅ 4 playbooks created (cover letter CRUD, linking, packages, AI generation)

---

**End of Implementation Plan**

**Next Step**: Review plan with user → Apply migrations → Begin implementation following sequenced timeline.
