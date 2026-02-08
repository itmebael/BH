-- =============================================
-- STORAGE POLICIES WITH VERIFICATION ENFORCEMENT
-- =============================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This will enforce that ONLY verified tenants can upload files

-- =============================================
-- TENANT-VERIFICATION BUCKET POLICIES (PRIMARY)
-- =============================================
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload to tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Users can update in tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from tenant-verification" ON storage.objects;
DROP POLICY IF EXISTS "Public can view tenant-verification" ON storage.objects;

-- Allow ONLY VERIFIED users to upload files to tenant-verification bucket
CREATE POLICY "Verified users can upload to tenant-verification"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-verification' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow ONLY VERIFIED users to update files in tenant-verification bucket
CREATE POLICY "Verified users can update in tenant-verification"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-verification')
WITH CHECK (
  bucket_id = 'tenant-verification' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow ONLY VERIFIED users to delete files from tenant-verification bucket
CREATE POLICY "Verified users can delete from tenant-verification"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-verification' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow public read access for tenant-verification bucket
CREATE POLICY "Public can view tenant-verification"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tenant-verification');

-- =============================================
-- PROFILE-IMAGES BUCKET POLICIES (FALLBACK)
-- =============================================
-- Drop existing policies for profile-images bucket
DROP POLICY IF EXISTS "Users can upload to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update in profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view profile-images" ON storage.objects;

-- Allow ONLY VERIFIED users to upload files to profile-images bucket
CREATE POLICY "Verified users can upload to profile-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow ONLY VERIFIED users to update files in profile-images bucket
CREATE POLICY "Verified users can update in profile-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (
  bucket_id = 'profile-images' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow ONLY VERIFIED users to delete files from profile-images bucket
CREATE POLICY "Verified users can delete from profile-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow public read access for profile-images bucket
CREATE POLICY "Public can view profile-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- =============================================
-- ID-DOCUMENTS BUCKET POLICIES (ADDITIONAL)
-- =============================================
-- Drop existing policies for id-documents bucket
DROP POLICY IF EXISTS "Users can upload to id-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update in id-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from id-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view id-documents" ON storage.objects;

-- Allow ONLY VERIFIED users to upload files to id-documents bucket
CREATE POLICY "Verified users can upload to id-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow ONLY VERIFIED users to update files in id-documents bucket
CREATE POLICY "Verified users can update in id-documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'id-documents')
WITH CHECK (
  bucket_id = 'id-documents' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow ONLY VERIFIED users to delete files from id-documents bucket
CREATE POLICY "Verified users can delete from id-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'id-documents' AND
  EXISTS (
    SELECT 1 FROM app_users 
    WHERE app_users.user_id = auth.uid() 
    AND app_users.is_verified = true
  )
);

-- Allow public read access for id-documents bucket
CREATE POLICY "Public can view id-documents"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'id-documents');

-- =============================================
-- VERIFICATION CHECK FUNCTION (OPTIONAL)
-- =============================================
-- This function can be used to check verification status
CREATE OR REPLACE FUNCTION is_user_verified()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE((SELECT is_verified FROM app_users WHERE user_id = auth.uid()), false);
$$;