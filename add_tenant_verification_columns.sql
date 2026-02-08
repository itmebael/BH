-- Add ID document column to user_profiles table
-- This script adds a column to store tenant verification documents

-- Add ID document URL column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Add comment to column
COMMENT ON COLUMN user_profiles.id_document_url IS 'URL to the uploaded ID document image for tenant verification';

-- Create storage bucket for tenant verification documents if it doesn't exist
-- Note: This needs to be run in Supabase Dashboard → Storage → Create Bucket
-- Bucket name: tenant-verification
-- Public: false (private bucket)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/jpg

