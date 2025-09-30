-- Migration: Alter profiles to add billing and access columns + backfill email
-- Purpose: Align schema with application code and Stripe integration
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- Add columns if they don't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS customer_id TEXT,
  ADD COLUMN IF NOT EXISTS price_id TEXT,
  ADD COLUMN IF NOT EXISTS has_access BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill email from auth.users when available
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

-- Ensure indexes exist (safe if already created)
CREATE INDEX IF NOT EXISTS profiles_customer_id_idx ON public.profiles(customer_id);
CREATE INDEX IF NOT EXISTS profiles_price_id_idx ON public.profiles(price_id);

