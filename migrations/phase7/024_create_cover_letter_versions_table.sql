/**
 * Migration: Create cover_letter_versions table
 *
 * Tracks version history for cover letters with snapshot-based versioning.
 * Each update creates a new version with complete data snapshot.
 */

-- Create cover_letter_versions table
CREATE TABLE IF NOT EXISTS public.cover_letter_versions (
  id BIGSERIAL PRIMARY KEY,
  cover_letter_id UUID NOT NULL REFERENCES public.cover_letters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT unique_cover_letter_version UNIQUE (cover_letter_id, version_number),
  CONSTRAINT positive_version_number CHECK (version_number > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cover_letter_versions_cover_letter_id
  ON public.cover_letter_versions(cover_letter_id);

CREATE INDEX IF NOT EXISTS idx_cover_letter_versions_created_at
  ON public.cover_letter_versions(created_at DESC);

-- Enable RLS
ALTER TABLE public.cover_letter_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access versions of their own cover letters
CREATE POLICY "Users can view their own cover letter versions"
  ON public.cover_letter_versions
  FOR SELECT
  USING (
    created_by = auth.uid()
  );

CREATE POLICY "Users can create versions for their own cover letters"
  ON public.cover_letter_versions
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.cover_letters
      WHERE id = cover_letter_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own cover letter versions"
  ON public.cover_letter_versions
  FOR DELETE
  USING (
    created_by = auth.uid()
  );

-- Trigger to auto-create version on cover letter update
CREATE OR REPLACE FUNCTION public.create_cover_letter_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if data actually changed
  IF (OLD.data IS DISTINCT FROM NEW.data) THEN
    INSERT INTO public.cover_letter_versions (
      cover_letter_id,
      version_number,
      data,
      created_by
    ) VALUES (
      OLD.id,
      OLD.version,
      OLD.data,
      OLD.user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to cover_letters table
DROP TRIGGER IF EXISTS trigger_create_cover_letter_version ON public.cover_letters;
CREATE TRIGGER trigger_create_cover_letter_version
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW
  EXECUTE FUNCTION public.create_cover_letter_version();

-- Comments
COMMENT ON TABLE public.cover_letter_versions IS 'Version history for cover letter documents';
COMMENT ON COLUMN public.cover_letter_versions.version_number IS 'Sequential version number for this cover letter';
COMMENT ON COLUMN public.cover_letter_versions.data IS 'Complete snapshot of cover letter data at this version';
