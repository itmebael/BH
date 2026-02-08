-- Test script to check if properties table exists and has data
-- Run this in your Supabase SQL editor to diagnose the issue

-- 1. Check if the properties table exists
SELECT 
  table_name, 
  table_schema 
FROM information_schema.tables 
WHERE table_name = 'properties';

-- 2. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;

-- 3. Check if there are any properties
SELECT COUNT(*) as total_properties FROM properties;

-- 4. Check properties with their status
SELECT 
  id, 
  title, 
  status, 
  price, 
  location,
  created_at
FROM properties 
ORDER BY created_at DESC;

-- 5. Check only available properties
SELECT 
  id, 
  title, 
  status, 
  price, 
  location
FROM properties 
WHERE status = 'available'
ORDER BY created_at DESC;

-- 6. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'properties';

-- 7. Test basic insert (if you want to add a test property)
-- INSERT INTO properties (
--   title, 
--   description, 
--   price, 
--   location, 
--   amenities, 
--   lat, 
--   lng, 
--   images, 
--   status, 
--   owner_email
-- ) VALUES (
--   'Test Property',
--   'This is a test property to verify the table is working',
--   10000,
--   'Test Location',
--   ARRAY['WiFi', 'Parking'],
--   11.7778,
--   124.8847,
--   ARRAY[]::text[],
--   'available',
--   'test@example.com'
-- );

