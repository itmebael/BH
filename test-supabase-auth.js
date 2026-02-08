const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('Testing Supabase Authentication...\n');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg';

console.log('Supabase URL:', supabaseUrl);
console.log('API Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('\n1. Testing basic authentication...');
  
  try {
    // Test a simple query to verify authentication
    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Authentication failed:', error.message);
      console.log('Error details:', error);
      return false;
    } else {
      console.log('✅ Authentication successful');
      return true;
    }
  } catch (err) {
    console.log('❌ Authentication exception:', err.message);
    return false;
  }
}

async function testRpc() {
  console.log('\n2. Testing RPC calls...');
  
  try {
    // Test a simple RPC call
    const { data, error } = await supabase.rpc('get_property_count');
    
    if (error) {
      console.log('❌ RPC call failed:', error.message);
      console.log('This might be expected if the function doesn\'t exist');
      return false;
    } else {
      console.log('✅ RPC call successful:', data);
      return true;
    }
  } catch (err) {
    console.log('❌ RPC call exception:', err.message);
    return false;
  }
}

async function main() {
  const authSuccess = await testAuth();
  
  if (authSuccess) {
    await testRpc();
  } else {
    console.log('\n🔑 Authentication Issue Detected!');
    console.log('Possible solutions:');
    console.log('1. Check if your Supabase API key is still valid');
    console.log('2. Regenerate the anon key in Supabase dashboard');
    console.log('3. Verify the project URL is correct');
    console.log('4. Check if Row Level Security (RLS) policies allow access');
  }
}

main();