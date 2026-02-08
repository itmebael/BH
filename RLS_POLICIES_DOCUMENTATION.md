# RLS (Row Level Security) Policies for Reviews Table

## 🔐 **What is RLS?**

Row Level Security (RLS) is a PostgreSQL feature that allows you to control which rows users can access in a table. It's like having a security guard for each row of data.

## 📋 **RLS Policies Explained**

### **1. SELECT Policies (Who can read reviews)**

```sql
-- Anyone can read verified reviews
CREATE POLICY "Anyone can read verified reviews" ON reviews
    FOR SELECT USING (is_verified = true);

-- Property owners can see all reviews for their properties
CREATE POLICY "Property owners can see all their reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = reviews.property_id 
            AND properties.owner_email = auth.jwt() ->> 'email'
        )
    );

-- Users can see their own reviews
CREATE POLICY "Users can see their own reviews" ON reviews
    FOR SELECT USING (client_email = auth.jwt() ->> 'email');
```

### **2. INSERT Policies (Who can create reviews)**

```sql
-- Anyone can insert reviews (they will be unverified by default)
CREATE POLICY "Anyone can insert reviews" ON reviews
    FOR INSERT WITH CHECK (true);
```

### **3. UPDATE Policies (Who can update reviews)**

```sql
-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (client_email = auth.jwt() ->> 'email')
    WITH CHECK (client_email = auth.jwt() ->> 'email');

-- Property owners can update reviews for their properties
CREATE POLICY "Property owners can update their reviews" ON reviews
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = reviews.property_id 
            AND properties.owner_email = auth.jwt() ->> 'email'
        )
    );
```

### **4. DELETE Policies (Who can delete reviews)**

```sql
-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (client_email = auth.jwt() ->> 'email');

-- Property owners can delete reviews for their properties
CREATE POLICY "Property owners can delete their reviews" ON reviews
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = reviews.property_id 
            AND properties.owner_email = auth.jwt() ->> 'email'
        )
    );
```

## 🚀 **Quick Setup Options**

### **Option 1: Disable RLS (Easiest for Testing)**
```sql
-- Disable RLS completely
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
```

### **Option 2: Very Permissive Policies (For Testing)**
```sql
-- Enable RLS with permissive policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow all operations
CREATE POLICY "Allow all operations on reviews" ON reviews
    FOR ALL USING (true) WITH CHECK (true);
```

### **Option 3: Production-Ready Policies (Secure)**
Use the complete `reviews_rls_policies.sql` file for production.

## 🔍 **How to Check RLS Status**

### **Check if RLS is enabled:**
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'reviews';
```

### **Check existing policies:**
```sql
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'reviews'
ORDER BY policyname;
```

## 🧪 **Testing RLS Policies**

### **Test 1: Check Table Access**
```sql
-- This should work if RLS is properly configured
SELECT COUNT(*) FROM reviews;
```

### **Test 2: Test Insert**
```sql
-- This should work if INSERT policy allows it
INSERT INTO reviews (property_id, client_email, client_name, rating, review_text)
VALUES (
    (SELECT id FROM properties LIMIT 1),
    'test@example.com',
    'Test User',
    5,
    'Test review'
);
```

### **Test 3: Test Update**
```sql
-- This should work if UPDATE policy allows it
UPDATE reviews 
SET review_text = 'Updated review' 
WHERE client_email = 'test@example.com';
```

### **Test 4: Test Delete**
```sql
-- This should work if DELETE policy allows it
DELETE FROM reviews 
WHERE client_email = 'test@example.com';
```

## 🚨 **Common RLS Issues**

### **Issue 1: "Permission denied" errors**
**Cause**: RLS policies are too restrictive
**Solution**: Use more permissive policies or disable RLS temporarily

### **Issue 2: "Table not found" errors**
**Cause**: Table doesn't exist
**Solution**: Create the table first

### **Issue 3: "Invalid API key" errors**
**Cause**: API key is invalid or expired
**Solution**: Update API key in Supabase dashboard

### **Issue 4: Policies not working**
**Cause**: RLS is disabled or policies are incorrect
**Solution**: Check RLS status and policy syntax

## 🔧 **Troubleshooting Steps**

### **Step 1: Check RLS Status**
```sql
SELECT rowsecurity FROM pg_tables WHERE tablename = 'reviews';
```

### **Step 2: Check Policies**
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'reviews';
```

### **Step 3: Test Basic Access**
```sql
SELECT COUNT(*) FROM reviews;
```

### **Step 4: Check API Key**
Run the API key test script:
```bash
node test_api_key.js
```

## 📝 **Best Practices**

### **For Development:**
- Use permissive policies or disable RLS
- Focus on getting functionality working first
- Add security later

### **For Production:**
- Use restrictive policies
- Test all user scenarios
- Monitor for security issues
- Regular security audits

## 🎯 **Quick Fix for "Database connection failed"**

1. **Run the simple RLS setup:**
   ```sql
   -- Copy and paste simple_rls_policies.sql in Supabase SQL Editor
   ```

2. **Test the connection:**
   ```bash
   node test_rls_fix.js
   ```

3. **If still failing, check API key:**
   ```bash
   node test_api_key.js
   ```

4. **Update API key if needed:**
   - Go to Supabase Dashboard → Settings → API
   - Copy new anon key
   - Update `src/lib/supabase.ts`

The RLS policies should resolve the "Database connection failed" error by ensuring proper access control to the reviews table!

