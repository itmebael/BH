-- ============================================================================
-- SQL Alterations for Booking and Review Enhancements
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ENSURE BOOKINGS TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- Add missing columns to bookings table if they don't exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        -- Full Name (required)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'full_name') THEN
            ALTER TABLE bookings ADD COLUMN full_name VARCHAR(255);
            -- Migrate from client_name if it exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_name') THEN
                UPDATE bookings SET full_name = client_name WHERE full_name IS NULL;
            END IF;
        END IF;
        
        -- Address fields (required)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'address') THEN
            ALTER TABLE bookings ADD COLUMN address TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'barangay') THEN
            ALTER TABLE bookings ADD COLUMN barangay VARCHAR(100);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'municipality_city') THEN
            ALTER TABLE bookings ADD COLUMN municipality_city VARCHAR(100);
        END IF;
        
        -- Personal information (required)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'gender') THEN
            ALTER TABLE bookings ADD COLUMN gender VARCHAR(20);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'age') THEN
            ALTER TABLE bookings ADD COLUMN age INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'citizenship') THEN
            ALTER TABLE bookings ADD COLUMN citizenship VARCHAR(20);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'occupation_status') THEN
            ALTER TABLE bookings ADD COLUMN occupation_status VARCHAR(20);
        END IF;
        
        -- Tenant email (for linking to reviews)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'tenant_email') THEN
            ALTER TABLE bookings ADD COLUMN tenant_email VARCHAR(255);
            -- Migrate from client_email if it exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'client_email') THEN
                UPDATE bookings SET tenant_email = client_email WHERE tenant_email IS NULL;
            END IF;
        END IF;
        
        -- Room and Bed selection
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'room_id') THEN
            ALTER TABLE bookings ADD COLUMN room_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'bed_id') THEN
            ALTER TABLE bookings ADD COLUMN bed_id UUID;
        END IF;
        
        -- Status column (ensure it exists and has 'approved' option)
        -- Note: Status constraint with 'approved' option is handled by the CHECK constraint in the main schema
        -- No action needed here as the constraint is managed by the main schema file
    END IF;
END $$;

-- ============================================================================
-- 2. ENSURE REVIEWS TABLE HAS booking_id COLUMN
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
        -- Add booking_id if missing (critical for review eligibility check)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'booking_id') THEN
            ALTER TABLE reviews ADD COLUMN booking_id UUID;
        END IF;
        
        -- Add foreign key constraint if it doesn't exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'booking_id') THEN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'reviews_booking_id_fkey' 
                AND table_name = 'reviews'
            ) THEN
                ALTER TABLE reviews 
                ADD CONSTRAINT reviews_booking_id_fkey 
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
            END IF;
        END IF;
        
        -- Create index for booking_id if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'reviews' 
            AND indexname = 'idx_reviews_booking'
        ) THEN
            CREATE INDEX idx_reviews_booking ON reviews(booking_id);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 3. ENSURE PROPERTIES TABLE HAS total_bookings COLUMN (for Most Booked feature)
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
        -- Add total_bookings column if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'total_bookings') THEN
            ALTER TABLE properties ADD COLUMN total_bookings INTEGER DEFAULT 0;
            
            -- Initialize total_bookings from existing approved bookings
            UPDATE properties 
            SET total_bookings = (
                SELECT COUNT(*) 
                FROM bookings 
                WHERE (bookings.property_id = properties.id OR bookings.boarding_house_id = properties.id)
                AND bookings.status = 'approved'
            );
        END IF;
        
        -- Create index for sorting by total_bookings
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'properties' 
            AND indexname = 'idx_properties_total_bookings'
        ) THEN
            CREATE INDEX idx_properties_total_bookings ON properties(total_bookings DESC);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 4. CREATE/UPDATE TRIGGER TO UPDATE total_bookings WHEN BOOKING IS APPROVED
-- ============================================================================

-- Function to update property total_bookings when booking status changes
CREATE OR REPLACE FUNCTION update_property_total_bookings()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT: When a new booking is created with approved status
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'approved' THEN
            -- Update properties table total_bookings
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
                UPDATE properties 
                SET total_bookings = COALESCE(total_bookings, 0) + 1
                WHERE id = COALESCE(NEW.property_id, NEW.boarding_house_id);
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE: When booking status changes
    IF TG_OP = 'UPDATE' THEN
        -- When booking is approved (wasn't approved before)
        IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
            -- Update properties table total_bookings
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
                UPDATE properties 
                SET total_bookings = COALESCE(total_bookings, 0) + 1
                WHERE id = COALESCE(NEW.property_id, NEW.boarding_house_id);
            END IF;
        END IF;
        
        -- When booking approval is revoked (rejected/cancelled after being approved)
        IF OLD.status = 'approved' AND NEW.status IN ('rejected', 'cancelled') THEN
            -- Decrease total_bookings
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') THEN
                UPDATE properties 
                SET total_bookings = GREATEST(COALESCE(total_bookings, 0) - 1, 0)
                WHERE id = COALESCE(OLD.property_id, OLD.boarding_house_id);
            END IF;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger (no WHEN clause - logic handled inside function)
DROP TRIGGER IF EXISTS update_property_total_bookings_trigger ON bookings;
CREATE TRIGGER update_property_total_bookings_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW 
    EXECUTE FUNCTION update_property_total_bookings();

-- ============================================================================
-- 5. CREATE/UPDATE TRIGGER TO VERIFY REVIEW ELIGIBILITY (Approved Booking Required)
-- ============================================================================

-- Function to verify review can only be submitted for approved bookings
CREATE OR REPLACE FUNCTION verify_review_eligibility()
RETURNS TRIGGER AS $$
BEGIN
    -- If booking_id is provided, verify the booking is approved
    -- This enforces the requirement that reviews can only be written for approved bookings
    IF NEW.booking_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM bookings 
            WHERE id = NEW.booking_id 
            AND status = 'approved'
        ) THEN
            RAISE EXCEPTION 'Review can only be submitted for approved bookings. Your booking must be approved by the landlord before you can write a review.';
        END IF;
        
        -- Mark review as verified since booking is approved
        NEW.is_verified = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS verify_review_eligibility_trigger ON reviews;
CREATE TRIGGER verify_review_eligibility_trigger
    BEFORE INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION verify_review_eligibility();

-- ============================================================================
-- 6. ADD CHECK CONSTRAINTS FOR BOOKING FORM FIELDS
-- ============================================================================

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        -- Add citizenship check constraint if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'citizenship') THEN
            -- Drop existing constraint if it exists
            ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_citizenship_check;
            -- Add new constraint
            ALTER TABLE bookings ADD CONSTRAINT bookings_citizenship_check 
                CHECK (citizenship IN ('Filipino', 'Foreigner') OR citizenship IS NULL);
        END IF;
        
        -- Add occupation_status check constraint if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'occupation_status') THEN
            -- Drop existing constraint if it exists
            ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_occupation_status_check;
            -- Add new constraint
            ALTER TABLE bookings ADD CONSTRAINT bookings_occupation_status_check 
                CHECK (occupation_status IN ('Student', 'Worker') OR occupation_status IS NULL);
        END IF;
        
        -- Ensure status includes 'approved'
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'status') THEN
            -- Drop existing constraint if it exists
            ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
            -- Add new constraint with 'approved' status
            ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
                CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed') OR status IS NULL);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 7. VERIFY ALL CHANGES
-- ============================================================================

-- Check bookings table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN (
    'full_name', 'address', 'barangay', 'municipality_city', 
    'gender', 'age', 'citizenship', 'occupation_status', 
    'tenant_email', 'room_id', 'bed_id', 'status'
)
ORDER BY ordinal_position;

-- Check reviews table has booking_id
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND column_name = 'booking_id';

-- Check properties table has total_bookings
SELECT 
    column_name, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'properties' 
AND column_name = 'total_bookings';

-- Check triggers exist
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN (
    'update_property_total_bookings_trigger',
    'verify_review_eligibility_trigger'
);

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

