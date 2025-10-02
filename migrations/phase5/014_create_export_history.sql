-- Migration: 014_create_export_history.sql
-- Phase: 5 (Export System)
-- Description: Create export_history table for tracking completed exports

CREATE TABLE IF NOT EXISTS public.export_history (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id      uuid REFERENCES public.resumes(id) ON DELETE SET NULL,
  document_version integer NOT NULL,
  format           text NOT NULL CHECK (format IN ('pdf')),
  template_slug    text NOT NULL,
  file_name        text NOT NULL,
  file_path        text NOT NULL,
  file_size        integer NOT NULL,
  page_count       integer,
  download_count   integer NOT NULL DEFAULT 0,
  expires_at       timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Comments for documentation
COMMENT ON TABLE public.export_history IS 'Historical exports with temporary storage links (7-day TTL)';
COMMENT ON COLUMN public.export_history.user_id IS 'User who created the export';
COMMENT ON COLUMN public.export_history.document_id IS 'Reference to original document (nullable if document deleted)';
COMMENT ON COLUMN public.export_history.document_version IS 'Version of document at export time';
COMMENT ON COLUMN public.export_history.format IS 'Export format';
COMMENT ON COLUMN public.export_history.template_slug IS 'Template used for export';
COMMENT ON COLUMN public.export_history.file_name IS 'User-friendly filename';
COMMENT ON COLUMN public.export_history.file_path IS 'Storage path (userId/documentId_timestamp.pdf)';
COMMENT ON COLUMN public.export_history.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.export_history.page_count IS 'Number of pages';
COMMENT ON COLUMN public.export_history.download_count IS 'Number of times downloaded';
COMMENT ON COLUMN public.export_history.expires_at IS '7-day TTL for automatic cleanup';
