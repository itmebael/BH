-- FIX FOR PROPERTIES STATUS CONSTRAINT
-- This SQL will allow 'pending' status in the properties table
-- Copy and paste this entire script into your Supabase SQL Editor

-- 1. First, drop the existing constraint
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_status_check;

-- 2. Create a new constraint that allows 'pending', 'available', 'full', and 'rejected' statuses
ALTER TABLE public.properties 
ADD CONSTRAINT properties_status_check CHECK (
  (status = ANY (ARRAY['available'::text, 'full'::text, 'pending'::text, 'rejected'::text]))
);

-- 3. Verify the constraint was updated
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.properties'::regclass
  AND conname = 'properties_status_check';

-- 4. Test: Try to update a property to 'pending' status (replace with actual property ID)
-- UPDATE public.properties 
-- SET status = 'pending' 
-- WHERE id = 'your-property-id-here';

-- 5. Check if any properties need to be updated to 'pending' for testing
SELECT id, title, status 
FROM public.properties 
WHERE status NOT IN ('pending', 'available', 'full');

-- 6. Optional: Update some properties to 'pending' for testing
-- UPDATE public.properties 
-- SET status = 'pending' 
-- WHERE id IN (
--   SELECT id FROM public.properties 
--   WHERE status = 'active' 
--   LIMIT 2
-- );

COMMENT ON COLUMN public.properties.status IS 'Property status: pending (awaiting approval), available (approved and available), full (no vacancies), rejected (admin rejected)';