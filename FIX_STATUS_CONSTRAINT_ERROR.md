# ✅ Fix: "violates check constraint properties_status_check" Error

## 🔍 Problem

The database constraint only allows `'available'` or `'full'` status values, but the code was trying to insert `'pending'`.

## ✅ Solution Applied

I've updated the code to use `'available'` status when creating new properties. This matches the database constraint.

## 🎯 Two Options

### Option 1: Use 'available' Status (Current Fix) ✅

**What I did:**
- Changed new property status from `'pending'` to `'available'`
- Properties are now immediately visible to tenants
- No database changes needed

**Pros:**
- ✅ Works immediately
- ✅ No database changes required
- ✅ Properties are visible right away

**Cons:**
- ❌ No admin approval workflow
- ❌ All properties show immediately

### Option 2: Update Database Constraint (Recommended for Admin Approval)

If you want properties to require admin approval before being visible:

1. **Run this SQL in Supabase SQL Editor:**

```sql
-- Update constraint to allow 'pending' status
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE public.properties 
ADD CONSTRAINT properties_status_check CHECK (
  (status = ANY (ARRAY['available'::text, 'full'::text, 'pending'::text]))
);
```

2. **Then change the code back to use 'pending':**

In `src/components/OwnerDashboard.tsx`, line ~413, change:
```typescript
status: 'available', // Change this back to 'pending'
```

**Pros:**
- ✅ Admin approval workflow
- ✅ Properties hidden until approved
- ✅ Better control over listings

**Cons:**
- ❌ Requires database change
- ❌ Properties need admin approval to show

## 🚀 Current Status

**The code now uses `'available'` status**, so properties will:
- ✅ Be created successfully
- ✅ Be visible to tenants immediately
- ✅ Show as "Active" in the owner dashboard

## 📝 What Changed

1. **Property creation status:** `'pending'` → `'available'`
2. **Success message:** Updated to reflect immediate visibility
3. **Status mapping:** Updated to handle 'available' correctly

## 🧪 Test It

1. Go to Owner Dashboard
2. Click "Add New Property"
3. Fill in all fields
4. **Click on the map** to set location
5. Click "Add Property"
6. Should now work! ✅

## 🔧 If You Want Admin Approval Workflow

1. Run the SQL script: `fix_properties_status_constraint.sql`
2. Change line 413 in `OwnerDashboard.tsx` back to `status: 'pending'`
3. Update Admin Dashboard to approve properties (change status from 'pending' to 'available')

---

**The error should now be fixed!** Try adding a property again. 🎉


