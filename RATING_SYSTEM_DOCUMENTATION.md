# Boarding House Rating System Documentation

## Overview
This rating system provides a comprehensive solution for managing property ratings, user reviews, and rating statistics for boarding houses. It includes detailed category-based ratings, helpfulness voting, and automatic statistics calculation.

## Database Tables

### 1. `property_ratings`
**Purpose**: Stores individual ratings and reviews given by users to properties.

**Columns**:
- `id` (uuid): Primary key
- `property_id` (uuid): Foreign key to properties table
- `user_id` (uuid): Foreign key to auth.users table
- `rating` (integer): Overall rating (1-5 stars)
- `review_text` (text): Written review/comment
- `created_at` (timestamp): When the rating was created
- `updated_at` (timestamp): When the rating was last updated
- `is_verified` (boolean): Whether the review is verified (e.g., from actual guests)

**Constraints**:
- Rating must be between 1 and 5
- One rating per user per property (unique constraint)

### 2. `property_rating_stats`
**Purpose**: Stores aggregated rating statistics for each property.

**Columns**:
- `id` (uuid): Primary key
- `property_id` (uuid): Foreign key to properties table
- `total_ratings` (integer): Total number of ratings
- `average_rating` (numeric): Average rating (rounded to 2 decimal places)
- `rating_1_count` to `rating_5_count` (integer): Count of each star rating
- `last_updated` (timestamp): When statistics were last calculated

### 3. `review_categories`
**Purpose**: Defines different categories for detailed ratings.

**Default Categories**:
- Cleanliness
- Location
- Value for Money
- Amenities
- Safety
- Communication
- Check-in Process
- Overall Experience

### 4. `category_ratings`
**Purpose**: Stores detailed ratings for specific categories within a review.

**Columns**:
- `id` (uuid): Primary key
- `property_rating_id` (uuid): Foreign key to property_ratings
- `category_id` (uuid): Foreign key to review_categories
- `rating` (integer): Category-specific rating (1-5 stars)

### 5. `rating_helpfulness`
**Purpose**: Allows users to vote on the helpfulness of reviews.

**Columns**:
- `id` (uuid): Primary key
- `property_rating_id` (uuid): Foreign key to property_ratings
- `user_id` (uuid): Foreign key to auth.users
- `is_helpful` (boolean): Whether the user found the review helpful

## Key Features

### 1. Automatic Statistics Calculation
- **Trigger**: `update_property_rating_stats()`
- **Purpose**: Automatically updates rating statistics when ratings are added, updated, or deleted
- **Updates**: Total count, average rating, and individual star counts

### 2. Properties Table Integration
- **Trigger**: `update_property_rating_info()`
- **Purpose**: Updates the main properties table with current rating information
- **Updates**: `rating` and `total_reviews` columns in properties table

### 3. Row Level Security (RLS)
- **Read Access**: Anyone can read ratings and statistics
- **Write Access**: Users can only create/update/delete their own ratings
- **Helpfulness**: Users can vote on review helpfulness

## Usage Examples

### Adding a New Rating
```sql
INSERT INTO public.property_ratings (property_id, user_id, rating, review_text, is_verified)
VALUES ('property-uuid', 'user-uuid', 5, 'Great place to stay!', true);
```

### Adding Category Ratings
```sql
-- First, get the category IDs
SELECT id, name FROM public.review_categories;

-- Then add category ratings
INSERT INTO public.category_ratings (property_rating_id, category_id, rating)
VALUES 
  ('rating-uuid', 'cleanliness-category-uuid', 5),
  ('rating-uuid', 'location-category-uuid', 4);
```

### Viewing Property Ratings
```sql
-- Get property with rating statistics
SELECT 
    p.title,
    p.location,
    p.price,
    prs.total_ratings,
    prs.average_rating,
    prs.rating_5_count,
    prs.rating_4_count,
    prs.rating_3_count,
    prs.rating_2_count,
    prs.rating_1_count
FROM public.properties p
LEFT JOIN public.property_rating_stats prs ON p.id = prs.property_id
WHERE p.id = 'property-uuid';
```

### Viewing Individual Reviews
```sql
-- Get reviews with category breakdown
SELECT 
    pr.rating,
    pr.review_text,
    pr.created_at,
    pr.is_verified,
    rc.name as category,
    cr.rating as category_rating
FROM public.property_ratings pr
LEFT JOIN public.category_ratings cr ON pr.id = cr.property_rating_id
LEFT JOIN public.review_categories rc ON cr.category_id = rc.id
WHERE pr.property_id = 'property-uuid'
ORDER BY pr.created_at DESC;
```

## Frontend Integration

### Rating Display
- Show average rating with star display
- Display total review count
- Show rating distribution (5-star breakdown)
- Highlight verified reviews

### Review Submission
- Overall rating (1-5 stars)
- Category-specific ratings
- Written review text
- Verification status (if applicable)

### Review Management
- Allow users to edit their own reviews
- Show helpfulness votes
- Sort by date, rating, helpfulness
- Filter by verified reviews

## Performance Considerations

### Indexes
- `property_ratings(property_id)` - Fast property rating lookups
- `property_ratings(user_id)` - Fast user rating lookups
- `property_ratings(created_at)` - Fast date-based sorting
- `property_rating_stats(property_id)` - Fast statistics lookups

### Caching
- Consider caching rating statistics for frequently viewed properties
- Cache category ratings for better performance
- Use database views for complex queries

## Security Features

### Data Protection
- RLS policies prevent unauthorized access
- Users can only modify their own ratings
- Admin functions for managing categories

### Spam Prevention
- One rating per user per property
- Verification system for authentic reviews
- Helpfulness voting to surface quality reviews

## Maintenance

### Regular Tasks
- Monitor for spam reviews
- Update category descriptions as needed
- Clean up old, unhelpful reviews
- Verify new review submissions

### Analytics
- Track rating trends over time
- Monitor category performance
- Analyze helpfulness patterns
- Generate rating reports for property owners

## Future Enhancements

### Potential Features
- Photo attachments for reviews
- Response system for property owners
- Advanced filtering and search
- Rating analytics dashboard
- Integration with booking system
- Mobile app optimization

