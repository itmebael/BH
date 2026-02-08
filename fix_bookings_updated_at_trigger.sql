-- Fix bookings table updated_at trigger issue
-- This script addresses the error: "record 'new' has no field 'updated_at'"

-- Step 1: Add updated_at column to bookings table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'bookings' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    CREATE INDEX IF NOT EXISTS idx_bookings_updated_at ON bookings(updated_at);
    RAISE NOTICE 'Added updated_at column to bookings table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in bookings table';
  END IF;
END $$;

-- Step 2: Drop any existing problematic triggers
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
DROP TRIGGER IF EXISTS set_updated_at ON bookings;
DROP TRIGGER IF EXISTS update_updated_at ON bookings;

-- Step 3: Drop old trigger functions if they exist
DROP FUNCTION IF EXISTS update_bookings_updated_at();
DROP FUNCTION IF EXISTS set_bookings_updated_at();

-- Step 4: Create a new safe trigger function
CREATE OR REPLACE FUNCTION set_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_bookings_updated_at();

-- Done! The trigger will now automatically update the updated_at column when bookings are modified.
