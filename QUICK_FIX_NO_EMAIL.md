# 🚨 Quick Fix: No Email Being Sent

## The Problem
Emails are not being sent during registration. This is because **email confirmation is disabled** in your Supabase project.

## Quick Fix (2 Minutes)

### Step 1: Enable Email Confirmation
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"Authentication"** in left sidebar
4. Click **"Settings"**
5. Scroll to **"Email Auth"** section
6. **✅ Check "Enable email confirmations"**
7. Click **"Save"**

### Step 2: Configure Email Template (Show Token)
1. Still in Authentication section
2. Click **"Email Templates"**
3. Click **"Confirm signup"**
4. Replace with this template (shows both link AND token):
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>

<p><a href="{{ .Token }}">Confirm your mail</a></p>

<p>Or copy this verification token:</p>
<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; border: 1px solid #ddd; margin: 10px 0;">
{{ .Token }}
</div>

<p>Paste this token in the registration form to verify your account.</p>
```
5. Click **"Save"**

**How it works:**
- Shows both a clickable link AND the token text
- Users can click the link OR copy the token
- Token is displayed in a formatted box for easy copying
- Users paste the token in the registration form

### Step 3: Test
1. Go back to your app
2. Try registering a new account
3. Check your email (including spam folder)
4. You should receive the verification email!

## What Changed in the Code

✅ **Added email confirmation check** - App now detects if email confirmation is disabled
✅ **Better error messages** - Shows clear message if email confirmation is disabled
✅ **Resend email button** - Users can resend email if they didn't receive it
✅ **Improved validation** - Checks if email was actually sent

## If Still Not Working

### Check Supabase Logs
1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for email sending errors
3. Check if emails are being sent

### Check Email Service
1. Go to **Settings** → **Auth** → **Email**
2. Ensure email provider is configured
3. For development, Supabase provides built-in email service

### Common Issues
- **Email in spam folder** - Check spam/junk folder
- **Wrong email address** - Verify email is correct
- **Rate limiting** - Wait a few minutes between attempts
- **Email service not configured** - Configure SMTP in Supabase settings

## Expected Behavior After Fix

1. ✅ User registers → Email is sent automatically
2. ✅ User receives email with token
3. ✅ User enters token → Account is created
4. ✅ User can log in

## Error Messages You'll See

### If Email Confirmation is Disabled:
```
Email confirmation is disabled in your Supabase settings. 
Please enable it: Go to Supabase Dashboard → Authentication → 
Settings → Enable email confirmations. Then try again.
```

### If Email Was Sent:
```
✓ A verification token has been sent to [email]. 
Please check your email (including spam folder) and enter 
the token below to complete registration.
```

## Need Help?

If emails still aren't being sent after enabling email confirmation:
1. Check Supabase Auth Logs for errors
2. Verify email template is saved correctly
3. Try a different email address
4. Check Supabase email service status

