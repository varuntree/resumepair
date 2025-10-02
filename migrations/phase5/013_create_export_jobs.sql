-- Migration: 013_create_export_jobs.sql
-- Phase: 5 (Export System)
-- Description: Create export_jobs table for queue management

CREATE TABLE IF NOT EXISTS public.export_jobs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id    uuid NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  format         text NOT NULL CHECK (format IN ('pdf')),
  options        jsonb NOT NULL DEFAULT '{}'::jsonb,
  status         text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  progress       integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  attempts       integer NOT NULL DEFAULT 0,
  max_attempts   integer NOT NULL DEFAULT 5,
  run_after      timestamptz,
  result_url     text,
  file_size      integer,
  page_count     integer,
  error_message  text,
  started_at     timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Comments for documentation
COMMENT ON TABLE public.export_jobs IS 'Job queue for PDF export operations with retry logic';
COMMENT ON COLUMN public.export_jobs.user_id IS 'User who initiated the export';
COMMENT ON COLUMN public.export_jobs.document_id IS 'Resume/document being exported';
COMMENT ON COLUMN public.export_jobs.format IS 'Export format (currently only pdf)';
COMMENT ON COLUMN public.export_jobs.options IS 'Export options: templateSlug, pageSize, margins, quality';
COMMENT ON COLUMN public.export_jobs.status IS 'Job lifecycle status';
COMMENT ON COLUMN public.export_jobs.progress IS 'Progress percentage (0-100)';
COMMENT ON COLUMN public.export_jobs.attempts IS 'Number of processing attempts';
COMMENT ON COLUMN public.export_jobs.max_attempts IS 'Maximum retry attempts before permanent failure';
COMMENT ON COLUMN public.export_jobs.run_after IS 'Scheduled retry time (for exponential backoff)';
COMMENT ON COLUMN public.export_jobs.result_url IS 'Signed URL to download the exported file';
COMMENT ON COLUMN public.export_jobs.file_size IS 'Size of exported file in bytes';
COMMENT ON COLUMN public.export_jobs.page_count IS 'Number of pages in exported PDF';
COMMENT ON COLUMN public.export_jobs.error_message IS 'Error details if job failed';
