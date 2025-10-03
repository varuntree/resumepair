-- Phase 7: Cover Letters & Extended Documents
-- Migration 022: Create document_packages table
-- Description: Stores document bundles (resume + cover letter + optional attachments) for job applications
-- Pattern: Denormalized user_id for RLS performance, CASCADE delete when documents removed

-- Create document_packages table
CREATE TABLE IF NOT EXISTS public.document_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) >= 1),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  cover_letter_id UUID NOT NULL REFERENCES public.cover_letters(id) ON DELETE CASCADE,
  additional_docs JSONB DEFAULT '[]'::jsonb,
  job_application_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'archived')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_packages_user ON public.document_packages(user_id);
CREATE INDEX idx_packages_resume ON public.document_packages(resume_id);
CREATE INDEX idx_packages_cover_letter ON public.document_packages(cover_letter_id);
CREATE INDEX idx_packages_status ON public.document_packages(user_id, status);
CREATE INDEX idx_packages_updated ON public.document_packages(user_id, updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_on_packages
  BEFORE UPDATE ON public.document_packages
  FOR EACH ROW EXECUTE PROCEDURE public.tg_set_updated_at();

-- Enable Row Level Security
ALTER TABLE public.document_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: SELECT - Read own packages
CREATE POLICY "packages_select_own" ON public.document_packages
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy 2: INSERT - Create own packages
CREATE POLICY "packages_insert_own" ON public.document_packages
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy 3: UPDATE - Modify own packages
CREATE POLICY "packages_update_own" ON public.document_packages
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy 4: DELETE - Remove own packages
CREATE POLICY "packages_delete_own" ON public.document_packages
  FOR DELETE USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE public.document_packages IS 'Document bundles (resume + cover letter + attachments) for job applications';
COMMENT ON COLUMN public.document_packages.user_id IS 'Denormalized user_id for RLS performance (avoids JOINs)';
COMMENT ON COLUMN public.document_packages.resume_id IS 'Foreign key to resumes. ON DELETE CASCADE: package deleted when resume removed.';
COMMENT ON COLUMN public.document_packages.cover_letter_id IS 'Foreign key to cover_letters. ON DELETE CASCADE: package deleted when cover letter removed.';
COMMENT ON COLUMN public.document_packages.additional_docs IS 'JSONB array of additional documents: [{ type, id, url, name }]. Future: portfolio items, references.';
COMMENT ON COLUMN public.document_packages.job_application_id IS 'Optional external tracking ID (e.g., ATS reference number, job board ID)';
