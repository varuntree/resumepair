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