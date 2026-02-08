// Database Connection Troubleshooting Script
// Run this in your browser console to test the connection

// Test 1: Check if Supabase client is properly initialized
console.log('=== SUPABASE CONNECTION TEST ===');

// Check if supabase is available
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client found');
  console.log('URL:', window.supabase.supabaseUrl);
  console.log('Key (first 20 chars):', window.supabase.supabaseKey?.substring(0, 20) + '...');
} else {
  console.log('❌ Supabase client not found');
}

// Test 2: Try to import and test Supabase
async function testSupabaseConnection() {
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    // Create client with hardcoded values (from your supabase.ts)
    const supabaseUrl = 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client created successfully');
    
    // Test connection
    const { data, error } = await supabase
      .from('reviews')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection test failed:', error);
      console.log('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Connection test successful');
      console.log('Data:', data);
    }
    
    // Test properties table
    const { data: propData, error: propError } = await supabase
      .from('properties')
      .select('id')
      .limit(1);
    
    if (propError) {
      console.log('❌ Properties table test failed:', propError);
    } else {
      console.log('✅ Properties table accessible');
    }
    
  } catch (error) {
    console.log('❌ Script error:', error);
  }
}

// Run the test
testSupabaseConnection();

// Test 3: Check network connectivity
fetch('https://jlahqyvpgdntlqfpxvoz.supabase.co/rest/v1/', {
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg'
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ Direct API call successful');
  } else {
    console.log('❌ Direct API call failed:', response.status, response.statusText);
  }
})
.catch(error => {
  console.log('❌ Network error:', error);
});

