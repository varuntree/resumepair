-- Migration 020: Create industry_benchmarks table
-- Purpose: Store hardcoded industry benchmark data (public read-only)
-- Phase: Phase 6 - Scoring & Optimization
-- Created: 2025-10-02

CREATE TABLE industry_benchmarks (
  industry TEXT PRIMARY KEY,

  average_score INTEGER NOT NULL,
  percentiles JSONB NOT NULL, -- { p25: 65, p50: 75, p75: 85, p90: 92 }

  sample_size INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data (hardcoded averages)
INSERT INTO industry_benchmarks (industry, average_score, percentiles, sample_size) VALUES
  ('software_engineering', 78, '{"p25":65,"p50":75,"p75":85,"p90":92}', 1000),
  ('data_science', 76, '{"p25":63,"p50":73,"p75":83,"p90":90}', 800),
  ('product_management', 80, '{"p25":68,"p50":78,"p75":88,"p90":94}', 600),
  ('marketing', 75, '{"p25":62,"p50":72,"p75":82,"p90":89}', 700),
  ('design', 77, '{"p25":64,"p50":74,"p75":84,"p90":91}', 500),
  ('general', 74, '{"p25":60,"p50":70,"p75":80,"p90":88}', 5000);

-- No RLS needed (public read-only data)

-- Add comment
COMMENT ON TABLE industry_benchmarks IS 'Public industry benchmark data for score comparison.';
