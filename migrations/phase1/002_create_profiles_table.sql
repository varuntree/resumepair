-- Migration: Create Profiles Table
-- Purpose: Store user profile information (1:1 with auth.users)
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- Profiles table: User profile information
-- One profile per authenticated user (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Primary key references auth.users (Supabase auth table)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile fields
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  customer_id TEXT,
  price_id TEXT,
  has_access BOOLEAN NOT NULL DEFAULT FALSE,
  locale TEXT NOT NULL DEFAULT 'en-US',
  date_format TEXT NOT NULL DEFAULT 'US',
  page_size TEXT NOT NULL DEFAULT 'Letter',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profile information, one per authenticated user';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id, CASCADE delete';
COMMENT ON COLUMN public.profiles.full_name IS 'User full name (from OAuth or user-edited)';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Storage path to avatar in Supabase Storage';
COMMENT ON COLUMN public.profiles.email IS 'User email (duplicated from auth for convenience)';
COMMENT ON COLUMN public.profiles.customer_id IS 'Stripe customer ID (for billing)';
COMMENT ON COLUMN public.profiles.price_id IS 'Stripe price ID for current plan (if any)';
COMMENT ON COLUMN public.profiles.has_access IS 'Whether the user currently has access to paid features';
COMMENT ON COLUMN public.profiles.locale IS 'User locale (en-US, en-GB, etc.)';
COMMENT ON COLUMN public.profiles.date_format IS 'Date format preference (US, ISO, EU)';
COMMENT ON COLUMN public.profiles.page_size IS 'Page size preference (Letter, A4)';
