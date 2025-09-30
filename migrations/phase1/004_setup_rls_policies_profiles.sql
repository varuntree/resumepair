-- Migration: Setup RLS Policies for Profiles
-- Purpose: Enforce row-level security for user-scoped access
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Policy: Users can insert their own profile (during signup)
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy: Users can delete their own profile
CREATE POLICY "profiles_delete_own"
ON public.profiles
FOR DELETE
USING (id = auth.uid());

COMMENT ON POLICY "profiles_select_own" ON public.profiles IS 'Users can only read their own profile';
COMMENT ON POLICY "profiles_insert_own" ON public.profiles IS 'Users can only create profile for themselves';
COMMENT ON POLICY "profiles_update_own" ON public.profiles IS 'Users can only modify their own profile';
COMMENT ON POLICY "profiles_delete_own" ON public.profiles IS 'Users can delete their own profile';