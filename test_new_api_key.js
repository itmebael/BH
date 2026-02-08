// Test new API key
// Replace the URL and key with your new credentials
// Run with: node test_new_api_key.js

const { createClient } = require('@supabase/supabase-js');

// REPLACE THESE WITH YOUR NEW CREDENTIALS
const supabaseUrl = 'https://your-new-project-id.supabase.co';
const supabaseKey = 'your-new-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewKey() {
    console.log('🔍 Testing New API Key...');
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
        } else {
            console.log('✅ Test 2 Passed: Reviews table accessible');
            console.log('Review count:', reviewData?.[0]?.count || 0);
        }

        console.log('\n🎉 API key test completed successfully!');
        console.log('You can now update your supabase.ts file with these credentials.');
        return true;

    } catch (error) {
        console.log('❌ Error:', error.message);
        console.log('Stack:', error.stack);
        return false;
    }
}

// Run the test
testNewKey().then((success) => {
    if (success) {
        console.log('\n✅ Your new API key is working!');
        console.log('Next steps:');
        console.log('1. Update src/lib/supabase.ts with the new credentials');
        console.log('2. Run: node diagnose_review_submission.js');
        console.log('3. Test review submission in your app');
    } else {
        console.log('\n❌ API key test failed!');
        console.log('Please check your credentials and try again.');
    }
}).catch(error => {
    console.log('\n💥 Test failed:', error.message);
});

