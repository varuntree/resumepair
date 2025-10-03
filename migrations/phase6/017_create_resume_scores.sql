-- Migration 017: Create resume_scores table
-- Purpose: Store current score for each resume (one row per resume, upserted on recalculation)
-- Phase: Phase 6 - Scoring & Optimization
-- Created: 2025-10-02

CREATE TABLE resume_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Denormalized for RLS

  -- Overall score (0-100)
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),

  -- Sub-scores (5 dimensions)
  ats_score INTEGER NOT NULL CHECK (ats_score BETWEEN 0 AND 30),
  keyword_score INTEGER NOT NULL CHECK (keyword_score BETWEEN 0 AND 25),
  content_score INTEGER NOT NULL CHECK (content_score BETWEEN 0 AND 20),
  format_score INTEGER NOT NULL CHECK (format_score BETWEEN 0 AND 15),
  completeness_score INTEGER NOT NULL CHECK (completeness_score BETWEEN 0 AND 10),

  -- Metadata
  breakdown JSONB NOT NULL, -- Detailed sub-factors
  suggestions JSONB NOT NULL, -- Array of suggestion objects

  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (resume_id) -- One score per resume
);

-- Indexes for fast lookups
CREATE INDEX idx_resume_scores_user ON resume_scores(user_id);
CREATE INDEX idx_resume_scores_resume ON resume_scores(resume_id);

-- RLS Policies
ALTER TABLE resume_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resume_scores_select_own"
  ON resume_scores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "resume_scores_insert_own"
  ON resume_scores FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "resume_scores_update_own"
  ON resume_scores FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "resume_scores_delete_own"
  ON resume_scores FOR DELETE
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE resume_scores IS 'Stores current resume score for each resume. Updated on every recalculation.';
