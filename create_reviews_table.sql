-- Create the missing reviews table
-- Run this in your Supabase SQL Editor

-- First, check if the table already exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'reviews';

-- Create the reviews table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can read verified reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (is_verified = true);

-- Property owners can see all reviews for their properties
CREATE POLICY "Property owners can see all reviews" ON reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = reviews.property_id 
            AND properties.owner_email = auth.jwt() ->> 'email'
        )
    );

-- Anyone can insert reviews (they will be unverified by default)
CREATE POLICY "Anyone can insert reviews" ON reviews
    FOR INSERT WITH CHECK (true);

-- Users can update their own reviews (if they match the email)
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (client_email = auth.jwt() ->> 'email');

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (client_email = auth.jwt() ->> 'email');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Create function to update property rating when reviews change
CREATE OR REPLACE FUNCTION update_property_rating_from_reviews()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the property's rating and total_reviews
    UPDATE properties SET
        rating = (
            SELECT ROUND(AVG(rating::numeric), 2)
            FROM reviews 
            WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
            AND is_verified = true
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
            AND is_verified = true
        )
    WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update property ratings
CREATE TRIGGER trigger_update_property_rating_from_reviews
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_property_rating_from_reviews();

-- Verify the table was created
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert a sample review (optional)
-- INSERT INTO reviews (property_id, client_email, client_name, rating, review_text, is_verified)
-- VALUES (
--     (SELECT id FROM properties LIMIT 1),
--     'test@example.com',
--     'Test User',
--     5,
--     'This is a test review',
--     true
-- );

