-- Add is_featured column to properties table
-- This column allows admins to feature/unfeature properties

-- First, check if the properties table exists
-- If you get an error that the table doesn't exist, check your actual table name
-- Common alternatives: boarding_houses, property, Property, etc.

-- Option 1: If your table is named "properties" (lowercase)
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties') THEN
        -- Add the column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'properties' 
            AND column_name = 'is_featured'
        ) THEN
            ALTER TABLE properties ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Column is_featured added to properties table';
        ELSE
            RAISE NOTICE 'Column is_featured already exists in properties table';
        END IF;
    ELSE
        RAISE NOTICE 'Table "properties" does not exist. Please check your table name.';
        RAISE NOTICE 'Common table names: properties, boarding_houses, property';
    END IF;
END $$;

-- Create an index for better query performance when filtering featured properties
-- Only create if table and column exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'properties' 
        AND column_name = 'is_featured'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_properties_is_featured ON properties(is_featured) WHERE is_featured = TRUE;
        RAISE NOTICE 'Index created for is_featured column';
    END IF;
END $$;

-- Add a comment to the column (if it exists)
COMMENT ON COLUMN properties.is_featured IS 'Indicates if the property is featured/promoted by admin';

-- Alternative: If your table is named "boarding_houses" instead, use this:
/*
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'boarding_houses') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'boarding_houses' 
            AND column_name = 'is_featured'
        ) THEN
            ALTER TABLE boarding_houses ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
            CREATE INDEX IF NOT EXISTS idx_boarding_houses_is_featured ON boarding_houses(is_featured) WHERE is_featured = TRUE;
            COMMENT ON COLUMN boarding_houses.is_featured IS 'Indicates if the property is featured/promoted by admin';
            RAISE NOTICE 'Column is_featured added to boarding_houses table';
        END IF;
    END IF;
END $$;
*/
