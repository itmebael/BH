# 📧 Email Verification Setup Guide

## Overview
This guide explains how to set up email verification for user signup with token-based confirmation.

## Step 1: Configure Supabase Email Template

### Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Select **"Confirm signup"** template

### Email Template Configuration

**Use this template to show the token:**

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

**Important Notes:**
- The link `href` uses `{{ .Token }}` - clicking it will navigate to the token URL
- The token is also displayed in a box below the link for easy copying
- Users can either click the link OR copy the token and paste it manually
- The token is formatted in a monospace font for easy reading

### Alternative: Token Display Template

If you want to show both the link and the token separately:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>

<p><a href="{{ .Token }}">Confirm your mail</a></p>

<p>Or copy this token and enter it in the app:</p>
<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; border: 1px solid #ddd; margin: 10px 0;">
{{ .Token }}
</div>
```

## Step 2: Configure Email Redirect URL

### In Supabase Dashboard
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your app URL (e.g., `http://localhost:3000` or your production URL)
3. Add to **Redirect URLs**: 
   - `http://localhost:3000/*` (for development)
   - `https://yourdomain.com/*` (for production)

## Step 3: Enable Email Confirmation

### In Supabase Dashboard
1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, ensure:
   - ✅ **Enable email confirmations** is checked
   - ✅ **Secure email change** is enabled (optional but recommended)

## How It Works

### Registration Flow
1. User fills out registration form
2. System sends confirmation email with token
3. User receives email with:
   - Clickable confirmation link, OR
   - Verification token to copy/paste
4. User clicks link or enters token
5. Account is verified and user can log in

### Email Content
The email will contain:
- **Confirmation Link**: Direct link to verify account (recommended)
- **Verification Token**: Token that can be manually entered in the app

### Token Format
The token is a JWT (JSON Web Token) that looks like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Features Implemented

✅ **Automatic Token Detection**: App detects verification tokens in URL
✅ **Manual Token Entry**: Users can paste token if link doesn't work
✅ **User-Friendly Messages**: Clear instructions for users
✅ **Error Handling**: Handles expired or invalid tokens gracefully
✅ **Account Creation**: Automatically creates app_users entry after verification

## Testing

1. **Register a new account** with a valid email
2. **Check your email** for the confirmation message
3. **Click the link** or copy the token
4. **Verify your account** in the app
5. **Log in** with your credentials

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email logs in dashboard
- Ensure email service is configured in Supabase

### Token Invalid/Expired
- Tokens expire after 1 hour (default)
- Request a new verification email
- Check if token was copied completely

### Link Doesn't Work
- Use manual token entry instead
- Copy the full token from email
- Paste it in the verification screen

## Security Notes

- Tokens expire after 1 hour for security
- Each token can only be used once
- Tokens are cryptographically signed
- Email verification prevents fake accounts

