# 🔧 Fix: "Failed to create property" Error

## ✅ What I Fixed

I've improved the error handling to show **detailed error messages** instead of just "Failed to create property". Now you'll see the actual error from the database.

## 🔍 Common Causes & Solutions

### 1. **Missing Location Coordinates** (Most Common)

**Error:** "Please click on the map to set the property location"

**Solution:**
- Make sure you **click on the map** to set the location
- The coordinates should NOT be 0 or empty
- You should see the marker move when you click
- Check the "Selected:" coordinates at the bottom of the map section

**How to fix:**
1. Scroll to "Location on Map" section
2. Click anywhere on the map
3. Verify the latitude/longitude inputs update
4. Verify the "Selected:" text shows valid coordinates

### 2. **Missing Owner Email**

**Error:** "Owner email is missing. Please log out and log back in."

**Solution:**
- Log out and log back in as a landlord
- Make sure you're logged in with a valid owner account
- Check browser console for owner email

### 3. **Database Permissions (RLS Policy)**

**Error:** Code `42501` or "permission denied"

**Solution:**
This means the database Row Level Security (RLS) policy is blocking the insert.

**Check in Supabase:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Find the `properties` table
3. Check if there's a policy allowing owners to INSERT
4. The policy should allow: `owner_email = current_setting('app.current_user_email', true)`

**Quick fix SQL:**
```sql
-- Allow owners to insert their own properties
CREATE POLICY "Owners can insert their own properties" 
ON public.properties
FOR INSERT
WITH CHECK (
  owner_email = current_setting('app.current_user_email', true)
);
```

### 4. **Invalid Price**

**Error:** "Please enter a valid price (must be a positive number)"

**Solution:**
- Make sure the price is a number (e.g., `15000` not `"15000"`)
- Price must be greater than 0
- Don't include currency symbols in the input

### 5. **Database Schema Mismatch**

**Error:** "column X does not exist" or "invalid input syntax"

**Solution:**
Check that your database schema matches what the code expects:

**Required columns:**
- `title` (text, NOT NULL)
- `description` (text, NOT NULL)
- `price` (integer, NOT NULL)
- `location` (text, NOT NULL)
- `lat` (double precision, NOT NULL)
- `lng` (double precision, NOT NULL)
- `images` (text[], default: `{}`)
- `amenities` (text[], default: `{}`)
- `status` (text, default: `'pending'` or `'available'`)
- `owner_email` (text, nullable)

### 6. **Image Upload Issues**

**Error:** "Failed to upload image"

**Solution:**
- Check if `property-images` bucket exists in Supabase Storage
- Check bucket permissions (should allow authenticated users to upload)
- Check file size (should be reasonable, e.g., < 5MB per image)
- Check file type (should be image: jpg, png, etc.)

## 🧪 How to Debug

### Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to add a property
4. Look for error messages starting with "Error creating property:"
5. Copy the full error message

### Step 2: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to add a property
4. Look for the POST request to `/rest/v1/properties`
5. Check the Response tab for error details

### Step 3: Verify Data Before Submit

The console will now log the data being sent:
```
Creating property with data: {
  title: "...",
  description: "...",
  price: 15000,
  location: "...",
  lat: 11.7778,
  lng: 124.8847,
  owner_email: "owner@example.com",
  ...
}
```

**Check:**
- ✅ All fields are filled
- ✅ Coordinates are NOT 0
- ✅ owner_email is present
- ✅ Price is a valid number

## 🔧 Quick Fixes

### Fix 1: Reset Form and Try Again

1. Close the "Add Property" modal
2. Open it again
3. Fill all fields carefully
4. **Make sure to click on the map** to set location
5. Try again

### Fix 2: Check Database Connection

1. Open browser console
2. Type: `localStorage.getItem('supabase.auth.token')`
3. If null, you're not logged in properly
4. Log out and log back in

### Fix 3: Verify Owner Email

1. Open browser console
2. Check the OwnerDashboard component
3. Look for "ownerEmail" in the state
4. Should show your email address

## 📝 What to Check When Reporting the Error

When you see the error, please check:

1. **What is the exact error message?** (It should now show details)
2. **What does the browser console show?** (F12 → Console)
3. **What does the Network tab show?** (F12 → Network → Find the properties POST request)
4. **Are the coordinates set?** (Check the "Selected:" text below the map)
5. **What is your owner email?** (Check if it's logged in console)

## 🎯 Most Likely Issue

Based on the code, the **most common issue** is:

**Missing coordinates** - The map click handler might not be working, or the user didn't click on the map.

**Solution:**
- I've already fixed the map click handler
- Make sure you click on the map before submitting
- The coordinates should update when you click
- If they don't update, there's still an issue with the map

## 💡 Prevention

To avoid this error:

1. ✅ Fill ALL required fields (Title, Description, Price, Location)
2. ✅ **Click on the map** to set coordinates (don't skip this!)
3. ✅ Verify coordinates are set (check "Selected:" text)
4. ✅ Make sure you're logged in as a landlord/owner
5. ✅ Check that images are valid (if uploading)

---

**Still having issues?** Check the browser console for the detailed error message and share it for further debugging!


