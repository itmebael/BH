# 🔧 Use Existing Reviews Table to Show Ratings

## The Solution
Your `reviews` table already exists with the correct structure. This script will use it to display ratings in your dashboards.

## Quick Setup

### Step 1: Run the Integration Script
1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy and paste** the contents of `use_existing_reviews_table.sql`
3. **Run the script**

### Step 2: Test the Results
1. **Check the output** - should show "Reviews table integration completed successfully"
2. **View the property ratings** - should show updated ratings
3. **Test your dashboards** - ratings should now be visible

## What the Script Does

### 1. **Uses Your Existing Reviews Table**
```sql
-- Your existing table structure:
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  property_id uuid NULL,
  client_email character varying(255) NOT NULL,
  client_name character varying(255) NOT NULL,
  rating integer NOT NULL,
  review_text text NULL,
  is_verified boolean NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  -- ... constraints
);
```

### 2. **Adds Rating Columns to Properties Table**
```sql
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
```
- Adds `rating` column to store average ratings
- Adds `total_reviews` column to store review counts

### 3. **Updates Properties with Current Ratings**
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
    ), 0);
```
- Calculates average ratings from verified reviews
- Counts total verified reviews per property

### 4. **Creates Auto-Update Triggers**
```sql
CREATE TRIGGER trigger_update_property_ratings
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_property_ratings_from_reviews();
```
- Automatically updates property ratings when reviews change
- Keeps data in sync

### 5. **Creates a Rating View**
```sql
CREATE OR REPLACE VIEW property_ratings_view AS
SELECT 
    p.id as property_id,
    p.title,
    p.location,
    p.price,
    p.rating as average_rating,
    p.total_reviews,
    COUNT(r.id) as total_reviews_count,
    AVG(r.rating) as calculated_average_rating,
    COUNT(CASE WHEN r.is_verified = true THEN 1 END) as verified_reviews_count,
    COUNT(CASE WHEN r.is_verified = false THEN 1 END) as unverified_reviews_count,
    MAX(r.created_at) as last_review_date
FROM properties p
LEFT JOIN reviews r ON p.id = r.property_id
GROUP BY p.id, p.title, p.location, p.price, p.rating, p.total_reviews;
```
- Provides easy access to rating data
- Shows both verified and unverified review counts

## How to Use in Your Dashboards

### For Tenant Dashboard:
```sql
SELECT * FROM property_ratings_view 
WHERE average_rating > 0
ORDER BY average_rating DESC, total_reviews DESC;
```

### For Landlord Dashboard:
```sql
SELECT * FROM property_ratings_view 
WHERE property_id IN (
    SELECT id FROM properties 
    WHERE owner_email = 'your-email@example.com'
)
ORDER BY average_rating DESC, total_reviews DESC;
```

### For Admin Dashboard:
```sql
SELECT * FROM property_ratings_view 
ORDER BY average_rating DESC, total_reviews DESC;
```

## Key Features

### ✅ **Verified Reviews Only**
- Only verified reviews (`is_verified = true`) are counted in averages
- Unverified reviews are tracked separately

### ✅ **Automatic Updates**
- Ratings update automatically when reviews are added/modified
- No manual intervention needed

### ✅ **Comprehensive Data**
- Shows both calculated and stored ratings
- Tracks verified vs unverified review counts
- Includes last review date

### ✅ **Easy Queries**
- Use the `property_ratings_view` for simple queries
- All rating data in one place

## Testing the Setup

1. **Run the script** in Supabase
2. **Check the property ratings view** - should show updated data
3. **Verify triggers work** - add a new review and check if ratings update
4. **Test your dashboards** - ratings should now be visible

## Expected Results

After running the script:
- ✅ **Properties table** has rating columns
- ✅ **Ratings are calculated** from verified reviews
- ✅ **Triggers are active** for auto-updates
- ✅ **View is created** for easy queries
- ✅ **Dashboards show** ratings correctly

## Files Created

- **`use_existing_reviews_table.sql`** - Complete integration script
- **`USE_EXISTING_REVIEWS_TABLE_GUIDE.md`** - This guide

Your existing reviews table will now be used to display ratings in all dashboards! 🎉





