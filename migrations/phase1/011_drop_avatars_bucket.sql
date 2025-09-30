-- Migration: Drop avatars bucket and related policies
-- Purpose: Remove profile picture storage to reduce scope
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Requires project owner privileges

-- NOTE: Execute as a privileged role / project owner in Supabase SQL editor

-- 1) Remove policies (if any)
DROP POLICY IF EXISTS "avatars_read_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;

-- 2) Delete all objects in the bucket
DELETE FROM storage.objects WHERE bucket_id = 'avatars';

-- 3) Drop the bucket
SELECT storage.delete_bucket('avatars');

