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