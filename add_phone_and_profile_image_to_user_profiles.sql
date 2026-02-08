-- Add phone number, profile image URL, and address columns to user_profiles table
-- This script adds columns to store tenant phone number, profile image, and address information

-- Add phone number column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add profile image URL column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add address columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS barangay TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add comments to columns
COMMENT ON COLUMN user_profiles.phone IS 'Phone number of the user/tenant';
COMMENT ON COLUMN user_profiles.profile_image_url IS 'URL to the uploaded profile image for the user/tenant';
COMMENT ON COLUMN user_profiles.address IS 'Street address of the user/tenant';
COMMENT ON COLUMN user_profiles.barangay IS 'Barangay of the user/tenant';
COMMENT ON COLUMN user_profiles.city IS 'City of the user/tenant';

