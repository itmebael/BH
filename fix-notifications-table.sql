-- FIX NOTIFICATIONS TABLE SCHEMA
-- This will fix any missing columns in the notifications table

-- First check if notifications table exists and what columns it has
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'notifications'
ORDER BY 
    ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Check if notification_type column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN notification_type TEXT NOT NULL DEFAULT 'general';
        RAISE NOTICE 'Added notification_type column to notifications table';
    END IF;
    
    -- Check if priority column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications ADD COLUMN priority TEXT DEFAULT 'normal';
        RAISE NOTICE 'Added priority column to notifications table';
    END IF;
    
    -- Check if is_read column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_read column to notifications table';
    END IF;
    
    -- Check if read_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added read_at column to notifications table';
    END IF;
    
    -- Check if created_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to notifications table';
    END IF;
END
$$;

-- Verify the fix worked
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'notifications'
ORDER BY 
    ordinal_position;