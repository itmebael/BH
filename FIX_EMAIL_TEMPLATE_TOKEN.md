# 🔧 Email Template: Token as Link

## Email Template Configuration

### Step 1: Update Email Template in Supabase

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project
   - Click **"Authentication"** → **"Email Templates"**
   - Click **"Confirm signup"** template

2. **Replace the Template**
   Delete everything and paste this:

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

3. **Save the Template**
   - Click **"Save"** button
   - Wait for confirmation

### Step 2: Test

1. Register a new account in your app
2. Check your email
3. You'll see a link "Confirm your mail"
4. Click the link OR copy the link URL and paste the token in the registration form

## How It Works

### Token as Link Href:
```html
<a href="{{ .Token }}">Confirm your mail</a>
```

- The token (`{{ .Token }}`) is used as the link `href`
- When users click the link, they navigate to the token URL
- The app automatically detects the token in the URL
- Users can also right-click → Copy link → Extract token from URL

### User Flow:
1. User receives email with link
2. User clicks link OR copies link URL
3. If clicked: App detects token from URL automatically
4. If copied: User pastes token in registration form
5. Account is verified

## Alternative: Show Both Link and Token

If you want to show both options:

```html
<h2>Confirm your signup</h2>

<p>Click this link to verify:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>

<p>Or copy this token:</p>
<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace; word-break: break-all; border: 1px solid #ddd; margin: 10px 0;">
{{ .Token }}
</div>

<p>Paste the token in the registration form to verify your account.</p>
```

## Token Format

The token will look like this:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

It's a long JWT (JSON Web Token) that users can copy and paste.

## Important Notes

- ✅ Use `{{ .Token }}` to show just the token
- ❌ Don't use `{{ .ConfirmationURL }}` if you want token-only
- ✅ Token is formatted in a box for easy copying
- ✅ Users paste token in the registration form
- ✅ Token expires after 1 hour for security

## After Fixing

1. ✅ Email shows token (not link)
2. ✅ User copies token from email
3. ✅ User pastes token in registration form
4. ✅ Account is verified and created

