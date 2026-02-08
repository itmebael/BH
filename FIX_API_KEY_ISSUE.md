# Fix: Invalid API Key Issue

## 🚨 **Root Cause Found!**

The error "Database connection: FAILED" is caused by an **invalid API key**.

**Error Message**: `Invalid API key - Double check your Supabase anon or service_role API key.`

## ✅ **Solution Steps:**

### **Step 1: Check Supabase Project Status**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Check if your project is still active
   - Look for any warnings or paused status

2. **If Project is Paused**
   - Click "Resume" to reactivate the project
   - Wait for the project to come back online

### **Step 2: Get New API Keys**

1. **Go to Project Settings**
   - In your Supabase dashboard
   - Click on "Settings" → "API"

2. **Copy the New Keys**
   - Copy the `anon` `public` key
   - Copy the `service_role` key (if needed)

3. **Update Your Code**
   - Update `src/lib/supabase.ts` with the new keys
   - Or create a `.env` file with the new keys

### **Step 3: Create Environment File**

Create a `.env` file in your project root:

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-new-anon-key-here
```

### **Step 4: Update Supabase Configuration**

Update `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-new-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```

### **Step 5: Test the Connection**

1. **Restart your development server**
   ```bash
   # Stop the server (Ctrl+C)
   npm start
   ```

2. **Test in browser**
   - Open http://localhost:3001
   - Try to submit a review
   - Check console for success messages

## 🔧 **Alternative Solutions:**

### **Option 1: Create New Supabase Project**

If the current project is completely inaccessible:

1. **Create New Project**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Choose your organization
   - Enter project name: "boardinghub"
   - Choose region closest to you
   - Set a strong database password

2. **Get New Credentials**
   - Copy the new project URL
   - Copy the new anon key

3. **Update Configuration**
   - Update `src/lib/supabase.ts` with new credentials

4. **Run Database Setup**
   - Run `create_reviews_table.sql` in the new project
   - Run `permissive_rls_policies.sql` in the new project

### **Option 2: Check Project Billing**

1. **Go to Billing**
   - In Supabase dashboard
   - Check if you have any billing issues
   - Ensure your project is not suspended

2. **Upgrade Plan if Needed**
   - Free tier has limitations
   - Consider upgrading if you've hit limits

## 🧪 **Testing the Fix:**

### **Method 1: Test API Key Directly**

Run this in your browser console:

```javascript
// Test the API key
fetch('https://your-project-id.supabase.co/rest/v1/', {
  method: 'GET',
  headers: {
    'apikey': 'your-anon-key',
    'Authorization': 'Bearer your-anon-key'
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ API key is valid');
  } else {
    console.log('❌ API key is invalid:', response.status);
  }
})
.catch(error => {
  console.log('❌ Network error:', error);
});
```

### **Method 2: Test with Node.js**

```bash
node test_supabase_connection.js
```

Should show:
```
✅ Test 1 Passed: Basic connection works
✅ Test 2 Passed: Properties table accessible
```

## 🚨 **Common Issues:**

### **Issue 1: Project Paused**
**Solution**: Resume the project in Supabase dashboard

### **Issue 2: API Key Expired**
**Solution**: Generate new API keys in project settings

### **Issue 3: Wrong Project**
**Solution**: Make sure you're using the correct project URL and keys

### **Issue 4: Billing Issues**
**Solution**: Check billing status and upgrade if needed

## 📞 **If Still Having Issues:**

1. **Check Supabase Status**: https://status.supabase.com
2. **Contact Support**: Use Supabase Discord or GitHub
3. **Create New Project**: As a last resort
4. **Check Documentation**: https://supabase.com/docs

## 🎯 **Expected Result:**

After fixing the API key issue, you should see:
- ✅ "Database connection test successful"
- ✅ "Reviews table access successful"
- ✅ Review submission works without errors

---

**Note**: The API key issue is the most common cause of "Database connection failed" errors. Once you get valid API keys, everything should work perfectly!

