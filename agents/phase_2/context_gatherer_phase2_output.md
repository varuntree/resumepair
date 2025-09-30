# Phase 2 Context Document: Document Management & Basic Editor

**Project**: ResumePair
**Phase**: Phase 2 - Document Management & Basic Editor
**Context Gathered**: 2025-09-30
**Status**: DEFINITIVE - Ready for Implementation
**Purpose**: Complete, unambiguous context for Phase 2 implementation

---

## EXECUTIVE SUMMARY

Phase 2 delivers the core document management system with CRUD operations, form-based resume editor, auto-save functionality, version history, and state management. This phase builds directly on Phase 1's authentication foundation and prepares for Phase 3's template rendering system.

**What Phase 2 IS**:
- Document data management (create, read, update, delete, version)
- Form-based editor with structured data entry
- Auto-save with debouncing and conflict resolution
- Undo/redo with 50-step history
- State management (Zustand + zundo)

**What Phase 2 is NOT**:
- NO AI features (Phase 4)
- NO template rendering system (Phase 3)
- NO live preview with styled templates (Phase 3)
- NO PDF/DOCX export (Phase 5)
- NO scoring system (Phase 6)
- NO cover letters (Phase 7)

**Success Definition**: Users can create, edit, and manage resume documents with auto-save, undo/redo, and version history. Form validation prevents data loss. All operations are fast (< 200ms form updates, < 500ms list loads, < 2s auto-save trigger).

---

## 1. PHASE 2 SCOPE (Complete Feature List)

### Core Features

#### 1.1 Resume Document CRUD
- **Create new resume documents** with initial empty ResumeJson v1 structure
- **Read/display document content** with full field access
- **Update document fields** with optimistic UI updates
- **Delete documents (soft delete)** with trash/restore capability
- **Duplicate existing documents** with "(Copy)" suffix
- **Restore from trash** within 30-day window

#### 1.2 Document Listing & Management
- **Grid view** with document cards (title, last edited, thumbnail placeholder)
- **List view** with table layout (title, status, date columns)
- **Search by title** (ILIKE query, case-insensitive)
- **Filter by status** (draft, active, archived)
- **Filter by date** (last 7 days, last 30 days, last 90 days, all time)
- **Sort by criteria** (updated_at DESC, title ASC, created_at DESC)
- **Pagination** with cursor-based loading (20 items per page)
- **Bulk selection and operations** (delete, archive selected documents)
- **Document metadata display** (created date, last edited, version number)

#### 1.3 Basic Form Editor
- **Section-based form layout** (10+ sections: profile, summary, work, education, projects, skills, certifications, awards, languages, extras)
- **Field validation** with inline error messages (email format, URL format, required fields)
- **Add/remove/reorder sections** with drag handle (work experience items, education entries)
- **Rich data structures** for arrays of experience, education, projects
- **Character counters** for text fields (summary: 500 chars, bullets: 200 chars each)
- **Required field indicators** (email, full name)

#### 1.4 Auto-save & Versioning
- **Debounced auto-save** (2 seconds after last keystroke)
- **Manual save option** (CMD/CTRL+S keyboard shortcut, header button)
- **Version history tracking** (immutable snapshots in `document_versions` table)
- **Restore previous versions** (select version, preview, restore action)
- **Conflict resolution** (optimistic concurrency control with version number)
- **Offline queue for saves** (retry failed saves, show warning)

#### 1.5 State Management
- **Zustand store** for current document state
- **Zundo middleware** for undo/redo with 50-step history
- **Optimistic updates** (UI updates immediately, background save)
- **Error recovery** (revert to last saved state on failure)
- **Persistent draft state** (localStorage backup for unsaved changes)

### Supporting Infrastructure

#### 1.6 Navigation
- **Document switcher** in header (dropdown with recent documents)
- **Breadcrumbs** showing current location (Dashboard > Resume Title > Edit)
- **Quick actions menu** (duplicate, delete, export - export disabled until Phase 5)

#### 1.7 Settings Pages
- **Auto-save preferences** (enable/disable, adjust debounce time)
- **Default document settings** (page size, date format, locale)

#### 1.8 Error Handling
- **Save failure notifications** (toast with retry button)
- **Validation error display** (inline below fields, summary at top)
- **Conflict resolution UI** (show diff, choose version to keep)

#### 1.9 Layout Components
- **Editor layout** (two-column: form left, preview placeholder right)
- **Form sections** (collapsible panels per resume section)
- **Field groups** (related fields grouped visually)

#### 1.10 Empty States
- **No documents state** (call-to-action to create first resume)
- **First document creation wizard** (3-step: choose template, enter basic info, start editing)

#### 1.11 Data Management
- **Document schema validation** (Zod schema for ResumeJson v1)
- **Field-level validation rules** (email, URL, date ranges)
- **Data transformations** (normalize phone numbers, format dates)

---

## 2. PHASE 2 EXCLUSIONS (What NOT to Build)

**Do NOT implement these in Phase 2**:

### AI Features (Phase 4)
- AI-assisted drafting
- Bullet point generation
- Content suggestions
- Job description parsing
- Keyword extraction

### Template System (Phase 3)
- Template gallery
- Template switching
- Styled resume rendering
- Live preview with design
- Template customization (colors, fonts, layout)

### Preview System (Phase 3)
- Paginated preview
- Print CSS rendering
- Real-time styled updates
- Template-based rendering

### Export (Phase 5)
- PDF generation
- DOCX generation
- Download functionality
- Print functionality

### Scoring (Phase 6)
- Resume scoring
- ATS readiness checks
- Keyword matching
- Content strength analysis
- Suggestions generation

### Cover Letters (Phase 7)
- Cover letter creation
- Cover letter editor
- Cover letter templates

---

## 3. PHASE 1 FOUNDATION (What Already Exists)

### 3.1 Authentication System (Complete)
**Files**:
- `/app/signin/page.tsx` - Google OAuth sign-in page
- `/app/auth/callback/route.ts` - OAuth callback handler
- `/middleware.ts` - Route protection middleware

**Features**:
- Google OAuth via Supabase Auth
- Session management with automatic refresh
- Protected route enforcement (redirects to /signin)
- Auth state persistence across page loads

**Integration Points for Phase 2**:
- All Phase 2 routes will use existing auth middleware
- User ID available via `supabase.auth.getUser()` in protected routes
- Session automatically refreshed in middleware

### 3.2 Database Structure (Complete)
**Tables**:
- `profiles` - User profile data (name, locale, date format, page size)
- `user_preferences` - App preferences (theme, notifications, auto-save settings)

**Status**:
- 11/11 migrations applied (Phase 1 complete)
- RLS policies enforced (user isolation at database level)
- Triggers active (profile auto-creation on signup)
- Indexes created (performance optimized)

**Files**: `/migrations/phase1/*.sql` (completed migrations)

**Integration Points for Phase 2**:
- User profiles exist for all authenticated users
- User preferences available for auto-save settings
- RLS pattern established (will extend to resumes table)

### 3.3 API Utilities (Complete)
**Files**:
- `/libs/api-utils/with-auth.ts` - Authentication wrapper
- `/libs/api-utils/responses.ts` - `apiSuccess`, `apiError` helpers
- `/libs/api-utils/with-api-handler.ts` - Public route wrapper
- `/libs/api-utils/index.ts` - Exports

**Pattern**:
```typescript
export const POST = withAuth(async (req, user) => {
  // user is authenticated
  // user.id available
  return apiSuccess(data)
})
```

**Response Format**:
```typescript
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

**Integration Points for Phase 2**:
- All Phase 2 API routes will use `withAuth` wrapper
- Consistent error handling via `apiError`
- Consistent success responses via `apiSuccess`

### 3.4 Repository Pattern (Complete)
**Files**:
- `/libs/repositories/profiles.ts` - Profile CRUD functions
- `/libs/repositories/preferences.ts` - Preferences functions
- `/libs/repositories/index.ts` - Exports

**Pattern**:
```typescript
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile> {
  // Pure function with dependency injection
}
```

**Integration Points for Phase 2**:
- Phase 2 will add `/libs/repositories/documents.ts`
- Follow same pure function pattern
- Dependency injection of SupabaseClient
- Never use service role (always user-scoped client)

### 3.5 Design System (Complete)
**Files**:
- `/app/globals.css` - Design tokens (--app-* and --doc-* tokens)
- `/components/ui/*` - shadcn/ui components (12 installed)
- `/libs/design-tokens.ts` - TypeScript utilities

**Ramp Palette**:
- Navy dark (#0B0F1E), Navy medium (#1A1F35)
- Lime accent (#CDFF00)
- Gray scale (50, 100, 200, 300, 500, 700, 900)

**Integration Points for Phase 2**:
- All Phase 2 UI will use design tokens (no hardcoded values)
- shadcn/ui components available (Button, Card, Input, etc.)
- Dark mode support via next-themes
- Responsive breakpoints established

### 3.6 Component Library (Complete)
**Installed shadcn/ui components**:
- button, card, dialog, input, label, select, switch, tabs, toast, dropdown-menu, avatar, badge

**Integration Points for Phase 2**:
- Use existing components for editor UI
- Add new components via `npx shadcn@latest add [component]`
- Follow composition patterns (see component standards)

---

## 4. RESUMEJSON V1 SCHEMA (Canonical Data Structure)

**Source**: [internal:/ai_docs/project_documentation/1_prd_v1.md#L77-L90]

This is the **CANONICAL** schema that ALL Phase 2 components will use. It is the single source of truth for resume data structure.

```typescript
interface ResumeJson {
  profile: {
    fullName: string
    headline?: string
    email: string
    phone?: string
    location?: {
      city?: string
      region?: string
      country?: string
      postal?: string
    }
    links?: Array<{
      type?: string      // e.g., "LinkedIn", "GitHub", "Website"
      label?: string     // Display text
      url: string
    }>
    photo?: {
      url: string        // Public URL
      path: string       // Storage path
    }
  }

  summary?: string

  work?: Array<{
    company: string
    role: string
    location?: string
    startDate: string                    // ISO date string
    endDate?: string | null | 'Present'
    descriptionBullets?: string[]
    achievements?: string[]
    techStack?: string[]
  }>

  education?: Array<{
    school: string
    degree: string
    field?: string
    startDate?: string
    endDate?: string
    details?: string[]
  }>

  projects?: Array<{
    name: string
    link?: string
    summary?: string
    bullets?: string[]
    techStack?: string[]
  }>

  skills?: Array<{
    category: string   // e.g., "Programming", "Tools", "Soft Skills"
    items: string[]
  }>

  certifications?: Array<{
    name: string
    issuer: string
    date?: string
  }>

  awards?: Array<{
    name: string
    org: string
    date?: string
    summary?: string
  }>

  languages?: Array<{
    name: string
    level: string      // e.g., "Native", "Fluent", "Conversational"
  }>

  extras?: Array<{
    title: string
    content: string
  }>

  settings: {
    locale: string                           // e.g., "en-US", "en-GB"
    dateFormat: 'US' | 'ISO' | 'EU'         // MMM YYYY | YYYY-MM | DD MMM YYYY
    addressFormat?: string                   // Country-specific formatting rules
    fontFamily: string                       // e.g., "Inter", "Source Sans 3"
    fontSizeScale: number                    // 0.8 to 1.2
    lineSpacing: number                      // 1.0 to 1.5
    colorTheme: string                       // Template-specific theme
    iconSet: 'lucide'                        // Icon library (Lucide only for v1)
    showIcons: boolean                       // Toggle icons in template
    sectionOrder: string[]                   // e.g., ["profile", "summary", "work", ...]
    pageSize: 'A4' | 'Letter'               // US: Letter, others: A4
  }
}
```

### Schema Version
- **Current Version**: `resume.v1`
- **Stored in DB**: `documents.schema_version` field
- **Purpose**: Enable schema evolution without breaking existing documents

### Validation Rules
- `profile.fullName`: Required, min 1 char, max 100 chars
- `profile.email`: Required, valid email format
- `profile.phone`: Optional, valid phone format (libphonenumber-js)
- `profile.links[].url`: Valid URL format
- `work[].startDate`: Valid ISO date string
- `work[].endDate`: Valid ISO date string OR null OR literal "Present"
- Date ranges: `endDate` must be after `startDate` when both present

### Default Values
When creating new resume:
```typescript
const DEFAULT_RESUME: ResumeJson = {
  profile: {
    fullName: user.full_name || "",
    email: user.email || "",
  },
  settings: {
    locale: userProfile.locale || "en-US",
    dateFormat: userProfile.date_format || "US",
    fontFamily: "Inter",
    fontSizeScale: 1.0,
    lineSpacing: 1.2,
    colorTheme: "default",
    iconSet: "lucide",
    showIcons: false,
    sectionOrder: ["profile", "summary", "work", "education", "projects", "skills"],
    pageSize: userProfile.page_size || "Letter",
  }
}
```

---

## 5. DATABASE REQUIREMENTS

### 5.1 Tables Needed for Phase 2

#### resumes (Primary Table)
```sql
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT,                                    -- Optional, unique per user
  version INTEGER NOT NULL DEFAULT 1,           -- Optimistic concurrency control
  schema_version TEXT NOT NULL,                 -- "resume.v1"
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  status TEXT NOT NULL DEFAULT 'draft',         -- 'draft' | 'active' | 'archived'
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,    -- Soft delete flag
  deleted_at TIMESTAMPTZ,                       -- When soft deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ                  -- Track usage
);

-- Indexes
CREATE INDEX resumes_user_id_idx ON public.resumes(user_id);
CREATE INDEX resumes_user_status_idx ON public.resumes(user_id, status) WHERE is_deleted = FALSE;
CREATE INDEX resumes_user_deleted_idx ON public.resumes(user_id, is_deleted);
CREATE INDEX resumes_updated_at_idx ON public.resumes(updated_at DESC);
CREATE UNIQUE INDEX resumes_user_slug_idx ON public.resumes(user_id, slug) WHERE slug IS NOT NULL;

-- Full-text search (optional Phase 2.5)
CREATE INDEX resumes_title_search_idx ON public.resumes USING GIN(to_tsvector('english', title));

-- Updated_at trigger
CREATE TRIGGER set_updated_at_on_resumes
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();
```

#### resume_versions (Version History)
```sql
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id BIGSERIAL PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,              -- Matches resumes.version at time of snapshot
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE (resume_id, version_number)
);

-- Index for version lookups
CREATE INDEX resume_versions_resume_id_idx ON public.resume_versions(resume_id, version_number DESC);
```

#### resume_templates (Optional Starter Templates)
```sql
CREATE TABLE IF NOT EXISTS public.resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  thumbnail_url TEXT,
  category TEXT,                                 -- e.g., "Student", "Professional", "Executive"
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one default template
CREATE UNIQUE INDEX resume_templates_default_idx ON public.resume_templates(is_default) WHERE is_default = TRUE;
```

### 5.2 RLS Policies

**resumes table** (User isolation):
```sql
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Users can select their own non-deleted resumes
CREATE POLICY resumes_select_own
  ON public.resumes FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert resumes for themselves
CREATE POLICY resumes_insert_own
  ON public.resumes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own resumes
CREATE POLICY resumes_update_own
  ON public.resumes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own resumes (soft delete via UPDATE)
-- Hard delete policy (optional, if needed)
CREATE POLICY resumes_delete_own
  ON public.resumes FOR DELETE
  USING (user_id = auth.uid());
```

**resume_versions table** (Read-only for version history):
```sql
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- Users can read versions of their own resumes
CREATE POLICY resume_versions_select_own
  ON public.resume_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = resume_id AND r.user_id = auth.uid()
    )
  );

-- Only system can insert versions (via repository function)
CREATE POLICY resume_versions_insert_own
  ON public.resume_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = resume_id AND r.user_id = auth.uid()
    )
  );
```

**resume_templates table** (Public read):
```sql
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read templates
CREATE POLICY resume_templates_select_all
  ON public.resume_templates FOR SELECT
  TO authenticated
  USING (TRUE);
```

### 5.3 Migrations to Create

**File**: `/migrations/phase2/001_create_resumes_table.sql`
- Create `resumes` table with all fields
- Add indexes for performance
- Add updated_at trigger
- Add comments for documentation

**File**: `/migrations/phase2/002_create_resume_versions_table.sql`
- Create `resume_versions` table
- Add indexes
- Add comments

**File**: `/migrations/phase2/003_create_resume_templates_table.sql`
- Create `resume_templates` table
- Add indexes
- Add comments

**File**: `/migrations/phase2/004_setup_rls_policies_resumes.sql`
- Enable RLS on all tables
- Create all policies listed above

**File**: `/migrations/phase2/005_seed_resume_templates.sql` (Optional)
- Insert 1-3 starter templates
- Mark one as default

**IMPORTANT**: These migrations are FILE-ONLY during Phase 2 development. They will NOT be applied automatically. User must explicitly approve before application.

---

## 6. API REQUIREMENTS

### 6.1 API Endpoints Needed

#### Resume CRUD Operations

**GET /api/v1/resumes** - List user's resumes
- **Query Parameters**:
  - `status`: Filter by status ('draft', 'active', 'archived')
  - `sort`: Sort field ('updated_at', 'created_at', 'title')
  - `order`: Sort order ('asc', 'desc')
  - `cursor`: Cursor for pagination
  - `limit`: Items per page (default 20, max 100)
  - `search`: Search term for title
- **Response**: `ApiResponse<{ resumes: Resume[], nextCursor: string | null, total: number }>`
- **RLS**: Automatic via user-scoped client

**POST /api/v1/resumes** - Create new resume
- **Body**: `{ title: string, template_id?: string }`
- **Logic**:
  1. Validate input (title required, 1-100 chars)
  2. Get template if `template_id` provided, else use empty schema
  3. Create document with `user_id`, initial version 1, schema_version "resume.v1"
  4. Return created document
- **Response**: `ApiResponse<Resume>`

**GET /api/v1/resumes/:id** - Get specific resume
- **Response**: `ApiResponse<Resume>`
- **RLS**: Returns 404 if not owned by user (via RLS)

**PUT /api/v1/resumes/:id** - Update resume
- **Body**: `{ title?: string, data?: Partial<ResumeJson>, version: number }`
- **Logic**:
  1. Validate input
  2. **Optimistic concurrency**: WHERE id = :id AND version = :version
  3. If rowCount = 0, return 409 Conflict (stale data)
  4. Snapshot previous version to `resume_versions`
  5. Increment version, update document
  6. Return updated document
- **Response**: `ApiResponse<Resume>`

**DELETE /api/v1/resumes/:id** - Soft delete resume
- **Logic**:
  1. Set `is_deleted = TRUE`, `deleted_at = NOW()`
  2. Keep in database for 30 days (cleanup job later)
- **Response**: `ApiResponse<{ id: string }>`

**POST /api/v1/resumes/:id/duplicate** - Duplicate resume
- **Logic**:
  1. Get source resume
  2. Create new resume with same data
  3. Append " (Copy)" to title
  4. New version = 1
- **Response**: `ApiResponse<Resume>`

**POST /api/v1/resumes/:id/restore** - Restore from trash
- **Logic**:
  1. WHERE id = :id AND is_deleted = TRUE AND user_id = auth.uid()
  2. Set `is_deleted = FALSE`, `deleted_at = NULL`
- **Response**: `ApiResponse<Resume>`

#### Version Management

**GET /api/v1/resumes/:id/versions** - List versions
- **Response**: `ApiResponse<{ versions: ResumeVersion[] }>`

**GET /api/v1/resumes/:id/versions/:version** - Get specific version
- **Response**: `ApiResponse<ResumeVersion>`

**POST /api/v1/resumes/:id/versions/:version/restore** - Restore version
- **Logic**:
  1. Get version data
  2. Update current document with version data
  3. Snapshot current version before restore
  4. Increment version
- **Response**: `ApiResponse<Resume>`

#### Templates (Optional for Phase 2)

**GET /api/v1/templates** - List available templates
- **Response**: `ApiResponse<{ templates: ResumeTemplate[] }>`

**GET /api/v1/templates/:id** - Get template details
- **Response**: `ApiResponse<ResumeTemplate>`

#### Bulk Operations

**POST /api/v1/resumes/bulk/delete** - Delete multiple
- **Body**: `{ ids: string[] }`
- **Logic**: Soft delete all matching IDs where user_id = auth.uid()
- **Response**: `ApiResponse<{ deleted: number }>`

**POST /api/v1/resumes/bulk/archive** - Archive multiple
- **Body**: `{ ids: string[] }`
- **Logic**: Set status = 'archived' for all matching IDs
- **Response**: `ApiResponse<{ archived: number }>`

### 6.2 Authentication Requirements

**ALL routes are protected** via `withAuth` wrapper:
```typescript
export const GET = withAuth(async (req, user) => {
  // user.id guaranteed available
})
```

### 6.3 Validation Requirements

**Zod Schemas Needed**:
```typescript
// File: /libs/validation/resume.ts
const ProfileSchema = z.object({
  fullName: z.string().min(1).max(100),
  headline: z.string().max(200).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
    postal: z.string().optional(),
  }).optional(),
  links: z.array(z.object({
    type: z.string().optional(),
    label: z.string().optional(),
    url: z.string().url(),
  })).optional(),
  photo: z.object({
    url: z.string().url(),
    path: z.string(),
  }).optional(),
})

const WorkExperienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date
  endDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    z.literal('Present'),
    z.null()
  ]).optional(),
  descriptionBullets: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
})

// ... similar schemas for education, projects, skills, etc.

const ResumeJsonSchema = z.object({
  profile: ProfileSchema,
  summary: z.string().optional(),
  work: z.array(WorkExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  // ... etc
  settings: SettingsSchema,
})

const CreateResumeSchema = z.object({
  title: z.string().min(1).max(100),
  template_id: z.string().uuid().optional(),
})

const UpdateResumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  data: ResumeJsonSchema.partial().optional(),
  version: z.number().int().positive(),
})
```

**Usage in API Routes**:
```typescript
export const POST = withAuth(async (req, user) => {
  const body = await req.json()
  const result = CreateResumeSchema.safeParse(body)

  if (!result.success) {
    return apiError(400, 'Validation failed', result.error.format())
  }

  // Proceed with validated data
  const { title, template_id } = result.data
})
```

---

## 7. STATE MANAGEMENT REQUIREMENTS

### 7.1 Zustand Stores Needed

#### Document Editor Store
```typescript
// File: /libs/stores/documentStore.ts
import { create } from 'zustand'
import { temporal } from 'zundo'
import { immer } from 'zustand/middleware/immer'

interface DocumentState {
  // Current state
  document: ResumeJson | null
  originalDocument: ResumeJson | null  // For dirty check
  documentId: string | null

  // Save state
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null

  // Actions
  loadDocument: (id: string) => Promise<void>
  updateField: (path: string, value: any) => void
  saveDocument: () => Promise<void>
  autoSave: () => void
  resetChanges: () => void
  deleteDocument: () => Promise<void>

  // Computed
  canSave: boolean
  hasChanges: boolean
}

const useDocumentStore = create<DocumentState>()(
  temporal(
    immer((set, get) => ({
      // Implementation
      document: null,
      originalDocument: null,
      documentId: null,
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      saveError: null,

      loadDocument: async (id: string) => {
        const response = await fetch(`/api/v1/resumes/${id}`)
        const { data } = await response.json()
        set((state) => {
          state.document = data.data
          state.originalDocument = data.data
          state.documentId = id
          state.isDirty = false
          state.lastSaved = new Date(data.updated_at)
        })
      },

      updateField: (path: string, value: any) => {
        set((state) => {
          // Use lodash.set or manual path traversal
          _.set(state.document, path, value)
          state.isDirty = true
        })
        // Trigger auto-save
        get().autoSave()
      },

      saveDocument: async () => {
        const { document, documentId } = get()
        if (!document || !documentId) return

        set({ isSaving: true, saveError: null })

        try {
          const response = await fetch(`/api/v1/resumes/${documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: document, version: document.version })
          })

          if (!response.ok) {
            throw new Error('Save failed')
          }

          const { data } = await response.json()

          set((state) => {
            state.originalDocument = data
            state.document = data
            state.isDirty = false
            state.lastSaved = new Date()
            state.isSaving = false
          })
        } catch (error) {
          set({ saveError: error, isSaving: false })
        }
      },

      autoSave: debounce(() => {
        if (get().isDirty && !get().isSaving) {
          get().saveDocument()
        }
      }, 2000),

      canSave: get().isDirty && !get().isSaving,
      hasChanges: get().isDirty,
    })),
    {
      limit: 50,  // 50-step undo history
      partialize: (state) => ({
        document: state.document  // Only track document changes in history
      }),
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b)
    }
  )
)

export default useDocumentStore
```

#### Document List Store
```typescript
// File: /libs/stores/documentListStore.ts
import { create } from 'zustand'

interface DocumentListState {
  // Data
  documents: Resume[]
  totalCount: number
  nextCursor: string | null

  // UI state
  isLoading: boolean
  error: Error | null

  // Filters
  filters: {
    status: 'all' | 'draft' | 'active' | 'archived'
    search: string
    dateRange: 'all' | 'week' | 'month' | 'quarter'
  }

  // Sort
  sort: {
    field: 'updated_at' | 'created_at' | 'title'
    order: 'asc' | 'desc'
  }

  // Selection
  selectedIds: Set<string>

  // Actions
  fetchDocuments: (cursor?: string) => Promise<void>
  searchDocuments: (query: string) => Promise<void>
  setFilter: (key: string, value: any) => void
  setSorting: (field: string, order: 'asc' | 'desc') => void
  selectDocument: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  bulkDelete: (ids: string[]) => Promise<void>
  refreshList: () => Promise<void>
}

const useDocumentListStore = create<DocumentListState>((set, get) => ({
  // Implementation
  documents: [],
  totalCount: 0,
  nextCursor: null,
  isLoading: false,
  error: null,
  filters: { status: 'all', search: '', dateRange: 'all' },
  sort: { field: 'updated_at', order: 'desc' },
  selectedIds: new Set(),

  fetchDocuments: async (cursor?: string) => {
    set({ isLoading: true, error: null })

    const { filters, sort } = get()
    const params = new URLSearchParams({
      status: filters.status === 'all' ? '' : filters.status,
      search: filters.search,
      sort: sort.field,
      order: sort.order,
      cursor: cursor || '',
      limit: '20'
    })

    try {
      const response = await fetch(`/api/v1/resumes?${params}`)
      const { data } = await response.json()

      set((state) => ({
        documents: cursor ? [...state.documents, ...data.resumes] : data.resumes,
        totalCount: data.total,
        nextCursor: data.nextCursor,
        isLoading: false
      }))
    } catch (error) {
      set({ error, isLoading: false })
    }
  },

  // ... other actions
}))

export default useDocumentListStore
```

### 7.2 Zundo Integration (Undo/Redo)

**Configuration**:
```typescript
import { temporal } from 'zundo'

// Applied as middleware
temporal(store, {
  limit: 50,                // Keep last 50 states
  partialize: (state) => ({ // Only track specific fields
    document: state.document
  }),
  equality: (a, b) => {     // Custom equality check
    return JSON.stringify(a) === JSON.stringify(b)
  }
})
```

**Usage in Components**:
```typescript
import { useTemporalStore } from '@/libs/stores/documentStore'

function EditorToolbar() {
  const { undo, redo, canUndo, canRedo } = useTemporalStore((state) => state)

  return (
    <div>
      <Button onClick={undo} disabled={!canUndo}>
        Undo (⌘Z)
      </Button>
      <Button onClick={redo} disabled={!canRedo}>
        Redo (⌘⇧Z)
      </Button>
    </div>
  )
}
```

**Keyboard Shortcuts**:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
      e.preventDefault()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [undo, redo])
```

### 7.3 Auto-Save Logic

**Debounced Auto-Save** (2 seconds):
```typescript
import { debounce } from 'lodash'

const autoSave = debounce(() => {
  if (get().isDirty && !get().isSaving) {
    get().saveDocument()
  }
}, 2000)

// Called on every field update
updateField: (path, value) => {
  set(/* update state */)
  autoSave()  // Trigger debounced save
}
```

**Manual Save** (CMD/CTRL+S):
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      saveDocument()  // Immediate save
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [saveDocument])
```

### 7.4 Dirty State Tracking

**Dirty Flag Logic**:
- Set `isDirty = true` on any field update
- Set `isDirty = false` after successful save
- Compare `document` vs `originalDocument` for accuracy

**Dirty Check on Navigation**:
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault()
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [isDirty])
```

### 7.5 Offline Queue for Failed Saves

**Queue Logic** (localStorage backup):
```typescript
const saveToQueue = (document: ResumeJson) => {
  const queue = JSON.parse(localStorage.getItem('saveQueue') || '[]')
  queue.push({ document, timestamp: Date.now() })
  localStorage.setItem('saveQueue', JSON.stringify(queue))
}

const processSaveQueue = async () => {
  const queue = JSON.parse(localStorage.getItem('saveQueue') || '[]')

  for (const item of queue) {
    try {
      await saveDocument(item.document)
      // Remove from queue on success
      queue.shift()
      localStorage.setItem('saveQueue', JSON.stringify(queue))
    } catch (error) {
      // Retry later
      break
    }
  }
}

// Retry on reconnect
window.addEventListener('online', processSaveQueue)
```

---

## 8. COMPONENT REQUIREMENTS

### 8.1 Component Hierarchy

```
Pages
├── /app/dashboard/page.tsx                    # Document list page
├── /app/editor/[id]/page.tsx                  # Resume editor page
├── /app/editor/new/page.tsx                   # New document creation
└── /app/trash/page.tsx                        # Deleted documents

Feature Components (/components/documents/)
├── DocumentCard.tsx                           # Grid view card
├── DocumentListItem.tsx                       # List view item
├── DocumentGrid.tsx                           # Grid container
├── DocumentList.tsx                           # List container
├── DocumentSearch.tsx                         # Search bar
├── DocumentFilters.tsx                        # Filter controls
├── DocumentSort.tsx                           # Sort dropdown
├── DocumentActions.tsx                        # Bulk actions bar
├── EmptyDocuments.tsx                         # Empty state
└── CreateDocumentDialog.tsx                   # Creation modal

Editor Components (/components/editor/)
├── EditorLayout.tsx                           # Editor container
├── EditorHeader.tsx                           # Save status, actions
├── EditorSidebar.tsx                          # Section navigation
├── EditorForm.tsx                             # Main form container
├── sections/
│   ├── ProfileSection.tsx                     # Profile fields
│   ├── SummarySection.tsx                     # Summary textarea
│   ├── WorkSection.tsx                        # Work experience array
│   ├── EducationSection.tsx                   # Education array
│   ├── ProjectsSection.tsx                    # Projects array
│   ├── SkillsSection.tsx                      # Skills grouped array
│   ├── CertificationsSection.tsx              # Certifications array
│   ├── AwardsSection.tsx                      # Awards array
│   ├── LanguagesSection.tsx                   # Languages array
│   └── ExtrasSection.tsx                      # Extra sections array
├── fields/
│   ├── TextField.tsx                          # Single-line text input
│   ├── TextAreaField.tsx                      # Multi-line text
│   ├── SelectField.tsx                        # Dropdown select
│   ├── DateField.tsx                          # Date picker
│   ├── ArrayField.tsx                         # Dynamic array of items
│   └── LinkField.tsx                          # URL input with validation
├── AutoSaveIndicator.tsx                      # Save status widget
├── UndoRedoButtons.tsx                        # Undo/redo controls
└── VersionHistory.tsx                         # Version list modal
```

### 8.2 Visual Quality Requirements

**Reference**: [internal:/ai_docs/standards/3_component_standards.md#L410-L645]

**All components MUST meet these standards**:

#### Spacing (8px Grid)
- Section padding: ≥64px mobile, ≥96px desktop
- Card padding: ≥24px (p-6)
- Element gaps: 16-24px (gap-4 to gap-6)
- Form field spacing: ≥16px vertical (space-y-4)

#### Typography Hierarchy
- Page titles: text-4xl (36px), bold
- Section headings: text-2xl (24px), bold
- Card titles: text-xl (20px), semibold
- Body text: text-base (16px), normal weight, 1.5 line height
- Labels: text-sm (14px), semibold

#### Color Usage (Ramp Palette)
- **ONE primary action (lime button) per screen section**
- Navy backgrounds (bg-navy-dark) with white text
- Gray scale for text hierarchy (text-gray-500, text-gray-700, text-gray-900)
- NO hardcoded #hex colors
- NO off-palette colors (blue-500, red-600, etc.)

#### Components
- Buttons: Clear primary/secondary distinction
- Cards: rounded-lg, shadow-sm, p-6 minimum
- Forms: Visible focus states (ring-2 ring-lime on focus)
- Touch targets: ≥48px on mobile

#### Responsiveness
- Mobile-first approach
- No horizontal scroll on mobile (375px)
- Text readable on small screens
- Desktop screenshots (1440px) + Mobile screenshots (375px) required

### 8.3 Component Implementation Standards

**Example: DocumentCard Component**

```typescript
// File: /components/documents/DocumentCard.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreVertical, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/libs/utils'

interface DocumentCardProps {
  document: {
    id: string
    title: string
    updated_at: string
    status: 'draft' | 'active' | 'archived'
  }
  onSelect: (id: string) => void
  isSelected: boolean
  className?: string
}

export function DocumentCard({ document, onSelect, isSelected, className }: DocumentCardProps) {
  return (
    <Card
      className={cn(
        "rounded-lg shadow-sm p-6 cursor-pointer transition-all",
        "hover:shadow-md hover:scale-[1.02]",
        isSelected && "ring-2 ring-lime",
        className
      )}
      onClick={() => onSelect(document.id)}
    >
      <CardHeader className="space-y-4">
        {/* Icon + Actions */}
        <div className="flex items-start justify-between">
          <FileText className="h-8 w-8 text-gray-500" />
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* Title + Status */}
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold line-clamp-2">
            {document.title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Updated {formatDistanceToNow(new Date(document.updated_at), { addSuffix: true })}
          </CardDescription>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs px-2 py-1 rounded-md",
            document.status === 'draft' && "bg-gray-100 text-gray-700",
            document.status === 'active' && "bg-lime text-navy-dark",
            document.status === 'archived' && "bg-gray-200 text-gray-500"
          )}>
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </span>
        </div>
      </CardHeader>
    </Card>
  )
}
```

**Example: WorkSection Component (Array Field)**

```typescript
// File: /components/editor/sections/WorkSection.tsx
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/editor/fields/TextField'
import { DateField } from '@/components/editor/fields/DateField'
import { TextAreaField } from '@/components/editor/fields/TextAreaField'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { useDocumentStore } from '@/libs/stores/documentStore'

export function WorkSection() {
  const { document, updateField } = useDocumentStore()
  const work = document?.work || []

  const addWorkExperience = () => {
    updateField('work', [
      ...work,
      {
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: null,
        descriptionBullets: [],
        achievements: [],
        techStack: []
      }
    ])
  }

  const removeWorkExperience = (index: number) => {
    updateField('work', work.filter((_, i) => i !== index))
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Work Experience</h2>
        <Button onClick={addWorkExperience} variant="secondary" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>

      <div className="space-y-8">
        {work.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
            {/* Drag Handle + Delete */}
            <div className="flex items-center justify-between">
              <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
              <Button
                onClick={() => removeWorkExperience(index)}
                variant="ghost"
                size="sm"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Company"
                value={item.company}
                onChange={(value) => updateField(`work.${index}.company`, value)}
                placeholder="Company name"
                required
              />

              <TextField
                label="Role"
                value={item.role}
                onChange={(value) => updateField(`work.${index}.role`, value)}
                placeholder="Job title"
                required
              />

              <TextField
                label="Location"
                value={item.location || ''}
                onChange={(value) => updateField(`work.${index}.location`, value)}
                placeholder="City, State"
              />

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <DateField
                  label="Start Date"
                  value={item.startDate}
                  onChange={(value) => updateField(`work.${index}.startDate`, value)}
                />

                <DateField
                  label="End Date"
                  value={item.endDate}
                  onChange={(value) => updateField(`work.${index}.endDate`, value)}
                  allowPresent
                />
              </div>

              <TextAreaField
                label="Description"
                value={item.descriptionBullets?.join('\n') || ''}
                onChange={(value) => updateField(`work.${index}.descriptionBullets`, value.split('\n'))}
                placeholder="One bullet point per line"
                rows={4}
                maxLength={1000}
                className="col-span-2"
              />
            </div>
          </div>
        ))}
      </div>

      {work.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No work experience added yet.</p>
          <Button onClick={addWorkExperience} variant="ghost" className="mt-4">
            Add your first experience
          </Button>
        </div>
      )}
    </section>
  )
}
```

### 8.4 Responsive Requirements

**Breakpoints**:
- Mobile: 375px - 640px (sm)
- Tablet: 640px - 1024px (md)
- Desktop: 1024px+ (lg)

**Mobile-First Approach**:
```typescript
<div className="
  p-4 md:p-6 lg:p-8           // Padding scales up
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  // Columns adapt
  text-base md:text-lg        // Typography scales
">
```

**Navigation Patterns**:
- Mobile: Hamburger menu, bottom navigation
- Desktop: Sidebar navigation, top bar

---

## 9. CODING PATTERNS (Mandatory)

**Reference**: [internal:/ai_docs/coding_patterns.md]

### 9.1 Repository Pattern (Pure Functions)

**File**: `/libs/repositories/documents.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js'
import type { ResumeJson } from '@/types'

export interface Resume {
  id: string
  user_id: string
  title: string
  slug: string | null
  version: number
  schema_version: string
  data: ResumeJson
  status: 'draft' | 'active' | 'archived'
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  last_accessed_at: string | null
}

/**
 * Get all resumes for a user
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @param options - Pagination and filtering options
 */
export async function getResumes(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    status?: 'draft' | 'active' | 'archived'
    search?: string
    limit?: number
    cursor?: string
  }
): Promise<{ resumes: Resume[], nextCursor: string | null, total: number }> {
  let query = supabase
    .from('resumes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_deleted', false)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`)
  }

  query = query
    .order('updated_at', { ascending: false })
    .limit(options?.limit || 20)

  if (options?.cursor) {
    query = query.gt('updated_at', options.cursor)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch resumes: ${error.message}`)
  }

  const nextCursor = data && data.length === (options?.limit || 20)
    ? data[data.length - 1].updated_at
    : null

  return {
    resumes: data as Resume[],
    nextCursor,
    total: count || 0
  }
}

/**
 * Get a single resume by ID
 * @param supabase - User-scoped Supabase client
 * @param id - Resume ID
 */
export async function getResume(
  supabase: SupabaseClient,
  id: string
): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch resume: ${error.message}`)
  }

  if (!data) {
    throw new Error('Resume not found')
  }

  return data as Resume
}

/**
 * Create a new resume
 * @param supabase - User-scoped Supabase client
 * @param userId - User ID
 * @param title - Resume title
 * @param data - Initial ResumeJson data
 */
export async function createResume(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  data: ResumeJson
): Promise<Resume> {
  const { data: resume, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      title,
      schema_version: 'resume.v1',
      data,
      version: 1,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create resume: ${error.message}`)
  }

  return resume as Resume
}

/**
 * Update a resume with optimistic concurrency control
 * @param supabase - User-scoped Supabase client
 * @param id - Resume ID
 * @param updates - Fields to update
 * @param currentVersion - Current version number (for optimistic locking)
 */
export async function updateResume(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<Resume, 'title' | 'data' | 'status'>>,
  currentVersion: number
): Promise<Resume> {
  // First, snapshot current version to history
  const { data: current } = await supabase
    .from('resumes')
    .select('data, version')
    .eq('id', id)
    .single()

  if (current) {
    await supabase
      .from('resume_versions')
      .insert({
        resume_id: id,
        version_number: current.version,
        data: current.data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
  }

  // Update with optimistic concurrency check
  const { data, error } = await supabase
    .from('resumes')
    .update({
      ...updates,
      version: currentVersion + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('version', currentVersion)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('CONFLICT: Document was updated by another process')
    }
    throw new Error(`Failed to update resume: ${error.message}`)
  }

  if (!data) {
    throw new Error('CONFLICT: Version mismatch')
  }

  return data as Resume
}

/**
 * Soft delete a resume
 * @param supabase - User-scoped Supabase client
 * @param id - Resume ID
 */
export async function deleteResume(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('resumes')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete resume: ${error.message}`)
  }
}

// ... more functions for duplicate, restore, versions, etc.
```

### 9.2 API Wrapper Pattern

**File**: `/app/api/v1/resumes/route.ts`

```typescript
import { withAuth } from '@/libs/api-utils'
import { apiSuccess, apiError } from '@/libs/api-utils/responses'
import { createClient } from '@/libs/supabase/server'
import { getResumes, createResume } from '@/libs/repositories/documents'
import { CreateResumeSchema } from '@/libs/validation/resume'

export const GET = withAuth(async (req, user) => {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(req.url)

    const options = {
      status: searchParams.get('status') as any,
      search: searchParams.get('search') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: parseInt(searchParams.get('limit') || '20')
    }

    const result = await getResumes(supabase, user.id, options)

    return apiSuccess(result)
  } catch (error) {
    console.error('GET /api/v1/resumes error:', error)
    return apiError(500, 'Failed to fetch resumes', error.message)
  }
})

export const POST = withAuth(async (req, user) => {
  try {
    const supabase = createClient()
    const body = await req.json()

    // Validate input
    const result = CreateResumeSchema.safeParse(body)
    if (!result.success) {
      return apiError(400, 'Validation failed', result.error.format())
    }

    const { title, template_id } = result.data

    // Get template data or use empty schema
    let initialData: ResumeJson
    if (template_id) {
      // Fetch template (Phase 2.5)
      initialData = await getTemplateData(supabase, template_id)
    } else {
      // Empty schema with defaults
      initialData = getDefaultResumeData(user)
    }

    const resume = await createResume(supabase, user.id, title, initialData)

    return apiSuccess(resume, 'Resume created successfully')
  } catch (error) {
    console.error('POST /api/v1/resumes error:', error)
    return apiError(500, 'Failed to create resume', error.message)
  }
})
```

### 9.3 Design Token Usage

**NEVER hardcode values**:
```typescript
// ❌ WRONG
<div style={{ padding: '24px', color: '#0B0F1E' }}>

// ✅ CORRECT
<div className="p-6 text-navy-dark">
```

**All spacing uses 8px grid**:
```typescript
// ✅ CORRECT
<div className="space-y-4">       // 16px gap
<Card className="p-6">            // 24px padding
<section className="section">     // Responsive section padding (64px/96px)
```

**All colors use semantic tokens**:
```typescript
// ✅ CORRECT
<Button variant="primary">        // Uses --app-lime
<div className="bg-navy-dark">    // Uses --app-navy-dark
<p className="text-gray-500">     // Uses --app-gray-500
```

### 9.4 Migration Pattern

**CRITICAL RULE**: Migrations are FILE-ONLY during development.

**During Phase 2 Development**:
1. Create migration SQL files in `/migrations/phase2/`
2. Document migrations in tracking file
3. **DO NOT apply migrations automatically**
4. **DO NOT use MCP tools to apply during development**

**After User Approval**:
1. User reviews all migration files
2. User gives explicit permission to apply
3. Agent applies migrations via MCP tools
4. Update tracking file with applied status

---

## 10. DESIGN SYSTEM REQUIREMENTS

**Reference**: [internal:/ai_docs/design-system.md]

### 10.1 Dual-Token Architecture

**App-Scoped Tokens** (`--app-*`):
- Used for application shell, dashboard, navigation, settings
- Global scope, used throughout app UI

**Document-Scoped Tokens** (`--doc-*`):
- Used for resume/cover letter templates, preview, exports
- Isolated in `.doc-theme` wrapper class
- **NOT used in Phase 2** (templates come in Phase 3)

**Phase 2 Components Use App Tokens Only**:
```typescript
// ✅ CORRECT for Phase 2
<div className="bg-app-background text-app-foreground">
  Dashboard content
</div>

// ❌ WRONG for Phase 2 (doc tokens are for templates)
<div className="bg-doc-surface text-doc-foreground">
```

### 10.2 Ramp Color System

**Base Colors** (HSL format):
```css
--app-navy-dark: 225 52% 8%        /* #0B0F1E */
--app-navy-medium: 226 36% 16%     /* #1A1F35 */
--app-lime: 73 100% 50%            /* #CDFF00 */
--app-lime-hover: 70 100% 45%      /* #B8E600 */
```

**Neutral Scale**:
```css
--app-gray-50: 210 17% 98%
--app-gray-100: 210 17% 95%
--app-gray-200: 210 16% 93%
--app-gray-300: 210 14% 89%
--app-gray-500: 210 11% 46%
--app-gray-700: 210 9% 31%
--app-gray-900: 210 11% 15%
```

**Usage in Phase 2**:
- **Primary accent (lime)**: Use for ONE CTA per screen section
- **Navy**: Backgrounds in dark mode, containers
- **Grays**: Text hierarchy, borders, subtle elements
- **White**: Light mode backgrounds, cards

### 10.3 Typography Scale

```css
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
--text-4xl: 2.25rem     /* 36px */
```

**Phase 2 Typography Hierarchy**:
- Page titles: `text-4xl` (36px), bold
- Section headings: `text-2xl` (24px), bold
- Card titles: `text-xl` (20px), semibold
- Body text: `text-base` (16px), normal weight
- Labels: `text-sm` (14px), semibold

### 10.4 Spacing System (8px Grid)

```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-16: 4rem     /* 64px */
--space-24: 6rem     /* 96px */
```

**Phase 2 Spacing Standards**:
- Section padding: `py-16 md:py-24` (64px/96px)
- Card padding: `p-6` (24px)
- Form field gaps: `space-y-4` (16px)
- Major element gaps: `gap-6` (24px)

---

## 11. PERFORMANCE REQUIREMENTS

**Reference**: [internal:/ai_docs/phases/phase_2.md#L37-L40]

### 11.1 Performance Budgets

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Auto-save trigger | < 2s | After last keystroke |
| Document list load | < 500ms | Initial page load |
| Form field update | < 50ms | Keystroke → state update |
| Undo operation | < 20ms | Undo → state restore |
| Document switch | < 200ms | List click → editor load |
| Version restore | < 300ms | Version click → preview |

### 11.2 Optimization Strategies

**Debouncing**:
```typescript
const debouncedAutoSave = debounce(saveDocument, 2000)
```

**Optimistic UI Updates**:
```typescript
// Update UI immediately, save in background
updateField(path, value)  // UI updates
autoSave()                // Background save
```

**Pagination**:
```typescript
// Load 20 documents at a time
const DOCUMENTS_PER_PAGE = 20
```

**Memoization**:
```typescript
const sortedDocuments = useMemo(
  () => documents.sort((a, b) => /* sort logic */),
  [documents, sortField, sortOrder]
)
```

---

## 12. SECURITY REQUIREMENTS

**Reference**: [internal:/ai_docs/standards/6_security_checklist.md]

### 12.1 RLS Enforcement

**Database Level**:
- ALL queries go through user-scoped Supabase client
- RLS policies enforce `user_id = auth.uid()`
- No service role keys in runtime code
- Automatic user isolation at database level

**Example**:
```typescript
// ✅ CORRECT: User-scoped client
const supabase = createClient()
const { data } = await supabase
  .from('resumes')
  .select('*')
// RLS automatically filters to user's documents only

// ❌ WRONG: Service role bypasses RLS
const supabase = createServiceRoleClient()
```

### 12.2 Input Validation

**All inputs validated with Zod**:
```typescript
const result = CreateResumeSchema.safeParse(body)
if (!result.success) {
  return apiError(400, 'Validation failed', result.error.format())
}
```

**XSS Prevention**:
- Never use `dangerouslySetInnerHTML`
- React escapes by default
- Validate URLs, emails with Zod

**SQL Injection Prevention**:
- Supabase client parameterizes all queries
- Never construct raw SQL strings

### 12.3 Authentication

**All Phase 2 routes protected**:
```typescript
export const GET = withAuth(async (req, user) => {
  // user guaranteed authenticated
})
```

**Session Management**:
- Middleware refreshes session automatically
- Redirects to /signin if unauthenticated
- Session stored in HTTP-only cookie

---

## 13. TESTING REQUIREMENTS

**Reference**: [internal:/ai_docs/testing/README.md]

### 13.1 Testing Approach

**ResumePair uses Puppeteer MCP + Manual Playbooks** (NO automated test files).

**Why**:
- Previous system (Playwright + Vitest) caused system freezes
- Simplified testing prevents complexity
- Visual verification integrated into workflow
- Faster phase gates (20-30 min vs hours)

### 13.2 Playbooks for Phase 2

**Create these playbooks**:
1. `phase_2_documents.md` - CRUD operations, list/grid views, search/filter/sort
2. `phase_2_editor.md` - Form functionality, validation, add/remove sections
3. `phase_2_autosave.md` - Auto-save triggers, manual save, version history, undo/redo

**Playbook Structure**:
```markdown
# Phase 2: Document Management Playbook

## Pre-flight
- [ ] Dev server running
- [ ] User authenticated
- [ ] No console errors

## Test: Create Resume
- [ ] Navigate to /dashboard
- [ ] Click "Create Resume" button
- [ ] MCP: Take screenshot "create_dialog"
- [ ] Fill title "Test Resume"
- [ ] Click "Create"
- [ ] Verify redirect to editor
- [ ] MCP: Verify element `.editor-form` exists

## Test: Auto-save
- [ ] Edit profile name
- [ ] Wait 2 seconds
- [ ] MCP: Verify auto-save indicator shows "Saved"
- [ ] Refresh page
- [ ] Verify changes persisted
```

### 13.3 Visual Verification (Mandatory)

**For EVERY UI feature**:
1. Build feature
2. Start dev server (`npm run dev`)
3. Navigate to page (MCP)
4. Take desktop screenshot (1440px) (MCP)
5. Take mobile screenshot (375px) (MCP)
6. Analyze against Visual Quality Checklist
7. Refine if needed
8. Save screenshots to `ai_docs/progress/phase_2/screenshots/`
9. Document in `visual_review.md`

**Visual Quality Checklist**:
- [ ] Spacing generous (≥16px gaps, ≥24px card padding)
- [ ] Clear typography hierarchy (page title > section > card title)
- [ ] One lime CTA per section (not multiple)
- [ ] Design tokens used (no hardcoded values)
- [ ] Responsive (no horizontal scroll on mobile)
- [ ] Ramp palette only (navy, lime, grays)

### 13.4 Puppeteer MCP Commands

**Navigation**:
```typescript
mcp__puppeteer__puppeteer_navigate({
  url: "http://localhost:3000/dashboard"
})
```

**Screenshot**:
```typescript
mcp__puppeteer__puppeteer_screenshot({
  name: "dashboard_desktop",
  width: 1440,
  height: 900
})

mcp__puppeteer__puppeteer_screenshot({
  name: "dashboard_mobile",
  width: 375,
  height: 667
})
```

**Element Verification**:
```typescript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    const button = document.querySelector('[data-testid="create-resume"]');
    if (!button) throw new Error('Create button not found');
    console.log('✅ Create button exists');
  `
})
```

**Form Interaction**:
```typescript
mcp__puppeteer__puppeteer_fill({
  selector: 'input[name="title"]',
  value: 'Test Resume'
})

mcp__puppeteer__puppeteer_click({
  selector: 'button[type="submit"]'
})
```

**API Testing**:
```typescript
mcp__puppeteer__puppeteer_evaluate({
  script: `
    (async () => {
      const response = await fetch('/api/v1/resumes');
      const json = await response.json();
      if (!json.success) throw new Error('API failed');
      console.log(\`✅ API returned \${json.data.resumes.length} resumes\`);
    })();
  `
})
```

---

## 14. INTEGRATION POINTS (Phase 1 → Phase 2)

### 14.1 Authentication
- **Uses**: Phase 1 auth middleware (`/middleware.ts`)
- **Integration**: All Phase 2 routes automatically protected
- **User ID**: Available via `supabase.auth.getUser()` in routes

### 14.2 Database
- **Uses**: Phase 1 `profiles` and `user_preferences` tables
- **Integration**: User locale, date format, page size used as defaults for new resumes
- **Pattern**: Extend Phase 1 RLS pattern to Phase 2 `resumes` table

### 14.3 API Utilities
- **Uses**: Phase 1 `withAuth`, `apiSuccess`, `apiError` helpers
- **Integration**: All Phase 2 API routes use same wrappers
- **Pattern**: Consistent response format across all routes

### 14.4 Repository Pattern
- **Uses**: Phase 1 pure function pattern (DI of SupabaseClient)
- **Integration**: Phase 2 adds `documents.ts` repository following same pattern
- **Files**: Phase 1 `profiles.ts`, `preferences.ts` → Phase 2 `documents.ts`

### 14.5 Design System
- **Uses**: Phase 1 design tokens, shadcn/ui components, dark mode
- **Integration**: Phase 2 UI uses same tokens, adds new components
- **Pattern**: All Phase 2 components follow component standards

### 14.6 Navigation
- **Uses**: Phase 1 navigation structure (header, sidebar)
- **Integration**: Phase 2 adds dashboard and editor routes to existing nav
- **Pattern**: Dashboard at `/dashboard`, Editor at `/editor/[id]`

---

## 15. PHASE BOUNDARIES (What Phase 2 Does NOT Include)

### NOT in Phase 2: AI Features (Phase 4)
- AI-assisted drafting
- Bullet point generation
- Content suggestions
- Job description parsing
- Keyword extraction
- Resume optimization

**Why**: Phase 2 focuses on data management. AI comes after template system is in place.

### NOT in Phase 2: Template System (Phase 3)
- Template gallery
- Template switching
- Styled resume rendering
- Live preview with design
- Template customization (colors, fonts, layout)
- CSS-based template rendering
- Paged media layout

**Why**: Phase 2 stores data. Phase 3 renders that data with templates.

### NOT in Phase 2: Preview System (Phase 3)
- Paginated preview
- Print CSS rendering
- Real-time styled updates
- Template-based rendering
- Page break handling

**Why**: Preview requires template system from Phase 3.

### NOT in Phase 2: Export (Phase 5)
- PDF generation
- DOCX generation
- Download functionality
- Print functionality
- Export queue

**Why**: Export requires template system from Phase 3.

### NOT in Phase 2: Scoring (Phase 6)
- Resume scoring
- ATS readiness checks
- Keyword matching
- Content strength analysis
- Suggestions generation

**Why**: Scoring requires complete data model and AI integration.

### NOT in Phase 2: Cover Letters (Phase 7)
- Cover letter creation
- Cover letter editor
- Cover letter templates
- Cover letter CRUD

**Why**: Focus on resumes first, replicate pattern for cover letters later.

---

## 16. SUCCESS CRITERIA (Phase Gate Requirements)

**Reference**: [internal:/ai_docs/phases/phase_2.md#L7-L48]

Phase 2 is complete ONLY when ALL of these are verified:

### 16.1 Playbook Execution (~20-30 minutes)
- [ ] **Document CRUD Playbook** (`phase_2_documents.md`)
  - Create, read, update, delete operations working
  - Document listing with search/filter/sort
  - Soft delete and restore from trash
  - Duplicate documents working

- [ ] **Editor Playbook** (`phase_2_editor.md`)
  - Basic form editor functional
  - Add/remove/reorder sections
  - Field validation working
  - Character counters visible

- [ ] **Auto-save Playbook** (`phase_2_autosave.md`)
  - Auto-save triggers after edits
  - Manual save button works
  - Version history tracking
  - Undo/redo functionality

### 16.2 Visual Verification (~10 minutes)
- [ ] **Desktop screenshots** (1440px) for document list, editor, version history
- [ ] **Mobile screenshots** (375px) for responsive layouts
- [ ] All UI features meet visual quality standards:
  - Form inputs have clear labels and focus states
  - Document cards use generous padding (p-6)
  - Primary actions clearly identified (one lime button per section)
  - Design tokens used throughout (no hardcoded values)
  - Auto-save indicator visible

### 16.3 Performance Validation
- [ ] Auto-save triggers within 2 seconds of last edit
- [ ] Document list loads in <500ms
- [ ] Form field updates <50ms
- [ ] Undo operations <20ms

### 16.4 Documentation
- [ ] Screenshots saved to `ai_docs/progress/phase_2/screenshots/`
- [ ] `visual_review.md` completed
- [ ] `playbook_results.md` completed
- [ ] All critical issues resolved

**Total Time**: 30-40 minutes per phase gate

---

## 17. KNOWN CONSTRAINTS & DECISIONS

**Reference**: [internal:/ai_docs/development_decisions.md], [internal:/ai_docs/coding_patterns.md]

### 17.1 Technology Stack (Fixed)
- **Auth**: Google OAuth only (via Supabase)
- **Database**: Supabase Postgres only
- **UI**: Tailwind CSS + shadcn/ui only (NO other UI libraries)
- **State**: Zustand + zundo only
- **Icons**: Lucide React only
- **Testing**: Puppeteer MCP + playbooks (NO Playwright, NO Vitest)

### 17.2 Development Constraints
- **NO automated migrations** during development (file-only until user approval)
- **NO testing code** (execute playbooks, don't write tests)
- **NO hardcoded design values** (use design tokens only)
- **NO service role keys** in runtime code (always user-scoped client)
- **NO DaisyUI** (removed, use shadcn/ui)
- **NO analytics** (error/performance logging only)

### 17.3 Phase 2 Specific Decisions
- **Form-based editor only** (no rich text editing until Phase 3)
- **Basic validation** (comprehensive validation in Phase 3)
- **Simple versioning** (full diff view in future phase)
- **Local undo history** (not persisted across sessions)
- **Soft delete** (documents moved to trash, not permanently deleted)
- **Cursor-based pagination** (simpler than offset, better for large datasets)

---

## 18. FILE STRUCTURE (Phase 2 Additions)

```
/Users/varunprasad/code/prjs/resumepair/

app/
  api/v1/
    resumes/
      route.ts                          # GET (list), POST (create)
      [id]/
        route.ts                        # GET, PUT, DELETE
        duplicate/
          route.ts                      # POST
        restore/
          route.ts                      # POST
        versions/
          route.ts                      # GET (list versions)
          [version]/
            route.ts                    # GET (get version)
            restore/
              route.ts                  # POST (restore version)
    templates/
      route.ts                          # GET (list templates)
      [id]/
        route.ts                        # GET (get template)
  dashboard/
    page.tsx                            # Document list page
    loading.tsx                         # Loading skeleton
  editor/
    [id]/
      page.tsx                          # Resume editor page
      layout.tsx                        # Editor layout wrapper
      loading.tsx                       # Editor skeleton
    new/
      page.tsx                          # New document creation
  trash/
    page.tsx                            # Deleted documents

components/
  documents/
    DocumentCard.tsx                    # Grid view card
    DocumentListItem.tsx                # List view item
    DocumentGrid.tsx                    # Grid container
    DocumentList.tsx                    # List container
    DocumentSearch.tsx                  # Search bar
    DocumentFilters.tsx                 # Filter controls
    DocumentSort.tsx                    # Sort dropdown
    DocumentActions.tsx                 # Bulk actions bar
    EmptyDocuments.tsx                  # Empty state
    CreateDocumentDialog.tsx            # Creation modal
  editor/
    EditorLayout.tsx                    # Editor container
    EditorHeader.tsx                    # Save status, actions
    EditorSidebar.tsx                   # Section navigation
    EditorForm.tsx                      # Main form container
    sections/
      ProfileSection.tsx                # Profile fields
      SummarySection.tsx                # Summary textarea
      WorkSection.tsx                   # Work experience array
      EducationSection.tsx              # Education array
      ProjectsSection.tsx               # Projects array
      SkillsSection.tsx                 # Skills grouped array
      CertificationsSection.tsx         # Certifications array
      AwardsSection.tsx                 # Awards array
      LanguagesSection.tsx              # Languages array
      ExtrasSection.tsx                 # Extra sections array
    fields/
      TextField.tsx                     # Single-line text input
      TextAreaField.tsx                 # Multi-line text
      SelectField.tsx                   # Dropdown select
      DateField.tsx                     # Date picker
      ArrayField.tsx                    # Dynamic array of items
      LinkField.tsx                     # URL input with validation
    AutoSaveIndicator.tsx               # Save status widget
    UndoRedoButtons.tsx                 # Undo/redo controls
    VersionHistory.tsx                  # Version list modal

libs/
  repositories/
    documents.ts                        # Resume CRUD functions
    versions.ts                         # Version history functions
  stores/
    documentStore.ts                    # Zustand store for current document
    documentListStore.ts                # Zustand store for document list
  validation/
    resume.ts                           # Zod schemas for ResumeJson
  utils/
    resume-helpers.ts                   # Helper functions for resume data

migrations/
  phase2/
    001_create_resumes_table.sql        # Resumes table
    002_create_resume_versions_table.sql # Version history
    003_create_resume_templates_table.sql # Starter templates (optional)
    004_setup_rls_policies_resumes.sql  # RLS policies
    005_seed_resume_templates.sql       # Seed data (optional)
    index.md                            # Migration tracking

ai_docs/
  testing/
    playbooks/
      phase_2_documents.md              # CRUD playbook
      phase_2_editor.md                 # Editor playbook
      phase_2_autosave.md               # Auto-save playbook
  progress/
    phase_2/
      screenshots/                      # All Phase 2 screenshots
      visual_review.md                  # Visual verification results
      playbook_results.md               # Playbook execution results
```

---

## 19. LEARNINGS FROM PHASE 1

**Reference**: [internal:/ai_docs/progress/phase_1/phase_summary.md#L449-L479]

### What Went Well
- **Agent-based execution**: Context-gatherer → Planner → Implementer → Reviewer workflow highly effective
- **Repository pattern**: Pure functions with DI worked perfectly
- **Design tokens**: CSS variables made theme switching trivial
- **shadcn/ui**: Composition approach gave full control
- **RLS policies**: Database-level enforcement prevented data leaks
- **Automated validation**: Build + lint + code review caught all major issues

### Challenges Faced
- **Context loss**: Session ran out of context mid-implementation
  - **Solution**: Comprehensive recovery doc created
- **Auth trigger permissions**: MCP cannot apply triggers on `auth.users`
  - **Solution**: Manual application documented
- **OAuth testing**: Cannot test Google OAuth in automated environment
  - **Solution**: Manual testing checklist created

### Discoveries
- **Edge runtime limitation**: Admin operations require Node.js runtime
  - **Fix**: Added `export const runtime = 'nodejs'` where needed
- **RLS policy coverage**: Initially forgot DELETE policy
  - **Fix**: Added complete policy set in iteration

### Apply to Phase 2
- **Plan for context limits**: Save progress frequently, document well
- **Manual steps early**: Identify anything requiring user action upfront
- **Complete RLS from start**: All policies (SELECT, INSERT, UPDATE, DELETE)
- **Runtime selection**: Edge for reads, Node for writes/admin
- **Visual verification**: Integrate into development, not end of phase

---

## 20. REFERENCE DOCUMENTATION

### Internal References
- **PRD**: `/ai_docs/project_documentation/1_prd_v1.md`
- **System Architecture**: `/ai_docs/project_documentation/2_system_architecture.md`
- **Database Schema**: `/ai_docs/project_documentation/4_database_schema.md`
- **Coding Patterns**: `/ai_docs/coding_patterns.md`
- **Development Decisions**: `/ai_docs/development_decisions.md`
- **Design System**: `/ai_docs/design-system.md`

### Standards
- **Architecture Principles**: `/ai_docs/standards/1_architecture_principles.md`
- **Data Flow Patterns**: `/ai_docs/standards/2_data_flow_patterns.md`
- **Component Standards**: `/ai_docs/standards/3_component_standards.md`
- **API Design Contracts**: `/ai_docs/standards/4_api_design_contracts.md`
- **Error Handling**: `/ai_docs/standards/5_error_handling_strategy.md`
- **Security Checklist**: `/ai_docs/standards/6_security_checklist.md`
- **Performance Guidelines**: `/ai_docs/standards/7_performance_guidelines.md`

### Testing
- **Testing README**: `/ai_docs/testing/README.md`
- **MCP Patterns**: `/ai_docs/testing/mcp_patterns.md`
- **Visual Verification Workflow**: `/ai_docs/standards/9_visual_verification_workflow.md`

### Phase 1 Deliverables
- **Phase 1 Summary**: `/ai_docs/progress/phase_1/phase_summary.md`
- **Phase 2 Handoff**: `/ai_docs/progress/phase_2_handoff.md`
- **Visual Review**: `/ai_docs/progress/phase_1/visual_review.md`

---

## 21. CONTEXT VERIFICATION CHECKLIST

Before implementation begins, verify this context is complete:

- [x] Phase 2 scope fully defined (what to build)
- [x] Phase 2 exclusions clear (what NOT to build)
- [x] Phase 1 foundation documented (what already exists)
- [x] ResumeJson schema complete (canonical data structure)
- [x] Database requirements specified (tables, RLS, indexes, migrations)
- [x] API requirements listed (all endpoints with details)
- [x] State management design documented (Zustand + zundo)
- [x] Component hierarchy defined (pages, features, fields)
- [x] Coding patterns explained (repository, API, design tokens, migrations)
- [x] Design system requirements documented (Ramp palette, tokens, spacing)
- [x] Performance budgets defined (< 2s auto-save, < 500ms list loads)
- [x] Security requirements documented (RLS, validation, auth)
- [x] Testing approach explained (Puppeteer MCP + playbooks)
- [x] Integration points identified (Phase 1 → Phase 2)
- [x] Phase boundaries clear (what Phase 2 does NOT include)
- [x] Success criteria defined (playbooks, visual verification, performance)
- [x] Known constraints documented (technology stack, development rules)
- [x] File structure mapped (all Phase 2 additions)
- [x] Learnings from Phase 1 applied
- [x] Reference documentation linked

**Context Status**: COMPLETE - Ready for planner agent

---

## SUMMARY FOR IMPLEMENTER

Phase 2 builds the core document management system with:

1. **CRUD Operations**: Create, read, update, delete resumes with soft delete and restore
2. **Document Management**: List, search, filter, sort with cursor-based pagination
3. **Form Editor**: Structured data entry for all ResumeJson fields with validation
4. **Auto-Save**: Debounced saves (2s) with dirty state tracking and conflict resolution
5. **Versioning**: Immutable version history with restore capability
6. **Undo/Redo**: 50-step history with zundo middleware
7. **State Management**: Zustand stores for editor and list with optimistic updates

**Key Constraints**:
- Use Phase 1 auth, API utilities, design system (already exists)
- Follow repository pattern (pure functions, DI)
- Use design tokens only (no hardcoded values)
- Migrations are file-only (don't apply during development)
- Mandatory visual verification for all UI features
- Test with Puppeteer MCP + playbooks (no test code)

**Success Definition**: Users can create, edit, and manage resumes with auto-save, undo/redo, and version history. All operations meet performance budgets. Visual quality meets Ramp design standards.

**Ready for Implementation**: This context document is complete, unambiguous, and ready for the planner agent to create a detailed implementation plan.

---

**Context Gathered By**: CONTEXTGATHERER Agent
**Date**: 2025-09-30
**Status**: DEFINITIVE - No ambiguity, no missing information
**Next Step**: Planner agent creates implementation plan from this context