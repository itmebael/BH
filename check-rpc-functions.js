const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as your app
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRpcFunctions() {
  console.log('Checking if RPC functions exist...');
  
  try {
    // Check if log_admin_action exists
    const { data: logData, error: logError } = await supabase
      .rpc('log_admin_action', {
        admin_email_param: 'test@example.com',
        action_type_param: 'test',
        target_type_param: 'test',
        target_id_param: 'test',
        action_details_param: { test: true }
      });
      
    if (logError) {
      console.log('❌ log_admin_action function does not exist or has errors:', logError.message);
    } else {
      console.log('✅ log_admin_action function exists and works');
    }
  } catch (e) {
    console.log('❌ log_admin_action function does not exist');
  }
  
  try {
    // Check if send_notification exists
    const { data: notifyData, error: notifyError } = await supabase
      .rpc('send_notification', {
        recipient_email_param: 'test@example.com',
        title_param: 'Test',
        body_param: 'Test notification',
        notification_type_param: 'test',
        priority_param: 'normal'
      });
      
    if (notifyError) {
      console.log('❌ send_notification function does not exist or has errors:', notifyError.message);
    } else {
      console.log('✅ send_notification function exists and works');
    }
  } catch (e) {
    console.log('❌ send_notification function does not exist');
  }
  
  console.log('\n📋 Solution:');
  console.log('1. Go to your Supabase dashboard at https://app.supabase.com/');
  console.log('2. Open the SQL Editor');
  console.log('3. Copy and paste the SQL from CREATE_MISSING_RPC_FUNCTIONS.sql');
  console.log('4. Run the SQL to create the missing functions and tables');
  console.log('5. The 400 errors should be resolved');
}

checkRpcFunctions();