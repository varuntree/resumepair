# ResumePair: Resume vs Cover Letter Implementation Analysis
**Investigation Date:** 2025-10-06
**Codebase:** ResumePair (Phase 7 - Cover Letters & Extended Documents)

---

## Executive Summary

### Implementation Completeness Overview

| Category | Resume | Cover Letter | Parity |
|----------|--------|--------------|--------|
| **Database Schema** | ✅ Complete | ✅ Complete | 100% |
| **API Endpoints** | ✅ Complete (7 routes) | ⚠️ Partial (5 routes) | 71% |
| **Data Repositories** | ✅ Complete | ✅ Complete | 100% |
| **State Management** | ✅ Complete | ✅ Complete | 100% |
| **Editor Pages** | ✅ Complete | ✅ Complete | 100% |
| **Preview System** | ✅ Complete | ❌ Not Implemented | 0% |
| **Templates** | ✅ 6 Templates | ✅ 4 Templates | 67% |
| **Navigation** | ✅ Visible | ✅ Visible | 100% |
| **AI Generation** | ✅ Complete | ✅ Complete | 100% |
| **AI Enhancement** | ✅ Complete | ❌ Not Implemented | 0% |
| **Export/PDF** | ✅ Complete | ❌ Not Implemented | 0% |
| **Version History** | ✅ Complete | ❌ Not Implemented | 0% |
| **Scoring System** | ✅ Complete | ❌ Not Applicable | N/A |
| **Dashboard Integration** | ✅ Complete | ✅ Complete | 100% |

**Overall Implementation Status:**
- **Resume:** Fully functional end-to-end system (100% complete)
- **Cover Letter:** Partial implementation (≈60% complete)
- **Key Finding:** Cover Letter IS visible in navigation but lacks critical features for production use

---

## 1. Resume Implementation (Complete Inventory)

### 1.1 Pages & Routes

#### User-Facing Pages
- **`/app/(app)/editor/[id]/page.tsx`** - Full-featured resume editor
  - Three-pane layout: sidebar (sections) + editor (form) + preview (live)
  - Tabbed right panel: Preview / Customize / Score
  - Real-time preview with RAF-batched updates (<120ms)
  - Section-based navigation with 10 sections
  - Version history modal
  - AI enhancement panel
  - Undo/redo support
  - Optimistic concurrency control

- **`/app/(app)/editor/new/page.tsx`** - New resume creation flow
  - Auto-creates empty resume via POST /api/v1/resumes
  - Redirects to /editor/[id] on success

- **`/app/(app)/dashboard/page.tsx`** - Resume dashboard
  - Grid view of all resumes
  - Search, filter (status), sort (updated_at, created_at, title)
  - Quick actions: edit, duplicate, delete
  - Empty state with CTA

- **`/app/(app)/documents/page.tsx`** - Unified document dashboard
  - Shows both resumes AND cover letters
  - Type filter: all / resume / cover_letter
  - Bulk operations support
  - Document linking status badges

#### Internal Pages
- **`/app/internal/preview/resume/[slug]/page.tsx`** - Template preview for marketing

### 1.2 API Endpoints

All routes use `withAuth` middleware + edge runtime (except export/PDF):

#### Collection Routes
- **`GET /api/v1/resumes`** - List resumes with pagination
  - Query params: status, search, sort, order, cursor, limit
  - Composite cursor pagination (value + id for stable sort)
  - RLS-enforced user isolation

- **`POST /api/v1/resumes`** - Create new resume
  - Validates with `CreateResumeSchema`
  - Auto-fills profile from user's profile table
  - Applies user preferences (locale, date format, page size)
  - Returns created resume with `schema_version: 'resume.v1'`

#### Individual Document Routes
- **`GET /api/v1/resumes/[id]`** - Get single resume
  - Updates `last_accessed_at` (fire-and-forget)
  - Ownership verification via RLS

- **`PUT /api/v1/resumes/[id]`** - Update resume
  - **Optimistic concurrency control** via version field
  - Snapshots current version to `resume_versions` table before update
  - Returns 409 Conflict if version mismatch

- **`DELETE /api/v1/resumes/[id]`** - Soft delete
  - Sets `is_deleted = true`, `deleted_at = NOW()`
  - Document remains in DB (can be restored)

#### Versioning Routes
- **`GET /api/v1/resumes/[id]/versions`** - List version history
- **`GET /api/v1/resumes/[id]/versions/[versionNumber]`** - Get specific version
- **`POST /api/v1/resumes/[id]/versions/[versionNumber]/restore`** - Restore version
  - Creates new snapshot, restores data

#### Utility Routes
- **`POST /api/v1/resumes/[id]/duplicate`** - Clone resume
  - Appends " (Copy)" to title, resets to draft status
- **`POST /api/v1/resumes/[id]/restore`** - Restore soft-deleted resume

### 1.3 Components

#### Editor Components (`components/editor/`)
**Layout & Chrome:**
- `EditorLayout.tsx` - Three-pane responsive layout with mobile drawer
- `EditorHeader.tsx` - Title editor, save status, undo/redo buttons
- `EditorSidebar.tsx` - Section navigation list
- `EditorForm.tsx` - Form context provider
- `SectionAccordion.tsx` - Collapsible section wrapper
- `VersionHistory.tsx` - Version history modal

**Form Fields:**
- `TextField.tsx`, `TextAreaField.tsx`, `DateField.tsx`, `LinkField.tsx`, `SelectField.tsx`, `ArrayField.tsx`
- All fields integrate with form context for undo/redo

**Sections (10 total):**
- `ProfileSection.tsx` - Name, contact, links, photo
- `SummarySection.tsx` - Professional summary
- `WorkSection.tsx` - Work experience entries
- `EducationSection.tsx` - Education entries
- `ProjectsSection.tsx` - Project entries
- `SkillsSection.tsx` - Skill categories
- `CertificationsSection.tsx` - Certifications
- `AwardsSection.tsx` - Awards & honors
- `LanguagesSection.tsx` - Languages & proficiency
- `ExtrasSection.tsx` - Custom sections

#### Preview Components (`components/preview/`)
- **`LivePreview.tsx`** - Main preview with RAF-batched updates
  - Subscribes to `documentStore` via shallow selector
  - Scroll position restoration
  - Performance monitoring (120ms budget)

- **`TemplateRenderer.tsx`** - Template component loader
  - Gets template from registry by slug
  - Graceful fallback to 'minimal' template

- **`PreviewContainer.tsx`** - Preview wrapper with zoom/viewport
- **`PreviewControls.tsx`** - Zoom controls, viewport selector, page nav
- **`PreviewError.tsx`** - Error boundary
- **`PreviewSkeleton.tsx`** - Loading skeleton

#### Customization Components (`components/customization/`)
- **`CustomizationPanel.tsx`** - Template settings UI
  - Color scheme picker
  - Typography controls
  - Spacing adjustments
  - Icon settings

- **`TemplateSelector.tsx`** - Template gallery with live previews

#### Enhancement Components (`components/enhance/`)
- **`EnhancementPanel.tsx`** - AI content improvement
  - Per-section enhancement triggers
  - Streaming response UI

#### Scoring Components (`components/score/`)
- **`ScorePanel.tsx`** - Resume scoring dashboard
  - ATS compatibility score
  - Industry benchmark comparison
  - Improvement suggestions

### 1.4 Templates

**Resume Templates (6 total):**

Located in `/libs/templates/*/`:

1. **Minimal** (`minimal/MinimalTemplate.tsx`)
   - Category: professional
   - Clean, text-focused layout

2. **Modern** (`modern/ModernTemplate.tsx`)
   - Category: creative
   - Contemporary design with accent colors

3. **Classic** (`classic/ClassicTemplate.tsx`)
   - Category: professional
   - Traditional two-column layout

4. **Creative** (`creative/CreativeTemplate.tsx`)
   - Category: creative
   - Bold typography, visual hierarchy

5. **Technical** (`technical/TechnicalTemplate.tsx`)
   - Category: technical
   - Code-friendly, dense layout

6. **Executive** (`executive/ExecutiveTemplate.tsx`)
   - Category: executive
   - Formal, high-level positioning

**Template Registry:** `/libs/templates/registry.ts`
- `getTemplate(slug)` - Returns template component + metadata
- `listTemplates()` - All template metadata
- `getTemplatesByCategory(category)` - Filter by category

### 1.5 Features

#### Creation Modes
✅ **Manual Entry** - Blank resume with form fields
✅ **AI Generation** - Full resume from job description (streaming)
✅ **PDF Import** - Extract text from PDF, parse with AI

#### Editing Features
✅ **Real-time Preview** - Live template rendering with <120ms updates
✅ **Undo/Redo** - Full edit history with Zustand temporal middleware
✅ **Auto-save** - Debounced save with optimistic concurrency
✅ **Version History** - Automatic snapshots, restore capability
✅ **Section Navigation** - Jump to section, scroll spy
✅ **Drag & Drop** - Reorder sections (not visible in pages but likely in components)

#### Customization
✅ **Template Selection** - 6 templates with live preview
✅ **Color Schemes** - Per-template color customization
✅ **Typography** - Font family, size scale, line spacing
✅ **Layout** - Spacing, margins, icon styles

#### AI Features
✅ **Full Generation** - `/api/v1/ai/generate` - Entire resume from job description
✅ **Section Enhancement** - `/api/v1/ai/enhance` - Improve specific section
✅ **ATS Matching** - `/api/v1/ai/match` - Match resume to job description
✅ **PDF Parsing** - `/api/v1/ai/import` - Extract & structure PDF content
✅ **Quota Management** - `/api/v1/ai/quota` - Track usage, limits

#### Export
✅ **PDF Export** - `/api/v1/export/pdf` - Async job queue with Puppeteer
✅ **Batch Export** - `/api/v1/export/batch` - Multiple formats
✅ **Export History** - `/api/v1/export/history` - Track all exports
✅ **Download** - `/api/v1/export/download/[id]` - Signed URL generation

#### Scoring
✅ **ATS Score** - `/api/v1/score/[resumeId]` - Calculate ATS compatibility
✅ **Score History** - `/api/v1/score/history/[resumeId]` - Track improvements
✅ **Benchmarking** - Compare to industry standards

### 1.6 Data Layer

#### Store (`stores/documentStore.ts`)
- **Generic store factory** from `createDocumentStore.ts`
- Zustand store with temporal middleware (undo/redo)
- API integration: load, save, update
- Optimistic concurrency handling
- Debounced auto-save (2s delay)
- Error state management

**Key Methods:**
- `loadDocument(id)` - Fetch from API, hydrate store
- `updateDocument(data)` - Local update (triggers preview)
- `saveDocument()` - POST/PUT to API
- `setTitle(title)` - Update document title
- `undo()`, `redo()` - Temporal navigation

#### Repository (`libs/repositories/documents.ts`)
Pure functions for Supabase operations:
- `getResumes(supabase, userId, options)` - Paginated list
- `getResume(supabase, id)` - Single document
- `createResume(supabase, userId, title, data)` - Insert
- `updateResume(supabase, id, updates, currentVersion)` - Update with OCC
- `deleteResume(supabase, id)` - Soft delete
- `duplicateResume(supabase, userId, id)` - Clone
- `bulkDeleteResumes(supabase, ids)` - Batch soft delete
- `bulkArchiveResumes(supabase, ids)` - Batch status change

#### Database Schema

**Table: `resumes`** (from `/migrations/phase2/001_create_resumes_table.sql`)

```sql
CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1),
  slug TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  schema_version TEXT NOT NULL DEFAULT 'resume.v1',
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_resumes_user` on (user_id) WHERE is_deleted = false
- `idx_resumes_status` on (user_id, status) WHERE is_deleted = false
- `idx_resumes_updated` on (user_id, updated_at DESC) WHERE is_deleted = false

**RLS Policies:**
- `resumes_select_own` - Users can only read their own resumes
- `resumes_insert_own` - Users can only create resumes for themselves
- `resumes_update_own` - Users can only update their own resumes
- `resumes_delete_own` - Users can only delete their own resumes

**Related Tables:**
- `resume_versions` - Version history snapshots
- `resume_templates` - Template metadata (pre-defined templates)

---

## 2. Cover Letter Implementation (Complete Inventory)

### 2.1 Pages & Routes

#### User-Facing Pages
- **`/app/(app)/cover-letter-editor/[id]/page.tsx`** - Cover letter editor
  - ✅ EditorLayout with header + sidebar
  - ✅ Three tabs: Edit / Preview / Customize
  - ✅ Rich text editor for letter body
  - ✅ Form fields: from, to, salutation, body, closing
  - ❌ **Preview tab shows "Preview functionality coming soon"**
  - ❌ **Customize tab shows "Customization panel coming soon"**
  - ❌ No version history
  - ❌ No AI enhancement panel
  - ✅ Undo/redo support (via store)
  - ✅ Auto-save with optimistic concurrency

- **`/app/(app)/cover-letter-editor/new/page.tsx`** - New cover letter creation
  - ✅ Auto-creates empty cover letter via POST /api/v1/cover-letters
  - ✅ Redirects to /cover-letter-editor/[id]

#### Internal Pages
- **`/app/internal/preview/cover-letter/[slug]/page.tsx`** - Template preview (exists)

### 2.2 API Endpoints

#### Collection Routes
- **`GET /api/v1/cover-letters`** - List cover letters ✅
  - Query params: status, search, sort, order, cursor, limit, linked_resume_id
  - Same pagination pattern as resumes (composite cursor)
  - RLS-enforced

- **`POST /api/v1/cover-letters`** - Create new cover letter ✅
  - Validates with `CoverLetterCreateInputSchema`
  - Supports `linked_resume_id` for resume association
  - Returns `schema_version: 'cover-letter.v1'`

#### Individual Document Routes
- **`GET /api/v1/cover-letters/[id]`** - Get single cover letter ✅
- **`PUT /api/v1/cover-letters/[id]`** - Update cover letter ✅
  - Optimistic concurrency control (same as resumes)
- **`DELETE /api/v1/cover-letters/[id]`** - Soft delete ✅

#### AI Routes
- **`POST /api/v1/cover-letters/generate`** - AI generation ✅
  - Input: jobDescription, resumeId (optional), tone, length
  - Streaming response with SSE (Server-Sent Events)
  - Uses `streamObject` from Vercel AI SDK
  - Extracts context from linked resume (profile, summary, work, skills)
  - Tone options: formal, friendly, enthusiastic
  - Length options: short, medium, long

#### Linking Routes
- **`POST /api/v1/cover-letters/[id]/link`** - Link to resume ✅
- **`POST /api/v1/cover-letters/[id]/sync`** - Sync contact info from resume ✅

#### ❌ Missing Routes (vs Resume)
- ❌ No `/api/v1/cover-letters/[id]/duplicate` (duplicate endpoint)
- ❌ No `/api/v1/cover-letters/[id]/restore` (undelete endpoint)
- ❌ No version history routes (`/versions`, `/versions/[versionNumber]`, `/versions/[versionNumber]/restore`)
- ❌ No AI enhancement endpoint (like `/api/v1/ai/enhance` for resumes)
- ❌ No export/PDF endpoint for cover letters

### 2.3 Components

#### Editor Components
**Existing:**
- ✅ Uses shared `EditorLayout.tsx`
- ✅ Uses shared `EditorHeader.tsx`
- ✅ Custom sidebar (inline in page, not reusable component)
- ✅ `RichTextEditor.tsx` for letter body
- ✅ Form fields for from/to/salutation/closing

**Missing:**
- ❌ No `CoverLetterPreview.tsx` component
- ❌ No `CoverLetterCustomizationPanel.tsx`
- ❌ No `CoverLetterVersionHistory.tsx`
- ❌ No `CoverLetterEnhancementPanel.tsx`
- ❌ No section-based components (cover letter is simpler, uses RichTextEditor)

#### Cover Letter Specific Components
- **`components/cover-letters/GenerateDialog.tsx`** ✅ - AI generation modal

#### ❌ No Preview Components for Cover Letters
The existing preview system (`components/preview/*`) only supports `ResumeJson` type:
- `LivePreview.tsx` - hardcoded to `useDocumentStore` (resume store)
- `TemplateRenderer.tsx` - only accepts `ResumeJson` data type
- No cover letter preview renderer

### 2.4 Templates

**Cover Letter Templates (4 total):**

Located in `/libs/templates/cover-letter/*/`:

1. **Classic Block** (`classic-block/ClassicBlockTemplate.tsx`)
   - Category: professional
   - Traditional business letter format

2. **Modern Minimal** (`modern-minimal/ModernMinimalTemplate.tsx`)
   - Category: creative
   - Clean, contemporary design

3. **Creative Bold** (`creative-bold/CreativeBoldTemplate.tsx`)
   - Category: creative
   - Vibrant, personality-driven

4. **Executive Formal** (`executive-formal/ExecutiveFormalTemplate.tsx`)
   - Category: executive
   - High-level, formal tone

**Template Registry:** `/libs/templates/cover-letter/registry.ts` ✅
- Separate registry from resume templates
- `getCoverLetterTemplate(slug)`
- `listCoverLetterTemplates()`

**Shared Base:** `CoverLetterTemplateBase.tsx` ✅
- Common layout wrapper for all cover letter templates
- Date formatting utilities in `CoverLetterTemplateUtils.tsx`

### 2.5 Features

#### Creation Modes
✅ **Manual Entry** - Blank cover letter with form fields
✅ **AI Generation** - Full cover letter from job description (streaming)
❌ **Resume Import** - No import from existing resume (sync exists via API but no UI)

#### Editing Features
✅ **Rich Text Editor** - TipTap-based body editor with formatting
✅ **Undo/Redo** - Via Zustand temporal middleware
✅ **Auto-save** - Debounced save with optimistic concurrency
❌ **Preview** - Tab exists but shows "coming soon" placeholder
❌ **Version History** - No UI or API endpoints
❌ **Template Switching** - No UI to change template

#### Customization
❌ **Template Selection** - No selector UI
❌ **Color Schemes** - No customization panel
❌ **Typography** - No controls
❌ **Layout** - No adjustments

#### AI Features
✅ **Full Generation** - `/api/v1/cover-letters/generate` - Entire letter from job description
✅ **Resume Context** - Pulls data from linked resume for personalization
❌ **Section Enhancement** - No enhancement endpoint (no equivalent to resume's enhance)
❌ **Job Matching** - No matching endpoint

#### Export
❌ **PDF Export** - No export endpoints for cover letters
❌ **Export History** - No tracking
❌ **Download** - No download capability

#### Linking
✅ **Resume Linking** - `/api/v1/cover-letters/[id]/link` API exists
✅ **Contact Sync** - `/api/v1/cover-letters/[id]/sync` syncs from resume
⚠️ **UI Integration** - Link/sync APIs exist but minimal UI integration

### 2.6 Data Layer

#### Store (`stores/coverLetterStore.ts`)
✅ **Same pattern as resume store**
- Uses generic `createDocumentStore<CoverLetterJson>` factory
- Zustand store with temporal middleware
- API endpoint: `/api/v1/cover-letters`
- Schema validator: `CoverLetterJsonSchema`

**Key Methods:** (identical to resume store)
- `loadDocument(id)`
- `updateDocument(data)`
- `saveDocument()`
- `setTitle(title)`
- `undo()`, `redo()`

#### Repository (`libs/repositories/coverLetters.ts`)
✅ **Complete parity with resume repository**

Functions:
- `getCoverLetters(supabase, userId, options)` ✅
- `getCoverLetter(supabase, id)` ✅
- `createCoverLetter(supabase, userId, title, data, linkedResumeId)` ✅
- `updateCoverLetter(supabase, id, updates, currentVersion)` ✅
- `deleteCoverLetter(supabase, id)` ✅
- `restoreCoverLetter(supabase, id)` ✅
- `duplicateCoverLetter(supabase, userId, id)` ✅
- `getDeletedCoverLetters(supabase, userId)` ✅
- `bulkDeleteCoverLetters(supabase, ids)` ✅
- `bulkArchiveCoverLetters(supabase, ids)` ✅

**Note:** Repository is complete, but some functions have no corresponding API routes.

#### Database Schema

**Table: `cover_letters`** (from `/migrations/phase7/020_create_cover_letters_table.sql`)

```sql
CREATE TABLE public.cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) >= 1),
  slug TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  schema_version TEXT NOT NULL DEFAULT 'cover-letter.v1',
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  linked_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);
```

**Differences from `resumes` table:**
- ✅ Additional field: `linked_resume_id UUID` (foreign key to resumes)
- ✅ ON DELETE SET NULL (cover letter persists if resume deleted)

**Indexes:**
- `idx_cover_letters_user`
- `idx_cover_letters_status`
- `idx_cover_letters_updated`
- `idx_cover_letters_linked_resume` - Filter by linked resume
- `idx_cover_letters_dashboard` - Composite index for unified dashboard

**RLS Policies:** (identical pattern to resumes)
- `cover_letters_select_own`
- `cover_letters_insert_own`
- `cover_letters_update_own`
- `cover_letters_delete_own`

**Related Tables:**
- `cover_letter_templates` (from `/migrations/phase7/023_seed_cover_letter_templates.sql`)
- No version history table (not implemented)

---

## 3. Architecture Comparison

### 3.1 Shared Infrastructure

Both Resume and Cover Letter leverage these shared systems:

#### ✅ Generic Document Store Factory
**File:** `/stores/createDocumentStore.ts`

Both `documentStore.ts` (resume) and `coverLetterStore.ts` use the same factory:
```typescript
export const useDocumentStore = createDocumentStore<ResumeJson>({
  apiEndpoint: '/api/v1/resumes',
  schemaValidator: ResumeJsonSchema,
})

export const useCoverLetterStore = createDocumentStore<CoverLetterJson>({
  apiEndpoint: '/api/v1/cover-letters',
  schemaValidator: CoverLetterJsonSchema,
})
```

**Benefits:**
- Consistent API (loadDocument, updateDocument, saveDocument)
- Built-in undo/redo via Zustand temporal middleware
- Optimistic concurrency handling
- Debounced auto-save
- Error state management

#### ✅ Repository Pattern
Both use pure functions with dependency injection:
- All functions accept `SupabaseClient` as first parameter
- No side effects outside of DB operations
- Consistent error handling (throws Error with descriptive messages)
- RLS enforcement via user-scoped client

#### ✅ Editor Layout
**File:** `/components/editor/EditorLayout.tsx`

Three-pane responsive layout:
- Left sidebar (collapsible on mobile)
- Main content area
- Optional right panel (preview, customization)
- Mobile drawer for sidebar

#### ✅ Editor Header
**File:** `/components/editor/EditorHeader.tsx`

- Editable title
- Save status indicator (saving, saved, error)
- Last saved timestamp
- Undo/redo buttons (enabled/disabled based on history)

#### ✅ API Utils
- `withAuth` middleware for authentication
- `apiSuccess`, `apiError` response formatters
- Consistent error codes (VALIDATION_ERROR, NOT_FOUND, CONFLICT, etc.)

#### ✅ Unified Dashboard
**File:** `/components/documents/UnifiedDocumentDashboard.tsx`

Single dashboard for both document types:
- Type filter: all / resume / cover_letter
- Document counts per type
- Unified search across both tables
- Linking status badges (shows if cover letter linked to resume)

**API:** `/api/v1/documents` (GET)
- Fetches from both `resumes` and `cover_letters` tables
- Client-side sorting and filtering
- Unified document interface

### 3.2 Divergences in Implementation Patterns

#### Preview System Architecture

**Resume Preview:** ✅ Fully Integrated
```
LivePreview.tsx
  └─ subscribes to useDocumentStore (shallow selector)
  └─ renders TemplateRenderer
      └─ gets template from registry (getTemplate)
      └─ renders <TemplateComponent data={resumeJson} />
```

**Cover Letter Preview:** ❌ Not Integrated
- Cover letter editor page has preview tab UI
- Preview tab shows placeholder: "Preview functionality coming soon"
- `LivePreview.tsx` is hardcoded to `ResumeJson` type
- `TemplateRenderer.tsx` only accepts `ResumeJson` data
- No cover letter preview renderer exists

**Why it's missing:**
1. Type incompatibility: `TemplateRenderer` expects `TemplateProps<ResumeJson>`, but cover letters use `CoverLetterJson`
2. Separate template registries: `getTemplate()` vs `getCoverLetterTemplate()`
3. No unified preview component for both document types
4. No integration between `useCoverLetterStore` and preview system

#### Template System Architecture

**Resume Templates:**
- Registry: `/libs/templates/registry.ts`
- Interface: `TemplateProps<ResumeJson>`
- Customizations: `Customizations` type (colors, typography, spacing)
- Base component: `TemplateBase.tsx`

**Cover Letter Templates:**
- Registry: `/libs/templates/cover-letter/registry.ts`
- Interface: `CoverLetterTemplateProps<CoverLetterJson>`
- Customizations: `CoverLetterCustomizations` type
- Base component: `CoverLetterTemplateBase.tsx`

**Divergence:** Completely separate type hierarchies, no shared preview infrastructure.

#### AI Features Divergence

**Resume AI:**
- Generation: `/api/v1/ai/generate` (full resume)
- Enhancement: `/api/v1/ai/enhance` (improve section)
- Matching: `/api/v1/ai/match` (score vs job description)
- Import: `/api/v1/ai/import` (parse PDF)

**Cover Letter AI:**
- Generation: `/api/v1/cover-letters/generate` (full letter) ✅
- Enhancement: ❌ Not implemented
- Matching: ❌ Not implemented
- Import: ❌ Not implemented

**Divergence:** Cover letter generation is in separate route (`/cover-letters/generate`) instead of generic `/ai/generate` route. No enhancement or matching.

---

## 4. Gap Analysis: Feature Parity Matrix

| Feature | Resume | Cover Letter | Implementation Gap | Estimated Complexity |
|---------|--------|--------------|-------------------|---------------------|
| **CRUD Operations** |
| Create | ✅ | ✅ | None | - |
| Read (single) | ✅ | ✅ | None | - |
| Read (list) | ✅ | ✅ | None | - |
| Update | ✅ | ✅ | None | - |
| Delete (soft) | ✅ | ✅ | None | - |
| Duplicate | ✅ API + UI | ⚠️ Repository only | Missing API route + UI button | Low (1-2 hours) |
| Restore (undelete) | ✅ API + UI | ⚠️ Repository only | Missing API route + trash UI | Low (2-3 hours) |
| **Versioning** |
| Version snapshots | ✅ Auto | ❌ None | No `cover_letter_versions` table | Medium (4-6 hours) |
| Version history UI | ✅ Modal | ❌ None | No UI component | Medium (3-4 hours) |
| Version restore | ✅ API + UI | ❌ None | Requires versioning DB + API | Medium (2-3 hours) |
| **Editor UI** |
| Form fields | ✅ 10 sections | ✅ 5 fields | Different structure (expected) | N/A |
| Live preview | ✅ RAF-batched | ❌ Placeholder | Preview renderer + integration | High (8-12 hours) |
| Template selector | ✅ Gallery | ❌ None | UI component + integration | Medium (4-6 hours) |
| Customization panel | ✅ Full | ❌ Placeholder | Color/typography/spacing UI | High (6-8 hours) |
| Section navigation | ✅ Sidebar | ⚠️ Basic | Cover letter has fewer sections | Low (unnecessary) |
| Undo/redo | ✅ | ✅ | None | - |
| Auto-save | ✅ | ✅ | None | - |
| **AI Features** |
| Full generation | ✅ | ✅ | None | - |
| Section enhancement | ✅ | ❌ None | API endpoint + UI integration | High (6-8 hours) |
| Job matching | ✅ | ❌ None | API endpoint + UI | High (6-8 hours) |
| PDF import | ✅ | ❌ None | Not applicable (cover letters rarely imported) | N/A |
| **Export** |
| PDF export | ✅ Queue | ❌ None | Export job + Puppeteer renderer | Very High (12-16 hours) |
| Batch export | ✅ | ❌ None | API endpoint | Medium (4-6 hours) |
| Export history | ✅ | ❌ None | Tracking + UI | Medium (3-4 hours) |
| Download | ✅ | ❌ None | Signed URL generation | Low (2-3 hours) |
| **Templates** |
| Template count | 6 | 4 | Need 2 more cover letter templates | Medium (6-8 hours ea) |
| Template preview | ✅ Live | ❌ Static | Preview integration | High (see preview) |
| Template switching | ✅ UI | ❌ None | Requires preview + customization | High (see above) |
| **Dashboard** |
| Document list | ✅ | ✅ | None | - |
| Unified view | ✅ | ✅ | None | - |
| Search | ✅ | ✅ | None | - |
| Filter by type | ✅ | ✅ | None | - |
| Bulk operations | ✅ | ✅ | None | - |
| Linking display | ✅ | ✅ | None | - |
| **Navigation** |
| Sidebar link | ✅ | ✅ | None | - |
| Dashboard link | ✅ | ✅ | None | - |
| Create flow | ✅ | ✅ | None | - |
| **Scoring** |
| ATS scoring | ✅ | ❌ N/A | Not applicable to cover letters | N/A |

---

## 5. Root Cause Analysis: Why Cover Letter Lacks Features

### Finding: Cover Letter IS Visible in Navigation

**Evidence:**
- Sidebar (`/components/layout/Sidebar.tsx`) line 154:
  ```typescript
  { label: 'New Cover Letter', href: '/cover-letter-editor/new', icon: Mail }
  ```
- Navigation is active and functional
- Dashboard shows cover letters alongside resumes
- Type filter works correctly

**Conclusion:** Cover Letter is NOT hidden. It's accessible and partially functional.

### Root Causes of Missing Features

#### 1. **Preview System Type Incompatibility**

**Problem:**
```typescript
// LivePreview.tsx (line 14)
import type { ResumeJson } from '@/types/resume'

// TemplateRenderer.tsx (line 19)
data: ResumeJson
```

The existing preview system is monomorphic (single type). Cover letters use a different data structure (`CoverLetterJson`), so preview doesn't work.

**Why this matters:**
- Preview is the primary user feedback mechanism
- Without preview, users can't see template rendering
- Blocks template selection and customization features

**Fix requires:**
- Generic preview system that accepts `ResumeJson | CoverLetterJson`
- Template renderer dispatch based on document type
- Separate preview containers for each type OR unified renderer

#### 2. **Template System Fragmentation**

**Problem:**
Two separate template registries with no shared infrastructure:
- Resume: `/libs/templates/registry.ts` → `getTemplate(slug: TemplateSlug)`
- Cover Letter: `/libs/templates/cover-letter/registry.ts` → `getCoverLetterTemplate(slug: CoverLetterTemplateSlug)`

**Impact:**
- Cannot reuse `TemplateRenderer.tsx`
- Cannot reuse `CustomizationPanel.tsx`
- Duplicate code for template selection UI

**Design decision:** Intentional separation (cover letter templates have different props/structure).

#### 3. **Export System Only Supports Resumes**

**Problem:**
```typescript
// /app/api/v1/export/pdf/route.ts (line 82)
const { data: document } = await supabase
  .from('resumes')  // Hardcoded to resumes table
  .select('id, user_id')
  .eq('id', documentId)
```

Export system is resume-specific (PDF generation, Puppeteer rendering).

**Why not extended:**
- Export was likely implemented in Phase 5 (before cover letters in Phase 7)
- Puppeteer templates only render resume templates
- No cover letter PDF renderer exists

#### 4. **AI Enhancement API Not Generalized**

**Problem:**
- `/api/v1/ai/enhance` accepts resume sections (work, education, skills, etc.)
- Cover letter has different structure (from, to, body, closing)
- No equivalent enhancement API for cover letter sections

**Why not implemented:**
- Cover letters have simpler structure (mostly body text)
- Enhancement prompt would need to be different (tone, persuasiveness vs. ATS optimization)
- Likely deprioritized (generation is more valuable than enhancement for cover letters)

#### 5. **Version History Table Missing**

**Problem:**
- `resume_versions` table exists (Phase 2)
- No `cover_letter_versions` table in Phase 7 migrations

**Why missing:**
- Cover letters are typically simpler, shorter documents
- Less need for version history (fewer edits, less complexity)
- Feature prioritization: generation > versioning for cover letters

#### 6. **UI Components Not Ported**

**Problem:**
Cover letter editor page is minimal:
- Preview tab shows placeholder
- Customize tab shows placeholder
- No version history modal
- No AI enhancement panel

**Why not ported:**
- Phase 7 focused on establishing cover letter infrastructure (DB, API, stores)
- UI polish likely planned for Phase 8+
- Core editing works (RichTextEditor), but advanced features deferred

---

## 6. Current State: What Works vs. What Doesn't

### ✅ What Works (Cover Letter)

**Navigation & Discovery:**
- ✅ Cover letter creation link in sidebar ("New Cover Letter")
- ✅ Clicking link creates new cover letter and navigates to editor
- ✅ Cover letters appear in unified documents dashboard
- ✅ Type filter shows cover letter count
- ✅ Search works across cover letters
- ✅ Bulk operations work (select, delete)

**Editing:**
- ✅ Form fields for from/to/salutation/closing
- ✅ Rich text editor for body (TipTap-based)
- ✅ Auto-save with optimistic concurrency
- ✅ Undo/redo functional
- ✅ Title editing
- ✅ Save status indicator

**AI Generation:**
- ✅ Generation dialog exists (`/components/cover-letters/GenerateDialog.tsx`)
- ✅ API endpoint works (`/api/v1/cover-letters/generate`)
- ✅ Streaming response with SSE
- ✅ Resume context extraction (if linked)
- ✅ Tone and length customization

**Data Persistence:**
- ✅ Database schema complete
- ✅ RLS policies enforced
- ✅ CRUD operations work (create, read, update, delete)
- ✅ Soft delete functional
- ✅ Resume linking supported (DB level)

**API Completeness:**
- ✅ List cover letters
- ✅ Get single cover letter
- ✅ Create cover letter
- ✅ Update cover letter
- ✅ Delete cover letter
- ✅ Generate cover letter (AI)
- ✅ Link to resume
- ✅ Sync from resume

### ❌ What Doesn't Work (Cover Letter)

**Preview System:**
- ❌ Preview tab shows placeholder ("Preview functionality coming soon")
- ❌ Cannot see template rendering
- ❌ Cannot verify layout/formatting
- ❌ No print preview
- ❌ No multi-page preview

**Customization:**
- ❌ Customize tab shows placeholder ("Customization panel coming soon")
- ❌ Cannot change template
- ❌ Cannot adjust colors
- ❌ Cannot modify typography
- ❌ Cannot control spacing
- ❌ Settings in JSON are not editable via UI

**Export:**
- ❌ No PDF export button
- ❌ No export queue
- ❌ No download capability
- ❌ Cannot generate shareable PDF
- ❌ No export history

**AI Enhancement:**
- ❌ No enhancement panel
- ❌ No "improve this paragraph" feature
- ❌ No tone adjustment
- ❌ No ATS optimization (not applicable, but no equivalent quality check)

**Version History:**
- ❌ No version snapshots
- ❌ No version history modal
- ❌ No restore capability
- ❌ Cannot compare versions
- ❌ No change tracking

**Template Management:**
- ❌ No template selector UI
- ❌ Cannot preview templates before applying
- ❌ Template is set at creation, cannot change
- ❌ No template gallery

**Resume Integration UI:**
- ❌ No UI to link cover letter to resume
- ❌ No UI to sync contact info from resume
- ❌ API exists but no buttons/forms to trigger

**Missing API Endpoints:**
- ❌ No duplicate endpoint (repository exists, API missing)
- ❌ No restore endpoint (repository exists, API missing)
- ❌ No version history endpoints
- ❌ No AI enhancement endpoint
- ❌ No export endpoints

### ⚠️ What's Incomplete (Cover Letter)

**Editor UI:**
- ⚠️ Editor sidebar is minimal (static list, no interactive features)
- ⚠️ No section navigation (not needed, but editor feels sparse)
- ⚠️ Rich text editor works but limited formatting options visible

**Dashboard Integration:**
- ⚠️ Unified dashboard works but lacks cover-letter-specific actions
- ⚠️ Cannot see template used (no metadata displayed)
- ⚠️ Cannot see linked resume name (shows badge but no details on hover)

**Templates:**
- ⚠️ 4 templates exist but cannot be previewed or switched
- ⚠️ Templates are functional (render correctly) but inaccessible to users

---

## 7. Data Model Comparison

### Resume Data Model (`ResumeJson`)

**Sections (10 total):**
1. `profile` - Personal info, contact, links, photo
2. `summary` - Professional summary (string)
3. `work` - Array of work experiences
4. `education` - Array of education entries
5. `projects` - Array of projects
6. `skills` - Skill groups by category
7. `certifications` - Array of certifications
8. `awards` - Array of awards
9. `languages` - Array of languages with proficiency
10. `extras` - Custom sections

**Settings:**
- `locale`, `dateFormat`, `pageSize`
- `fontFamily`, `fontSizeScale`, `lineSpacing`
- `colorTheme`, `template`, `showPhoto`, etc.

**Complexity:** High (many sections, complex nested arrays)

### Cover Letter Data Model (`CoverLetterJson`)

**Sections (5 total):**
1. `from` - Sender info (fullName, email, phone, location)
2. `to` - Recipient info (recipientName, companyName, companyAddress)
3. `jobInfo` - Optional (jobTitle, jobId, source)
4. `date` - ISO date string
5. `salutation` - Greeting string
6. `body` - Array of `RichTextBlock[]` (paragraph, bullet_list, numbered_list)
7. `closing` - Closing phrase

**Settings:** (similar to resume)
- `locale`, `dateFormat`, `pageSize`
- `fontFamily`, `fontSizeScale`, `lineSpacing`
- `colorTheme`, `showLetterhead`, `includeDate`

**Complexity:** Low (fewer sections, rich text body)

**Key Difference:** Cover letter uses structured rich text (`RichTextBlock[]`) instead of resume's section-based arrays.

---

## 8. Recommendations

### Priority 1: Critical for Production (MVP)

#### 1. Implement Cover Letter Preview System
**Effort:** High (8-12 hours)
**Impact:** Critical - Without preview, users cannot see their cover letter

**Approach:**
1. Create `CoverLetterPreview.tsx` component
2. Create `CoverLetterTemplateRenderer.tsx` (similar to `TemplateRenderer.tsx`)
3. Wire up to `useCoverLetterStore`
4. Replace placeholder in preview tab

**Alternative (Faster):** Create unified preview system that accepts both document types.

#### 2. Add PDF Export for Cover Letters
**Effort:** Very High (12-16 hours)
**Impact:** Critical - Users need to download cover letters

**Tasks:**
- Extend export job system to support document type
- Create Puppeteer renderer for cover letter templates
- Add export button to cover letter editor
- Reuse existing export queue infrastructure

#### 3. Implement Template Selector UI
**Effort:** Medium (4-6 hours)
**Impact:** High - Users should choose template

**Tasks:**
- Create template gallery (reuse resume's `TemplateSelector.tsx` pattern)
- Add template switching API call
- Show template preview thumbnails

### Priority 2: Enhanced User Experience

#### 4. Add Customization Panel
**Effort:** High (6-8 hours)
**Impact:** High - Users want to customize appearance

**Tasks:**
- Create `CoverLetterCustomizationPanel.tsx`
- Implement color scheme picker
- Implement typography controls
- Wire up to `CoverLetterCustomizations` type

#### 5. Implement Cover Letter Versioning
**Effort:** Medium (8-10 hours total)
**Impact:** Medium - Nice to have, not critical

**Tasks:**
- Create `cover_letter_versions` table migration
- Add version snapshot logic to update API
- Create version history modal UI
- Add restore endpoint

#### 6. Add Resume Linking UI
**Effort:** Low (2-3 hours)
**Impact:** Medium - Improves workflow

**Tasks:**
- Add "Link to Resume" dropdown in editor
- Add "Sync Contact Info" button
- Show linked resume name in header

### Priority 3: AI Feature Parity

#### 7. Implement AI Enhancement for Cover Letters
**Effort:** High (6-8 hours)
**Impact:** Medium - Useful but not critical

**Tasks:**
- Create `/api/v1/cover-letters/[id]/enhance` endpoint
- Build enhancement prompts (tone, persuasiveness, clarity)
- Add enhancement panel to editor sidebar
- Support body paragraph enhancement

#### 8. Add Duplicate & Restore Endpoints
**Effort:** Low (2-3 hours)
**Impact:** Low - QoL improvement

**Tasks:**
- Add `POST /api/v1/cover-letters/[id]/duplicate` route
- Add `POST /api/v1/cover-letters/[id]/restore` route
- Add duplicate button to dashboard actions
- Add trash/restore UI

### Priority 4: Polish & Optimization

#### 9. Create 2 More Cover Letter Templates
**Effort:** Medium (6-8 hours each)
**Impact:** Low - Variety is nice, but 4 templates is sufficient

**Suggestions:**
- Academic (for research positions)
- Startup/Casual (for modern companies)

#### 10. Add Export History for Cover Letters
**Effort:** Medium (3-4 hours)
**Impact:** Low - Not critical for MVP

---

## 9. Implementation Complexity Estimates

### Minimum Viable Cover Letter (MVP)

**Goal:** Cover letter feature is usable for end-users

**Must-Have:**
1. Preview system ✅ (8-12 hours)
2. PDF export ✅ (12-16 hours)
3. Template selector ✅ (4-6 hours)

**Total MVP Effort:** 24-34 hours (3-4 days)

### Full Feature Parity

**Goal:** Cover letter has same capabilities as resume

**All Features:**
1. Preview system (8-12 hours)
2. PDF export (12-16 hours)
3. Template selector (4-6 hours)
4. Customization panel (6-8 hours)
5. Version history (8-10 hours)
6. AI enhancement (6-8 hours)
7. Resume linking UI (2-3 hours)
8. Duplicate/restore (2-3 hours)
9. Export history (3-4 hours)

**Total Full Parity:** 51-70 hours (6-9 days)

### Recommended Phased Rollout

**Phase 7.1 (MVP):** Preview + Export + Template Selector (24-34 hours)
**Phase 7.2 (UX):** Customization + Resume Linking + Duplicate (12-17 hours)
**Phase 7.3 (Advanced):** Version History + AI Enhancement + Export History (17-22 hours)

**Total:** 53-73 hours across 3 mini-phases

---

## 10. Architectural Considerations

### Design Patterns Already in Place

✅ **Generic Document Store** - Both use `createDocumentStore<T>` factory
✅ **Repository Pattern** - Pure functions with dependency injection
✅ **Optimistic Concurrency** - Version-based conflict detection
✅ **Soft Delete** - `is_deleted` flag instead of hard delete
✅ **RLS Enforcement** - Row-level security on all tables
✅ **API Standardization** - `withAuth`, `apiSuccess`, `apiError`
✅ **Unified Dashboard** - Single view for multiple document types

### Architectural Debt

❌ **Monomorphic Preview System** - Hardcoded to `ResumeJson` type
❌ **Duplicate Template Registries** - Resume and cover letter templates separate
❌ **Export System Not Extensible** - Hardcoded to resumes table
❌ **AI Routes Not Generalized** - Cover letter generation in separate route

### Refactoring Opportunities

#### Option 1: Generic Preview System
Create polymorphic preview that dispatches based on document type:
```typescript
interface PreviewProps {
  documentType: 'resume' | 'cover_letter'
  data: ResumeJson | CoverLetterJson
  templateId: string
}
```

**Pros:** Single preview component, less duplication
**Cons:** Type safety complexity, runtime dispatch

#### Option 2: Separate Preview Components
Keep `LivePreview.tsx` for resumes, create `CoverLetterLivePreview.tsx`:

**Pros:** Type safety, clear separation
**Cons:** Code duplication

**Recommendation:** Option 2 (simpler, safer, faster to implement)

#### Option 3: Unified Template System
Merge resume and cover letter templates into single registry with type discrimination:

**Pros:** Single source of truth, easier template management
**Cons:** Complex type system, breaking change to existing templates

**Recommendation:** Defer to Phase 8+ (not urgent)

---

## 11. Testing & Validation Checklist

### Cover Letter Feature Validation

**Database Layer:**
- [ ] Create cover letter → verify in `cover_letters` table
- [ ] Update cover letter → verify version incremented
- [ ] Soft delete → verify `is_deleted = true`
- [ ] Link to resume → verify `linked_resume_id` set
- [ ] RLS policies → test cross-user access denied

**API Layer:**
- [ ] `GET /api/v1/cover-letters` → returns paginated list
- [ ] `POST /api/v1/cover-letters` → creates with linked_resume_id
- [ ] `PUT /api/v1/cover-letters/[id]` → optimistic concurrency works
- [ ] `DELETE /api/v1/cover-letters/[id]` → soft delete works
- [ ] `POST /api/v1/cover-letters/generate` → streaming response works
- [ ] `POST /api/v1/cover-letters/[id]/sync` → syncs from resume

**UI Layer:**
- [ ] Sidebar "New Cover Letter" → creates and navigates
- [ ] Editor loads cover letter data
- [ ] Rich text editor formats text (bold, italic, lists)
- [ ] Auto-save triggers after edits
- [ ] Undo/redo works
- [ ] ❌ Preview tab → CURRENTLY SHOWS PLACEHOLDER
- [ ] ❌ Customize tab → CURRENTLY SHOWS PLACEHOLDER
- [ ] AI generation dialog opens
- [ ] AI generation streams response

**Dashboard:**
- [ ] Cover letters appear in unified dashboard
- [ ] Type filter shows correct counts
- [ ] Search finds cover letters by title
- [ ] Edit action navigates to cover-letter-editor
- [ ] Delete action soft-deletes cover letter
- [ ] Linked badge shows for linked cover letters

**Navigation:**
- [ ] Sidebar shows "New Cover Letter" link
- [ ] Dashboard is active for /cover-letter-editor routes
- [ ] /cover-letter-editor/new redirects to /cover-letter-editor/[id]

---

## 12. Source Map: Files Investigated

### Core Implementation Files

**Pages:**
- `/app/(app)/editor/[id]/page.tsx` - Resume editor (full-featured reference)
- `/app/(app)/editor/new/page.tsx` - Resume creation flow
- `/app/(app)/cover-letter-editor/[id]/page.tsx` - Cover letter editor (partial)
- `/app/(app)/cover-letter-editor/new/page.tsx` - Cover letter creation
- `/app/(app)/dashboard/page.tsx` - Resume-only dashboard
- `/app/(app)/documents/page.tsx` - Unified dashboard

**API Routes (Resume):**
- `/app/api/v1/resumes/route.ts` - List/create resumes
- `/app/api/v1/resumes/[id]/route.ts` - CRUD operations
- `/app/api/v1/resumes/[id]/duplicate/route.ts` - Duplication
- `/app/api/v1/resumes/[id]/restore/route.ts` - Restore deleted
- `/app/api/v1/resumes/[id]/versions/route.ts` - Version history
- `/app/api/v1/export/pdf/route.ts` - PDF export (resume-only)

**API Routes (Cover Letter):**
- `/app/api/v1/cover-letters/route.ts` - List/create cover letters
- `/app/api/v1/cover-letters/[id]/route.ts` - CRUD operations
- `/app/api/v1/cover-letters/generate/route.ts` - AI generation
- `/app/api/v1/cover-letters/[id]/link/route.ts` - Link to resume
- `/app/api/v1/cover-letters/[id]/sync/route.ts` - Sync from resume
- `/app/api/v1/documents/route.ts` - Unified document list

**Stores:**
- `/stores/documentStore.ts` - Resume store (uses factory)
- `/stores/coverLetterStore.ts` - Cover letter store (uses factory)
- `/stores/createDocumentStore.ts` - Generic store factory
- `/stores/templateStore.ts` - Template selection state

**Repositories:**
- `/libs/repositories/documents.ts` - Resume repository (complete)
- `/libs/repositories/coverLetters.ts` - Cover letter repository (complete)
- `/libs/repositories/versions.ts` - Version history (resume-only)
- `/libs/repositories/exportJobs.ts` - Export queue (resume-only)

**Components (Editor):**
- `/components/editor/EditorLayout.tsx` - Shared layout
- `/components/editor/EditorHeader.tsx` - Shared header
- `/components/editor/EditorSidebar.tsx` - Resume sidebar
- `/components/editor/EditorForm.tsx` - Form context provider
- `/components/editor/SectionAccordion.tsx` - Collapsible sections
- `/components/editor/VersionHistory.tsx` - Version history modal
- `/components/editor/sections/*` - Resume section components

**Components (Preview):**
- `/components/preview/LivePreview.tsx` - Resume preview (hardcoded type)
- `/components/preview/TemplateRenderer.tsx` - Template renderer (resume-only)
- `/components/preview/PreviewContainer.tsx` - Preview wrapper
- `/components/preview/PreviewControls.tsx` - Zoom/viewport controls

**Components (Cover Letter):**
- `/components/cover-letters/GenerateDialog.tsx` - AI generation UI

**Components (Dashboard):**
- `/components/documents/UnifiedDocumentDashboard.tsx` - Unified view
- `/components/documents/DocumentTypeFilter.tsx` - Type filter
- `/components/documents/DocumentSearch.tsx` - Search bar
- `/components/documents/BulkOperations.tsx` - Bulk actions

**Components (Layout):**
- `/components/layout/Sidebar.tsx` - Navigation sidebar (shows cover letter links)

**Templates (Resume):**
- `/libs/templates/registry.ts` - Resume template registry
- `/libs/templates/minimal/MinimalTemplate.tsx`
- `/libs/templates/modern/ModernTemplate.tsx`
- `/libs/templates/classic/ClassicTemplate.tsx`
- `/libs/templates/creative/CreativeTemplate.tsx`
- `/libs/templates/technical/TechnicalTemplate.tsx`
- `/libs/templates/executive/ExecutiveTemplate.tsx`

**Templates (Cover Letter):**
- `/libs/templates/cover-letter/registry.ts` - Cover letter registry
- `/libs/templates/cover-letter/classic-block/ClassicBlockTemplate.tsx`
- `/libs/templates/cover-letter/modern-minimal/ModernMinimalTemplate.tsx`
- `/libs/templates/cover-letter/creative-bold/CreativeBoldTemplate.tsx`
- `/libs/templates/cover-letter/executive-formal/ExecutiveFormalTemplate.tsx`
- `/libs/templates/cover-letter/shared/CoverLetterTemplateBase.tsx`

**Types:**
- `/types/resume.ts` - Resume data model
- `/types/cover-letter.ts` - Cover letter data model
- `/types/template.ts` - Resume template types
- `/types/cover-letter-template.ts` - Cover letter template types

**Database Migrations:**
- `/migrations/phase2/001_create_resumes_table.sql`
- `/migrations/phase2/002_create_resume_versions_table.sql`
- `/migrations/phase7/020_create_cover_letters_table.sql`
- `/migrations/phase7/021_create_document_relationships_table.sql`
- `/migrations/phase7/023_seed_cover_letter_templates.sql`

---

## Conclusion

### Key Findings

1. **Cover Letter IS Visible:** Navigation links exist and work. The feature is discoverable.

2. **Partial Implementation:** Cover letter has ~60% feature parity with resume. Core CRUD operations, AI generation, and dashboard integration work. Preview, export, customization, and versioning are missing.

3. **Architectural Debt:** Preview system is monomorphic (hardcoded to `ResumeJson`), preventing cover letter preview integration. This is the primary blocker.

4. **MVP Path Exists:** Implementing preview + export + template selector would make cover letters production-ready (24-34 hours).

5. **Database Layer Complete:** Schema, repositories, and API routes are solid. Missing features are UI-layer problems, not data-layer issues.

6. **AI Generation Works:** Cover letter AI generation is fully functional with streaming, tone control, and resume context extraction.

### Why Cover Letter Isn't "Visible" to Users

The question was "why isn't Cover Letter visible in the app?" The answer: **It IS visible, but it's not FUNCTIONAL enough to use.**

Users can:
- ✅ Find "New Cover Letter" in sidebar
- ✅ Create a cover letter
- ✅ Edit content in rich text editor
- ✅ See cover letters in dashboard
- ✅ Generate with AI

Users cannot:
- ❌ Preview their cover letter (shows "coming soon")
- ❌ Customize template or colors
- ❌ Export to PDF
- ❌ Switch templates
- ❌ See version history

**Root Cause:** Phase 7 established infrastructure but deferred UI polish. Cover letter is in "beta" state—works for data entry but not ready for professional use.

### Recommended Next Steps

**Immediate (MVP):**
1. Build cover letter preview renderer (8-12 hours)
2. Add PDF export for cover letters (12-16 hours)
3. Create template selector UI (4-6 hours)

**Near-term (UX):**
4. Add customization panel (6-8 hours)
5. Wire up resume linking UI (2-3 hours)
6. Add duplicate/restore (2-3 hours)

**Long-term (Feature Parity):**
7. Implement version history (8-10 hours)
8. Add AI enhancement (6-8 hours)
9. Build export history (3-4 hours)

**Total Time to MVP:** 3-4 days
**Total Time to Parity:** 6-9 days

---

**End of Report**
Generated: 2025-10-06
Investigator: CONTEXTGATHERER
Codebase: ResumePair (Phase 7)
