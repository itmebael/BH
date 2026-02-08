# 🔧 Simple Password Reset Solution

## The Problem
The 6-digit verification code approach isn't working properly with Supabase's password reset flow.

## The Best Solution
Configure your Supabase email template to send proper JWT tokens instead of 6-digit codes.

## Step-by-Step Fix

### 1. Configure Supabase Email Template

1. **Go to Supabase Dashboard:**
   - [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Authentication → Email Templates → Reset Password

2. **Replace the template with:**
```html
<h2>Reset Password</h2>
<p>Your password reset token:</p>
<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; border: 1px solid #ddd; margin: 10px 0;">
{{ .Token }}
</div>
<p>Copy this token and enter it in your app to reset your password.</p>
<p><strong>Steps:</strong></p>
<ol>
  <li>Go to your app</li>
  <li>Click "Forgot Password?"</li>
  <li>Enter your email</li>
  <li>Paste this token when prompted</li>
  <li>Set your new password</li>
</ol>
<p style="color: #666; font-size: 12px;">This token will expire in 1 hour for security reasons.</p>
```

3. **Save the template**

### 2. Test the Fix

1. **Send a new reset email** from your app
2. **Check your email** - you should now get a long JWT token instead of a 6-digit code
3. **Copy the token** and paste it in your app
4. **Set your new password**
5. **Try logging in** with the new password

## Alternative: Manual Password Reset

If you need to reset a password immediately without waiting for email configuration:

### Method 1: Use Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user account
3. Click "Reset Password" or edit the user
4. Set a new password directly

### Method 2: Use Supabase SQL Editor
1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with actual email):
```sql
UPDATE auth.users 
SET encrypted_password = crypt('newpassword123', gen_salt('bf'))
WHERE email = 'user@example.com';
```

## Why This Happens

- **6-digit codes** are typically for email verification, not password reset
- **JWT tokens** are the proper format for password reset in Supabase
- **Email templates** need to be configured to send the right format

## Expected Results

### Before (6-digit code):
```
Your verification code is: 123456
```

### After (JWT token):
```
Your password reset token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Troubleshooting

**If you still get 6-digit codes:**
- Make sure you saved the template in Supabase
- Wait a few minutes for changes to take effect
- Try sending a new reset email

**If the JWT token doesn't work:**
- Make sure you copied the complete token
- Check that there are no extra spaces
- Try refreshing your app

The proper JWT token approach should work much better than the 6-digit code method! 🎉





