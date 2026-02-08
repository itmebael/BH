-- FIX NOTIFICATION COLUMN NAME MISMATCH
-- The notifications table has a 'type' column but the function expects 'notification_type'

-- Option 1: Rename the column to match the function
ALTER TABLE notifications RENAME COLUMN type TO notification_type;

-- Option 2: Alternatively, update the function to use 'type' instead (uncomment below)
/*
CREATE OR REPLACE FUNCTION public.send_notification(
  recipient_email_param TEXT,
  title_param TEXT,
  body_param TEXT,
  type_param TEXT,  -- Changed from notification_type_param
  priority_param TEXT DEFAULT 'normal'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (
    recipient_email,
    title,
    body,
    type,  -- Changed from notification_type
    priority,
    is_read
  ) VALUES (
    recipient_email_param,
    title_param,
    body_param,
    type_param,  -- Changed from notification_type_param
    priority_param,
    false
  );
END;
$$;
*/

-- Verify the fix
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;