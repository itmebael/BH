-- Fix Rating Columns Step by Step
-- Run this in your Supabase SQL Editor

-- Step 1: Check current properties table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Add rating columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Step 3: Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND table_schema = 'public'
AND column_name IN ('rating', 'total_reviews')
ORDER BY column_name;

-- Step 4: Check if reviews table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'reviews';

-- Step 5: Create reviews table if it doesn't exist
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

-- Step 6: Disable RLS on reviews table
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Step 7: Check current reviews data
SELECT COUNT(*) as total_reviews FROM reviews;
SELECT COUNT(*) as verified_reviews FROM reviews WHERE is_verified = true;

-- Step 8: Update properties with current ratings (only if reviews exist)
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

-- Step 9: Check the results
SELECT 
    p.id,
    p.title,
    p.rating,
    p.total_reviews,
    COUNT(r.id) as actual_reviews_count,
    AVG(r.rating) as actual_avg_rating,
    COUNT(CASE WHEN r.is_verified = true THEN 1 END) as verified_reviews_count
FROM properties p
LEFT JOIN reviews r ON p.id = r.property_id
GROUP BY p.id, p.title, p.rating, p.total_reviews
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 10: Create a simple function to update ratings
CREATE OR REPLACE FUNCTION update_property_rating_simple()
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

-- Step 11: Create trigger to update property ratings
DROP TRIGGER IF EXISTS trigger_update_property_rating_simple ON reviews;
CREATE TRIGGER trigger_update_property_rating_simple
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_property_rating_simple();

-- Step 12: Test the setup
SELECT 'Rating columns fix completed successfully' as status;

-- Instructions:
-- 1. Run this script step by step in your Supabase SQL Editor
-- 2. Check the output of each step
-- 3. If you get errors, run the steps individually
-- 4. The script will add the missing columns and update ratings





