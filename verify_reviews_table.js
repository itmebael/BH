// Verify that the reviews table exists and works
// Run with: node verify_reviews_table.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKIafk9hPg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReviewsTable() {
    console.log('🔍 Verifying Reviews Table...');
    console.log('');

    try {
        // Test 1: Check if reviews table exists
        console.log('Test 1: Check if reviews table exists');
        const { data: testData, error: testError } = await supabase
            .from('reviews')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.log('❌ Test 1 Failed:', testError.message);
            console.log('Error details:', JSON.stringify(testError, null, 2));
            return false;
        } else {
            console.log('✅ Test 1 Passed: Reviews table exists');
            console.log('Data:', testData);
        }
        console.log('');

        // Test 2: Check table structure
        console.log('Test 2: Check table structure');
        const { data: structureData, error: structureError } = await supabase
            .from('reviews')
            .select('id, property_id, client_email, client_name, rating, review_text, is_verified, created_at, updated_at')
            .limit(1);
        
        if (structureError) {
            console.log('❌ Test 2 Failed:', structureError.message);
            return false;
        } else {
            console.log('✅ Test 2 Passed: Table structure is correct');
            console.log('Available columns: id, property_id, client_email, client_name, rating, review_text, is_verified, created_at, updated_at');
        }
        console.log('');

        // Test 3: Get a property ID for testing
        console.log('Test 3: Get a property ID for testing');
        const { data: propData, error: propError } = await supabase
            .from('properties')
            .select('id, title')
            .limit(1);
        
        if (propError || !propData || propData.length === 0) {
            console.log('❌ Test 3 Failed: No properties found');
            console.log('You need to add some properties first');
            return false;
        } else {
            console.log('✅ Test 3 Passed: Found property for testing');
            console.log('Property:', propData[0]);
        }
        console.log('');

        // Test 4: Try to insert a test review
        console.log('Test 4: Try to insert a test review');
        const testReview = {
            property_id: propData[0].id,
            client_email: 'test@example.com',
            client_name: 'Test User',
            rating: 5,
            review_text: 'This is a test review from verification script',
            is_verified: false
        };

        const { data: insertData, error: insertError } = await supabase
            .from('reviews')
            .insert([testReview])
            .select();
        
        if (insertError) {
            console.log('❌ Test 4 Failed:', insertError.message);
            console.log('Error details:', JSON.stringify(insertError, null, 2));
            return false;
        } else {
            console.log('✅ Test 4 Passed: Insert works');
            console.log('Inserted review:', insertData[0]);
        }
        console.log('');

        // Test 5: Try to read the inserted review
        console.log('Test 5: Try to read the inserted review');
        const { data: readData, error: readError } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', insertData[0].id);
        
        if (readError) {
            console.log('❌ Test 5 Failed:', readError.message);
            return false;
        } else {
            console.log('✅ Test 5 Passed: Read works');
            console.log('Read review:', readData[0]);
        }
        console.log('');

        // Test 6: Clean up test data
        console.log('Test 6: Clean up test data');
        const { error: deleteError } = await supabase
            .from('reviews')
            .delete()
            .eq('id', insertData[0].id);
        
        if (deleteError) {
            console.log('⚠️ Test 6 Warning: Could not clean up test data');
            console.log('Error:', deleteError.message);
        } else {
            console.log('✅ Test 6 Passed: Clean up successful');
        }

        console.log('');
        console.log('🎉 All tests passed! The reviews table is working correctly.');
        return true;

    } catch (error) {
        console.log('❌ General Error:', error.message);
        console.log('Stack:', error.stack);
        return false;
    }
}

// Run the verification
verifyReviewsTable().then((success) => {
    if (success) {
        console.log('\n✅ Reviews table verification completed successfully!');
        console.log('You can now submit reviews in your application.');
    } else {
        console.log('\n❌ Reviews table verification failed!');
        console.log('Please run the create_reviews_table.sql script in your Supabase SQL Editor first.');
    }
}).catch(error => {
    console.log('\n💥 Verification failed:', error.message);
});

