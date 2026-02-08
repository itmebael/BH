// Comprehensive diagnostic script for review submission issues
// Run with: node diagnose_review_submission.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKIafk9hPg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseReviewSubmission() {
    console.log('🔍 Comprehensive Review Submission Diagnosis');
    console.log('==========================================');
    console.log('');

    let allTestsPassed = true;

    try {
        // Test 1: Check Supabase client initialization
        console.log('Test 1: Supabase Client Initialization');
        console.log('URL:', supabaseUrl);
        console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
        console.log('Client created:', !!supabase);
        console.log('✅ Test 1 Passed: Client initialized');
        console.log('');

        // Test 2: Check API key validity
        console.log('Test 2: API Key Validity');
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('id')
                .limit(1);
            
            if (error) {
                console.log('❌ Test 2 Failed: API key is invalid');
                console.log('Error:', error.message);
                console.log('Details:', JSON.stringify(error, null, 2));
                allTestsPassed = false;
                return false;
            } else {
                console.log('✅ Test 2 Passed: API key is valid');
                console.log('Properties found:', data?.length || 0);
            }
        } catch (error) {
            console.log('❌ Test 2 Failed: API key test error');
            console.log('Error:', error.message);
            allTestsPassed = false;
            return false;
        }
        console.log('');

        // Test 3: Check if reviews table exists
        console.log('Test 3: Reviews Table Existence');
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('count')
                .limit(1);
            
            if (error) {
                console.log('❌ Test 3 Failed: Reviews table does not exist');
                console.log('Error:', error.message);
                console.log('Details:', JSON.stringify(error, null, 2));
                allTestsPassed = false;
                return false;
            } else {
                console.log('✅ Test 3 Passed: Reviews table exists');
                console.log('Current review count:', data?.[0]?.count || 0);
            }
        } catch (error) {
            console.log('❌ Test 3 Failed: Reviews table test error');
            console.log('Error:', error.message);
            allTestsPassed = false;
            return false;
        }
        console.log('');

        // Test 4: Check reviews table structure
        console.log('Test 4: Reviews Table Structure');
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('id, property_id, client_email, client_name, rating, review_text, is_verified, created_at, updated_at')
                .limit(1);
            
            if (error) {
                console.log('❌ Test 4 Failed: Cannot access reviews table structure');
                console.log('Error:', error.message);
                allTestsPassed = false;
            } else {
                console.log('✅ Test 4 Passed: Reviews table structure is accessible');
                console.log('Available columns: id, property_id, client_email, client_name, rating, review_text, is_verified, created_at, updated_at');
            }
        } catch (error) {
            console.log('❌ Test 4 Failed: Table structure test error');
            console.log('Error:', error.message);
            allTestsPassed = false;
        }
        console.log('');

        // Test 5: Get a property ID for testing
        console.log('Test 5: Get Property for Testing');
        try {
            const { data: propData, error: propError } = await supabase
                .from('properties')
                .select('id, title, location')
                .limit(1);
            
            if (propError || !propData || propData.length === 0) {
                console.log('❌ Test 5 Failed: No properties found');
                console.log('Error:', propError?.message || 'No properties in database');
                allTestsPassed = false;
                return false;
            } else {
                console.log('✅ Test 5 Passed: Found property for testing');
                console.log('Property:', propData[0]);
            }
        } catch (error) {
            console.log('❌ Test 5 Failed: Property fetch error');
            console.log('Error:', error.message);
            allTestsPassed = false;
            return false;
        }
        console.log('');

        // Test 6: Test review insertion
        console.log('Test 6: Test Review Insertion');
        try {
            const testReview = {
                property_id: propData[0].id,
                client_email: 'diagnostic-test@example.com',
                client_name: 'Diagnostic Test User',
                rating: 5,
                review_text: 'This is a diagnostic test review',
                is_verified: false
            };

            console.log('Attempting to insert review:', testReview);

            const { data: insertData, error: insertError } = await supabase
                .from('reviews')
                .insert([testReview])
                .select();
            
            if (insertError) {
                console.log('❌ Test 6 Failed: Review insertion failed');
                console.log('Error:', insertError.message);
                console.log('Details:', JSON.stringify(insertError, null, 2));
                allTestsPassed = false;
            } else {
                console.log('✅ Test 6 Passed: Review insertion successful');
                console.log('Inserted review:', insertData[0]);
            }
        } catch (error) {
            console.log('❌ Test 6 Failed: Review insertion error');
            console.log('Error:', error.message);
            console.log('Stack:', error.stack);
            allTestsPassed = false;
        }
        console.log('');

        // Test 7: Test review reading
        console.log('Test 7: Test Review Reading');
        try {
            const { data: readData, error: readError } = await supabase
                .from('reviews')
                .select('*')
                .eq('client_email', 'diagnostic-test@example.com');
            
            if (readError) {
                console.log('❌ Test 7 Failed: Review reading failed');
                console.log('Error:', readError.message);
                allTestsPassed = false;
            } else {
                console.log('✅ Test 7 Passed: Review reading successful');
                console.log('Found reviews:', readData?.length || 0);
                if (readData && readData.length > 0) {
                    console.log('Sample review:', readData[0]);
                }
            }
        } catch (error) {
            console.log('❌ Test 7 Failed: Review reading error');
            console.log('Error:', error.message);
            allTestsPassed = false;
        }
        console.log('');

        // Test 8: Clean up test data
        console.log('Test 8: Clean Up Test Data');
        try {
            const { error: deleteError } = await supabase
                .from('reviews')
                .delete()
                .eq('client_email', 'diagnostic-test@example.com');
            
            if (deleteError) {
                console.log('⚠️ Test 8 Warning: Could not clean up test data');
                console.log('Error:', deleteError.message);
            } else {
                console.log('✅ Test 8 Passed: Test data cleaned up');
            }
        } catch (error) {
            console.log('⚠️ Test 8 Warning: Clean up error');
            console.log('Error:', error.message);
        }

    } catch (error) {
        console.log('❌ General Error:', error.message);
        console.log('Stack:', error.stack);
        allTestsPassed = false;
    }

    console.log('');
    console.log('==========================================');
    if (allTestsPassed) {
        console.log('🎉 All tests passed! Review submission should work.');
        console.log('If you\'re still getting "Unknown error", check the browser console for more details.');
    } else {
        console.log('❌ Some tests failed. Review the errors above.');
        console.log('Common fixes:');
        console.log('1. Update API key in Supabase dashboard');
        console.log('2. Create reviews table using create_reviews_table.sql');
        console.log('3. Run simple_rls_policies.sql to fix RLS issues');
    }
    console.log('==========================================');

    return allTestsPassed;
}

// Run the diagnosis
diagnoseReviewSubmission().then((success) => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.log('💥 Diagnosis failed:', error.message);
    process.exit(1);
});

