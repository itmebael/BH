# Complete Fix Guide: "Failed to submit review: Unknown error"

## 🚨 **Issue Confirmed: Invalid API Key**

The credentials you provided are **invalid**. This is why you're getting "Failed to submit review: Unknown error".

## ✅ **Step-by-Step Fix:**

### **Step 1: Create .env File**

Create a `.env` file in your project root with these contents:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jlahqyvpgdntlqfpxvoz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKIafk9hPg
```

### **Step 2: Get Valid API Keys**

**The current API key is invalid. You need to get new ones:**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account

2. **Check Project Status**
   - Look for your project: `jlahqyvpgdntlqfpxvoz`
   - Check if it's active, paused, or deleted

3. **Get New API Keys**
   - If project exists: Go to Settings → API → Copy new keys
   - If project is paused: Click "Resume" first
   - If project is deleted: Create a new project

### **Step 3: Create New Supabase Project (Recommended)**

Since the current API key is invalid, create a new project:

1. **Go to Supabase Dashboard**
   - Click "New Project"
   - Choose your organization
   - Enter project name: "boardinghub"
   - Choose region closest to you
   - Set a strong database password
   - Click "Create new project"

2. **Wait for Project to be Ready**
   - This takes 2-3 minutes
   - You'll see a success message when ready

3. **Get New Credentials**
   - Go to Settings → API
   - Copy the **Project URL**
   - Copy the **anon** `public` key

4. **Update .env File**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key-here
   ```

### **Step 4: Set Up Database Tables**

1. **Go to SQL Editor**
   - In your new Supabase project
   - Click "SQL Editor" → "New Query"

2. **Run Database Setup Scripts**
   - Copy and paste `create_reviews_table.sql`
   - Click "Run" to execute
   - Copy and paste `simple_rls_policies.sql`
   - Click "Run" to execute

### **Step 5: Test the Fix**

1. **Restart Development Server**
   ```bash
   # Stop the server (Ctrl+C)
   npm start
   ```

2. **Test API Key**
   ```bash
   node test_new_api_key.js
   ```

3. **Run Full Diagnostic**
   ```bash
   node diagnose_review_submission.js
   ```

4. **Test in Browser**
   - Open http://localhost:3001
   - Try to submit a review
   - Check console for success messages

## 🔧 **Alternative: Fix Current Project**

If you want to try fixing the current project:

### **Option 1: Check Project Status**
1. Go to https://supabase.com/dashboard
2. Look for project `jlahqyvpgdntlqfpxvoz`
3. If paused: Click "Resume"
4. If active: Generate new API keys

### **Option 2: Generate New API Keys**
1. In project settings → API
2. Click "Generate new key"
3. Copy the new anon key
4. Update your .env file

## 🧪 **Testing Steps:**

### **Test 1: Environment Variables**
Check if your .env file is being loaded:
```bash
# Look for these in browser console:
# NEXT_PUBLIC_SUPABASE_URL: https://...
# NEXT_PUBLIC_SUPABASE_ANON_KEY: Set
```

### **Test 2: API Key Validity**
```bash
node test_new_api_key.js
```
Should show: `✅ API key is valid!`

### **Test 3: Database Connection**
```bash
node diagnose_review_submission.js
```
Should show: `🎉 All tests passed!`

### **Test 4: Review Submission**
- Open your app
- Try to submit a review
- Should work without errors

## 🚨 **Common Issues:**

### **Issue 1: "Environment variables not loaded"**
**Solution**: Restart development server after creating .env file

### **Issue 2: "API key still invalid"**
**Solution**: Create new Supabase project with fresh credentials

### **Issue 3: "Reviews table not found"**
**Solution**: Run `create_reviews_table.sql` in Supabase SQL Editor

### **Issue 4: "RLS policies blocking access"**
**Solution**: Run `simple_rls_policies.sql` to disable RLS

## 📁 **Files You Need:**

1. **`.env`** - Environment variables (create this)
2. **`create_reviews_table.sql`** - Creates reviews table
3. **`simple_rls_policies.sql`** - Fixes RLS issues
4. **`test_new_api_key.js`** - Tests API key
5. **`diagnose_review_submission.js`** - Full diagnostic

## 🎯 **Expected Result:**

After completing these steps:
- ✅ Environment variables loaded correctly
- ✅ API key is valid and working
- ✅ Reviews table exists and accessible
- ✅ RLS policies allow access
- ✅ Review submission works without errors
- ✅ No more "Unknown error" messages

## 📞 **If Still Having Issues:**

1. **Check Supabase Status**: https://status.supabase.com
2. **Verify Project Access**: Make sure you can access your Supabase dashboard
3. **Check Billing**: Ensure your account has no billing issues
4. **Contact Support**: Use Supabase Discord or GitHub

---

**The root cause is the invalid API key. Once you get valid credentials and set up the database tables, everything will work perfectly!**

