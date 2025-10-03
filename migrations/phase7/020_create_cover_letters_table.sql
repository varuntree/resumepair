-- Phase 7: Cover Letters & Extended Documents
-- Migration 020: Create cover_letters table
-- Description: Creates the cover_letters table with same structure as resumes table for consistency
-- Pattern: Hybrid FK + Junction (denormalized user_id for RLS performance)

-- Create cover_letters table
CREATE TABLE IF NOT EXISTS public.cover_letters (
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

-- Indexes for performance
CREATE INDEX idx_cover_letters_user ON public.cover_letters(user_id) WHERE is_deleted = false;
CREATE INDEX idx_cover_letters_status ON public.cover_letters(user_id, status) WHERE is_deleted = false;
CREATE INDEX idx_cover_letters_updated ON public.cover_letters(user_id, updated_at DESC) WHERE is_deleted = false;
CREATE INDEX idx_cover_letters_linked_resume ON public.cover_letters(linked_resume_id) WHERE linked_resume_id IS NOT NULL AND is_deleted = false;
CREATE UNIQUE INDEX idx_cover_letters_slug ON public.cover_letters(user_id, slug) WHERE slug IS NOT NULL AND is_deleted = false;

-- Composite index for multi-document dashboard queries
CREATE INDEX idx_cover_letters_dashboard ON public.cover_letters(user_id, updated_at DESC, status) WHERE is_deleted = false;

-- Trigger for updated_at timestamp
CREATE TRIGGER set_updated_at_on_cover_letters
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE PROCEDURE public.tg_set_updated_at();

-- Enable Row Level Security
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: SELECT - Read own cover letters
CREATE POLICY "cover_letters_select_own" ON public.cover_letters
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy 2: INSERT - Create own cover letters
CREATE POLICY "cover_letters_insert_own" ON public.cover_letters
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy 3: UPDATE - Modify own cover letters
CREATE POLICY "cover_letters_update_own" ON public.cover_letters
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy 4: DELETE - Remove own cover letters (soft delete recommended)
CREATE POLICY "cover_letters_delete_own" ON public.cover_letters
  FOR DELETE USING (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE public.cover_letters IS 'Stores cover letter documents with JSONB schema, linked to resumes for data sync';
COMMENT ON COLUMN public.cover_letters.data IS 'JSONB column storing CoverLetterJson schema (from, to, jobInfo, date, salutation, body as RichTextBlock[], closing, settings)';
COMMENT ON COLUMN public.cover_letters.linked_resume_id IS 'Foreign key to resumes table for one-way data sync (resume → cover letter). ON DELETE SET NULL preserves cover letter when resume deleted.';
COMMENT ON COLUMN public.cover_letters.version IS 'Optimistic locking version number. Incremented on each UPDATE for conflict detection.';
