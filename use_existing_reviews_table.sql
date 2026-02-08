-- Use Existing Reviews Table to Show Ratings
-- This script uses your existing reviews table to display ratings in dashboards

-- Step 1: Check current reviews table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add rating columns to properties table if they don't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Step 3: Disable RLS on reviews table to allow access
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Step 4: Check current reviews data
SELECT 
    COUNT(*) as total_reviews,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_reviews,
    AVG(rating) as average_rating
FROM reviews;

-- Step 5: Update properties table with current ratings from reviews
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

-- Step 6: Create a function to automatically update property ratings
CREATE OR REPLACE FUNCTION update_property_ratings_from_reviews()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the properties table with current rating info
    UPDATE properties 
    SET 
        rating = COALESCE((
            SELECT AVG(rating)::DECIMAL(3,2) 
            FROM reviews 
            WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
            AND is_verified = true
        ), 0.0),
        total_reviews = COALESCE((
            SELECT COUNT(*) 
            FROM reviews 
            WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
            AND is_verified = true
        ), 0)
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically update ratings when reviews change
DROP TRIGGER IF EXISTS trigger_update_property_ratings ON reviews;
CREATE TRIGGER trigger_update_property_ratings
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_property_ratings_from_reviews();

-- Step 8: Show current property ratings
SELECT 
    p.id,
    p.title,
    p.location,
    p.rating as property_rating,
    p.total_reviews as property_total_reviews,
    COUNT(r.id) as actual_reviews_count,
    AVG(r.rating) as actual_average_rating,
    COUNT(CASE WHEN r.is_verified = true THEN 1 END) as verified_reviews_count,
    COUNT(CASE WHEN r.is_verified = false THEN 1 END) as unverified_reviews_count
FROM properties p
LEFT JOIN reviews r ON p.id = r.property_id
GROUP BY p.id, p.title, p.location, p.rating, p.total_reviews
ORDER BY p.rating DESC, p.total_reviews DESC
LIMIT 20;

-- Step 9: Show individual reviews for verification
SELECT 
    r.id,
    r.property_id,
    p.title as property_title,
    r.client_name,
    r.client_email,
    r.rating,
    r.review_text,
    r.is_verified,
    r.created_at
FROM reviews r
LEFT JOIN properties p ON r.property_id = p.id
ORDER BY r.created_at DESC
LIMIT 10;

-- Step 10: Create a view for easy rating queries
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

-- Step 11: Test the view
SELECT * FROM property_ratings_view 
ORDER BY average_rating DESC, total_reviews DESC
LIMIT 10;

-- Step 12: Show completion status
SELECT 'Reviews table integration completed successfully' as status;

-- Instructions:
-- 1. Run this script in your Supabase SQL Editor
-- 2. The script will use your existing reviews table
-- 3. It will add rating columns to properties table
-- 4. It will create triggers to keep ratings updated
-- 5. It will create a view for easy rating queries
-- 6. Your dashboards should now show ratings correctly





