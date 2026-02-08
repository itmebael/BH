# 🔑 Setup Token-Only Email (No Reset Link)

## Configure Supabase Email Template

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. Select **"Reset Password"** template

### Step 2: Configure Email Template
Replace the default template with this:

```html
<h2>Reset Password</h2>
<p>Use this token to reset your password:</p>
<p><strong>Token:</strong> {{ .Token }}</p>
<p>Go to: <a href="http://localhost:3000/?type=recovery&access_token={{ .Token }}">Reset Password</a></p>
```

**OR for just the token (no link):**
```html
<h2>Reset Password</h2>
<p>Your password reset token:</p>
<div style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">
{{ .Token }}
</div>
<p>Enter this token in your app to reset your password.</p>
```

### Step 3: Update Your App to Handle Token-Only Flow

## Method 1: Manual Token Entry Interface

Create a simple token entry form in your app:

```typescript
// Add this to your App.tsx or create a new component
const [showTokenEntry, setShowTokenEntry] = useState(false);
const [manualToken, setManualToken] = useState('');

const handleTokenEntry = () => {
  setShowTokenEntry(true);
};

const handleTokenSubmit = async (token: string) => {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });
    
    if (!error) {
      setCurrentScreen('newPassword');
    } else {
      console.error('Error setting session:', error);
    }
  } catch (err) {
    console.error('Error:', err);
  }
};
```

## Method 2: Direct URL with Token

When user receives the email with just the token:
1. User copies the token from email
2. User goes to: `http://localhost:3000/?type=recovery&access_token=TOKEN_FROM_EMAIL`
3. Your app automatically handles the token

## Method 3: Token Input Form

Add a "Enter Token" button to your reset password screen:

```typescript
// In ResetPasswordScreen.tsx
const [showTokenInput, setShowTokenInput] = useState(false);
const [token, setToken] = useState('');

const handleTokenSubmit = async () => {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });
    
    if (!error) {
      onSuccess(); // Go to new password screen
    } else {
      setError('Invalid token. Please try again.');
    }
  } catch (err) {
    setError('Error processing token.');
  }
};

// Add this to your JSX:
{showTokenInput && (
  <div className="mt-4">
    <input
      type="text"
      placeholder="Enter token from email"
      value={token}
      onChange={(e) => setToken(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
    />
    <button
      onClick={handleTokenSubmit}
      className="w-full mt-2 bg-green-600 text-white py-3 rounded-xl"
    >
      Submit Token
    </button>
  </div>
)}
```

## Method 4: Complete Token-Only Setup

Here's a complete implementation:

### 1. Update ResetPasswordScreen.tsx
```typescript
const [showTokenInput, setShowTokenInput] = useState(false);
const [token, setToken] = useState('');

const handleTokenSubmit = async () => {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    });
    
    if (!error) {
      onSuccess();
    } else {
      setError('Invalid token. Please check and try again.');
    }
  } catch (err) {
    setError('Error processing token.');
  }
};

// Add token input form
{showTokenInput && (
  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
    <h3 className="text-lg font-semibold mb-3">Enter Token from Email</h3>
    <input
      type="text"
      placeholder="Paste token from email here"
      value={token}
      onChange={(e) => setToken(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-3"
    />
    <button
      onClick={handleTokenSubmit}
      className="w-full bg-green-600 text-white py-3 rounded-xl"
    >
      Submit Token
    </button>
  </div>
)}

// Add button to show token input
<button
  onClick={() => setShowTokenInput(!showTokenInput)}
  className="text-blue-600 hover:text-blue-700 text-sm"
>
  {showTokenInput ? 'Hide Token Input' : 'Have a token? Enter it here'}
</button>
```

### 2. Update App.tsx to Handle Token-Only URLs
```typescript
useEffect(() => {
  const checkPasswordReset = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const accessToken = urlParams.get('access_token');
    
    if (type === 'recovery' && accessToken) {
      try {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: ''
        });
        
        if (!error) {
          setCurrentScreen('newPassword');
        } else {
          console.error('Error setting session:', error);
          setCurrentScreen('login');
        }
      } catch (err) {
        console.error('Error:', err);
        setCurrentScreen('login');
      }
    }
  };

  checkPasswordReset();
}, []);
```

## Testing the Token-Only Flow

1. **Configure Supabase email template** with token-only format
2. **Send reset email** from your app
3. **Check email** for the token
4. **Copy token** from email
5. **Use one of these methods:**
   - Go to: `http://localhost:3000/?type=recovery&access_token=YOUR_TOKEN`
   - Or use the token input form in your app

## Benefits of Token-Only Approach

- ✅ **Simpler email** - just the token, no complex URLs
- ✅ **More control** - you handle the token processing
- ✅ **Better UX** - users can copy/paste token easily
- ✅ **Flexible** - works with any email client
- ✅ **Secure** - token is still validated by Supabase

This setup gives you complete control over how the token is handled while still using Supabase's secure token generation!





