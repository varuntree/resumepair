-- Migration: Setup Storage Bucket and Policies for Avatars
-- Purpose: Create private 'avatars' bucket and restrict access to user-owned paths
-- Phase: Phase 1 - Foundation
-- Date: 2025-09-30
-- Status: NOT APPLIED - Awaiting user permission

-- Create bucket if it does not exist (private)
select
  case
    when exists (
      select 1 from storage.buckets where id = 'avatars'
    ) then null
    else storage.create_bucket('avatars', public := false)
  end;

-- Helper: policies ensure users can only access objects under a folder named by their uid
-- Read
create policy if not exists "avatars_read_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'avatars'
  and storage.foldername(name) = auth.uid()::text
);

-- Insert
create policy if not exists "avatars_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and storage.foldername(name) = auth.uid()::text
);

-- Update (allow overwrite metadata/path within own folder if needed)
create policy if not exists "avatars_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and storage.foldername(name) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and storage.foldername(name) = auth.uid()::text
);

-- Delete
create policy if not exists "avatars_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and storage.foldername(name) = auth.uid()::text
);

comment on policy "avatars_read_own" on storage.objects is 'Users can read avatar files under their own uid folder';
comment on policy "avatars_insert_own" on storage.objects is 'Users can upload avatar files under their own uid folder';
comment on policy "avatars_update_own" on storage.objects is 'Users can update avatar files under their own uid folder';
comment on policy "avatars_delete_own" on storage.objects is 'Users can delete avatar files under their own uid folder';

