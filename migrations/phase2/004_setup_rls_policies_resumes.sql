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