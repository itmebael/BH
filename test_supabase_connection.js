// Node.js script to test Supabase connection
// Run with: node test_supabase_connection.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔍 Testing Supabase Connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
    console.log('');

    try {
        // Test 1: Basic connection
        console.log('Test 1: Basic connection test');
        const { data: testData, error: testError } = await supabase
            .from('reviews')
            .select('count')
            .limit(1);
        
        if (testError) {
            console.log('❌ Test 1 Failed:', testError.message);
            console.log('Error details:', JSON.stringify(testError, null, 2));
        } else {
            console.log('✅ Test 1 Passed: Basic connection works');
            console.log('Data:', testData);
        }
        console.log('');

        // Test 2: Properties table
        console.log('Test 2: Properties table test');
        const { data: propData, error: propError } = await supabase
            .from('properties')
            .select('id')
            .limit(1);
        
        if (propError) {
            console.log('❌ Test 2 Failed:', propError.message);
        } else {
            console.log('✅ Test 2 Passed: Properties table accessible');
            console.log('Data:', propData);
        }
        console.log('');

        // Test 3: Check reviews table structure
        console.log('Test 3: Reviews table structure test');
        const { data: tableData, error: tableError } = await supabase
            .from('reviews')
            .select('id, property_id, client_email, client_name, rating, review_text, is_verified, created_at')
            .limit(1);
        
        if (tableError) {
            console.log('❌ Test 3 Failed:', tableError.message);
        } else {
            console.log('✅ Test 3 Passed: Table structure is correct');
            console.log('Data:', tableData);
        }
        console.log('');

        // Test 4: Try to insert a test record
        console.log('Test 4: Insert test record');
        const testReview = {
            property_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            client_email: 'test@example.com',
            client_name: 'Test User',
            rating: 5,
            review_text: 'Test review from connection test',
            is_verified: false
        };

        const { data: insertData, error: insertError } = await supabase
            .from('reviews')
            .insert([testReview])
            .select();
        
        if (insertError) {
            console.log('❌ Test 4 Failed:', insertError.message);
            console.log('This might be expected if property_id doesn\'t exist');
        } else {
            console.log('✅ Test 4 Passed: Insert works');
            console.log('Data:', insertData);
        }

    } catch (error) {
        console.log('❌ General Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Run the test
testConnection().then(() => {
    console.log('\n🏁 Connection test completed');
}).catch(error => {
    console.log('\n💥 Test failed:', error.message);
});

