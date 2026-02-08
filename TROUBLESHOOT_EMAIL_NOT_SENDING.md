# 🔧 Troubleshoot: Email Not Sending

## Quick Diagnosis

### Step 1: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Try registering a new account
4. Look for these messages:

**If you see:**
```
❌ EMAIL CONFIRMATION IS DISABLED!
Session exists = emails are NOT being sent
```
→ **Email confirmation is DISABLED** - Go to Step 2

**If you see:**
```
✅ Email confirmation is ENABLED
✅ Confirmation email should be sent to: [email]
```
→ Email confirmation is enabled, but email still not received - Go to Step 3

## Step 2: Enable Email Confirmation

### In Supabase Dashboard:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"Authentication"** → **"Settings"**
4. Scroll to **"Email Auth"** section
5. **✅ Check "Enable email confirmations"**
6. Click **"Save"**
7. Wait 10 seconds for settings to apply
8. Try registering again

## Step 3: Check Email Service

### Verify Email Service is Configured:
1. Go to Supabase Dashboard → **Settings** → **Auth** → **Email**
2. Check if email provider is configured:
   - For **development**: Supabase provides built-in email (should work automatically)
   - For **production**: You may need to configure SMTP

### Check Supabase Logs:
1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for entries when you register
3. Check for email sending errors
4. Look for rate limiting messages

## Step 4: Check Email Template

### Verify Email Template:
1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Click **"Confirm signup"**
3. Make sure template contains `{{ .Token }}` or `{{ .ConfirmationURL }}`
4. Click **"Save"** if you made changes

## Step 5: Common Issues

### Issue 1: Email in Spam Folder
- ✅ Check spam/junk folder
- ✅ Add Supabase to email contacts
- ✅ Check email filters

### Issue 2: Wrong Email Address
- ✅ Verify email address is correct
- ✅ Try a different email address
- ✅ Check for typos

### Issue 3: Rate Limiting
- ⏳ Wait 5-10 minutes between registration attempts
- ⏳ Supabase limits emails to prevent spam
- ⏳ Try again after waiting

### Issue 4: Email Service Not Working
- 🔧 Check Supabase status page
- 🔧 Verify SMTP settings (if using custom SMTP)
- 🔧 Contact Supabase support if issue persists

## Step 6: Test Email Sending

### Manual Test:
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find a test user
3. Click **"Send magic link"** or **"Resend confirmation"**
4. Check if email is received

### Check Email Logs:
1. Go to Supabase Dashboard → **Logs** → **Auth Logs**
2. Filter by your email address
3. Look for "email sent" or error messages
4. Check timestamps to see if emails are being sent

## Step 7: Verify Configuration

### Checklist:
- [ ] Email confirmation is **ENABLED** in Supabase settings
- [ ] Email template is configured correctly
- [ ] Email service is working (check logs)
- [ ] No rate limiting errors
- [ ] Email address is correct
- [ ] Checked spam folder
- [ ] Redirect URLs are configured

## Still Not Working?

### Debug Steps:
1. **Check console logs** - Look for error messages
2. **Check Supabase Auth Logs** - See if emails are being sent
3. **Try different email** - Test with Gmail, Outlook, etc.
4. **Check Supabase status** - Visit status.supabase.com
5. **Contact support** - If all else fails

### Error Messages to Look For:

**"Email confirmation is disabled"**
→ Enable it in Supabase Dashboard

**"Rate limit exceeded"**
→ Wait a few minutes and try again

**"Email service not configured"**
→ Configure SMTP in Supabase settings

**"Invalid email address"**
→ Check email format

## Expected Behavior

### When Working Correctly:
1. ✅ User registers
2. ✅ Console shows: "Email confirmation is ENABLED"
3. ✅ Console shows: "Confirmation email should be sent"
4. ✅ Email arrives within 1-2 minutes
5. ✅ Email contains token or link
6. ✅ User can verify account

### When NOT Working:
1. ❌ Console shows: "Email confirmation is DISABLED"
2. ❌ No email received
3. ❌ Error messages in console
4. ❌ Auth logs show errors

## Quick Fix Summary

1. **Enable email confirmation** in Supabase
2. **Check email template** is configured
3. **Verify email service** is working
4. **Check spam folder**
5. **Review console logs** for errors
6. **Check Supabase Auth Logs** for email status





