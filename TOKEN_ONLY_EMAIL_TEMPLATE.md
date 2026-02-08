# 🔑 Token-Only Email Template Configuration

## Supabase Email Template Setup

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Click on **"Reset Password"** template

### Step 2: Replace Email Template
Replace the entire template with this token-only version:

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

### Step 3: Save Template
Click **"Save"** to apply the new template.

## What This Does

✅ **Sends only the token** - no reset links
✅ **Clear instructions** - tells users exactly what to do
✅ **Formatted token** - easy to copy and paste
✅ **Security note** - mentions token expiration
✅ **Step-by-step guide** - walks users through the process

## User Experience

1. **User clicks "Forgot Password?"**
2. **Enters email** → Gets token in email
3. **Clicks "Send Token"** → Goes to token entry step
4. **Pastes token** → Goes to password entry step
5. **Sets new password** → Done!

## Testing

Use `token_only_test.html` to test the complete flow:
- Send reset email
- Get token from email
- Enter token in app
- Set new password

The flow is now completely token-only with no reset links! 🎉





