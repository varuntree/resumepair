-- Migration: Remove avatar_url column from profiles
-- Purpose: Simplify scope by removing profile pictures feature
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS avatar_url;

