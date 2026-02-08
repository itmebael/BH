-- Alter app_users table to add ID document, address, phone, and profile image columns
-- This script adds columns to store tenant verification and profile information directly in app_users

-- Add phone number column
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add address column
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add barangay column
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS barangay TEXT;

-- Add city column
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add ID document URL column
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Add profile image URL column
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add comments to columns
COMMENT ON COLUMN public.app_users.phone IS 'Phone number of the user';
COMMENT ON COLUMN public.app_users.address IS 'Street address of the user';
COMMENT ON COLUMN public.app_users.barangay IS 'Barangay of the user';
COMMENT ON COLUMN public.app_users.city IS 'City of the user';
COMMENT ON COLUMN public.app_users.id_document_url IS 'URL to the uploaded ID document image for verification';
COMMENT ON COLUMN public.app_users.profile_image_url IS 'URL to the uploaded profile image for the user';


