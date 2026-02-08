-- SQL script to set up storage bucket policies for profile images and ID documents
-- IMPORTANT: Storage buckets must be created in Supabase Dashboard → Storage first
-- This script only sets up the access policies
-- 
-- This script includes policies for:
-- 1. Profile images (profile-images folder in tenant-verification bucket)
-- 2. ID documents (id-documents folder in tenant-verification bucket)

-- ============================================================================
-- OPTION 1: Use existing tenant-verification bucket (Recommended)
-- ============================================================================
-- If you already have a 'tenant-verification' bucket, use these policies:

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload profile images to tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile images in tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile images from tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images from tenant-verification" ON storage.objects;

-- Allow authenticated users to upload profile images to tenant-verification bucket
CREATE POLICY "Users can upload profile images to tenant-verification"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-verification' AND
  (storage.foldername(name))[1] = 'profile-images'
);

-- Allow authenticated users to update profile images
CREATE POLICY "Users can update profile images in tenant-verification"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-verification' AND (storage.foldername(name))[1] = 'profile-images')
WITH CHECK (bucket_id = 'tenant-verification' AND (storage.foldername(name))[1] = 'profile-images');

-- Allow authenticated users to delete profile images
CREATE POLICY "Users can delete profile images from tenant-verification"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-verification' AND (storage.foldername(name))[1] = 'profile-images');

-- Allow public read access (if bucket is public)
CREATE POLICY "Public can view profile images from tenant-verification"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tenant-verification' AND (storage.foldername(name))[1] = 'profile-images');

-- ============================================================================
-- ID DOCUMENT POLICIES (for tenant-verification bucket)
-- ============================================================================

-- Drop existing ID document policies if they exist
DROP POLICY IF EXISTS "Users can upload ID documents to tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Users can update ID documents in tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete ID documents from tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Public can view ID documents from tenant-verification" ON storage.objects;

-- Allow authenticated users to upload ID documents to tenant-verification bucket
CREATE POLICY "Users can upload ID documents to tenant-verification"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-verification' AND
  (storage.foldername(name))[1] = 'id-documents'
);

-- Allow authenticated users to update ID documents
CREATE POLICY "Users can update ID documents in tenant-verification"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-verification' AND (storage.foldername(name))[1] = 'id-documents')
WITH CHECK (bucket_id = 'tenant-verification' AND (storage.foldername(name))[1] = 'id-documents');

-- Allow authenticated users to delete ID documents
CREATE POLICY "Users can delete ID documents from tenant-verification"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'tenant-verification' AND (storage.foldername(name))[1] = 'id-documents');

-- Allow public read access to ID documents (if bucket is public)
CREATE POLICY "Public can view ID documents from tenant-verification"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tenant-verification' AND (storage.foldername(name))[1] = 'id-documents');

-- ============================================================================
-- OPTION 2: Create new profile-images bucket (if you prefer separate bucket)
-- ============================================================================
-- Step 1: Create bucket in Supabase Dashboard:
--   1. Go to Storage → New bucket
--   2. Name: "profile-images"
--   3. Public: Yes
--   4. Create bucket

-- Step 2: Run these policies (uncomment if using profile-images bucket):

/*
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;

-- Allow authenticated users to upload profile images
CREATE POLICY "Users can upload profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
);

-- Allow authenticated users to update profile images
CREATE POLICY "Users can update profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to delete profile images
CREATE POLICY "Users can delete profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- Allow public read access
CREATE POLICY "Public can view profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');
*/

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. The DROP POLICY statements at the top will remove existing policies if they exist
-- 2. If you get "policy does not exist" errors on DROP, that's fine - just means they don't exist yet
-- 3. Make sure the 'tenant-verification' bucket exists in your Supabase Storage
-- 4. If the bucket is private, you may need to adjust the SELECT policy or use signed URLs

