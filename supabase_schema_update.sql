-- Add business_permit_url column to properties table
ALTER TABLE properties ADD COLUMN business_permit_url TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' AND column_name = 'business_permit_url';
