# 🔧 Enable Email Confirmation in Supabase

## Why No Token is Being Sent

If you're not receiving confirmation emails with tokens during signup, it's likely because **email confirmation is disabled** in your Supabase project settings.

## Step-by-Step Fix

### Step 1: Enable Email Confirmation

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign in and select your project

2. **Navigate to Authentication Settings**
   - Click **"Authentication"** in the left sidebar
   - Click **"Settings"** (or go to Authentication → Settings)

3. **Enable Email Confirmation**
   - Scroll down to **"Email Auth"** section
   - Find **"Enable email confirmations"**
   - **✅ Check the box** to enable it
   - Click **"Save"**

### Step 2: Configure Email Template

1. **Go to Email Templates**
   - Still in Authentication section
   - Click **"Email Templates"**
   - Select **"Confirm signup"** template

2. **Update the Template**
   Replace the template with:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>

<p><a href="{{ .Token }}">Confirm your mail</a></p>
```

3. **Save the Template**
   - Click **"Save"** button

### Step 3: Configure Redirect URLs

1. **Go to URL Configuration**
   - In Authentication → Settings
   - Scroll to **"URL Configuration"** section

2. **Set Site URL**
   - **Site URL**: `http://localhost:3000` (for development)
   - Or your production URL: `https://yourdomain.com`

3. **Add Redirect URLs**
   - Click **"Add URL"** or edit the list
   - Add: `http://localhost:3000/*`
   - Add: `https://yourdomain.com/*` (for production)
   - Click **"Save"**

### Step 4: Verify Email Service is Configured

1. **Check Email Settings**
   - Go to **Settings** → **Auth** → **Email**
   - Ensure email service is configured
   - For development, Supabase provides a test email service
   - For production, configure SMTP or use Supabase's email service

2. **Test Email Sending**
   - Try registering a new account
   - Check your email inbox (and spam folder)
   - You should receive the confirmation email

## Verification Checklist

After enabling, verify:

- ✅ **Email confirmation is enabled** in Authentication → Settings
- ✅ **Email template is configured** with `{{ .Token }}`
- ✅ **Redirect URLs are set** correctly
- ✅ **Site URL is configured**
- ✅ **Email service is working** (check Supabase logs)

## Testing

1. **Register a new account** in your app
2. **Check console logs** - you should see:
   ```
   Email confirmation required. Confirmation email should be sent.
   ```
3. **Check your email** - you should receive:
   - Subject: "Confirm your signup"
   - Content: Link with token `{{ .Token }}`
4. **Click the link** or copy the token
5. **Verify your account** in the app

## Troubleshooting

### Still Not Receiving Emails?

1. **Check Spam Folder**
   - Emails might be filtered as spam
   - Add Supabase to your contacts

2. **Check Supabase Logs**
   - Go to **Logs** → **Auth Logs**
   - Look for email sending errors
   - Check if emails are being sent

3. **Verify Email Address**
   - Make sure the email address is valid
   - Try a different email address

4. **Check Rate Limits**
   - Supabase has rate limits on emails
   - Wait a few minutes between attempts

5. **Verify Email Service**
   - Go to **Settings** → **Auth** → **Email**
   - Ensure email provider is configured
   - For development, use Supabase's built-in email

### Email Confirmation Still Disabled?

If you see this message after signup:
```
Registration successful! Note: Email confirmation is currently disabled...
```

This means:
- Email confirmation is **NOT enabled** in Supabase
- Follow **Step 1** above to enable it
- Users will be auto-confirmed without email verification

## Expected Behavior

### When Email Confirmation is ENABLED:
- ✅ User signs up
- ✅ No session is created immediately
- ✅ Confirmation email is sent with token
- ✅ User must verify email before logging in
- ✅ Console shows: "Email confirmation required"

### When Email Confirmation is DISABLED:
- ⚠️ User signs up
- ⚠️ Session is created immediately
- ⚠️ No confirmation email is sent
- ⚠️ User can log in immediately
- ⚠️ Console shows: "Session exists - email confirmation is DISABLED"

## Quick Fix Summary

1. **Supabase Dashboard** → **Authentication** → **Settings**
2. **Enable email confirmations** ✅
3. **Save** settings
4. **Configure email template** with `{{ .Token }}`
5. **Test** by registering a new account

After enabling, you should receive confirmation emails with tokens! 🎉





