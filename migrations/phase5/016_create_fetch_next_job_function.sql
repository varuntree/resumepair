-- Migration: 016_create_fetch_next_job_function.sql
-- Phase: 5 (Export System)
-- Description: Create atomic job fetch function using FOR UPDATE SKIP LOCKED

CREATE OR REPLACE FUNCTION public.fetch_next_export_job(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  document_id uuid,
  format text,
  options jsonb,
  status text,
  progress integer,
  attempts integer,
  max_attempts integer,
  run_after timestamptz,
  result_url text,
  file_size integer,
  page_count integer,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atomic job claim with FOR UPDATE SKIP LOCKED
  -- This ensures no race conditions when multiple workers fetch simultaneously
  RETURN QUERY
  UPDATE public.export_jobs SET
    status = 'processing',
    attempts = attempts + 1,
    started_at = now()
  WHERE export_jobs.id IN (
    SELECT ej.id
    FROM public.export_jobs ej
    WHERE ej.status = 'pending'
      AND (p_user_id IS NULL OR ej.user_id = p_user_id)
      AND (ej.run_after IS NULL OR ej.run_after <= now())
    ORDER BY ej.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING
    export_jobs.id,
    export_jobs.user_id,
    export_jobs.document_id,
    export_jobs.format,
    export_jobs.options,
    export_jobs.status,
    export_jobs.progress,
    export_jobs.attempts,
    export_jobs.max_attempts,
    export_jobs.run_after,
    export_jobs.result_url,
    export_jobs.file_size,
    export_jobs.page_count,
    export_jobs.error_message,
    export_jobs.started_at,
    export_jobs.completed_at,
    export_jobs.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fetch_next_export_job(uuid) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION public.fetch_next_export_job IS 'Atomically claim next pending export job using FOR UPDATE SKIP LOCKED pattern';
