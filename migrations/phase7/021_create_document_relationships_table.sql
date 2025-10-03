-- Phase 7: Cover Letters & Extended Documents
-- Migration 021: Create document_relationships table
-- Description: Junction table for flexible document linking with metadata support
-- Pattern: Hybrid FK + Junction (supports many-to-many with typed relationships)

-- Create document_relationships table
CREATE TABLE IF NOT EXISTS public.document_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('resume', 'cover_letter')),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('resume', 'cover_letter')),
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('linked', 'package', 'variant')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_relationships_user ON public.document_relationships(user_id);
CREATE INDEX idx_relationships_source ON public.document_relationships(source_id, source_type);
CREATE INDEX idx_relationships_target ON public.document_relationships(target_id, target_type);
CREATE INDEX idx_relationships_type ON public.document_relationships(relationship_type);

-- Composite index for bi-directional lookups
CREATE INDEX idx_relationships_bidirectional ON public.document_relationships(source_id, target_id);

-- Unique constraint: Prevent duplicate relationships
CREATE UNIQUE INDEX idx_relationships_unique ON public.document_relationships(
  source_id, source_type, target_id, target_type, relationship_type
) WHERE relationship_type != 'variant';

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_on_relationships
  BEFORE UPDATE ON public.document_relationships
  FOR EACH ROW EXECUTE PROCEDURE public.tg_set_updated_at();

-- Enable Row Level Security
ALTER TABLE public.document_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: SELECT - Read relationships for own documents
CREATE POLICY "relationships_select_own" ON public.document_relationships
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policy 2: INSERT - Create relationships for own documents
CREATE POLICY "relationships_insert_own" ON public.document_relationships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policy 3: UPDATE - Modify own relationships
CREATE POLICY "relationships_update_own" ON public.document_relationships
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy 4: DELETE - Remove own relationships
CREATE POLICY "relationships_delete_own" ON public.document_relationships
  FOR DELETE USING (user_id = auth.uid());

-- Trigger: Clean up relationships when resume is deleted
CREATE OR REPLACE FUNCTION cleanup_resume_relationships()
RETURNS TRIGGER AS $$
BEGIN
  -- Update linked cover letters to set linkedResumeId to null in JSONB
  UPDATE public.cover_letters
  SET
    data = jsonb_set(
      data,
      '{from,linkedResumeId}',
      'null'::jsonb
    ),
    linked_resume_id = NULL,
    version = version + 1
  WHERE linked_resume_id = OLD.id;

  -- Delete relationship records
  DELETE FROM public.document_relationships
  WHERE (source_id = OLD.id AND source_type = 'resume')
     OR (target_id = OLD.id AND target_type = 'resume');

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to resumes table
CREATE TRIGGER on_resume_delete
  BEFORE DELETE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION cleanup_resume_relationships();

-- Add comments for documentation
COMMENT ON TABLE public.document_relationships IS 'Junction table for flexible document relationships with typed metadata';
COMMENT ON COLUMN public.document_relationships.user_id IS 'Denormalized user_id for RLS performance (avoids JOINs in policies)';
COMMENT ON COLUMN public.document_relationships.relationship_type IS 'Relationship type: linked (one-way sync), package (bundle), variant (A/B version)';
COMMENT ON COLUMN public.document_relationships.metadata IS 'JSONB metadata for relationship-specific data (e.g., sync timestamp, package config)';
