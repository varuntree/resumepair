-- Migration 019: Create score_improvements table
-- Purpose: Track which suggestions were applied (for ROI analytics)
-- Phase: Phase 6 - Scoring & Optimization
-- Created: 2025-10-02

CREATE TABLE score_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  suggestion_id TEXT NOT NULL, -- ID from Suggestion interface
  suggestion_data JSONB NOT NULL, -- Full Suggestion object (audit trail)

  applied BOOLEAN NOT NULL DEFAULT TRUE,
  impact INTEGER, -- Points improvement (0-10)

  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_improvements_resume ON score_improvements(resume_id);
CREATE INDEX idx_improvements_user ON score_improvements(user_id);

-- RLS Policies
ALTER TABLE score_improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "score_improvements_select_own"
  ON score_improvements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "score_improvements_insert_own"
  ON score_improvements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE score_improvements IS 'Tracks applied suggestions for ROI analytics.';
