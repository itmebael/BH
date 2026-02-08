-- Create the validate_role RPC function for Supabase
-- This function checks if the current user has the expected role

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
END;
$$;