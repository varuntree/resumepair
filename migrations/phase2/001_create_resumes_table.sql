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