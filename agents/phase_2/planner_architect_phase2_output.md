# Phase 2 Implementation Plan: Document Management & Basic Editor

**Project**: ResumePair
**Phase**: Phase 2 - Document Management & Basic Editor
**Plan Created**: 2025-09-30
**Status**: IMPLEMENTATION-READY
**Planner**: PLANNER-ARCHITECT Agent

---

## EXECUTIVE SUMMARY

This plan provides complete implementation specifications for Phase 2: Document Management & Basic Editor. The implementer agent can execute this plan without additional research or clarification.

**What Phase 2 Delivers**:
- Full CRUD operations for resume documents with RLS-enforced user isolation
- Form-based editor with 10+ sections supporting nested arrays (work, education, projects)
- Debounced auto-save (2s) with optimistic locking and conflict resolution
- 50-step undo/redo history with zundo temporal middleware
- Version history with full snapshot strategy (last 30 versions)
- State management with Zustand + zundo for document state, react-hook-form for form state

**Key Architectural Decisions**:
1. **State Split**: Zustand owns persisted document state, RHF owns transient form state
2. **Full Snapshots**: Store complete ResumeJson on each save (not deltas) for simplicity
3. **Optimistic Locking**: Version-based concurrency control (not pessimistic locks)
4. **localStorage Offline Queue**: Failed saves retry with exponential backoff
5. **Field-Level Validation**: Zod validation on blur (not every keystroke)

**Performance Targets** (from Phase 2 context):
- Auto-save trigger: <2s after last keystroke ✅
- Document list load: <500ms ✅
- Form field update: <50ms (keystroke → state) ✅
- Undo operation: <20ms ✅
- Document switch: <200ms ✅

**Estimated Implementation Time**: 5-6 days (40-48 hours)

---

## 1. DATABASE SCHEMA

### Migration Files to Create (File-Only, Not Applied)

All migrations created in `/migrations/phase2/` directory. **CRITICAL**: Do NOT apply these migrations during development. They are created as files only and applied AFTER explicit user permission.

---

#### Migration 001: Create Resumes Table

**File**: `/migrations/phase2/001_create_resumes_table.sql`

```sql
-- =============================================================================
-- Migration: Create resumes table
-- Description: Main table for storing resume documents with optimistic locking
-- Author: Phase 2 Implementation
-- Date: 2025-09-30
-- =============================================================================

-- Create resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document metadata
  title TEXT NOT NULL,
  slug TEXT,  -- Optional URL-friendly identifier

  -- Versioning (optimistic concurrency control)
  version INTEGER NOT NULL DEFAULT 1,
  schema_version TEXT NOT NULL DEFAULT 'resume.v1',

  -- Document data (ResumeJson)
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),

  -- Status management
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

-- Add comments for documentation
COMMENT ON TABLE public.resumes IS 'User resume documents with version control and soft delete';
COMMENT ON COLUMN public.resumes.version IS 'Incremented on each update for optimistic locking';
COMMENT ON COLUMN public.resumes.schema_version IS 'Identifies ResumeJson schema version (e.g., resume.v1)';
COMMENT ON COLUMN public.resumes.data IS 'Complete ResumeJson object stored as JSONB';
COMMENT ON COLUMN public.resumes.slug IS 'Optional URL-friendly identifier unique per user';
COMMENT ON COLUMN public.resumes.is_deleted IS 'Soft delete flag - documents kept for 30 days';

-- Indexes for performance
CREATE INDEX resumes_user_id_idx ON public.resumes(user_id);
CREATE INDEX resumes_user_status_idx ON public.resumes(user_id, status) WHERE is_deleted = FALSE;
CREATE INDEX resumes_user_deleted_idx ON public.resumes(user_id, is_deleted);
CREATE INDEX resumes_updated_at_idx ON public.resumes(updated_at DESC);

-- Unique constraint on slug per user (when slug is not null)
CREATE UNIQUE INDEX resumes_user_slug_idx ON public.resumes(user_id, slug) WHERE slug IS NOT NULL;

-- Optional: Full-text search on title (Phase 2.5 feature)
CREATE INDEX resumes_title_search_idx ON public.resumes USING GIN(to_tsvector('english', title));

-- Trigger to automatically update updated_at
CREATE TRIGGER set_updated_at_on_resumes
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();
```

**Design Rationale**:
- **version column**: Enables optimistic concurrency control (check-and-set pattern)
- **JSONB data type**: Native JSON support with indexing, faster than TEXT
- **Soft delete**: Preserves data for recovery (30-day retention window)
- **Composite indexes**: Cover common queries (user + status, user + deleted)
- **Full-text search**: Prepared for search feature in Phase 2.5

---

#### Migration 002: Create Resume Versions Table

**File**: `/migrations/phase2/002_create_resume_versions_table.sql`

```sql
-- =============================================================================
-- Migration: Create resume_versions table
-- Description: Immutable version history with full snapshots
-- Author: Phase 2 Implementation
-- Date: 2025-09-30
-- =============================================================================

-- Create resume_versions table
CREATE TABLE IF NOT EXISTS public.resume_versions (
  -- Primary key (BIGSERIAL for unlimited versions)
  id BIGSERIAL PRIMARY KEY,

  -- Foreign key to resume
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,

  -- Version tracking
  version_number INTEGER NOT NULL,

  -- Snapshot data (full ResumeJson)
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),

  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Ensure one snapshot per version number
  UNIQUE (resume_id, version_number)
);

-- Add comments
COMMENT ON TABLE public.resume_versions IS 'Immutable version history for resumes (full snapshots)';
COMMENT ON COLUMN public.resume_versions.version_number IS 'Snapshot of version number at time of save (before increment)';
COMMENT ON COLUMN public.resume_versions.data IS 'Full ResumeJson snapshot (not delta)';
COMMENT ON COLUMN public.resume_versions.created_by IS 'User who created this version (for audit trail)';

-- Indexes
CREATE INDEX resume_versions_resume_id_idx ON public.resume_versions(resume_id, version_number DESC);
CREATE INDEX resume_versions_created_at_idx ON public.resume_versions(resume_id, created_at DESC);
CREATE INDEX resume_versions_created_by_idx ON public.resume_versions(created_by);

-- Optional: GIN index on JSONB data for search in versions (Phase 2.5)
-- CREATE INDEX resume_versions_data_gin ON public.resume_versions USING GIN (data);
```

**Design Rationale**:
- **BIGSERIAL**: Supports 9 quintillion versions (vs INT max 2 billion)
- **Full snapshots**: Simpler than deltas, O(1) retrieval, no replay needed
- **CASCADE delete**: Versions deleted when resume deleted (data consistency)
- **created_by**: Audit trail for multi-user scenarios (future-proof)

---

#### Migration 003: Create Resume Templates Table

**File**: `/migrations/phase2/003_create_resume_templates_table.sql`

```sql
-- =============================================================================
-- Migration: Create resume_templates table
-- Description: Optional starter templates for new resumes (Phase 2.5)
-- Author: Phase 2 Implementation
-- Date: 2025-09-30
-- =============================================================================

-- Create resume_templates table (optional for Phase 2)
CREATE TABLE IF NOT EXISTS public.resume_templates (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,  -- e.g., "Student", "Professional", "Executive"

  -- Template data (starter ResumeJson)
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),

  -- Visual preview
  thumbnail_url TEXT,

  -- Default template flag
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.resume_templates IS 'Starter templates for new resumes (system-provided)';
COMMENT ON COLUMN public.resume_templates.data IS 'Starter ResumeJson with example content';
COMMENT ON COLUMN public.resume_templates.is_default IS 'Default template shown in create dialog';

-- Ensure only one default template
CREATE UNIQUE INDEX resume_templates_default_idx ON public.resume_templates(is_default) WHERE is_default = TRUE;

-- Index for category filtering
CREATE INDEX resume_templates_category_idx ON public.resume_templates(category);
```

**Design Rationale**:
- **Optional for Phase 2**: Can defer seeding templates until Phase 2.5
- **System-provided**: No user_id column (templates are global)
- **is_default constraint**: Ensures only one default template
- **thumbnail_url**: Prepared for visual template gallery

---

#### Migration 004: Setup RLS Policies for Resumes

**File**: `/migrations/phase2/004_setup_rls_policies_resumes.sql`

```sql
-- =============================================================================
-- Migration: Setup RLS policies for resumes
-- Description: User isolation policies enforcing row-level security
-- Author: Phase 2 Implementation
-- Date: 2025-09-30
-- =============================================================================

-- Enable RLS on resumes table
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own resumes
CREATE POLICY resumes_select_own
  ON public.resumes FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can INSERT resumes for themselves
CREATE POLICY resumes_insert_own
  ON public.resumes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can UPDATE their own resumes
CREATE POLICY resumes_update_own
  ON public.resumes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can DELETE their own resumes (soft delete via UPDATE)
CREATE POLICY resumes_delete_own
  ON public.resumes FOR DELETE
  USING (user_id = auth.uid());

-- Enable RLS on resume_versions table
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT versions of their own resumes
CREATE POLICY resume_versions_select_own
  ON public.resume_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = resume_id AND r.user_id = auth.uid()
    )
  );

-- Policy: Users can INSERT versions for their own resumes
CREATE POLICY resume_versions_insert_own
  ON public.resume_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = resume_id AND r.user_id = auth.uid()
    )
  );

-- Enable RLS on resume_templates table
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read templates
CREATE POLICY resume_templates_select_all
  ON public.resume_templates FOR SELECT
  TO authenticated
  USING (TRUE);

-- Note: Only admins should be able to create/update templates
-- Admin policies to be added in Phase 2.5
```

**Design Rationale**:
- **RLS enforces user isolation at database level**: No user can access another user's resumes
- **Automatic enforcement**: Repository functions don't need to manually filter by user_id
- **Defense in depth**: Even if application code has bugs, database prevents unauthorized access
- **Version policies**: Tied to resume ownership via EXISTS subquery

---

#### Migration 005: Create Indexes for Performance

**File**: `/migrations/phase2/005_create_resume_indexes.sql`

```sql
-- =============================================================================
-- Migration: Create additional performance indexes
-- Description: Optimize common query patterns
-- Author: Phase 2 Implementation
-- Date: 2025-09-30
-- =============================================================================

-- Index for pagination by updated_at
CREATE INDEX IF NOT EXISTS resumes_user_updated_cursor_idx
  ON public.resumes(user_id, updated_at DESC, id)
  WHERE is_deleted = FALSE;

-- Index for filtering by status and sorting
CREATE INDEX IF NOT EXISTS resumes_user_status_updated_idx
  ON public.resumes(user_id, status, updated_at DESC)
  WHERE is_deleted = FALSE;

-- Index for trash view (deleted documents)
CREATE INDEX IF NOT EXISTS resumes_user_deleted_at_idx
  ON public.resumes(user_id, deleted_at DESC)
  WHERE is_deleted = TRUE;

-- Index for version history pagination
CREATE INDEX IF NOT EXISTS resume_versions_pagination_idx
  ON public.resume_versions(resume_id, created_at DESC, version_number DESC);

-- Analyze tables to update statistics
ANALYZE public.resumes;
ANALYZE public.resume_versions;
ANALYZE public.resume_templates;
```

**Design Rationale**:
- **Cursor-based pagination**: Includes (updated_at, id) for stable cursors
- **Partial indexes**: Include WHERE clause to reduce index size
- **Query plan optimization**: ANALYZE updates statistics for query planner

---

#### Migration 006: Seed Resume Templates (Optional)

**File**: `/migrations/phase2/006_seed_resume_templates.sql`

```sql
-- =============================================================================
-- Migration: Seed resume templates (OPTIONAL for Phase 2)
-- Description: Insert starter templates with example content
-- Author: Phase 2 Implementation
-- Date: 2025-09-30
-- =============================================================================

-- NOTE: This migration is OPTIONAL and can be deferred to Phase 2.5
-- It inserts 1-3 starter templates with example ResumeJson data

-- Insert: Minimal Professional Template (default)
INSERT INTO public.resume_templates (id, name, description, category, is_default, data)
VALUES (
  gen_random_uuid(),
  'Minimal Professional',
  'Clean, modern resume with essential sections',
  'Professional',
  TRUE,
  '{
    "profile": {
      "fullName": "",
      "email": "",
      "phone": "",
      "location": {}
    },
    "summary": "",
    "work": [],
    "education": [],
    "projects": [],
    "skills": [],
    "settings": {
      "locale": "en-US",
      "dateFormat": "US",
      "fontFamily": "Inter",
      "fontSizeScale": 1.0,
      "lineSpacing": 1.2,
      "colorTheme": "default",
      "iconSet": "lucide",
      "showIcons": false,
      "sectionOrder": ["profile", "summary", "work", "education", "projects", "skills"],
      "pageSize": "Letter"
    }
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Additional templates can be added here (Phase 2.5)
```

**Design Rationale**:
- **Deferred to Phase 2.5**: Not critical for Phase 2 MVP
- **Empty template**: Provides clean starting point
- **ON CONFLICT DO NOTHING**: Idempotent (safe to re-run)

---

### Migration Tracking

**File**: `/migrations/phase2/index.md`

```markdown
# Phase 2 Migrations

## Status: CREATED (Not Applied)

All migration files created but NOT applied to database.

## Migrations

1. `001_create_resumes_table.sql` - Main resumes table with optimistic locking
2. `002_create_resume_versions_table.sql` - Version history with full snapshots
3. `003_create_resume_templates_table.sql` - Optional starter templates
4. `004_setup_rls_policies_resumes.sql` - RLS policies for user isolation
5. `005_create_resume_indexes.sql` - Performance indexes
6. `006_seed_resume_templates.sql` - Optional template seed data

## Application Instructions

**CRITICAL**: These migrations are NOT applied automatically.

### User Review Required

User must review all SQL files before application.

### Application via MCP

After user approval, apply migrations in order:

```bash
# Apply migrations via Supabase MCP
mcp__supabase__apply_migration({
  project_id: 'resumepair',
  name: 'phase2_001_create_resumes_table',
  query: '<contents of 001_create_resumes_table.sql>'
})

# Repeat for migrations 002-006
```

## Verification

After application, verify:
- All tables created: `resumes`, `resume_versions`, `resume_templates`
- RLS enabled on all tables
- Indexes created successfully
- Policies active

## Rollback

If issues occur, provide rollback SQL (DROP statements) to user.
```

---

## 2. REPOSITORY LAYER

### File: `/libs/repositories/documents.ts`

Complete repository implementation with pure functions and dependency injection.

```typescript
/**
 * Resume Document Repository
 *
 * Pure functions for resume CRUD operations with optimistic concurrency control.
 * All functions receive SupabaseClient as first parameter (dependency injection).
 *
 * @module repositories/documents
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { ResumeJson } from '@/types'

// =============================================================================
// Types
// =============================================================================

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

export interface ResumeVersion {
  id: number
  resume_id: string
  version_number: number
  data: ResumeJson
  created_at: string
  created_by: string
}

export interface ResumeListOptions {
  status?: 'draft' | 'active' | 'archived'
  search?: string
  limit?: number
  cursor?: string
}

export interface ResumeListResult {
  resumes: Resume[]
  nextCursor: string | null
  total: number
}

// =============================================================================
// Document CRUD Operations
// =============================================================================

/**
 * Get all resumes for a user with optional filtering and pagination
 */
export async function getResumes(
  supabase: SupabaseClient,
  userId: string,
  options: ResumeListOptions = {}
): Promise<ResumeListResult> {
  const { status, search, limit = 20, cursor } = options

  // Build query with RLS automatically enforced
  let query = supabase
    .from('resumes')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_deleted', false)

  // Apply filters
  if (status) {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  // Pagination (cursor-based)
  query = query.order('updated_at', { ascending: false }).limit(limit)

  if (cursor) {
    query = query.lt('updated_at', cursor)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch resumes: ${error.message}`)
  }

  // Calculate next cursor
  const nextCursor =
    data && data.length === limit ? data[data.length - 1].updated_at : null

  return {
    resumes: (data as Resume[]) || [],
    nextCursor,
    total: count || 0,
  }
}

/**
 * Get a single resume by ID
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

  // Update last_accessed_at (fire-and-forget)
  supabase
    .from('resumes')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', id)
    .then()

  return data as Resume
}

/**
 * Create a new resume
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
 *
 * @throws Error with 'CONFLICT' message if version mismatch
 */
export async function updateResume(
  supabase: SupabaseClient,
  id: string,
  updates: {
    title?: string
    data?: ResumeJson
    status?: 'draft' | 'active' | 'archived'
  },
  currentVersion: number
): Promise<Resume> {
  // Step 1: Snapshot current version to history
  const { data: current } = await supabase
    .from('resumes')
    .select('version, data, user_id')
    .eq('id', id)
    .single()

  if (current) {
    // Create version snapshot (fire-and-forget, no await)
    supabase
      .from('resume_versions')
      .insert({
        resume_id: id,
        version_number: current.version,
        data: current.data,
        created_by: current.user_id,
      })
      .then()
  }

  // Step 2: Update with optimistic concurrency check
  const { data, error } = await supabase
    .from('resumes')
    .update({
      ...updates,
      version: currentVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('version', currentVersion) // WHERE version = currentVersion
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows updated: version conflict
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
 */
export async function deleteResume(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('resumes')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete resume: ${error.message}`)
  }
}

/**
 * Restore a soft-deleted resume
 */
export async function restoreResume(
  supabase: SupabaseClient,
  id: string
): Promise<Resume> {
  const { data, error } = await supabase
    .from('resumes')
    .update({
      is_deleted: false,
      deleted_at: null,
    })
    .eq('id', id)
    .eq('is_deleted', true) // Only restore deleted documents
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to restore resume: ${error.message}`)
  }

  if (!data) {
    throw new Error('Resume not found or not deleted')
  }

  return data as Resume
}

/**
 * Duplicate an existing resume
 */
export async function duplicateResume(
  supabase: SupabaseClient,
  id: string
): Promise<Resume> {
  // Fetch source resume
  const source = await getResume(supabase, id)

  // Create duplicate with "(Copy)" suffix
  const title = `${source.title} (Copy)`

  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: source.user_id,
      title,
      schema_version: source.schema_version,
      data: source.data,
      version: 1,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to duplicate resume: ${error.message}`)
  }

  return data as Resume
}

// =============================================================================
// Version History Operations
// =============================================================================

/**
 * Get version history for a resume
 */
export async function getVersions(
  supabase: SupabaseClient,
  resumeId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<ResumeVersion[]> {
  const { limit = 30, offset = 0 } = options

  const { data, error } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('resume_id', resumeId)
    .order('version_number', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch versions: ${error.message}`)
  }

  return (data as ResumeVersion[]) || []
}

/**
 * Get a specific version
 */
export async function getVersion(
  supabase: SupabaseClient,
  resumeId: string,
  versionNumber: number
): Promise<ResumeVersion> {
  const { data, error } = await supabase
    .from('resume_versions')
    .select('*')
    .eq('resume_id', resumeId)
    .eq('version_number', versionNumber)
    .single()

  if (error) {
    throw new Error(`Failed to fetch version: ${error.message}`)
  }

  if (!data) {
    throw new Error('Version not found')
  }

  return data as ResumeVersion
}

/**
 * Restore a specific version (creates new version with old data)
 */
export async function restoreVersion(
  supabase: SupabaseClient,
  resumeId: string,
  versionNumber: number
): Promise<Resume> {
  // Fetch version data
  const version = await getVersion(supabase, resumeId, versionNumber)

  // Get current resume to extract version and user_id
  const current = await getResume(supabase, resumeId)

  // Update current document with version data
  return await updateResume(
    supabase,
    resumeId,
    { data: version.data },
    current.version
  )
}

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Delete multiple resumes (soft delete)
 */
export async function bulkDeleteResumes(
  supabase: SupabaseClient,
  ids: string[]
): Promise<number> {
  const { count, error } = await supabase
    .from('resumes')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to bulk delete resumes: ${error.message}`)
  }

  return count || 0
}

/**
 * Archive multiple resumes
 */
export async function bulkArchiveResumes(
  supabase: SupabaseClient,
  ids: string[]
): Promise<number> {
  const { count, error } = await supabase
    .from('resumes')
    .update({ status: 'archived' })
    .in('id', ids)

  if (error) {
    throw new Error(`Failed to bulk archive resumes: ${error.message}`)
  }

  return count || 0
}

// =============================================================================
// Template Operations (Optional for Phase 2)
// =============================================================================

/**
 * Get all resume templates
 */
export async function getTemplates(
  supabase: SupabaseClient
): Promise<any[]> {
  const { data, error } = await supabase
    .from('resume_templates')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`)
  }

  return data || []
}

/**
 * Get default template
 */
export async function getDefaultTemplate(
  supabase: SupabaseClient
): Promise<any | null> {
  const { data, error } = await supabase
    .from('resume_templates')
    .select('*')
    .eq('is_default', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch default template: ${error.message}`)
  }

  return data || null
}
```

**Key Design Decisions**:
1. **Pure functions with DI**: All functions receive SupabaseClient as first parameter
2. **RLS automatic**: No manual user_id filtering needed in queries
3. **Optimistic locking**: Version check in WHERE clause prevents lost updates
4. **Fire-and-forget snapshots**: Version history insertion doesn't block main update
5. **Error handling**: Explicit error messages, CONFLICT errors clearly marked

---

## 3. API ENDPOINTS

### API Route Structure

```
app/api/v1/
├── resumes/
│   ├── route.ts                      # GET (list), POST (create)
│   ├── [id]/
│   │   ├── route.ts                  # GET, PUT, DELETE
│   │   ├── duplicate/
│   │   │   └── route.ts              # POST
│   │   ├── restore/
│   │   │   └── route.ts              # POST
│   │   └── versions/
│   │       ├── route.ts              # GET (list versions)
│   │       └── [versionNumber]/
│   │           ├── route.ts          # GET (get version)
│   │           └── restore/
│   │               └── route.ts      # POST (restore version)
│   └── bulk/
│       ├── delete/
│       │   └── route.ts              # POST
│       └── archive/
│           └── route.ts              # POST
└── templates/
    ├── route.ts                      # GET (list templates)
    └── [id]/
        └── route.ts                  # GET (get template)
```

---

### Endpoint 1: GET /api/v1/resumes

**File**: `/app/api/v1/resumes/route.ts` (partial)

```typescript
import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getResumes, createResume } from '@/libs/repositories/documents'
import { createClient } from '@/libs/supabase/server'
import { z } from 'zod'

/**
 * GET /api/v1/resumes
 * List user's resumes with optional filtering and pagination
 */
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(req.url)

    // Parse query parameters
    const options = {
      status: searchParams.get('status') as 'draft' | 'active' | 'archived' | undefined,
      search: searchParams.get('search') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: parseInt(searchParams.get('limit') || '20', 10),
    }

    // Fetch resumes
    const result = await getResumes(supabase, user.id, options)

    return apiSuccess(result)
  } catch (error) {
    console.error('GET /api/v1/resumes error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to fetch resumes', message)
  }
})

/**
 * POST /api/v1/resumes
 * Create a new resume
 */
const CreateResumeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  template_id: z.string().uuid().optional(),
})

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const supabase = createClient()
    const body = await req.json()

    // Validate input
    const result = CreateResumeSchema.safeParse(body)
    if (!result.success) {
      return apiError(
        400,
        'Validation failed',
        result.error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
      )
    }

    const { title, template_id } = result.data

    // Get initial data (from template or default empty)
    let initialData: ResumeJson
    if (template_id) {
      // Fetch template (Phase 2.5 feature)
      // For Phase 2, just use default empty schema
    }

    // Default empty ResumeJson
    initialData = {
      profile: {
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
      },
      settings: {
        locale: 'en-US',
        dateFormat: 'US',
        fontFamily: 'Inter',
        fontSizeScale: 1.0,
        lineSpacing: 1.2,
        colorTheme: 'default',
        iconSet: 'lucide',
        showIcons: false,
        sectionOrder: ['profile', 'summary', 'work', 'education', 'projects', 'skills'],
        pageSize: 'Letter',
      },
    }

    // Create resume
    const resume = await createResume(supabase, user.id, title, initialData)

    return apiSuccess(resume, 'Resume created successfully')
  } catch (error) {
    console.error('POST /api/v1/resumes error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to create resume', message)
  }
})
```

**Response Format**:
```json
// GET /api/v1/resumes
{
  "success": true,
  "data": {
    "resumes": [...],
    "nextCursor": "2025-09-30T12:00:00Z",
    "total": 42
  }
}

// POST /api/v1/resumes
{
  "success": true,
  "data": { ...resume },
  "message": "Resume created successfully"
}
```

---

### Endpoint 2-4: Resume CRUD

**File**: `/app/api/v1/resumes/[id]/route.ts`

```typescript
import { NextRequest } from 'next/server'
import { withAuth, apiSuccess, apiError } from '@/libs/api-utils'
import { getResume, updateResume, deleteResume } from '@/libs/repositories/documents'
import { createClient } from '@/libs/supabase/server'
import { z } from 'zod'
import type { ResumeJson } from '@/types'

/**
 * GET /api/v1/resumes/:id
 * Get a specific resume
 */
export const GET = withAuth(async (req: NextRequest, user, { params }) => {
  try {
    const supabase = createClient()
    const { id } = params

    const resume = await getResume(supabase, id)

    return apiSuccess(resume)
  } catch (error) {
    console.error('GET /api/v1/resumes/:id error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return apiError(404, 'Resume not found', message)
    }

    return apiError(500, 'Failed to fetch resume', message)
  }
})

/**
 * PUT /api/v1/resumes/:id
 * Update a resume with optimistic concurrency control
 */
const UpdateResumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  data: z.any().optional(), // ResumeJsonSchema validation here
  status: z.enum(['draft', 'active', 'archived']).optional(),
  version: z.number().int().positive(),
})

export const PUT = withAuth(async (req: NextRequest, user, { params }) => {
  try {
    const supabase = createClient()
    const { id } = params
    const body = await req.json()

    // Validate input
    const result = UpdateResumeSchema.safeParse(body)
    if (!result.success) {
      return apiError(
        400,
        'Validation failed',
        result.error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
      )
    }

    const { title, data, status, version } = result.data

    // Update resume
    const updated = await updateResume(
      supabase,
      id,
      { title, data: data as ResumeJson, status },
      version
    )

    return apiSuccess(updated, 'Resume updated successfully')
  } catch (error) {
    console.error('PUT /api/v1/resumes/:id error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('CONFLICT')) {
      return apiError(409, 'Conflict: Document was updated elsewhere', message)
    }

    return apiError(500, 'Failed to update resume', message)
  }
})

/**
 * DELETE /api/v1/resumes/:id
 * Soft delete a resume
 */
export const DELETE = withAuth(async (req: NextRequest, user, { params }) => {
  try {
    const supabase = createClient()
    const { id } = params

    await deleteResume(supabase, id)

    return apiSuccess({ id }, 'Resume deleted successfully')
  } catch (error) {
    console.error('DELETE /api/v1/resumes/:id error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(500, 'Failed to delete resume', message)
  }
})
```

---

### Endpoint 5-12: Additional Operations

Due to length constraints, I'll provide **specifications** for remaining endpoints:

#### POST /api/v1/resumes/:id/duplicate
- **Implementation**: Call `duplicateResume(supabase, id)`
- **Response**: `ApiResponse<Resume>` with 201 status
- **Error**: 404 if source not found, 500 on failure

#### POST /api/v1/resumes/:id/restore
- **Implementation**: Call `restoreResume(supabase, id)`
- **Response**: `ApiResponse<Resume>`
- **Error**: 404 if not deleted, 500 on failure

#### GET /api/v1/resumes/:id/versions
- **Implementation**: Call `getVersions(supabase, id, { limit, offset })`
- **Response**: `ApiResponse<{ versions: ResumeVersion[] }>`

#### GET /api/v1/resumes/:id/versions/:versionNumber
- **Implementation**: Call `getVersion(supabase, id, versionNumber)`
- **Response**: `ApiResponse<ResumeVersion>`

#### POST /api/v1/resumes/:id/versions/:versionNumber/restore
- **Implementation**: Call `restoreVersion(supabase, id, versionNumber)`
- **Response**: `ApiResponse<Resume>` with restored data

#### POST /api/v1/resumes/bulk/delete
- **Body**: `{ ids: string[] }`
- **Implementation**: Call `bulkDeleteResumes(supabase, ids)`
- **Response**: `ApiResponse<{ deleted: number }>`

#### POST /api/v1/resumes/bulk/archive
- **Body**: `{ ids: string[] }`
- **Implementation**: Call `bulkArchiveResumes(supabase, ids)`
- **Response**: `ApiResponse<{ archived: number }>`

#### GET /api/v1/templates
- **Implementation**: Call `getTemplates(supabase)`
- **Response**: `ApiResponse<{ templates: Template[] }>`

---

## 4. VALIDATION SCHEMAS

### File: `/libs/validation/resume/index.ts`

Complete Zod schemas for ResumeJson validation.

```typescript
/**
 * Resume Validation Schemas
 *
 * Modular Zod schemas for validating ResumeJson structure.
 * Composed from smaller, reusable schemas.
 *
 * @module validation/resume
 */

import { z } from 'zod'

// =============================================================================
// Profile Schema
// =============================================================================

export const ProfileLocationSchema = z.object({
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postal: z.string().max(20).optional(),
})

export const ProfileLinkSchema = z.object({
  type: z.string().max(50).optional(),
  label: z.string().max(100).optional(),
  url: z.string().url('Invalid URL format'),
})

export const ProfilePhotoSchema = z.object({
  url: z.string().url('Invalid photo URL'),
  path: z.string().min(1, 'Photo path is required'),
})

export const ProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  headline: z.string().max(200).optional(),
  email: z.string().email('Invalid email format'),
  phone: z.string().max(50).optional(),
  location: ProfileLocationSchema.optional(),
  links: z.array(ProfileLinkSchema).optional(),
  photo: ProfilePhotoSchema.optional(),
})

// =============================================================================
// Work Experience Schema
// =============================================================================

export const WorkExperienceSchema = z
  .object({
    company: z.string().min(1, 'Company name is required').max(100),
    role: z.string().min(1, 'Job title is required').max(100),
    location: z.string().max(100).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    endDate: z
      .union([
        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
        z.literal('Present'),
        z.null(),
      ])
      .optional(),
    descriptionBullets: z.array(z.string().max(200)).optional(),
    achievements: z.array(z.string().max(200)).optional(),
    techStack: z.array(z.string().max(50)).optional(),
  })
  .refine(
    data => {
      // Cross-field validation: endDate must be after startDate
      if (!data.endDate || data.endDate === 'Present') return true
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end >= start
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  )

// =============================================================================
// Education Schema
// =============================================================================

export const EducationSchema = z.object({
  school: z.string().min(1, 'School name is required').max(100),
  degree: z.string().min(1, 'Degree is required').max(100),
  field: z.string().max(100).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  details: z.array(z.string().max(200)).optional(),
})

// =============================================================================
// Project Schema
// =============================================================================

export const ProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  link: z.string().url().optional(),
  summary: z.string().max(500).optional(),
  bullets: z.array(z.string().max(200)).optional(),
  techStack: z.array(z.string().max(50)).optional(),
})

// =============================================================================
// Skills Schema
// =============================================================================

export const SkillsGroupSchema = z.object({
  category: z.string().min(1, 'Category is required').max(50),
  items: z.array(z.string().max(50)),
})

// =============================================================================
// Other Sections
// =============================================================================

export const CertificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required').max(100),
  issuer: z.string().min(1, 'Issuer is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const AwardSchema = z.object({
  name: z.string().min(1, 'Award name is required').max(100),
  org: z.string().min(1, 'Organization is required').max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  summary: z.string().max(200).optional(),
})

export const LanguageSchema = z.object({
  name: z.string().min(1, 'Language name is required').max(50),
  level: z.string().min(1, 'Proficiency level is required').max(50),
})

export const ExtraSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(1, 'Content is required').max(500),
})

// =============================================================================
// Settings Schema
// =============================================================================

export const SettingsSchema = z.object({
  locale: z.string().default('en-US'),
  dateFormat: z.enum(['US', 'ISO', 'EU']).default('US'),
  addressFormat: z.string().optional(),
  fontFamily: z.string().default('Inter'),
  fontSizeScale: z.number().min(0.8).max(1.2).default(1.0),
  lineSpacing: z.number().min(1.0).max(1.5).default(1.2),
  colorTheme: z.string().default('default'),
  iconSet: z.literal('lucide').default('lucide'),
  showIcons: z.boolean().default(false),
  sectionOrder: z.array(z.string()).default([
    'profile',
    'summary',
    'work',
    'education',
    'projects',
    'skills',
  ]),
  pageSize: z.enum(['A4', 'Letter']).default('Letter'),
})

// =============================================================================
// Master ResumeJson Schema
// =============================================================================

export const ResumeJsonSchema = z.object({
  profile: ProfileSchema,
  summary: z.string().max(500, 'Summary must be 500 characters or less').optional(),
  work: z.array(WorkExperienceSchema).optional(),
  education: z.array(EducationSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  skills: z.array(SkillsGroupSchema).optional(),
  certifications: z.array(CertificationSchema).optional(),
  awards: z.array(AwardSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
  extras: z.array(ExtraSchema).optional(),
  settings: SettingsSchema,
})

// Export inferred TypeScript type
export type ResumeJson = z.infer<typeof ResumeJsonSchema>

// =============================================================================
// Request/Response Schemas
// =============================================================================

export const CreateResumeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  template_id: z.string().uuid().optional(),
})

export const UpdateResumeSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  data: ResumeJsonSchema.partial().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  version: z.number().int().positive(),
})

export const BulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
})
```

**Key Design Decisions**:
- **Modular composition**: Small schemas composed into master schema
- **Cross-field validation**: `.refine()` for date range validation
- **Clear error messages**: User-friendly validation feedback
- **Optional fields**: Reflects ResumeJson optional structure
- **Max lengths**: Prevents excessive data (performance)

---

## 5. STATE MANAGEMENT

### File: `/libs/stores/documentStore.ts`

Complete Zustand store with zundo temporal middleware and auto-save integration.

```typescript
/**
 * Document Store
 *
 * Zustand store with temporal (undo/redo) support for document editing.
 * Integrates with react-hook-form for transient form state.
 *
 * @module stores/documentStore
 */

import { create } from 'zustand'
import { temporal } from 'zundo'
import { immer } from 'zustand/middleware/immer'
import { debounce } from 'lodash'
import type { ResumeJson } from '@/types'

// =============================================================================
// Types
// =============================================================================

interface DocumentState {
  // Current state
  document: ResumeJson | null
  originalDocument: ResumeJson | null // Last saved state (for dirty check)
  documentId: string | null
  version: number

  // Save state
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null
  saveError: Error | null

  // Conflict resolution
  conflictModalOpen: boolean
  latestServerVersion: ResumeJson | null
  latestServerVersionNumber: number

  // Actions
  loadDocument: (id: string) => Promise<void>
  updateField: (path: string, value: any) => void
  saveDocument: () => Promise<void>
  autoSave: () => void
  resetChanges: () => void
  clearHistory: () => void

  // Conflict resolution actions
  keepMyChanges: () => Promise<void>
  useServerVersion: () => void

  // Computed (getters)
  canSave: () => boolean
  hasChanges: () => boolean
}

// =============================================================================
// Store Implementation
// =============================================================================

const useDocumentStore = create<DocumentState>()(
  temporal(
    immer((set, get) => ({
      // Initial state
      document: null,
      originalDocument: null,
      documentId: null,
      version: 1,
      isDirty: false,
      isSaving: false,
      lastSaved: null,
      saveError: null,
      conflictModalOpen: false,
      latestServerVersion: null,
      latestServerVersionNumber: 0,

      // Load document from API
      loadDocument: async (id: string) => {
        try {
          const response = await fetch(`/api/v1/resumes/${id}`)
          if (!response.ok) throw new Error('Failed to load document')

          const { data } = await response.json()

          set(state => {
            state.document = data.data
            state.originalDocument = structuredClone(data.data)
            state.documentId = id
            state.version = data.version
            state.isDirty = false
            state.lastSaved = new Date(data.updated_at)
          })

          // Clear undo/redo history when switching documents
          useDocumentStore.temporal.getState().clear()
        } catch (error) {
          console.error('Failed to load document:', error)
          throw error
        }
      },

      // Update field with path notation (e.g., "profile.email")
      updateField: (path: string, value: any) => {
        set(state => {
          // Use lodash set for nested path updates
          const keys = path.split('.')
          let target: any = state.document

          for (let i = 0; i < keys.length - 1; i++) {
            target = target[keys[i]]
          }
          target[keys[keys.length - 1]] = value

          state.isDirty = true
        })

        // Trigger debounced auto-save
        get().autoSave()
      },

      // Save document to API
      saveDocument: async () => {
        const { document, documentId, version } = get()
        if (!document || !documentId) return

        set(state => {
          state.isSaving = true
          state.saveError = null
        })

        try {
          const response = await fetch(`/api/v1/resumes/${documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: document, version }),
          })

          if (response.status === 409) {
            // Conflict: another save happened
            const latest = await fetch(`/api/v1/resumes/${documentId}`)
            const { data: latestDoc } = await latest.json()

            set(state => {
              state.conflictModalOpen = true
              state.latestServerVersion = latestDoc.data
              state.latestServerVersionNumber = latestDoc.version
              state.isSaving = false
            })

            return
          }

          if (!response.ok) {
            throw new Error('Save failed')
          }

          const { data: saved } = await response.json()

          set(state => {
            state.originalDocument = structuredClone(saved.data)
            state.document = saved.data
            state.version = saved.version
            state.isDirty = false
            state.lastSaved = new Date()
            state.isSaving = false
          })
        } catch (error) {
          console.error('Save failed:', error)

          // Queue for retry (offline queue implementation)
          queueFailedSave({
            documentId: get().documentId!,
            document: get().document!,
            version: get().version,
          })

          set(state => {
            state.saveError = error as Error
            state.isSaving = false
          })
        }
      },

      // Debounced auto-save (2 seconds)
      autoSave: debounce(function () {
        const state = get()
        if (state.isDirty && !state.isSaving) {
          state.saveDocument()
        }
      }, 2000),

      // Reset to last saved state
      resetChanges: () => {
        const { originalDocument } = get()
        set(state => {
          state.document = structuredClone(originalDocument)
          state.isDirty = false
        })
      },

      // Clear undo/redo history
      clearHistory: () => {
        useDocumentStore.temporal.getState().clear()
      },

      // Conflict resolution: Keep my changes
      keepMyChanges: async () => {
        const { document, documentId, latestServerVersionNumber } = get()

        set(state => {
          state.isSaving = true
        })

        try {
          const response = await fetch(`/api/v1/resumes/${documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: document,
              version: latestServerVersionNumber,
            }),
          })

          if (!response.ok) throw new Error('Failed to save')

          const { data: saved } = await response.json()

          set(state => {
            state.originalDocument = structuredClone(saved.data)
            state.document = saved.data
            state.version = saved.version
            state.isDirty = false
            state.lastSaved = new Date()
            state.isSaving = false
            state.conflictModalOpen = false
          })
        } catch (error) {
          console.error('Failed to resolve conflict:', error)
          set(state => {
            state.saveError = error as Error
            state.isSaving = false
          })
        }
      },

      // Conflict resolution: Use server version
      useServerVersion: () => {
        const { latestServerVersion, latestServerVersionNumber } = get()

        set(state => {
          state.document = structuredClone(latestServerVersion)
          state.originalDocument = structuredClone(latestServerVersion)
          state.version = latestServerVersionNumber
          state.isDirty = false
          state.conflictModalOpen = false
        })
      },

      // Computed: Can save?
      canSave: () => {
        const { isDirty, isSaving } = get()
        return isDirty && !isSaving
      },

      // Computed: Has unsaved changes?
      hasChanges: () => {
        return get().isDirty
      },
    })),
    {
      // Zundo configuration
      limit: 50, // 50-step history

      // Only track document changes (not UI state)
      partialize: state => ({
        document: state.document,
      }),

      // Custom equality check (avoid identical snapshots)
      equality: (pastState, currentState) => {
        if (pastState.document === currentState.document) return true
        return JSON.stringify(pastState.document) === JSON.stringify(currentState.document)
      },

      // Group rapid changes with debounce (150ms)
      handleSet: handleSet =>
        debounce(state => {
          handleSet(state)
        }, 150),
    }
  )
)

export default useDocumentStore

// =============================================================================
// Offline Queue Helper (placeholder)
// =============================================================================

function queueFailedSave(item: any) {
  // Offline queue implementation (see Auto-Save research dossier)
  const queue = JSON.parse(localStorage.getItem('resumepair_save_queue') || '[]')
  queue.push({
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    attempts: 0,
  })
  localStorage.setItem('resumepair_save_queue', JSON.stringify(queue))
}
```

**Key Design Decisions**:
1. **Triple middleware stack**: `create(temporal(immer(store)))` - order matters
2. **Partialize**: Only track `document` in history (not UI flags)
3. **Debounce at two levels**:
   - `handleSet` (150ms): Group rapid edits
   - `autoSave` (2000ms): Trigger network save
4. **Conflict resolution**: Explicit user choice (keep mine vs use theirs)
5. **localStorage backup**: Failed saves queued for retry

---

### File: `/libs/stores/documentListStore.ts`

Separate store for document list management.

```typescript
/**
 * Document List Store
 *
 * Zustand store for managing document list, filters, sorting, and selection.
 *
 * @module stores/documentListStore
 */

import { create } from 'zustand'
import type { Resume } from '@/libs/repositories/documents'

// =============================================================================
// Types
// =============================================================================

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
  searchDocuments: (query: string) => void
  setFilter: (key: string, value: any) => void
  setSorting: (field: string, order: 'asc' | 'desc') => void
  selectDocument: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  bulkDelete: (ids: string[]) => Promise<void>
  refreshList: () => Promise<void>
}

// =============================================================================
// Store Implementation
// =============================================================================

const useDocumentListStore = create<DocumentListState>((set, get) => ({
  // Initial state
  documents: [],
  totalCount: 0,
  nextCursor: null,
  isLoading: false,
  error: null,
  filters: { status: 'all', search: '', dateRange: 'all' },
  sort: { field: 'updated_at', order: 'desc' },
  selectedIds: new Set(),

  // Fetch documents from API
  fetchDocuments: async (cursor?: string) => {
    set({ isLoading: true, error: null })

    const { filters, sort } = get()
    const params = new URLSearchParams({
      status: filters.status === 'all' ? '' : filters.status,
      search: filters.search,
      sort: sort.field,
      order: sort.order,
      cursor: cursor || '',
      limit: '20',
    })

    try {
      const response = await fetch(`/api/v1/resumes?${params}`)
      if (!response.ok) throw new Error('Failed to fetch documents')

      const { data } = await response.json()

      set(state => ({
        documents: cursor ? [...state.documents, ...data.resumes] : data.resumes,
        totalCount: data.total,
        nextCursor: data.nextCursor,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: error as Error, isLoading: false })
    }
  },

  // Search documents
  searchDocuments: query => {
    set(state => ({
      filters: { ...state.filters, search: query },
    }))
    get().fetchDocuments()
  },

  // Set filter
  setFilter: (key, value) => {
    set(state => ({
      filters: { ...state.filters, [key]: value },
    }))
    get().fetchDocuments()
  },

  // Set sorting
  setSorting: (field, order) => {
    set({ sort: { field: field as any, order } })
    get().fetchDocuments()
  },

  // Select document
  selectDocument: id => {
    set(state => {
      const newSelected = new Set(state.selectedIds)
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
      return { selectedIds: newSelected }
    })
  },

  // Select all
  selectAll: () => {
    set(state => ({
      selectedIds: new Set(state.documents.map(doc => doc.id)),
    }))
  },

  // Deselect all
  deselectAll: () => {
    set({ selectedIds: new Set() })
  },

  // Bulk delete
  bulkDelete: async ids => {
    try {
      const response = await fetch('/api/v1/resumes/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) throw new Error('Bulk delete failed')

      // Refresh list after delete
      get().fetchDocuments()
      get().deselectAll()
    } catch (error) {
      set({ error: error as Error })
    }
  },

  // Refresh list
  refreshList: async () => {
    set({ selectedIds: new Set() })
    await get().fetchDocuments()
  },
}))

export default useDocumentListStore
```

---

## 6. COMPONENT ARCHITECTURE

### Page: `/app/dashboard/page.tsx`

Main dashboard with document list.

```typescript
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import useDocumentListStore from '@/libs/stores/documentListStore'
import { DocumentGrid } from '@/components/documents/DocumentGrid'
import { DocumentSearch } from '@/components/documents/DocumentSearch'
import { DocumentFilters } from '@/components/documents/DocumentFilters'
import { DocumentActions } from '@/components/documents/DocumentActions'
import { EmptyDocuments } from '@/components/documents/EmptyDocuments'
import { CreateDocumentDialog } from '@/components/documents/CreateDocumentDialog'
import { useState } from 'react'

export default function DashboardPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const {
    documents,
    isLoading,
    error,
    selectedIds,
    fetchDocuments,
  } = useDocumentListStore()

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  if (isLoading && documents.length === 0) {
    return <div>Loading...</div> // Replace with skeleton
  }

  if (documents.length === 0 && !isLoading) {
    return <EmptyDocuments onCreateClick={() => setCreateDialogOpen(true)} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">My Resumes</h1>
          <p className="text-muted-foreground mt-2">
            Manage your resume documents
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Resume
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <DocumentSearch />
        <DocumentFilters />
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && <DocumentActions />}

      {/* Document Grid */}
      <DocumentGrid />

      {/* Create Dialog */}
      <CreateDocumentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
```

---

### Page: `/app/editor/[id]/page.tsx`

Resume editor page with form.

```typescript
'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { EditorHeader } from '@/components/editor/EditorHeader'
import { EditorSidebar } from '@/components/editor/EditorSidebar'
import { EditorForm } from '@/components/editor/EditorForm'
import useDocumentStore from '@/libs/stores/documentStore'

export default function EditorPage() {
  const params = useParams()
  const id = params.id as string

  const { loadDocument, document, isLoading } = useDocumentStore()

  useEffect(() => {
    loadDocument(id)
  }, [id, loadDocument])

  if (isLoading) {
    return <div>Loading editor...</div> // Replace with skeleton
  }

  if (!document) {
    return <div>Document not found</div>
  }

  return (
    <EditorLayout
      header={<EditorHeader />}
      sidebar={<EditorSidebar />}
      main={<EditorForm />}
    />
  )
}
```

---

### Component: `/components/editor/EditorForm.tsx`

Main form container with react-hook-form.

```typescript
'use client'

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ResumeJsonSchema } from '@/libs/validation/resume'
import type { ResumeJson } from '@/types'
import useDocumentStore from '@/libs/stores/documentStore'
import { ProfileSection } from './sections/ProfileSection'
import { SummarySection } from './sections/SummarySection'
import { WorkSection } from './sections/WorkSection'
import { EducationSection } from './sections/EducationSection'
import { ProjectsSection } from './sections/ProjectsSection'
import { SkillsSection } from './sections/SkillsSection'
import { AutoSaveHandler } from './AutoSaveHandler'

export function EditorForm() {
  const document = useDocumentStore(state => state.document)

  const methods = useForm<ResumeJson>({
    resolver: zodResolver(ResumeJsonSchema),
    defaultValues: document || undefined,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  })

  if (!document) return null

  return (
    <FormProvider {...methods}>
      <form className="space-y-8">
        <ProfileSection />
        <SummarySection />
        <WorkSection />
        <EducationSection />
        <ProjectsSection />
        <SkillsSection />

        {/* Auto-save handler (no UI) */}
        <AutoSaveHandler />
      </form>
    </FormProvider>
  )
}
```

---

### Component: `/components/editor/sections/WorkSection.tsx`

Work experience section with array manipulation (example from research).

```typescript
'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Plus, GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { TextField } from '@/components/editor/fields/TextField'
import { DateField } from '@/components/editor/fields/DateField'
import { TextAreaField } from '@/components/editor/fields/TextAreaField'

export function WorkSection() {
  const { control } = useFormContext()

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'work',
  })

  const addExperience = () => {
    append({
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: null,
      descriptionBullets: [],
      achievements: [],
      techStack: [],
    })
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Work Experience</h2>
        <Button onClick={addExperience} variant="secondary" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </Button>
      </div>

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-200 rounded-lg p-6 space-y-4"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                <div className="flex gap-1">
                  {index > 0 && (
                    <Button
                      type="button"
                      onClick={() => move(index, index - 1)}
                      variant="ghost"
                      size="sm"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  )}
                  {index < fields.length - 1 && (
                    <Button
                      type="button"
                      onClick={() => move(index, index + 1)}
                      variant="ghost"
                      size="sm"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <Button
                type="button"
                onClick={() => remove(index)}
                variant="ghost"
                size="sm"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`work.${index}.company`}
                label="Company"
                placeholder="Company name"
                required
              />

              <TextField
                name={`work.${index}.role`}
                label="Role"
                placeholder="Job title"
                required
              />

              <TextField
                name={`work.${index}.location`}
                label="Location"
                placeholder="City, State"
              />

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <DateField
                  name={`work.${index}.startDate`}
                  label="Start Date"
                />

                <DateField
                  name={`work.${index}.endDate`}
                  label="End Date"
                  allowPresent
                />
              </div>

              <TextAreaField
                name={`work.${index}.descriptionBullets`}
                label="Description"
                placeholder="One bullet point per line"
                rows={4}
                maxLength={1000}
                className="col-span-2"
              />
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No work experience added yet.</p>
          <Button onClick={addExperience} variant="ghost" className="mt-4">
            Add your first experience
          </Button>
        </div>
      )}
    </section>
  )
}
```

---

### Component: `/components/editor/fields/TextAreaField.tsx`

Reusable textarea with character counter (example from research).

```typescript
'use client'

import { useFormContext, Controller } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/libs/utils'

interface TextAreaFieldProps {
  name: string
  label: string
  placeholder?: string
  rows?: number
  maxLength?: number
  helpText?: string
  required?: boolean
  className?: string
}

export function TextAreaField({
  name,
  label,
  placeholder,
  rows = 4,
  maxLength = 500,
  helpText,
  required,
  className,
}: TextAreaFieldProps) {
  const { control, watch } = useFormContext()
  const value = watch(name) || ''
  const charCount = value.length

  // Color thresholds
  const getCounterColor = () => {
    const percentage = (charCount / maxLength) * 100
    if (percentage >= 100) return 'text-destructive'
    if (percentage >= 90) return 'text-amber-600'
    return 'text-gray-500'
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <div className="flex items-center justify-between">
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <span
              className={cn('text-sm', getCounterColor())}
              aria-live="polite"
              aria-atomic="true"
            >
              {charCount}/{maxLength}
            </span>
          </div>
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              aria-required={required}
              aria-invalid={!!fieldState.error}
              aria-describedby={`${name}-description ${name}-error`}
              className={cn(
                'resize-none',
                fieldState.error && 'border-destructive',
                charCount >= maxLength && 'border-amber-600'
              )}
            />
          </FormControl>
          {helpText && (
            <FormDescription id={`${name}-description`}>
              {helpText}
            </FormDescription>
          )}
          <FormMessage id={`${name}-error`} />
        </FormItem>
      )}
    />
  )
}
```

---

### Component: `/components/editor/AutoSaveHandler.tsx`

Auto-save logic component (no UI).

```typescript
'use client'

import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useDebouncedCallback } from 'use-debounce'
import useDocumentStore from '@/libs/stores/documentStore'
import type { ResumeJson } from '@/types'

export function AutoSaveHandler() {
  const { control } = useFormContext()
  const updateField = useDocumentStore(state => state.updateField)
  const saveDocument = useDocumentStore(state => state.saveDocument)
  const isDirty = useDocumentStore(state => state.isDirty)
  const isSaving = useDocumentStore(state => state.isSaving)

  // Watch all form fields
  const formData = useWatch({ control }) as ResumeJson

  // Debounced sync: form state → Zustand store → API
  const syncToStore = useDebouncedCallback((data: ResumeJson) => {
    // Update Zustand store (which triggers auto-save)
    useDocumentStore.setState({ document: data, isDirty: true })

    // Trigger auto-save (debounced in store)
    if (!isSaving) {
      saveDocument()
    }
  }, 2000)

  // Sync form changes to store
  useEffect(() => {
    if (formData) {
      syncToStore(formData)
    }
  }, [formData, syncToStore])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      syncToStore.cancel()
    }
  }, [syncToStore])

  return null // No UI rendered
}
```

**Key Design Decisions**:
- **Two-layer debounce**: Form → Store (2s) → API (triggered immediately if not saving)
- **useWatch for form tracking**: Watches all fields without re-rendering parent
- **Cleanup on unmount**: Cancel pending saves when user navigates away
- **No UI**: Pure logic component embedded in form

---

## 7. AUTO-SAVE WORKFLOW DESIGN

### State Machine

The auto-save system operates as a finite state machine with the following states:

```
┌─────────────────────────────────────────────────────────────┐
│                      AUTO-SAVE STATE MACHINE                 │
└─────────────────────────────────────────────────────────────┘

[IDLE] ──────keystroke────> [DEBOUNCING]
           (set isDirty=true)

[DEBOUNCING] ──2s timeout──> [SAVING]
               (call API)

[SAVING] ─────success─────> [IDLE]
          (set isDirty=false)

[SAVING] ──────error──────> [RETRY_QUEUE]
          (localStorage)

[RETRY_QUEUE] ──online────> [SAVING]
              (exponential backoff)

[SAVING] ─────409 Conflict──> [CONFLICT_MODAL]
                               (user choice)

[CONFLICT_MODAL] ──keep mine──> [SAVING]
                 (force save)

[CONFLICT_MODAL] ──use theirs─> [IDLE]
                 (discard local)
```

### Auto-Save Trigger Conditions

**Triggers**:
1. **Form field change** → Reset 2-second timer
2. **Timer expires** → Trigger save if `isDirty && !isSaving`
3. **Manual save** → Immediate save (Cmd+S or Save button)
4. **Version restore** → Save restored version

**Non-Triggers**:
- Undo/redo operations (tracked separately in history)
- Read-only field focus
- Navigation without changes

### Conflict Resolution Flow

When a 409 Conflict is detected:

1. **Fetch latest server version**
   ```typescript
   const latest = await fetch(`/api/v1/resumes/${documentId}`)
   const { data: serverDoc } = await latest.json()
   ```

2. **Show conflict modal** with two options:
   - **Keep My Changes**: Force save local version (overwrites server)
   - **Use Server Version**: Discard local changes (reload server version)

3. **User selects option**:
   - Keep mine: Retry save with `version: latestServerVersionNumber`
   - Use theirs: Replace `document` with `serverDoc.data`

4. **Close modal** → Return to editing

### Offline Queue Implementation

**File**: `/libs/utils/offline-queue.ts`

```typescript
interface QueuedSave {
  id: string
  documentId: string
  document: ResumeJson
  version: number
  timestamp: number
  attempts: number
  nextRetry: number
}

const QUEUE_KEY = 'resumepair_save_queue'
const MAX_RETRIES = 5
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000] // Exponential backoff

export function queueFailedSave(item: Omit<QueuedSave, 'id' | 'timestamp' | 'attempts' | 'nextRetry'>) {
  const queue = getQueue()
  const queued: QueuedSave = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    attempts: 0,
    nextRetry: Date.now() + RETRY_DELAYS[0],
  }
  queue.push(queued)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getQueue(): QueuedSave[] {
  const raw = localStorage.getItem(QUEUE_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function processQueue() {
  const queue = getQueue()
  const now = Date.now()

  for (const item of queue) {
    if (item.nextRetry > now) continue
    if (item.attempts >= MAX_RETRIES) {
      removeFromQueue(item.id)
      continue
    }

    try {
      const response = await fetch(`/api/v1/resumes/${item.documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: item.document, version: item.version }),
      })

      if (response.ok) {
        removeFromQueue(item.id)
      } else if (response.status === 409) {
        // Conflict: remove from queue (user already resolved)
        removeFromQueue(item.id)
      } else {
        // Retry with exponential backoff
        updateQueueItem(item.id, {
          attempts: item.attempts + 1,
          nextRetry: now + RETRY_DELAYS[item.attempts + 1],
        })
      }
    } catch (error) {
      updateQueueItem(item.id, {
        attempts: item.attempts + 1,
        nextRetry: now + RETRY_DELAYS[item.attempts + 1],
      })
    }
  }
}

function removeFromQueue(id: string) {
  const queue = getQueue().filter(item => item.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

function updateQueueItem(id: string, updates: Partial<QueuedSave>) {
  const queue = getQueue().map(item =>
    item.id === id ? { ...item, ...updates } : item
  )
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

// Process queue on app load and periodically
if (typeof window !== 'undefined') {
  processQueue()
  setInterval(processQueue, 15000) // Every 15 seconds
}
```

### Visual Indicators

**Save status UI** (in editor header):

- **Saved** (idle): Green checkmark "All changes saved"
- **Saving...** (debouncing/saving): Spinner "Saving..."
- **Failed** (error): Red X "Save failed. Retrying..."
- **Conflict** (modal open): Orange warning "Conflict detected"

---

## 8. VERSION HISTORY SYSTEM

### Storage Strategy

**Full Snapshots (Not Deltas)**:
- Each version stores complete `ResumeJson` object
- Simpler retrieval: O(1) fetch, no replay needed
- Storage trade-off: ~10-50 KB per version acceptable for JSONB

### Versioning Logic

1. **On every save** (auto or manual):
   - Snapshot current `data` to `resume_versions` table
   - Increment `version` number in `resumes` table
   - Store `created_by` for audit trail

2. **Version retention**:
   - Keep last 30 versions per document
   - Older versions auto-deleted by background job (Phase 3)

3. **Version numbering**:
   - Version 1: Initial creation
   - Version N: After (N-1) updates
   - Version number never resets (monotonically increasing)

### Version History UI

**Location**: Sidebar in editor (`/editor/[id]`)

**Components**:
- **VersionHistoryPanel**: Collapsible panel showing version list
- **VersionListItem**: Each version with timestamp, preview, actions
- **VersionPreviewDialog**: Modal showing diff between current and selected version

**User Actions**:
- **View Version**: Open modal with read-only preview
- **Restore Version**: Replace current document with version data (creates new version)
- **Compare Versions**: Show diff (Phase 2.5 feature)

### Version Restore Flow

1. User clicks "Restore" on version N
2. Confirm dialog: "Replace current document with version N?"
3. On confirm:
   - Fetch version N data via API
   - Update Zustand store with version data
   - Trigger save (creates version N+1 with restored data)
   - Show toast: "Restored to version N"

### API Endpoints

- `GET /api/v1/resumes/:id/versions` → List versions (paginated)
- `GET /api/v1/resumes/:id/versions/:versionNumber` → Get specific version
- `POST /api/v1/resumes/:id/versions/:versionNumber/restore` → Restore version

---

## 9. FILE STRUCTURE

Complete directory structure for Phase 2 implementation:

```
/Users/varunprasad/code/prjs/resumepair/
├── migrations/
│   └── phase2/
│       ├── index.md                                # Migration tracking doc
│       ├── 001_create_resumes_table.sql
│       ├── 002_create_resume_versions_table.sql
│       ├── 003_create_resume_templates_table.sql
│       ├── 004_setup_rls_policies_resumes.sql
│       ├── 005_create_resume_indexes.sql
│       └── 006_seed_resume_templates.sql
│
├── libs/
│   ├── repositories/
│   │   └── documents.ts                           # Resume CRUD repository
│   │
│   ├── validation/
│   │   └── resume/
│   │       └── index.ts                           # Zod schemas for ResumeJson
│   │
│   ├── stores/
│   │   ├── documentStore.ts                       # Zustand store with zundo
│   │   └── documentListStore.ts                   # Document list management
│   │
│   └── utils/
│       └── offline-queue.ts                       # Auto-save queue for offline
│
├── app/
│   ├── dashboard/
│   │   └── page.tsx                               # Document list page
│   │
│   ├── editor/
│   │   └── [id]/
│   │       └── page.tsx                           # Editor page
│   │
│   └── api/
│       └── v1/
│           ├── resumes/
│           │   ├── route.ts                       # GET (list), POST (create)
│           │   ├── [id]/
│           │   │   ├── route.ts                   # GET, PUT, DELETE
│           │   │   ├── duplicate/
│           │   │   │   └── route.ts               # POST duplicate
│           │   │   ├── restore/
│           │   │   │   └── route.ts               # POST restore
│           │   │   └── versions/
│           │   │       ├── route.ts               # GET list versions
│           │   │       └── [versionNumber]/
│           │   │           ├── route.ts           # GET version
│           │   │           └── restore/
│           │   │               └── route.ts       # POST restore version
│           │   └── bulk/
│           │       ├── delete/
│           │       │   └── route.ts               # POST bulk delete
│           │       └── archive/
│           │           └── route.ts               # POST bulk archive
│           └── templates/
│               ├── route.ts                       # GET list templates
│               └── [id]/
│                   └── route.ts                   # GET template
│
├── components/
│   ├── documents/
│   │   ├── DocumentGrid.tsx                       # Grid of document cards
│   │   ├── DocumentCard.tsx                       # Individual document card
│   │   ├── DocumentSearch.tsx                     # Search input
│   │   ├── DocumentFilters.tsx                    # Status/date filters
│   │   ├── DocumentActions.tsx                    # Bulk action toolbar
│   │   ├── EmptyDocuments.tsx                     # Empty state
│   │   └── CreateDocumentDialog.tsx               # Create new document modal
│   │
│   ├── editor/
│   │   ├── EditorLayout.tsx                       # Layout wrapper
│   │   ├── EditorHeader.tsx                       # Top bar with save status
│   │   ├── EditorSidebar.tsx                      # Version history panel
│   │   ├── EditorForm.tsx                         # Main form container
│   │   ├── AutoSaveHandler.tsx                    # Auto-save logic component
│   │   │
│   │   ├── sections/
│   │   │   ├── ProfileSection.tsx                 # Profile fields
│   │   │   ├── SummarySection.tsx                 # Summary textarea
│   │   │   ├── WorkSection.tsx                    # Work experience array
│   │   │   ├── EducationSection.tsx               # Education array
│   │   │   ├── ProjectsSection.tsx                # Projects array
│   │   │   └── SkillsSection.tsx                  # Skills groups array
│   │   │
│   │   └── fields/
│   │       ├── TextField.tsx                      # Reusable text input
│   │       ├── TextAreaField.tsx                  # Textarea with counter
│   │       ├── DateField.tsx                      # Date picker
│   │       ├── SelectField.tsx                    # Dropdown
│   │       └── ArrayField.tsx                     # Array manipulation UI
│   │
│   └── version-history/
│       ├── VersionHistoryPanel.tsx                # Sidebar panel
│       ├── VersionListItem.tsx                    # Version list item
│       ├── VersionPreviewDialog.tsx               # Version preview modal
│       └── ConflictResolutionDialog.tsx           # Conflict modal
│
└── ai_docs/
    └── testing/
        └── playbooks/
            ├── phase2_playbook_documents.md       # Document CRUD tests
            ├── phase2_playbook_editor.md          # Editor tests
            └── phase2_playbook_autosave.md        # Auto-save tests
```

**Estimated File Count**: ~45 files (migrations, API routes, components, stores, tests)

---

## 10. IMPLEMENTATION SEQUENCE

### Dependency Graph

```
Migration Files (1-6)
        ↓
Repository Layer
        ↓
API Endpoints ────────┐
        ↓             │
Validation Schemas    │
        ↓             │
State Stores          │
        ↓             │
UI Components ←───────┘
        ↓
Testing Playbooks
```

### Step-by-Step Implementation Order

#### Phase 2A: Foundation (Days 1-2)

**Day 1: Database + Repository**
1. Create migration files (001-006) in `/migrations/phase2/`
2. Review migrations with user → Get approval → Apply via MCP
3. Create `/libs/repositories/documents.ts` (complete repository)
4. Create `/libs/validation/resume/index.ts` (Zod schemas)
5. Test repository functions manually via Puppeteer

**Day 2: API Layer**
6. Create `/app/api/v1/resumes/route.ts` (GET list, POST create)
7. Create `/app/api/v1/resumes/[id]/route.ts` (GET, PUT, DELETE)
8. Create duplicate/restore/versions endpoints (5 files)
9. Create bulk operations endpoints (2 files)
10. Test all API endpoints via Puppeteer (manual playbook)

#### Phase 2B: State Management (Day 3)

**Day 3: Stores + Offline Queue**
11. Create `/libs/stores/documentStore.ts` (Zustand + zundo)
12. Create `/libs/stores/documentListStore.ts` (list management)
13. Create `/libs/utils/offline-queue.ts` (auto-save retry)
14. Test undo/redo with 50-step limit
15. Test offline queue with localStorage

#### Phase 2C: Document List UI (Days 4-5)

**Day 4: Dashboard Components**
16. Create `/app/dashboard/page.tsx` (main dashboard)
17. Create `/components/documents/DocumentGrid.tsx`
18. Create `/components/documents/DocumentCard.tsx`
19. Create `/components/documents/DocumentSearch.tsx`
20. Create `/components/documents/DocumentFilters.tsx`
21. Create `/components/documents/EmptyDocuments.tsx`
22. Test dashboard with 0, 1, 10, 100 documents

**Day 5: Document Actions**
23. Create `/components/documents/DocumentActions.tsx` (bulk actions)
24. Create `/components/documents/CreateDocumentDialog.tsx`
25. Implement selection UI (checkboxes, select all)
26. Test bulk delete, bulk archive
27. Visual verification: Desktop (1440px) + Mobile (375px) screenshots

#### Phase 2D: Editor UI (Days 6-8)

**Day 6: Editor Layout + Form Container**
28. Create `/app/editor/[id]/page.tsx`
29. Create `/components/editor/EditorLayout.tsx`
30. Create `/components/editor/EditorHeader.tsx` (with save status)
31. Create `/components/editor/EditorForm.tsx` (RHF setup)
32. Create `/components/editor/AutoSaveHandler.tsx`
33. Test document loading + save status indicators

**Day 7: Form Fields (Reusable Components)**
34. Create `/components/editor/fields/TextField.tsx`
35. Create `/components/editor/fields/TextAreaField.tsx` (with counter)
36. Create `/components/editor/fields/DateField.tsx`
37. Create `/components/editor/fields/SelectField.tsx`
38. Test field validation on blur, character counters

**Day 8: Form Sections (Array Manipulation)**
39. Create `/components/editor/sections/ProfileSection.tsx`
40. Create `/components/editor/sections/SummarySection.tsx`
41. Create `/components/editor/sections/WorkSection.tsx` (array fields)
42. Create `/components/editor/sections/EducationSection.tsx`
43. Create `/components/editor/sections/ProjectsSection.tsx`
44. Create `/components/editor/sections/SkillsSection.tsx`
45. Test add/remove/reorder for arrays

#### Phase 2E: Version History + Conflict Resolution (Days 9-10)

**Day 9: Version History UI**
46. Create `/components/version-history/VersionHistoryPanel.tsx`
47. Create `/components/version-history/VersionListItem.tsx`
48. Create `/components/version-history/VersionPreviewDialog.tsx`
49. Test version list, preview, restore

**Day 10: Conflict Resolution + Polish**
50. Create `/components/version-history/ConflictResolutionDialog.tsx`
51. Test conflict resolution (keep mine vs use theirs)
52. Add keyboard shortcuts (Cmd+S for save, Cmd+Z/Shift+Cmd+Z for undo/redo)
53. Polish UI: Loading states, error states, empty states
54. Visual verification: All UI components screenshotted

#### Phase 2F: Testing & Documentation (Day 11)

**Day 11: Testing Playbooks + Final QA**
55. Create `/ai_docs/testing/playbooks/phase2_playbook_documents.md`
56. Create `/ai_docs/testing/playbooks/phase2_playbook_editor.md`
57. Create `/ai_docs/testing/playbooks/phase2_playbook_autosave.md`
58. Run all 3 playbooks (15-20 min each)
59. Fix any critical issues found
60. Document known limitations in `/ai_docs/progress/phase_2/`

### Parallel Work Opportunities

**Can be done simultaneously**:
- API endpoints (Day 2) + Validation schemas (Day 1) → Can overlap
- Document list UI (Days 4-5) + Editor UI (Days 6-8) → Independent
- Field components (Day 7) + Section components (Day 8) → Can be built by different devs

**Must be sequential**:
- Migrations → Repository → API (strict dependency chain)
- State stores → UI components (UI depends on stores)
- Core components → Testing playbooks (can't test what doesn't exist)

### Critical Path (Cannot Parallelize)

1. Migrations applied to database
2. Repository layer tested
3. API endpoints functional
4. State stores working
5. Editor form rendering
6. Auto-save triggering
7. Version history operational
8. Testing playbooks passing

**Estimated Total Time**: 10-11 implementation days (~80-88 hours)

---

## 11. INTEGRATION WITH PHASE 1

### Phase 1 Dependencies

**Phase 2 requires these Phase 1 components**:
1. **Auth system** (`/libs/supabase/server`, `/libs/api-utils/withAuth`)
2. **API utilities** (`apiSuccess`, `apiError`, `withAuth`)
3. **Profile repository** (`/libs/repositories/profile.ts`)
4. **User profile** (`profiles` table with `full_name`, `locale`, `date_format`)
5. **Design system** (CSS tokens, shadcn/ui components)

### Integration Points

#### 1. User Profile → Resume Defaults

When creating a new resume:
```typescript
// Get user profile for defaults
const profile = await getProfile(supabase, user.id)

// Pre-fill resume with user data
const initialData: ResumeJson = {
  profile: {
    fullName: profile.full_name || user.user_metadata?.full_name || '',
    email: user.email || '',
  },
  settings: {
    locale: profile.locale || 'en-US',
    dateFormat: profile.date_format || 'US',
    pageSize: profile.page_size || 'Letter',
    // ... other settings
  },
}
```

#### 2. Navigation Links

**Dashboard link** in existing header:
```tsx
// Update /components/layout/Header.tsx
<NavigationMenu>
  <NavigationMenuItem>
    <Link href="/dashboard">My Resumes</Link>
  </NavigationMenuItem>
</NavigationMenu>
```

**Settings page link** to dashboard:
```tsx
// In /app/settings/page.tsx
<Button variant="ghost" asChild>
  <Link href="/dashboard">
    <FileText className="h-4 w-4 mr-2" />
    My Documents
  </Link>
</Button>
```

#### 3. Auth Middleware

Phase 2 routes inherit Phase 1 auth middleware:
```typescript
// /middleware.ts (from Phase 1)
export const config = {
  matcher: [
    '/dashboard/:path*',    // ← Phase 2 route
    '/editor/:path*',       // ← Phase 2 route
    '/api/v1/resumes/:path*', // ← Phase 2 API
    '/settings/:path*',     // Phase 1 route
  ],
}
```

#### 4. Design System

Phase 2 components use Phase 1 design tokens:
- **App tokens** (`--app-*`): Dashboard, editor chrome
- **Doc tokens** (`--doc-*`): Reserved for templates (Phase 3)
- **shadcn/ui**: All buttons, inputs, dialogs from Phase 1

#### 5. Error Handling

Phase 2 follows Phase 1 error patterns:
- API errors return `ApiResponse` envelope
- UI shows toasts via `useToast` hook
- Logs redact PII (no email/phone in logs)

### Phase 1 Files NOT Modified

**Phase 2 does NOT change**:
- `/libs/supabase/*` (client setup)
- `/libs/api-utils/*` (API wrappers)
- `/libs/repositories/profile.ts` (profile repo)
- `/app/settings/*` (settings pages)
- `/components/ui/*` (shadcn components)

**Phase 2 ONLY creates new files** (no edits to Phase 1 code)

---

## 12. PERFORMANCE TARGETS

### Response Time Budgets

From Phase 2 context document:

| Operation | Target | Measurement Method |
|-----------|--------|-------------------|
| Auto-save trigger | <2s after last keystroke | Debounce timer |
| Document list load | <500ms | First contentful paint |
| Form field update | <50ms | Keystroke → state update |
| Undo operation | <20ms | State rollback |
| Document switch | <200ms | Route change → editor render |
| Version list load | <300ms | API → UI render |
| Save API call | <800ms | PUT request round-trip |
| Conflict detection | <100ms | 409 response → modal |

### Performance Monitoring Strategy

#### Client-Side Metrics

**Instrumentation locations**:
1. **Auto-save debounce**: Log time between keystroke and save trigger
2. **Form field updates**: Measure `onChange` → `setValue` latency
3. **Undo/redo**: Measure `temporal.getState().undo()` execution time
4. **List rendering**: Track `fetchDocuments()` → grid render time

**Implementation**:
```typescript
// Example: Measure auto-save latency
const startTime = performance.now()
await saveDocument()
const duration = performance.now() - startTime

if (duration > 2000) {
  console.warn(`Auto-save slow: ${duration}ms (target: <2000ms)`)
}
```

#### Server-Side Metrics

**Database query times**:
- `getResumes()`: Target <200ms for 20 documents
- `getResume()`: Target <50ms (single row + JSONB)
- `updateResume()`: Target <100ms (with version snapshot)
- `getVersions()`: Target <150ms for 30 versions

**Monitoring approach**:
```typescript
// Add timing to repository functions
const start = Date.now()
const resume = await supabase.from('resumes').select('*').eq('id', id).single()
const duration = Date.now() - start

if (duration > 50) {
  console.warn(`Slow query: getResume(${id}) took ${duration}ms`)
}
```

### Performance Optimization Strategies

**If targets not met**:

1. **Auto-save too fast** (<2s):
   - Increase debounce delay
   - Add user preference for auto-save frequency

2. **Form updates slow** (>50ms):
   - Use `useWatch` instead of `watch()` (Phase 2 already does this)
   - Split form into multiple `<FormProvider>` contexts

3. **Document list slow** (>500ms):
   - Implement virtual scrolling for >100 documents
   - Add skeleton loading states
   - Paginate with cursor-based pagination (already planned)

4. **Database queries slow**:
   - Add composite indexes (already in migrations)
   - Use `select('id, title, updated_at')` for list (not full `data`)
   - Cache templates in memory (no DB hit per request)

5. **Undo/redo slow** (>20ms):
   - Reduce history limit from 50 to 30 steps
   - Use `equality` check to skip identical snapshots (already implemented)

### Load Testing Targets (Phase 2.5)

**Simulate realistic load**:
- 10 concurrent users editing
- 100 documents per user
- 50 auto-saves per hour per user
- Version history: 30 versions per document

**Target**: System remains responsive under this load with p95 latencies within budgets.

---

## 13. SECURITY IMPLEMENTATION

### Threat Model

**Attack Vectors**:
1. **Unauthorized document access**: User A tries to read User B's resume
2. **IDOR attacks**: Guessing resume IDs to access others' documents
3. **Version history leakage**: Accessing deleted or archived versions
4. **Concurrent edit race conditions**: Lost updates in multi-tab scenarios
5. **XSS via document data**: Malicious scripts in resume content
6. **SQL injection**: Malformed JSONB queries
7. **Mass assignment**: Overwriting protected fields (user_id, version)

### Security Layers

#### Layer 1: Row-Level Security (RLS)

**Enforcement**: Database level (cannot be bypassed)

```sql
-- Policy: Users can only access their own resumes
CREATE POLICY resumes_select_own
  ON public.resumes FOR SELECT
  USING (user_id = auth.uid());

-- Applied to: resumes, resume_versions, templates (read-only)
```

**Verification**:
- RLS enabled on all tables (checked in migrations)
- Policies cover all CRUD operations
- `auth.uid()` enforced at DB level (not application)

#### Layer 2: API Authentication

**Enforcement**: API middleware (`withAuth`)

```typescript
// All protected routes wrapped
export const GET = withAuth(async (req, user) => {
  // user.id guaranteed to exist (or 401 returned)
  const resume = await getResume(supabase, id)
})
```

**Verification**:
- All `/api/v1/resumes/*` routes use `withAuth`
- Supabase client created with user's session token
- Session validated on every request

#### Layer 3: Input Validation

**Enforcement**: Zod schemas

```typescript
const result = UpdateResumeSchema.safeParse(body)
if (!result.success) {
  return apiError(400, 'Validation failed')
}
```

**Protected against**:
- XSS: Input sanitized (React escapes by default)
- Type confusion: Zod ensures correct types
- Malformed JSONB: Schema validates structure

#### Layer 4: Optimistic Concurrency Control

**Enforcement**: Version-based locking

```typescript
// WHERE version = currentVersion prevents lost updates
.update({ ...updates, version: currentVersion + 1 })
.eq('version', currentVersion)
```

**Verification**:
- 409 Conflict returned if version mismatch
- User explicitly chooses resolution strategy

### Secure Coding Patterns

**Mass Assignment Prevention**:
```typescript
// ❌ WRONG: Accepts user_id from request
const { user_id, title, data } = body
await createResume(supabase, user_id, title, data)

// ✅ CORRECT: Always use authenticated user
const { title, data } = body
await createResume(supabase, user.id, title, data)
```

**IDOR Prevention**:
```typescript
// RLS automatically filters by user_id
const resume = await getResume(supabase, id)
// If not owned by user, RLS returns null (404)
```

**SQL Injection Prevention**:
```typescript
// Supabase client uses parameterized queries
.eq('id', id) // Safe: id is parameterized
.ilike('title', search) // Safe: search is escaped
```

### Audit Trail

**Logged events**:
- Document created: `{ userId, documentId, timestamp }`
- Document updated: `{ userId, documentId, version, timestamp }`
- Document deleted: `{ userId, documentId, timestamp }`
- Version restored: `{ userId, documentId, fromVersion, toVersion }`

**NOT logged**:
- Resume content (PII)
- User email/phone
- Full JSONB data

**Implementation**:
```typescript
// In repository functions
console.info('Document created', { userId: user.id, documentId: resume.id })
```

### Security Checklist

Before Phase 2 ships:

- [ ] RLS enabled on all tables
- [ ] All API routes use `withAuth`
- [ ] All inputs validated with Zod
- [ ] Mass assignment prevented (no user-controlled user_id)
- [ ] Optimistic locking tested (409 conflicts handled)
- [ ] Version history respects RLS (users can't see others' versions)
- [ ] Soft delete implemented (no hard deletes)
- [ ] Audit logging in place (no PII logged)
- [ ] XSS prevention verified (React escaping + Content-Security-Policy)
- [ ] CSRF protection via SameSite cookies (Supabase default)

---

## 14. TESTING STRATEGY

### Testing Approach

**Manual Playbooks with Puppeteer MCP** (no automated test suites)

Three playbooks for Phase 2:
1. **Document CRUD** (~15 minutes)
2. **Editor & Auto-Save** (~20 minutes)
3. **Version History** (~15 minutes)

### Playbook 1: Document CRUD Operations

**File**: `/ai_docs/testing/playbooks/phase2_playbook_documents.md`

**Test scenarios**:

1. **Empty State**
   - Navigate to `/dashboard`
   - Screenshot: Empty state with "Create Resume" button
   - Verify: No documents shown

2. **Create Document**
   - Click "New Resume" button
   - Fill title: "Test Resume 1"
   - Submit form
   - Verify: Redirected to `/editor/{id}`
   - Verify: Document loads with user's name/email pre-filled

3. **Document List**
   - Navigate back to `/dashboard`
   - Verify: 1 document card shown
   - Screenshot: Document card with title, date, status

4. **Search & Filter**
   - Create 3 more documents
   - Search for "Test Resume 1"
   - Verify: Only 1 result shown
   - Filter by status: "Draft"
   - Verify: All 4 documents shown (all drafts)

5. **Bulk Actions**
   - Select 2 documents (checkboxes)
   - Click "Archive Selected"
   - Verify: Documents archived
   - Filter by status: "Archived"
   - Verify: 2 archived documents shown

6. **Duplicate Document**
   - Click "Duplicate" on "Test Resume 1"
   - Verify: New document created with "(Copy)" suffix
   - Verify: Content identical to original

7. **Delete & Restore**
   - Delete "Test Resume 1"
   - Navigate to Trash
   - Verify: 1 deleted document shown
   - Click "Restore"
   - Verify: Document restored to dashboard

**Puppeteer Commands**:
```javascript
// Navigate to dashboard
mcp__puppeteer__puppeteer_navigate({ url: 'http://localhost:3000/dashboard' })

// Screenshot empty state
mcp__puppeteer__puppeteer_screenshot({ name: 'dashboard_empty', width: 1440, height: 900 })

// Create document
mcp__puppeteer__puppeteer_click({ selector: 'button:has-text("New Resume")' })
mcp__puppeteer__puppeteer_fill({ selector: 'input[name="title"]', value: 'Test Resume 1' })
mcp__puppeteer__puppeteer_click({ selector: 'button[type="submit"]' })

// Verify redirect
mcp__puppeteer__puppeteer_evaluate({
  script: 'window.location.pathname.startsWith("/editor/")'
})
```

### Playbook 2: Editor & Auto-Save

**File**: `/ai_docs/testing/playbooks/phase2_playbook_editor.md`

**Test scenarios**:

1. **Editor Loads**
   - Navigate to `/editor/{id}`
   - Verify: Form renders with all sections
   - Screenshot: Full editor layout (header, form, sidebar)

2. **Form Field Updates**
   - Update "Full Name" field
   - Wait 2 seconds
   - Verify: Save status shows "Saving..."
   - Wait 1 second
   - Verify: Save status shows "Saved"

3. **Array Manipulation**
   - Click "Add Experience" in Work section
   - Fill company name, role, dates
   - Click move up/down buttons
   - Verify: Order changes
   - Click remove button
   - Verify: Item deleted

4. **Character Counter**
   - Focus summary textarea
   - Type 450 characters
   - Verify: Counter shows "450/500" in gray
   - Type 50 more characters
   - Verify: Counter shows "500/500" in amber
   - Try typing more
   - Verify: maxLength prevents input

5. **Undo/Redo**
   - Make 5 edits to different fields
   - Press Cmd+Z (undo)
   - Verify: Last edit reverted
   - Press Shift+Cmd+Z (redo)
   - Verify: Edit restored
   - Press Cmd+Z 50 times
   - Verify: Can only undo 50 steps

6. **Auto-Save Conflict**
   - Open same document in 2 tabs
   - Edit field in Tab 1, wait for save
   - Edit same field in Tab 2, wait for save
   - Verify: Conflict modal appears
   - Choose "Keep My Changes"
   - Verify: Save succeeds

7. **Offline Queue**
   - Disconnect network (DevTools)
   - Make edits
   - Wait 2 seconds
   - Verify: Save status shows "Save failed. Retrying..."
   - Reconnect network
   - Wait 15 seconds
   - Verify: Save succeeds, status shows "Saved"

**Puppeteer Commands**:
```javascript
// Navigate to editor
mcp__puppeteer__puppeteer_navigate({ url: 'http://localhost:3000/editor/{id}' })

// Screenshot editor
mcp__puppeteer__puppeteer_screenshot({ name: 'editor_layout', width: 1440, height: 900 })

// Update field
mcp__puppeteer__puppeteer_fill({ selector: 'input[name="profile.fullName"]', value: 'Jane Doe' })

// Wait and verify save status
await new Promise(resolve => setTimeout(resolve, 3000))
mcp__puppeteer__puppeteer_evaluate({
  script: 'document.querySelector("[data-testid=save-status]").textContent'
})

// Add work experience
mcp__puppeteer__puppeteer_click({ selector: 'button:has-text("Add Experience")' })
```

### Playbook 3: Version History

**File**: `/ai_docs/testing/playbooks/phase2_playbook_autosave.md`

**Test scenarios**:

1. **Version List**
   - Open document, make 5 edits (wait for auto-save between each)
   - Open version history sidebar
   - Verify: 5 versions shown (plus initial version = 6 total)
   - Screenshot: Version history panel

2. **Version Preview**
   - Click "View" on version 3
   - Verify: Modal opens with read-only preview
   - Verify: Content matches version 3 state
   - Close modal

3. **Restore Version**
   - Click "Restore" on version 3
   - Confirm dialog
   - Verify: Current document replaced with version 3 content
   - Verify: New version created (version 7)

4. **Version Pagination**
   - Create 35 versions (script to auto-edit 35 times)
   - Open version history
   - Verify: Only 30 versions shown
   - Verify: Load more button appears (if pagination added)

**Puppeteer Commands**:
```javascript
// Open version history
mcp__puppeteer__puppeteer_click({ selector: 'button[aria-label="Version history"]' })

// Screenshot version list
mcp__puppeteer__puppeteer_screenshot({ name: 'version_history', width: 1440, height: 900 })

// Restore version
mcp__puppeteer__puppeteer_click({ selector: '[data-version="3"] button:has-text("Restore")' })
mcp__puppeteer__puppeteer_click({ selector: 'button:has-text("Confirm")' })
```

### Visual Verification Requirements

**Desktop Screenshots (1440x900)**:
- Dashboard: Empty state, 1 doc, 10 docs, 100 docs
- Editor: Full layout, profile section, work section
- Version history: Panel open, preview modal
- Conflict resolution: Modal with choices

**Mobile Screenshots (375x667)**:
- Dashboard: Document list (stacked)
- Editor: Form sections (collapsed sidebar)

**Visual Quality Checklist** (from standards):
- [ ] Spacing generous (≥16px gaps, ≥24px card padding)
- [ ] Clear typography hierarchy (4xl → xl → base)
- [ ] One primary action per section (lime button)
- [ ] Design tokens used (no hardcoded colors/px)
- [ ] Responsive (no horizontal scroll on mobile)
- [ ] Ramp palette only (navy, lime, grays)

### Testing Timeline

**Total testing time**: ~50 minutes

- Playbook 1 (Documents): 15 minutes
- Playbook 2 (Editor): 20 minutes
- Playbook 3 (Versions): 15 minutes
- Visual verification: ~10 minutes (screenshots + analysis)

**When to run**:
- After each major milestone (e.g., after Day 5, Day 8, Day 10)
- Before marking Phase 2 complete

---

## 15. KNOWN CONSTRAINTS & DECISIONS

### Technical Constraints

1. **Full Snapshots (Not Deltas)**
   - **Decision**: Store complete ResumeJson on each version
   - **Trade-off**: Higher storage cost (~30KB per version × 30 versions = ~1MB per document)
   - **Rationale**: Simpler retrieval, no replay logic needed, JSONB compresses well

2. **50-Step Undo Limit**
   - **Decision**: Limit zundo history to 50 steps
   - **Trade-off**: Cannot undo beyond 50 edits
   - **Rationale**: Prevents memory bloat, 50 steps covers 95% of use cases

3. **2-Second Auto-Save Debounce**
   - **Decision**: Fixed 2-second delay (not user-configurable in Phase 2)
   - **Trade-off**: Fast typers may see longer delays
   - **Rationale**: Balances save frequency with API load

4. **localStorage for Offline Queue**
   - **Decision**: Use localStorage (not IndexedDB)
   - **Trade-off**: 5MB limit (enough for ~50 queued saves)
   - **Rationale**: Simpler API, no async complexity

5. **No Real-Time Collaboration**
   - **Decision**: Phase 2 is single-user editing only
   - **Trade-off**: Multi-tab conflicts possible (handled with modal)
   - **Rationale**: Real-time collaboration deferred to Phase 6

6. **No Search Index**
   - **Decision**: Phase 2 uses ILIKE for search (not full-text search)
   - **Trade-off**: Slower search with >1000 documents
   - **Rationale**: Full-text search (GIN index) deferred to Phase 2.5

### Design Decisions

1. **Form State Separated from Document State**
   - **Decision**: react-hook-form owns transient form state, Zustand owns persisted document
   - **Rationale**: RHF provides built-in validation, dirty checking, error handling

2. **No Preview in Phase 2**
   - **Decision**: Editor is form-only (no live preview)
   - **Rationale**: Preview deferred to Phase 3 (requires templates)

3. **Conflict Resolution: User Choice**
   - **Decision**: No automatic merge, user picks "keep mine" or "use theirs"
   - **Rationale**: CRDTs complex, user-driven merge simpler and safer

4. **Version Retention: 30 Versions**
   - **Decision**: Keep last 30 versions (not infinite)
   - **Rationale**: Balances storage cost with undo depth

5. **Templates Optional in Phase 2**
   - **Decision**: Migration 006 (seed templates) is optional
   - **Rationale**: Users can create blank resumes, templates add polish but not critical

### Assumptions

1. **User has Google account** (OAuth-only auth from Phase 1)
2. **Modern browser** (Chrome, Firefox, Safari, Edge - ES2022 support)
3. **JavaScript enabled** (no SSR fallback for editor)
4. **Network available most of the time** (offline queue handles brief outages)
5. **<100 documents per user** (pagination handles this, but UI optimized for ≤50)

### Out of Scope for Phase 2

**Explicitly deferred**:
- Live preview (Phase 3)
- PDF/DOCX export (Phase 3)
- AI drafting (Phase 4)
- Template gallery (Phase 2.5)
- Full-text search (Phase 2.5)
- Mobile-optimized editor (Phase 7)
- Real-time collaboration (Phase 6)
- Analytics/usage tracking (never, per design decision)

---

## 16. RISKS & MITIGATIONS

### High-Priority Risks

#### Risk 1: Migration Failures

**Description**: Database migrations fail to apply due to syntax errors or permission issues.

**Likelihood**: Medium
**Impact**: Critical (blocks all development)

**Detection**: Migration apply returns error via MCP

**Mitigation**:
1. **Pre-flight validation**: Test migrations on local Supabase instance first
2. **Rollback scripts**: Provide DROP statements for each migration
3. **Incremental application**: Apply migrations one-by-one with verification between each

**Contingency**: If migration fails, immediately provide rollback script to user, fix issue, re-apply.

---

#### Risk 2: Optimistic Locking Conflicts

**Description**: Frequent 409 conflicts frustrate users, especially in multi-tab scenarios.

**Likelihood**: High (for power users with 2+ tabs)
**Impact**: Medium (user can resolve, but annoying)

**Detection**: High rate of 409 responses in API logs

**Mitigation**:
1. **Clear conflict UI**: Modal with visual diff (Phase 2.5)
2. **Tab synchronization**: BroadcastChannel to sync state across tabs (Phase 2.5)
3. **Last-write-wins option**: Add user preference for auto-merge (Phase 3)

**Contingency**: If conflicts are too frequent, switch to last-write-wins as default (removes optimistic locking).

---

#### Risk 3: Auto-Save Performance Degrades

**Description**: Auto-save triggers too frequently, overwhelming API or causing UI lag.

**Likelihood**: Medium (depends on user typing speed)
**Impact**: High (degrades editor experience)

**Detection**: API latency >800ms, save queue backs up

**Mitigation**:
1. **Debounce tuning**: Increase to 3s if 2s causes issues
2. **Batch updates**: Group multiple field changes into single save
3. **Rate limiting**: Max 10 saves per minute per user

**Contingency**: Disable auto-save, require manual save (Cmd+S or button).

---

#### Risk 4: JSONB Size Exceeds Limits

**Description**: Large resumes (10+ pages, 50+ work items) exceed JSONB storage limits.

**Likelihood**: Low (PostgreSQL JSONB limit is 1GB)
**Impact**: Medium (user cannot save)

**Detection**: Database error on INSERT/UPDATE

**Mitigation**:
1. **Size validation**: Check JSONB size before save (warn at 100KB, block at 500KB)
2. **Compression**: Use JSONB compression (PostgreSQL default)
3. **Field limits**: Enforce max lengths in Zod schemas (200 chars per bullet)

**Contingency**: Split large resumes into multiple documents (manual user action).

---

#### Risk 5: Undo/Redo State Corruption

**Description**: Zundo history becomes inconsistent, causing undo to fail or produce wrong state.

**Likelihood**: Low (zundo is battle-tested)
**Impact**: High (user loses work)

**Detection**: User reports "undo not working" or "document reverted incorrectly"

**Mitigation**:
1. **Equality check**: Use JSON.stringify to detect identical snapshots (already implemented)
2. **History clear on load**: Clear undo history when switching documents
3. **Manual save before undo**: Auto-save before undo operation (safety net)

**Contingency**: Add "Clear Undo History" button, reset to last saved state.

---

#### Risk 6: Version History Leaks User Data

**Description**: RLS misconfiguration allows users to see other users' versions.

**Likelihood**: Low (RLS tested in Phase 1)
**Impact**: Critical (data breach)

**Detection**: Security audit, manual testing with 2 users

**Mitigation**:
1. **RLS verification**: Test version history with 2 different users
2. **Policy audit**: Review all RLS policies before production
3. **Regular audits**: Monthly RLS policy review

**Contingency**: Immediately disable version history API, fix RLS, re-deploy.

---

### Medium-Priority Risks

#### Risk 7: Offline Queue Fills Up

**Likelihood**: Low | **Impact**: Medium

**Mitigation**: Warn user at 40 queued saves, block new edits at 50.

---

#### Risk 8: Browser localStorage Quota Exceeded

**Likelihood**: Low | **Impact**: Low

**Mitigation**: Clear old queue items >7 days, compress JSONB before storing.

---

#### Risk 9: Supabase Rate Limits Hit

**Likelihood**: Low | **Impact**: Medium

**Mitigation**: Implement client-side rate limiting (max 10 saves/min).

---

#### Risk 10: UI Performance with 100+ Documents

**Likelihood**: Medium | **Impact**: Low

**Mitigation**: Implement virtual scrolling, lazy load document cards.

---

## 17. SUCCESS CRITERIA

### Functional Requirements (Must-Have)

**Document Management**:
- [ ] User can create a new resume with title
- [ ] User can view list of all resumes (paginated if >20)
- [ ] User can search resumes by title
- [ ] User can filter resumes by status (draft/active/archived)
- [ ] User can duplicate a resume
- [ ] User can soft-delete a resume
- [ ] User can restore a deleted resume from trash
- [ ] User can bulk delete 2+ resumes
- [ ] User can bulk archive 2+ resumes

**Editor**:
- [ ] User can edit all resume sections (profile, summary, work, education, projects, skills)
- [ ] User can add/remove/reorder array items (work experience, education, projects)
- [ ] User can see character counters on text fields
- [ ] User can see validation errors on blur
- [ ] User can undo last 50 edits (Cmd+Z)
- [ ] User can redo undone edits (Shift+Cmd+Z)

**Auto-Save**:
- [ ] Changes auto-save 2 seconds after last keystroke
- [ ] Save status indicator shows "Saving..." and "Saved"
- [ ] Failed saves retry with exponential backoff
- [ ] Offline edits queue and retry when online
- [ ] Conflict modal appears on version mismatch (409)
- [ ] User can choose "Keep Mine" or "Use Server Version" on conflict

**Version History**:
- [ ] User can view list of versions (last 30 shown)
- [ ] User can preview a specific version (read-only)
- [ ] User can restore a previous version (creates new version)
- [ ] Versions show timestamp and version number

### Non-Functional Requirements (Must-Have)

**Performance**:
- [ ] Auto-save triggers <2s after last keystroke (p95)
- [ ] Document list loads <500ms (p95)
- [ ] Form field updates <50ms keystroke-to-state (p95)
- [ ] Undo operation <20ms (p95)
- [ ] Document switch <200ms (p95)

**Security**:
- [ ] RLS policies enforce user isolation (tested with 2 users)
- [ ] All API routes use `withAuth` wrapper
- [ ] All inputs validated with Zod schemas
- [ ] Optimistic locking prevents lost updates
- [ ] No PII logged in error reports

**Quality**:
- [ ] All 3 testing playbooks pass (Documents, Editor, Auto-Save)
- [ ] Visual verification completed (desktop + mobile screenshots)
- [ ] Design system compliance (Ramp palette, generous spacing, one primary action per section)
- [ ] No console errors in browser DevTools
- [ ] No ESLint errors in codebase

### Phase 2 Complete When:

1. **All 45 files created** (migrations, API routes, components, stores, utils)
2. **All 6 migrations applied** to database (with user approval)
3. **All 3 playbooks passing** (50 minutes total testing time)
4. **Visual verification documented** (10 screenshots saved to `/ai_docs/progress/phase_2/screenshots/`)
5. **Performance targets met** (measured via Puppeteer timing)
6. **Security checklist complete** (RLS verified, no auth bypass possible)
7. **Integration tested** (Phase 1 auth working, dashboard accessible from header)

### Definition of Done (Hard Gate)

**Phase 2 is complete when**:
- [ ] User can create, edit, save, and manage resume documents end-to-end
- [ ] Auto-save works reliably (2s debounce, conflict resolution, offline queue)
- [ ] Version history functional (view, restore, pagination)
- [ ] All performance targets met (<2s auto-save, <500ms list load, <50ms field update, <20ms undo)
- [ ] All security requirements met (RLS enforced, inputs validated, optimistic locking working)
- [ ] All testing playbooks passing (no critical issues)
- [ ] Visual verification complete (design system compliance verified)
- [ ] Documentation updated (`/ai_docs/progress/phase_2/` directory with findings)

**User-facing outcome**: "User can create and edit resumes with auto-save, undo/redo, and version history—all within 2 seconds of their actions."

---

## APPENDIX A: EVIDENCE & CITATIONS

### Research Dossiers (Internal)

- [doc:systems_researcher_phase2_state_management_output.md] - Zustand + zundo integration patterns (50-step history, partialize, handleSet debounce)
- [doc:systems_researcher_phase2_autosave_output.md] - 2-second debounced auto-save, optimistic locking, offline queue with exponential backoff
- [doc:systems_researcher_phase2_forms_output.md] - react-hook-form + Zod patterns, useFieldArray for arrays, character counters

### Architecture Standards (Internal)

- [doc:/ai_docs/standards/1_architecture_principles.md] - Schema-driven design, repository pattern with DI, layered architecture
- [doc:/ai_docs/standards/2_data_flow_patterns.md] - Three-state model (server, client, form), Zustand with Immer, optimistic updates
- [doc:/ai_docs/standards/3_component_standards.md] - Atomic design, Ramp palette, 8px spacing grid
- [doc:/ai_docs/standards/4_api_design_contracts.md] - API response envelope, withAuth wrapper, error codes
- [doc:/ai_docs/standards/5_error_handling_strategy.md] - Result type pattern, retry strategies, exponential backoff

### Phase 1 Implementations (Internal)

- [internal:/app/api/v1/me/route.ts#L23-L81] - Example of withAuth usage, Zod validation, parallel data fetching
- [internal:/app/settings/profile/page.tsx#L43-L80] - Example of react-hook-form with Zod resolver, useEffect for data loading

### External References

- [web:https://github.com/charkour/zundo | retrieved 2025-09-30] - Zundo temporal middleware documentation (limit, partialize, equality, handleSet)
- [web:https://react-hook-form.com/docs/useFieldArray | retrieved 2025-09-30] - useFieldArray API for dynamic form arrays (append, remove, move)
- [web:https://supabase.com/docs/guides/database/postgres/row-level-security | retrieved 2025-09-30] - PostgreSQL RLS policy patterns (auth.uid(), USING, WITH CHECK)
- [web:https://zod.dev | retrieved 2025-09-30] - Zod validation library (refine for cross-field validation, safeParse for error handling)

---

## APPENDIX B: IMPLEMENTATION CHECKLIST

Use this checklist during implementation to track progress:

### Database Layer
- [ ] Create 6 migration files in `/migrations/phase2/`
- [ ] Review migrations with user
- [ ] Apply migrations via Supabase MCP
- [ ] Verify RLS policies active
- [ ] Verify indexes created

### Repository Layer
- [ ] Create `/libs/repositories/documents.ts`
- [ ] Test getResumes() with 0, 1, 20, 100 docs
- [ ] Test createResume()
- [ ] Test updateResume() with optimistic locking
- [ ] Test deleteResume() (soft delete)
- [ ] Test duplicateResume()
- [ ] Test version operations (getVersions, getVersion, restoreVersion)

### Validation Layer
- [ ] Create `/libs/validation/resume/index.ts`
- [ ] Test ProfileSchema with valid/invalid data
- [ ] Test WorkExperienceSchema with date validation
- [ ] Test ResumeJsonSchema with nested structure
- [ ] Test cross-field validation (endDate > startDate)

### API Layer
- [ ] Create GET /api/v1/resumes (list)
- [ ] Create POST /api/v1/resumes (create)
- [ ] Create GET /api/v1/resumes/:id (read)
- [ ] Create PUT /api/v1/resumes/:id (update with version check)
- [ ] Create DELETE /api/v1/resumes/:id (soft delete)
- [ ] Create POST /api/v1/resumes/:id/duplicate
- [ ] Create POST /api/v1/resumes/:id/restore
- [ ] Create GET /api/v1/resumes/:id/versions (list versions)
- [ ] Create GET /api/v1/resumes/:id/versions/:versionNumber
- [ ] Create POST /api/v1/resumes/:id/versions/:versionNumber/restore
- [ ] Create POST /api/v1/resumes/bulk/delete
- [ ] Create POST /api/v1/resumes/bulk/archive
- [ ] Test all endpoints with Puppeteer

### State Management
- [ ] Create `/libs/stores/documentStore.ts` (Zustand + zundo)
- [ ] Test 50-step undo limit
- [ ] Test partialize (only document tracked)
- [ ] Test equality check (skip identical snapshots)
- [ ] Test handleSet debounce (150ms)
- [ ] Create `/libs/stores/documentListStore.ts`
- [ ] Test fetchDocuments() with filters
- [ ] Test searchDocuments()
- [ ] Test selection (selectDocument, selectAll, deselectAll)
- [ ] Test bulkDelete()

### Auto-Save System
- [ ] Create `/libs/utils/offline-queue.ts`
- [ ] Test queueFailedSave()
- [ ] Test processQueue() with exponential backoff
- [ ] Test max retries (5 attempts)
- [ ] Test auto-save debounce (2 seconds)
- [ ] Test conflict detection (409 response)
- [ ] Test conflict resolution (keep mine vs use theirs)

### Document List UI
- [ ] Create `/app/dashboard/page.tsx`
- [ ] Create `/components/documents/DocumentGrid.tsx`
- [ ] Create `/components/documents/DocumentCard.tsx`
- [ ] Create `/components/documents/DocumentSearch.tsx`
- [ ] Create `/components/documents/DocumentFilters.tsx`
- [ ] Create `/components/documents/DocumentActions.tsx`
- [ ] Create `/components/documents/EmptyDocuments.tsx`
- [ ] Create `/components/documents/CreateDocumentDialog.tsx`
- [ ] Test with 0, 1, 10, 100 documents
- [ ] Visual verification (desktop + mobile)

### Editor UI
- [ ] Create `/app/editor/[id]/page.tsx`
- [ ] Create `/components/editor/EditorLayout.tsx`
- [ ] Create `/components/editor/EditorHeader.tsx` (save status)
- [ ] Create `/components/editor/EditorSidebar.tsx`
- [ ] Create `/components/editor/EditorForm.tsx`
- [ ] Create `/components/editor/AutoSaveHandler.tsx`
- [ ] Create 4 field components (TextField, TextAreaField, DateField, SelectField)
- [ ] Create 6 section components (Profile, Summary, Work, Education, Projects, Skills)
- [ ] Test form validation (on blur)
- [ ] Test character counters
- [ ] Test array manipulation (add/remove/reorder)
- [ ] Visual verification (desktop + mobile)

### Version History UI
- [ ] Create `/components/version-history/VersionHistoryPanel.tsx`
- [ ] Create `/components/version-history/VersionListItem.tsx`
- [ ] Create `/components/version-history/VersionPreviewDialog.tsx`
- [ ] Create `/components/version-history/ConflictResolutionDialog.tsx`
- [ ] Test version list rendering
- [ ] Test version preview
- [ ] Test version restore
- [ ] Visual verification (desktop + mobile)

### Testing & QA
- [ ] Create playbook: `/ai_docs/testing/playbooks/phase2_playbook_documents.md`
- [ ] Create playbook: `/ai_docs/testing/playbooks/phase2_playbook_editor.md`
- [ ] Create playbook: `/ai_docs/testing/playbooks/phase2_playbook_autosave.md`
- [ ] Run playbook 1: Document CRUD (15 min)
- [ ] Run playbook 2: Editor & Auto-Save (20 min)
- [ ] Run playbook 3: Version History (15 min)
- [ ] Visual verification: 10 screenshots (desktop + mobile)
- [ ] Performance verification: All 5 targets met
- [ ] Security verification: RLS + auth tested with 2 users

### Documentation
- [ ] Update `/ai_docs/progress/phase_2/visual_review.md` with findings
- [ ] Save screenshots to `/ai_docs/progress/phase_2/screenshots/`
- [ ] Document known issues in `/ai_docs/progress/phase_2/issues.md`
- [ ] Update CLAUDE.md if Phase 2 changes project patterns

---

**END OF PLAN**

---

**Plan Status**: ✅ COMPLETE
**Last Updated**: 2025-09-30
**Implementer**: Ready to execute
**Next Action**: Review plan with user → Begin implementation