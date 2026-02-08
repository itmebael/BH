# 🔐 How to Enter Token and New Password

## Complete Step-by-Step Guide

### 📧 **Step 1: Get the Token from Email**

1. **Send Reset Email:**
   - Go to your app: `http://localhost:3000`
   - Select role (Tenant or Landlord)
   - Click "Forgot Password?"
   - Enter your email address
   - Click "Send Reset Link"

2. **Check Your Email:**
   - Look for email from Supabase
   - Subject: "Reset your password" or similar
   - The email contains a link like:
   ```
   https://jlahqyvpgdntlqfpxvoz.supabase.co/auth/v1/verify?token=YOUR_TOKEN&type=recovery&redirect_to=http://localhost:3000/?type=recovery
   ```

3. **Extract the Token:**
   - Copy the complete URL from the email
   - Open `token_extractor.html` in your browser
   - Paste the URL and click "Extract Tokens"
   - Copy the generated access token

### 🔑 **Step 2: Enter Token in Your App**

**Method 1: Direct URL (Easiest)**
- Use the generated URL from token extractor:
```
http://localhost:3000/?type=recovery&access_token=YOUR_TOKEN
```

**Method 2: Using Test Interface**
- Open `test_password_reset.html` in your browser
- Paste the access token in Step 2
- Click "Set Session with Token"

### 🔒 **Step 3: Enter New Password**

1. **The app will automatically show the "Set New Password" screen**

2. **Enter your new password:**
   - New Password: Enter your desired password
   - Confirm Password: Enter the same password again
   - Use the eye icon (👁️) to show/hide passwords

3. **Password Requirements:**
   - At least 6 characters long
   - Passwords must match
   - Use letters, numbers, and symbols for better security

4. **Click "Update Password"**

### 🎯 **Quick Test Method**

1. **Open** `test_password_reset.html` in your browser
2. **Step 1:** Enter email and send reset
3. **Step 2:** Copy token from email and paste it
4. **Step 3:** Enter new password and confirm
5. **Step 4:** Test complete flow

### 📱 **Using the App Directly**

1. **Go to:** `http://localhost:3000`
2. **Select role:** Tenant or Landlord
3. **Click:** "Forgot Password?"
4. **Enter email** and send reset
5. **Check email** for reset link
6. **Copy the URL** from email
7. **Paste URL** in browser address bar
8. **App will show** password reset form
9. **Enter new password** and confirm
10. **Click "Update Password"**

### 🔧 **Troubleshooting**

**If token doesn't work:**
- Make sure you copied the complete URL from email
- Check that the token is not expired
- Try using the token extractor tool

**If password update fails:**
- Ensure password meets requirements (6+ characters)
- Make sure both password fields match
- Check that you have a valid session

**If app doesn't show reset form:**
- Make sure URL contains `?type=recovery`
- Check browser console for errors
- Try refreshing the page

### 🎉 **Success!**

Once you complete these steps:
- Your password will be updated in Supabase
- You can login with your new password
- The reset flow is working perfectly!

## 📞 **Need Help?**

- Use `test_password_reset.html` for guided testing
- Use `token_extractor.html` to extract tokens from email URLs
- Check browser console for any error messages

