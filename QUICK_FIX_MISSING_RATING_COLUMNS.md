# 🔧 Quick Fix: Missing Rating Columns Error

## The Problem
You're getting `ERROR: 42703: column "rating" of relation "properties" does not exist` because the `rating` and `total_reviews` columns don't exist in the `properties` table.

## Quick Solution

### Step 1: Add Missing Columns
1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this simple command**:
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
```

### Step 2: Verify Columns Were Added
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
AND column_name IN ('rating', 'total_reviews')
ORDER BY column_name;
```

### Step 3: Run the Complete Fix
1. **Copy and paste** the contents of `fix_rating_columns_step_by_step.sql`
2. **Run the script**

## What the Fix Does

### 1. **Adds Missing Columns**
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
```
- Adds `rating` column to store average ratings
- Adds `total_reviews` column to store review counts

### 2. **Creates Reviews Table**
```sql
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    client_email VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    review_text TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- Creates the reviews table if it doesn't exist
- Sets up proper structure for ratings

### 3. **Updates Properties with Ratings**
```sql
UPDATE properties 
SET 
    rating = COALESCE((
        SELECT AVG(rating)::DECIMAL(3,2) 
        FROM reviews 
        WHERE property_id = properties.id 
        AND is_verified = true
    ), 0.0),
    total_reviews = COALESCE((
        SELECT COUNT(*) 
        FROM reviews 
        WHERE property_id = properties.id 
        AND is_verified = true
    ), 0)
WHERE EXISTS (
    SELECT 1 FROM reviews 
    WHERE property_id = properties.id 
    AND is_verified = true
);
```
- Updates properties with current verified ratings
- Calculates averages and counts

## Alternative: Manual Column Addition

If you prefer to do it manually:

1. **Go to Supabase Dashboard** → Table Editor
2. **Find the `properties` table**
3. **Add these columns**:
   - `rating` (Decimal, 3,2) - Default: 0.0
   - `total_reviews` (Integer) - Default: 0

## Testing the Fix

1. **Run the column addition commands**
2. **Check the output** - should show the new columns
3. **Run the complete script**
4. **Test your dashboards** - ratings should now be visible

## Expected Results

After running the fix:
- ✅ **Rating columns** added to properties table
- ✅ **Reviews table** created if missing
- ✅ **Properties updated** with current ratings
- ✅ **Dashboards show** ratings correctly

## Files Created

- **`fix_rating_columns_step_by_step.sql`** - Complete step-by-step fix
- **`QUICK_FIX_MISSING_RATING_COLUMNS.md`** - This guide

## Troubleshooting

**If you still get errors:**
1. Run the commands one by one
2. Check if you have permission to alter tables
3. Verify the table name is correct
4. Make sure you're in the right database

**If columns still don't exist:**
1. Check the table structure manually
2. Try adding columns through the Supabase dashboard
3. Verify the column names are correct

The missing columns should be added after running the fix! 🎉





