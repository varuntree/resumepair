-- Migration: Create Indexes for Performance
-- Purpose: Optimize common query patterns
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- Index on profiles.updated_at for efficient sorting/filtering
CREATE INDEX IF NOT EXISTS profiles_updated_at_idx
ON public.profiles(updated_at DESC);

-- Indexes for billing integration fields
CREATE INDEX IF NOT EXISTS profiles_customer_id_idx
ON public.profiles(customer_id);

CREATE INDEX IF NOT EXISTS profiles_price_id_idx
ON public.profiles(price_id);

-- Index on user_preferences.user_id
-- (Technically redundant with PRIMARY KEY but explicit for documentation)
CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx
ON public.user_preferences(user_id);

-- Add comments
COMMENT ON INDEX profiles_updated_at_idx IS 'Optimize queries sorting by profile update time';
COMMENT ON INDEX profiles_customer_id_idx IS 'Lookup by Stripe customer id';
COMMENT ON INDEX profiles_price_id_idx IS 'Lookup by Stripe price id';
COMMENT ON INDEX user_preferences_user_id_idx IS 'Explicit index on user_id for query documentation';
