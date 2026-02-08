-- Add is_verified field to app_users table
-- This script adds the missing is_verified boolean field with default value false

-- First check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'app_users' 
        AND column_name = 'is_verified'
    ) THEN
        -- Add the is_verified column with default value false
        ALTER TABLE app_users 
        ADD COLUMN is_verified BOOLEAN DEFAULT FALSE NOT NULL;
        
        RAISE NOTICE 'Added is_verified column to app_users table';
    ELSE
        RAISE NOTICE 'is_verified column already exists in app_users table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'app_users' 
    AND column_name = 'is_verified';