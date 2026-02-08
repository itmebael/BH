# 🔧 Configure Supabase Email Template for Token-Only

## The Problem
Supabase is still sending reset links instead of just the token because the email template hasn't been updated.

## The Solution
You need to configure the email template in your Supabase Dashboard.

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `boardinghub`

### 2. Navigate to Email Templates
1. In the left sidebar, click **"Authentication"**
2. Click **"Email Templates"**
3. Find and click **"Reset Password"**

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
2. Wait for the confirmation message

### 5. Test the Configuration
1. Go to your app: `http://localhost:3000`
2. Click "Forgot Password?"
3. Enter your email address
4. Click "Send Token"
5. Check your email - it should now contain ONLY the token (no reset link)

## What This Does

✅ **Removes reset links** - no more clickable URLs
✅ **Shows only the token** - formatted in a copy-friendly box
✅ **Clear instructions** - tells users exactly what to do
✅ **Step-by-step guide** - walks users through the process
✅ **Security note** - mentions token expiration

## Before vs After

### Before (Default Supabase Template):
```
Reset Password
Follow this link to reset the password for your user:
[Click here to reset password]
```

### After (Token-Only Template):
```
Reset Password
Your password reset token:
[TOKEN_HERE_IN_A_BOX]
Copy this token and enter it in your app to reset your password.
Steps:
1. Go to your app
2. Click "Forgot Password?"
3. Enter your email
4. Paste this token when prompted
5. Set your new password
```

## Troubleshooting

**If you still see reset links:**
- Make sure you saved the template
- Wait a few minutes for changes to take effect
- Try sending a new reset email
- Check that you replaced the entire template content

**If the token doesn't work:**
- Make sure you copied the complete token
- Check that there are no extra spaces or characters
- Try refreshing your app

## Test Your Setup

After configuring the template:
1. Send a reset email from your app
2. Check your email - should show only the token
3. Copy the token
4. Go to your app and paste it in the token field
5. Set your new password

Your token-only password reset flow should now work perfectly! 🎉
