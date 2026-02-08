const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Testing RPC functions...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFunctions() {
  // Test log_admin_action
  try {
    console.log('\n1. Testing log_admin_action...');
    const result1 = await supabase.rpc('log_admin_action', {
      admin_email_param: 'admin@test.com',
      action_type_param: 'test',
      target_type_param: 'property',
      target_id_param: 'test-id'
    });
    
    if (result1.error) {
      console.log('❌ log_admin_action error:', result1.error.message);
    } else {
      console.log('✅ log_admin_action: Success');
    }
  } catch (err) {
    console.log('❌ log_admin_action exception:', err.message);
  }
  
  // Test send_notification
  try {
    console.log('\n2. Testing send_notification...');
    const result2 = await supabase.rpc('send_notification', {
      recipient_email_param: 'test@example.com',
      title_param: 'Test Notification',
      body_param: 'This is a test notification',
      notification_type_param: 'test'
    });
    
    if (result2.error) {
      console.log('❌ send_notification error:', result2.error.message);
    } else {
      console.log('✅ send_notification: Success');
    }
  } catch (err) {
    console.log('❌ send_notification exception:', err.message);
  }
}

testFunctions();