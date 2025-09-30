-- =============================================================================
-- Migration: Create helper functions
-- Description: Utility functions used by Phase 2 tables
-- Author: Phase 2 Implementation
-- Date: 2025-09-30
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.tg_set_updated_at() IS 'Trigger function to automatically set updated_at timestamp';