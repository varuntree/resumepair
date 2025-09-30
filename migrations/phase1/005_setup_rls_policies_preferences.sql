-- Migration: Setup RLS Policies for User Preferences
-- Purpose: Enforce row-level security for preferences
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- Enable Row Level Security on user_preferences table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "prefs_select_own"
ON public.user_preferences
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Users can insert their own preferences
CREATE POLICY "prefs_insert_own"
ON public.user_preferences
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own preferences
CREATE POLICY "prefs_update_own"
ON public.user_preferences
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Comments
COMMENT ON POLICY "prefs_select_own" ON public.user_preferences IS 'Users can only read their own preferences';
COMMENT ON POLICY "prefs_insert_own" ON public.user_preferences IS 'Users can only create preferences for themselves';
COMMENT ON POLICY "prefs_update_own" ON public.user_preferences IS 'Users can only modify their own preferences';