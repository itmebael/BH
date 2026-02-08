# Fix: Invalid API Key - "Failed to submit review: Unknown error"

## 🚨 **Root Cause Confirmed!**

The diagnostic shows: **"Invalid API key"**

This is why you're getting "Failed to submit review: Unknown error" - the database connection fails due to an invalid API key.

## ✅ **Step-by-Step Fix:**

### **Step 1: Check Supabase Project Status**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in to your account
   - Check if your project is still active

2. **Look for these issues:**
   - Project paused/suspended
   - Billing issues
   - Project deleted
   - API key expired

### **Step 2: Get New API Keys**

1. **In Supabase Dashboard:**
   - Click on your project
   - Go to **Settings** → **API**
   - Copy the **anon** `public` key
   - Copy the **service_role** key (if needed)

2. **If you can't access the project:**
   - The project might be paused or deleted
   - You may need to create a new project

### **Step 3: Update Your Code**

**Option A: Update supabase.ts file**
```typescript
// Update src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-new-project-id.supabase.co';
const supabaseAnonKey = 'your-new-anon-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```

**Option B: Create .env file**
```env
# Create .env file in project root
REACT_APP_SUPABASE_URL=https://your-new-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-new-anon-key-here
```

### **Step 4: Test the Fix**

1. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm start
   ```

2. **Test the connection:**
   ```bash
   node diagnose_review_submission.js
   ```

3. **Expected output:**
   ```
   ✅ Test 1 Passed: Client initialized
   ✅ Test 2 Passed: API key is valid
   ✅ Test 3 Passed: Reviews table exists
   ✅ Test 4 Passed: Reviews table structure is accessible
   ✅ Test 5 Passed: Found property for testing
   ✅ Test 6 Passed: Review insertion successful
   ✅ Test 7 Passed: Review reading successful
   ✅ Test 8 Passed: Test data cleaned up
   🎉 All tests passed! Review submission should work.
   ```

## 🔧 **Alternative: Create New Supabase Project**

If you can't access your current project:

### **Step 1: Create New Project**
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Choose your organization
4. Enter project name: "boardinghub"
5. Choose region closest to you
6. Set a strong database password
7. Click **"Create new project"**

### **Step 2: Get New Credentials**
1. Wait for project to be ready (2-3 minutes)
2. Go to **Settings** → **API**
3. Copy the **Project URL**
4. Copy the **anon** `public` key

### **Step 3: Update Configuration**
1. Update `src/lib/supabase.ts` with new credentials
2. Run database setup scripts:
   - `create_reviews_table.sql`
   - `simple_rls_policies.sql`

### **Step 4: Test Everything**
```bash
node diagnose_review_submission.js
```

## 🧪 **Quick Test Script**

Create a file called `test_new_api_key.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

// Replace with your new credentials
const supabaseUrl = 'https://your-new-project-id.supabase.co';
const supabaseKey = 'your-new-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewKey() {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('id')
            .limit(1);
        
        if (error) {
            console.log('❌ API key still invalid:', error.message);
        } else {
            console.log('✅ API key is valid!');
            console.log('Data:', data);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

testNewKey();
```

Run it:
```bash
node test_new_api_key.js
```

## 🚨 **Common Issues & Solutions:**

### **Issue 1: "Project not found"**
**Solution**: Create a new project

### **Issue 2: "API key expired"**
**Solution**: Generate new API keys

### **Issue 3: "Billing issues"**
**Solution**: Check billing status, upgrade if needed

### **Issue 4: "Wrong project"**
**Solution**: Make sure you're using the correct project URL and keys

## 📞 **If Still Having Issues:**

1. **Check Supabase Status**: https://status.supabase.com
2. **Contact Support**: Use Supabase Discord or GitHub
3. **Check Documentation**: https://supabase.com/docs
4. **Try Different Browser**: Clear cache and cookies

## 🎯 **Expected Result:**

After fixing the API key, you should see:
- ✅ "Database connection test successful"
- ✅ "Reviews table access successful"
- ✅ Review submission works without errors
- ✅ No more "Unknown error" messages

---

**The "Unknown error" is caused by the invalid API key. Once you get valid API keys, everything will work perfectly!**

