# Setup Storage Buckets for Profile Images

## Option 1: Create via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** button
4. Configure the bucket:
   - **Name**: `profile-images`
   - **Public bucket**: ✅ Yes (check this if you want public access)
   - **File size limit**: 5 MB (or your preferred limit)
   - **Allowed MIME types**: `image/*` (optional)
5. Click **"Create bucket"**

## Option 2: Create via SQL (if you have access)

Storage buckets cannot be created directly via SQL, but you can use the Supabase Management API or create them manually in the dashboard.

## Option 3: Use Existing Bucket

If you already have a `tenant-verification` bucket, the code will automatically fall back to using it.

## Storage Policies

After creating the bucket, run the SQL in `create_profile_images_bucket.sql` to set up access policies.

## Quick Fix: Update Code to Use Existing Bucket

If you want to use the existing `tenant-verification` bucket instead, the code already has fallback logic. Just make sure the bucket exists and has proper policies.


