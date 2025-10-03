# Database Schema

**Purpose**: Database tables, RLS policies, indexes, and migration structure.

---

## Table of Contents

1. [Tables Overview](#1-tables-overview)
2. [Schema Definitions](#2-schema-definitions)
3. [RLS Policies](#3-rls-policies)
4. [Indexes](#4-indexes)
5. [Migration Structure](#5-migration-structure)

---

## 1. Tables Overview

| Table | Purpose | Owner |
|-------|---------|-------|
| `profiles` | User profile & preferences | User (1:1 with auth.users) |
| `documents` | Resumes & cover letters (JSONB) | User (1:N) |
| `document_versions` | Immutable version history | User (N per document) |
| `storage.objects` | Supabase Storage (exports, avatars) | User (folder-based RLS) |

---

## 2. Schema Definitions

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  locale TEXT NOT NULL DEFAULT 'en-US',
  date_format TEXT NOT NULL DEFAULT 'US',      -- US | ISO | EU
  page_size TEXT NOT NULL DEFAULT 'Letter',    -- A4 | Letter
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update trigger
CREATE TRIGGER set_updated_at_on_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE tg_set_updated_at();

-- Auto-create on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### documents
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document metadata
  type TEXT NOT NULL CHECK (type IN ('resume', 'cover-letter')),
  title TEXT NOT NULL,
  slug TEXT,

  -- Schema & content
  schema_version TEXT NOT NULL,               -- "resume.v1"
  data JSONB NOT NULL,                        -- ResumeJson | CoverLetterJson

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,

  -- Score (latest)
  score JSONB,                                -- { total, dimensions, suggestions }

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ                      -- Soft delete
);

-- Indexes
CREATE INDEX idx_documents_user_id ON documents(user_id, updated_at DESC);
CREATE INDEX idx_documents_type ON documents(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NOT NULL;

-- Auto-update trigger
CREATE TRIGGER set_updated_at_on_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE PROCEDURE tg_set_updated_at();
```

### document_versions
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Version snapshot
  version INTEGER NOT NULL,
  data JSONB NOT NULL,                        -- Immutable copy

  -- Metadata
  created_by UUID REFERENCES auth.users(id),  -- Who made this version
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(document_id, version)
);

-- Index for version queries
CREATE INDEX idx_document_versions_document ON document_versions(document_id, version DESC);
```

---

## 3. RLS Policies

**Critical**: ALL user tables must have 4 CRUD policies (SELECT, INSERT, UPDATE, DELETE).

### profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Read own profile
CREATE POLICY "users_select_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- INSERT: Create own profile (auto-created by trigger, but allow manual)
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- UPDATE: Modify own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: Remove own profile
CREATE POLICY "users_delete_own_profile" ON profiles
  FOR DELETE USING (id = auth.uid());
```

### documents

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- SELECT: Read own documents
CREATE POLICY "users_select_own_documents" ON documents
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: Create own documents
CREATE POLICY "users_insert_own_documents" ON documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: Modify own documents
CREATE POLICY "users_update_own_documents" ON documents
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Soft delete own documents
CREATE POLICY "users_delete_own_documents" ON documents
  FOR DELETE USING (user_id = auth.uid());
```

### document_versions

```sql
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- SELECT: Read own versions
CREATE POLICY "users_select_own_versions" ON document_versions
  FOR SELECT USING (user_id = auth.uid());

-- INSERT: Create own versions
CREATE POLICY "users_insert_own_versions" ON document_versions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: Not allowed (immutable)
-- No UPDATE policy

-- DELETE: Remove own versions
CREATE POLICY "users_delete_own_versions" ON document_versions
  FOR DELETE USING (user_id = auth.uid());
```

### storage.objects (exports bucket)

```sql
-- Upload to own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read own files
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete own files
CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exports' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 4. Indexes

### Performance Indexes

```sql
-- User document queries (most common)
CREATE INDEX idx_documents_user_id ON documents(user_id, updated_at DESC);

-- Document type filtering
CREATE INDEX idx_documents_type ON documents(type) WHERE deleted_at IS NULL;

-- Soft delete cleanup queries
CREATE INDEX idx_documents_deleted ON documents(deleted_at) WHERE deleted_at IS NOT NULL;

-- Version history queries
CREATE INDEX idx_document_versions_document ON document_versions(document_id, version DESC);

-- Optional: Full-text search on title (if needed)
-- CREATE INDEX idx_documents_title_trgm ON documents USING gin(title gin_trgm_ops);
```

---

## 5. Migration Structure

### File Organization
```
migrations/
├── phase1/                    # Foundation
│   ├── 001_enable_extensions.sql
│   ├── 002_profiles.sql
│   ├── 003_documents.sql
│   ├── 004_document_versions.sql
│   ├── 005_rls_policies.sql
│   ├── 006_storage_buckets.sql
│   └── 007_indexes.sql
├── phase2/                    # Enhancements
│   └── ...
└── phase3/
    └── ...
```

### Migration Template

```sql
-- Migration: [Description]
-- Phase: [N]
-- Date: [YYYY-MM-DD]
-- Author: [Name]

-- Description:
-- [What this migration does]

-- Dependencies:
-- [Previous migrations this depends on]

BEGIN;

-- [SQL statements here]

COMMIT;
```

### Example: 003_documents.sql

```sql
-- Migration: Create documents table
-- Phase: 1
-- Date: 2025-10-03

BEGIN;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('resume', 'cover-letter')),
  title TEXT NOT NULL,
  slug TEXT,
  schema_version TEXT NOT NULL,
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  score JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_documents_user_id ON documents(user_id, updated_at DESC);
CREATE INDEX idx_documents_type ON documents(type) WHERE deleted_at IS NULL;

-- Updated trigger
CREATE TRIGGER set_updated_at_on_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE PROCEDURE tg_set_updated_at();

COMMIT;
```

---

## Data Model Rationale

### Why JSONB for documents.data?

**Pros**:
- ✅ Schema flexibility (easy to evolve)
- ✅ Single query to get full document
- ✅ Versioning is simpler (snapshot entire JSON)
- ✅ No JOIN overhead for nested data
- ✅ AI outputs map directly to storage

**Cons**:
- ❌ Harder to query nested fields (but we don't need to)
- ❌ No foreign key constraints on nested data (acceptable)

**Decision**: JSONB is ideal for document-centric apps where the document is an atomic unit.

### Why soft deletes?

**Rationale**:
- User can "restore" accidentally deleted documents
- Cleanup cron job removes old deleted documents (>30 days)
- Never hard-delete user data without explicit action

### Why user_id in document_versions?

**RLS Performance**:
- Denormalized for efficient RLS without JOINs
- RLS policy: `WHERE user_id = auth.uid()` (indexed, fast)
- Alternative: `WHERE document_id IN (SELECT id FROM documents WHERE user_id = auth.uid())` (slow)

---

## Key Constraints

### Data Integrity
- `documents.type`: Must be 'resume' or 'cover-letter'
- `documents.schema_version`: Required (tracks schema evolution)
- `documents.data`: JSONB, validated by application layer
- `document_versions`: Immutable (no UPDATE policy)

### Soft Delete Behavior
```sql
-- Mark as deleted
UPDATE documents SET deleted_at = NOW() WHERE id = $1;

-- Query excludes soft-deleted
SELECT * FROM documents WHERE deleted_at IS NULL;

-- Restore
UPDATE documents SET deleted_at = NULL WHERE id = $1;

-- Hard delete (cleanup cron)
DELETE FROM documents WHERE deleted_at < NOW() - INTERVAL '30 days';
```

---

## Key Takeaways

1. **JSONB-first** - Documents stored as atomic JSON
2. **RLS enforced** - All tables have 4 CRUD policies
3. **Soft deletes** - Never hard-delete user data immediately
4. **Version history** - Immutable snapshots for undo/audit
5. **User-scoped indexes** - Optimized for `user_id` queries
6. **File-only migrations** - Never auto-apply until approved

---

**Next**: API Specification (`06_api.md`)
