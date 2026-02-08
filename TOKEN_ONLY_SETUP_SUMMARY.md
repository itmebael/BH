# 🔑 Token-Only Password Reset Setup

## Quick Setup Guide

### 1. Configure Supabase Email Template

**Go to:** Supabase Dashboard → Authentication → Email Templates → Reset Password

**Replace with:**
```html
<h2>Reset Password</h2>
<p>Your password reset token:</p>
<div style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">
{{ .Token }}
</div>
<p>Enter this token in your app to reset your password.</p>
```

### 2. Your App Now Supports Both Methods

✅ **Email with Reset Link** (default)
- User gets email with link
- Clicks link → goes to password reset form

✅ **Token-Only Email** (new)
- User gets email with just the token
- Clicks "Have a token? Enter it here" in your app
- Pastes token → goes to password reset form

### 3. How Users Use Token-Only Flow

1. **Click "Forgot Password?"** in your app
2. **Enter email** and send reset
3. **Check email** for token (no link, just the token)
4. **Click "Have a token? Enter it here"** in your app
5. **Paste token** from email
6. **Enter new password** and confirm
7. **Done!** Password updated

### 4. Test the Setup

**Open:** `token_only_test.html` in your browser
- Complete test interface for token-only flow
- Step-by-step guidance
- Real-time testing

### 5. Benefits of Token-Only

- ✅ **Simpler emails** - just the token
- ✅ **Works everywhere** - any email client
- ✅ **More control** - you handle the flow
- ✅ **Better UX** - copy/paste token
- ✅ **Still secure** - Supabase validates tokens

### 6. Files Created

- `token_only_test.html` - Test interface
- `setup_token_only_email.md` - Detailed setup guide
- Updated `ResetPasswordScreen.tsx` - Added token input option

## 🎯 Result

Your app now supports both:
- **Traditional reset links** (for users who prefer clicking)
- **Token-only emails** (for users who prefer copy/paste)

Users can choose whichever method they prefer! 🎉





