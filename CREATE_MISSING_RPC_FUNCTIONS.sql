-- Create missing RPC functions for Supabase
-- This includes validate_role and other functions that might be missing

-- Function 1: validate_role - Checks if current user has expected role
CREATE OR REPLACE FUNCTION validate_role(expected_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_role TEXT;
BEGIN
    -- Get the current authenticated user ID
    current_user_id := auth.uid();
    
    -- If no user is authenticated, return false
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get the user's role from the app_users table
    SELECT role INTO user_role
    FROM app_users
    WHERE user_id = current_user_id;
    
    -- If user not found in app_users table, return false
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the user's role matches the expected role
    RETURN user_role = expected_role;
EXCEPTION
    WHEN OTHERS THEN
        -- If any error occurs, return false
        RETURN FALSE;
END;
$$;

-- Function 2: log_admin_action - Logs admin actions for auditing
CREATE OR REPLACE FUNCTION log_admin_action(admin_email_param TEXT, action_type_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO admin_actions (admin_email, action_type, action_timestamp)
    VALUES (admin_email_param, action_type_param, NOW());
EXCEPTION
    WHEN OTHERS THEN
        -- Silently fail if logging fails
        NULL;
END;
$$;

-- Function 3: send_notification - Sends notifications to users
CREATE OR REPLACE FUNCTION send_notification(recipient_email_param TEXT, title_param TEXT, message_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO notifications (recipient_email, title, message, created_at, is_read)
    VALUES (recipient_email_param, title_param, message_param, NOW(), FALSE);
EXCEPTION
    WHEN OTHERS THEN
        -- Silently fail if notification sending fails
        NULL;
END;
$$;