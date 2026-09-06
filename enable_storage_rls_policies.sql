-- Enable RLS policies for the "site-images" Storage bucket.
-- Run this in Supabase → SQL Editor.
--
-- Root cause: every image/photo upload in the admin panel (Hero slides,
-- About images, Installation/Timeline/Project/Site-section images, and
-- Team Member avatars) uses the browser's authenticated Supabase client to
-- write directly to the "site-images" bucket. The bucket itself exists and
-- is public-readable, but storage.objects has no INSERT/UPDATE/DELETE
-- policy for the `authenticated` role — every upload fails with
-- "new row violates row-level security policy". This was confirmed live:
-- creating a team_members row with no photo succeeds; attaching a photo
-- fails at the storage.upload() step every time.
--
-- This is almost certainly why the client's 6 team members all still show
-- placeholder icons — the admin UI to upload their photos has never
-- actually been able to write to storage.

-- Drop existing policies if they exist (safe to re-run)
DROP POLICY IF EXISTS "Allow public read access to site-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to site-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update site-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from site-images" ON storage.objects;

-- Public read (bucket is already public, but storage.objects RLS still
-- gates listing/metadata reads through the API)
CREATE POLICY "Allow public read access to site-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-images');

-- Authenticated admin users can upload new files
CREATE POLICY "Allow authenticated users to upload to site-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-images');

-- Authenticated admin users can overwrite/replace files (upsert)
CREATE POLICY "Allow authenticated users to update site-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-images')
WITH CHECK (bucket_id = 'site-images');

-- Authenticated admin users can delete files (image removal in every
-- admin CRUD page relies on this)
CREATE POLICY "Allow authenticated users to delete from site-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-images');
