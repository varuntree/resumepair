-- Phase 4C: AI Response Caching
-- Creates ai_cache table for caching AI enhancement responses to reduce costs
-- Migration 011: AI Response Cache

-- AI response caching for cost optimization (30-40% reduction target)
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,      -- SHA-256 hash of (operation_type + content + context)
  operation_type TEXT NOT NULL CHECK (operation_type IN ('enhance_bullet', 'enhance_summary', 'extract_keywords')),
  input_hash TEXT NOT NULL,             -- SHA-256 of input content
  response JSONB NOT NULL,              -- Cached AI response
  hit_count INTEGER DEFAULT 1,          -- Number of cache hits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL       -- TTL: 1 hour from creation
);

-- Index for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);

-- Index for TTL-based cleanup
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);

-- Auto-cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM ai_cache WHERE expires_at < NOW();
END;
$$;

-- Enable Row Level Security (even though cache is global)
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cache (global cache for cost optimization)
CREATE POLICY "cache_read_all" ON ai_cache
  FOR SELECT USING (true);

-- Policy: Only authenticated users can write
CREATE POLICY "cache_write_auth" ON ai_cache
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Table comment
COMMENT ON TABLE ai_cache IS 'Phase 4C: Caches AI enhancement responses to reduce costs. 1-hour TTL, content-addressed via SHA-256. Global cache (not user-specific) for higher hit rate.';

-- Column comments
COMMENT ON COLUMN ai_cache.cache_key IS 'SHA-256 hash of (operation_type + content + context) for content-addressed lookup';
COMMENT ON COLUMN ai_cache.operation_type IS 'Type of enhancement: enhance_bullet, enhance_summary, extract_keywords';
COMMENT ON COLUMN ai_cache.input_hash IS 'SHA-256 hash of input content for verification';
COMMENT ON COLUMN ai_cache.response IS 'Cached AI response as JSON';
COMMENT ON COLUMN ai_cache.hit_count IS 'Number of times this cached response has been used';
COMMENT ON COLUMN ai_cache.expires_at IS 'Cache entry expiration time (1 hour TTL)';
