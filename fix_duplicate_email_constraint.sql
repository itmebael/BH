-- Fix Duplicate Email Constraint Issue
-- This script provides options to resolve the "app_users_email_key" constraint error

-- Option 1: Remove the unique constraint on email (if you want to allow duplicate emails)
-- WARNING: This will allow multiple accounts with the same email
-- Uncomment the line below if you want to remove the constraint:
-- ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_email_key;

-- Option 2: Check for existing duplicate emails and clean them up
-- This will help you see what duplicates exist
SELECT email, COUNT(*) as count
FROM app_users 
GROUP BY email 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Option 3: Remove duplicate entries (keep only the first one)
-- WARNING: This will delete duplicate records, keeping only the first occurrence
-- Uncomment the lines below if you want to remove duplicates:
-- DELETE FROM app_users 
-- WHERE id NOT IN (
--   SELECT MIN(id) 
--   FROM app_users 
--   GROUP BY email
-- );

-- Option 4: Add a unique constraint with a different name (if it doesn't exist)
-- This ensures email uniqueness going forward
-- Uncomment the line below if you want to add the constraint:
-- ALTER TABLE app_users ADD CONSTRAINT app_users_email_unique UNIQUE (email);

-- Option 5: Check the current table structure
-- This will show you the current constraints on the app_users table
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'app_users'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- Option 6: Create the app_users table if it doesn't exist
-- This creates the table with proper structure
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'owner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Option 7: Update existing records to handle the constraint properly
-- This will help you see what's in the table
SELECT id, user_id, email, full_name, role, created_at
FROM app_users
ORDER BY created_at DESC
LIMIT 10;

-- Option 8: If you want to allow the same email for different user types
-- You could modify the constraint to be unique on (email, role) instead
-- Uncomment the lines below if you want this approach:
-- ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_email_key;
-- ALTER TABLE app_users ADD CONSTRAINT app_users_email_role_unique UNIQUE (email, role);

-- Instructions:
-- 1. Run the SELECT queries first to see what data you have
-- 2. Choose the option that best fits your needs
-- 3. Uncomment the appropriate ALTER TABLE or DELETE statements
-- 4. Run the script in your Supabase SQL Editor

-- Recommended approach:
-- 1. First run Option 2 to see duplicates
-- 2. If you have duplicates, run Option 3 to clean them up
-- 3. Then run Option 4 to ensure the constraint exists
-- 4. Test your registration process
