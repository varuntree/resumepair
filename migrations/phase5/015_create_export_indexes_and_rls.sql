-- Migration: 015_create_export_indexes_and_rls.sql
-- Phase: 5 (Export System)
-- Description: Create indexes and RLS policies for export tables

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for job fetching (most critical query)
-- Used by fetchNextJob() to claim jobs atomically
CREATE INDEX IF NOT EXISTS export_jobs_fetch_idx
  ON public.export_jobs(status, run_after, created_at)
  WHERE status IN ('pending', 'processing');

-- Index for user's job listing
CREATE INDEX IF NOT EXISTS export_jobs_user_idx
  ON public.export_jobs(user_id, created_at DESC);

-- Index for finding stuck jobs (cleanup)
CREATE INDEX IF NOT EXISTS export_jobs_stuck_idx
  ON public.export_jobs(status, started_at)
  WHERE status = 'processing';

-- Index for cleanup query (find expired exports)
CREATE INDEX IF NOT EXISTS export_history_expires_idx
  ON public.export_history(expires_at)
  WHERE expires_at > now();

-- Index for user's export history
CREATE INDEX IF NOT EXISTS export_history_user_idx
  ON public.export_history(user_id, created_at DESC);


-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- export_jobs policies: Users can only access their own jobs
CREATE POLICY "export_jobs_select_own"
  ON public.export_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "export_jobs_insert_own"
  ON public.export_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "export_jobs_update_own"
  ON public.export_jobs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "export_jobs_delete_own"
  ON public.export_jobs FOR DELETE
  USING (user_id = auth.uid());

-- export_history policies: Users can only access their own exports
CREATE POLICY "export_history_select_own"
  ON public.export_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "export_history_insert_own"
  ON public.export_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "export_history_delete_own"
  ON public.export_history FOR DELETE
  USING (user_id = auth.uid());
