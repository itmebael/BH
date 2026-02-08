-- COMPLETE FIX FOR PROPERTIES TABLE CONSTRAINTS
-- This SQL will fix ALL constraint issues with the properties table

-- 1. First, check what constraints currently exist on the properties table
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.properties'::regclass
ORDER BY constraint_name;

-- 2. Drop the status constraint if it exists
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_status_check;

-- 3. Create a new constraint that allows all needed status values
ALTER TABLE public.properties 
ADD CONSTRAINT properties_status_check CHECK (
  (status = ANY (ARRAY['available'::text, 'full'::text, 'pending'::text, 'rejected'::text]))
);

-- 4. Check if is_verified column exists and has proper type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'properties' AND column_name = 'is_verified') THEN
    ALTER TABLE public.properties ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;
END$$;

-- 5. Verify the constraints were updated
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.properties'::regclass
  AND conname = 'properties_status_check';

-- 6. Test: Try to update a property to verify the fix works
-- UPDATE public.properties 
-- SET status = 'pending', is_verified = false
-- WHERE id = 'your-property-id-here';

-- 7. Check the current properties and their statuses
SELECT id, title, status, is_verified 
FROM public.properties 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. Update the comment to reflect all status options
COMMENT ON COLUMN public.properties.status IS 'Property status: pending (awaiting approval), available (approved and available), full (no vacancies), rejected (admin rejected)';

-- 9. Optional: Set some properties to pending for testing
-- UPDATE public.properties 
-- SET status = 'pending', is_verified = false
-- WHERE status = 'active'
-- LIMIT 3;

-- 10. Verify the updates worked
SELECT COUNT(*) as pending_count FROM public.properties WHERE status = 'pending';
SELECT COUNT(*) as rejected_count FROM public.properties WHERE status = 'rejected';