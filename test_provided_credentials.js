// Test the provided credentials
// Run with: node test_provided_credentials.js

const { createClient } = require('@supabase/supabase-js');

// Use the provided credentials
const supabaseUrl = 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKIafk9hPg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProvidedCredentials() {
    console.log('🔍 Testing Provided Credentials...');
    console.log('URL:', supabaseUrl);
    console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
    console.log('');

    try {
        // Test 1: Basic connection
        console.log('Test 1: Basic connection test');
        const { data, error } = await supabase
            .from('properties')
            .select('id')
            .limit(1);
        
        if (error) {
            console.log('❌ Test 1 Failed:', error.message);
            console.log('Details:', JSON.stringify(error, null, 2));
            return false;
        } else {
            console.log('✅ Test 1 Passed: API key is valid');
            console.log('Properties found:', data?.length || 0);
            if (data && data.length > 0) {
                console.log('Sample property:', data[0]);
            }
        }

        // Test 2: Check reviews table
        console.log('\nTest 2: Reviews table test');
        const { data: reviewData, error: reviewError } = await supabase
            .from('reviews')
            .select('count')
            .limit(1);
        
        if (reviewError) {
            console.log('❌ Test 2 Failed:', reviewError.message);
            console.log('The reviews table might not exist yet');
            console.log('We need to create it first');
        } else {
            console.log('✅ Test 2 Passed: Reviews table accessible');
            console.log('Review count:', reviewData?.[0]?.count || 0);
        }

        // Test 3: Try to create reviews table if it doesn't exist
        if (reviewError && reviewError.message.includes('Could not find the table')) {
            console.log('\nTest 3: Reviews table does not exist - this is the issue!');
            console.log('We need to create the reviews table first');
            console.log('Run the create_reviews_table.sql script in Supabase SQL Editor');
        }

        console.log('\n🎉 Credential test completed!');
        return true;

    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('Stack:', error.stack);
        return false;
    }
}

// Run the test
testProvidedCredentials().then((success) => {
    if (success) {
        console.log('\n✅ Your credentials are working!');
        console.log('Next steps:');
        console.log('1. Create .env file with these credentials');
        console.log('2. Create reviews table using create_reviews_table.sql');
        console.log('3. Test review submission');
    } else {
        console.log('\n❌ Credential test failed!');
        console.log('Please check your Supabase project status');
    }
}).catch(error => {
    console.log('\n💥 Test failed:', error.message);
});

