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