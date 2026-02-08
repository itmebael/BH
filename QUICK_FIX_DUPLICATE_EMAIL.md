# 🔧 Quick Fix: Duplicate Email Constraint Error

## The Problem
You're getting `duplicate key value violates unique constraint "app_users_email_key"` because the `app_users` table has a unique constraint on the email field.

## Quick Solutions

### Option 1: Remove Duplicate Records (Recommended)
1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this query** to see duplicates:
```sql
SELECT email, COUNT(*) as count
FROM app_users 
GROUP BY email 
HAVING COUNT(*) > 1;
```

3. **If you have duplicates, run this** to remove them:
```sql
DELETE FROM app_users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM app_users 
  GROUP BY email
);
```

### Option 2: Remove the Constraint (Not Recommended)
1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this query**:
```sql
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_email_key;
```

### Option 3: Use Different Emails
- **For testing:** Use different email addresses like `test1@example.com`, `test2@example.com`
- **For production:** Make sure each user has a unique email

## Step-by-Step Fix

### Step 1: Check Your Data
```sql
SELECT email, COUNT(*) as count
FROM app_users 
GROUP BY email 
HAVING COUNT(*) > 1;
```

### Step 2: Clean Up Duplicates
```sql
DELETE FROM app_users 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM app_users 
  GROUP BY email
);
```

### Step 3: Verify the Fix
```sql
SELECT email, COUNT(*) as count
FROM app_users 
GROUP BY email 
HAVING COUNT(*) > 1;
```
*This should return no results*

### Step 4: Test Registration
- Try registering with a new email
- Should work without errors

## Alternative: Use the SQL Script

I've created `fix_duplicate_email_constraint.sql` with all the options. You can:

1. **Open the file** in your editor
2. **Choose the option** you want
3. **Uncomment the relevant lines**
4. **Run it in Supabase SQL Editor**

## Why This Happens

- **Unique constraint:** The `app_users` table has a unique constraint on email
- **Duplicate attempts:** You're trying to register with an email that already exists
- **Database protection:** This prevents duplicate accounts

## Prevention

The updated code now:
- ✅ **Checks for existing emails** before registration
- ✅ **Shows clear error messages** when email exists
- ✅ **Handles database constraints** gracefully

## Quick Test

1. **Go to your app:** `http://localhost:3000`
2. **Try registering** with a new email address
3. **Should work** without the constraint error

The duplicate email error should now be resolved! 🎉





