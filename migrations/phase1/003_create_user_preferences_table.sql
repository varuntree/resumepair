-- Migration: Create User Preferences Table
-- Purpose: Store application settings and preferences
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- User preferences: Application settings
-- One preferences record per user (1:1 with profiles)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  -- Primary key references profiles (not auth.users directly)
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Preference fields
  theme TEXT NOT NULL DEFAULT 'system',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  auto_save BOOLEAN NOT NULL DEFAULT true,
  default_template TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_theme CHECK (theme IN ('light', 'dark', 'system'))
);

-- Add comments
COMMENT ON TABLE public.user_preferences IS 'User application preferences and settings';
COMMENT ON COLUMN public.user_preferences.user_id IS 'References profiles.id, CASCADE delete';
COMMENT ON COLUMN public.user_preferences.theme IS 'UI theme preference (light, dark, system)';
COMMENT ON COLUMN public.user_preferences.email_notifications IS 'Enable email notifications (Phase 2+)';
COMMENT ON COLUMN public.user_preferences.auto_save IS 'Enable auto-save for documents (Phase 2+)';
COMMENT ON COLUMN public.user_preferences.default_template IS 'Default template slug for new documents (Phase 2+)';