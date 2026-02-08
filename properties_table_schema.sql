-- Properties Table Schema
-- This creates the properties table with the exact structure provided

-- Drop existing properties table if it exists (be careful in production!)
DROP TABLE IF EXISTS public.properties CASCADE;

-- Create the properties table with the exact structure
CREATE TABLE public.properties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NULL,
  title text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL,
  location text NOT NULL,
  amenities text[] NOT NULL DEFAULT '{}'::text[],
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  images text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'available'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  owner_email text NULL,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_status_check CHECK (
    (status = ANY (ARRAY['available'::text, 'full'::text]))
  )
) TABLESPACE pg_default;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_email ON public.properties(owner_email);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read available properties
CREATE POLICY "Properties are viewable by everyone" ON public.properties
  FOR SELECT USING (status = 'available');

-- Policy: Owners can manage their own properties
CREATE POLICY "Owners can manage their own properties" ON public.properties
  FOR ALL USING (owner_email = current_setting('app.current_user_email', true));

-- Policy: Admins can manage all properties
CREATE POLICY "Admins can manage all properties" ON public.properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE app_users.user_id = current_setting('app.current_user_id', true)
      AND app_users.role = 'admin'
    )
  );

-- Insert some sample data for testing
INSERT INTO public.properties (
  title, 
  description, 
  price, 
  location, 
  amenities, 
  lat, 
  lng, 
  images, 
  status, 
  owner_email
) VALUES 
(
  'Cozy Studio Apartment',
  'A beautiful studio apartment in the heart of the city with modern amenities and great location.',
  15000,
  'Catbalogan City, Samar',
  ARRAY['WiFi', 'Air Conditioning', 'Private Kitchen', 'Parking'],
  11.7778,
  124.8847,
  ARRAY['sample-image-1.jpg'],
  'available',
  'owner@example.com'
),
(
  'Modern 2-Bedroom Unit',
  'Spacious 2-bedroom unit perfect for students or young professionals. Near university and shopping centers.',
  25000,
  'Catbalogan City, Samar',
  ARRAY['WiFi', 'Air Conditioning', 'Shared Kitchen', 'Laundry', 'Security'],
  11.7780,
  124.8850,
  ARRAY['sample-image-2.jpg'],
  'available',
  'owner@example.com'
),
(
  'Budget-Friendly Room',
  'Affordable single room with shared facilities. Perfect for budget-conscious tenants.',
  8000,
  'Catbalogan City, Samar',
  ARRAY['WiFi', 'Shared Kitchen', 'Laundry'],
  11.7775,
  124.8845,
  ARRAY['sample-image-3.jpg'],
  'available',
  'owner2@example.com'
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

