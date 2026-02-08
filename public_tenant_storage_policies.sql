-- =============================================
-- PUBLIC TENANT STORAGE POLICIES
-- =============================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This allows public access for tenant operations while maintaining security

-- =============================================
-- TENANT-VERIFICATION BUCKET POLICIES (PUBLIC ACCESS)
-- =============================================
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload to tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Users can update in tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Public can view tenant-verification" ON storage.objects;

-- Allow PUBLIC upload to tenant-verification bucket (no authentication required)
CREATE POLICY "Public can upload to tenant-verification"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'tenant-verification');

-- Allow PUBLIC update in tenant-verification bucket
CREATE POLICY "Public can update in tenant-verification"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'tenant-verification')
WITH CHECK (bucket_id = 'tenant-verification');

-- Allow PUBLIC delete from tenant-verification bucket
CREATE POLICY "Public can delete from tenant-verification"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'tenant-verification');

-- Allow public read access for tenant-verification bucket
CREATE POLICY "Public can view tenant-verification"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tenant-verification');

-- =============================================
-- PROFILE-IMAGES BUCKET POLICIES (PUBLIC ACCESS)
-- =============================================
-- Drop existing policies for profile-images bucket
DROP POLICY IF EXISTS "Users can upload to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update in profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile-images" ON storage.objects;

-- Allow PUBLIC upload to profile-images bucket
CREATE POLICY "Public can upload to profile-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'profile-images');

-- Allow PUBLIC update in profile-images bucket
CREATE POLICY "Public can update in profile-images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- Allow PUBLIC delete from profile-images bucket
CREATE POLICY "Public can delete from profile-images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'profile-images');

-- Allow public read access for profile-images bucket
CREATE POLICY "Public can view profile-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- =============================================
-- ID-DOCUMENTS BUCKET POLICIES (PUBLIC ACCESS)
-- =============================================
-- Drop existing policies for id-documents bucket
DROP POLICY IF EXISTS "Users can upload to id-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update in id-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from id-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view id-documents" ON storage.objects;

-- Allow PUBLIC upload to id-documents bucket
CREATE POLICY "Public can upload to id-documents"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'id-documents');

-- Allow PUBLIC update in id-documents bucket
CREATE POLICY "Public can update in id-documents"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'id-documents')
WITH CHECK (bucket_id = 'id-documents');

-- Allow PUBLIC delete from id-documents bucket
CREATE POLICY "Public can delete from id-documents"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'id-documents');

-- Allow public read access for id-documents bucket
CREATE POLICY "Public can view id-documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'id-documents');

-- =============================================
-- SECURITY NOTE
-- =============================================
-- WARNING: These policies allow COMPLETE public access to the storage buckets.
-- Anyone can upload, update, delete, and view files in these buckets.
-- 
-- If you need some security, consider:
-- 1. Keeping authentication for sensitive operations
-- 2. Adding file validation in your application code
-- 3. Using different buckets for public vs private content
-- 4. Implementing rate limiting in your application
-- 
-- For production use, it's recommended to maintain some level of authentication
-- to prevent abuse and unauthorized access.