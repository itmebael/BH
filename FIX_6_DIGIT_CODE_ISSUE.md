# 🔧 Fix: 6-Digit Code Instead of Token

## The Problem
You're receiving a 6-digit number (like `123456`) instead of a proper JWT token. This means your Supabase email template is not configured correctly.

## The Solution
Configure your Supabase email template to send the actual token instead of a 6-digit code.

## Step-by-Step Fix

### 1. Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project

### 2. Navigate to Email Templates
1. In the left sidebar, click **"Authentication"**
2. Click **"Email Templates"**
3. Click **"Reset Password"**

### 3. Replace the Template
**Delete everything** in the template editor and replace it with this:

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

### 4. Save the Template
1. Click **"Save"** button
2. Wait for confirmation

### 5. Test the Fix
1. Go to your app: `http://localhost:3000`
2. Click "Forgot Password?"
3. Enter your email
4. Click "Send Token"
5. Check your email - you should now get a long token instead of a 6-digit code

## What You Should See

### Before (Wrong - 6-digit code):
```
Your verification code is: 123456
```

### After (Correct - JWT token):
```
Your password reset token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Temporary Fix (If You Can't Change Template)

I've updated your app to accept 6-digit codes as well, so it should work now even with the current email template. However, for the best experience, you should still configure the proper token template.

## Test Your Setup

1. **Send a reset email** from your app
2. **Check your email** - should now show the long token
3. **Copy the token** and paste it in your app
4. **Set your new password**

## Troubleshooting

**If you still get 6-digit codes:**
- Make sure you saved the template in Supabase
- Wait a few minutes for changes to take effect
- Try sending a new reset email

**If the token doesn't work:**
- Make sure you copied the complete token
- Check that there are no extra spaces
- Try refreshing your app

Your app should now work with both 6-digit codes and proper JWT tokens! 🎉





