-- Migration 018: Create score_history table
-- Purpose: Track score evolution over time (append-only log)
-- Phase: Phase 6 - Scoring & Optimization
-- Created: 2025-10-02

CREATE TABLE score_history (
  id BIGSERIAL PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version INTEGER NOT NULL, -- Resume version at time of scoring

  -- Score snapshot
  overall_score INTEGER NOT NULL,
  ats_score INTEGER NOT NULL,
  keyword_score INTEGER NOT NULL,
  content_score INTEGER NOT NULL,
  format_score INTEGER NOT NULL,
  completeness_score INTEGER NOT NULL,

  breakdown JSONB NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for history queries
CREATE INDEX idx_score_history_resume ON score_history(resume_id, created_at DESC);
CREATE INDEX idx_score_history_user ON score_history(user_id);

-- RLS Policies
ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "score_history_select_own"
  ON score_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "score_history_insert_own"
  ON score_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE score_history IS 'Append-only log of score calculations for trend analysis.';
