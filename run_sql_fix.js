const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg';

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to fix the properties status constraint
const sql = `
ALTER TABLE public.properties 
DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE public.properties 
ADD CONSTRAINT properties_status_check CHECK (
  (status = ANY (ARRAY['available'::text, 'full'::text, 'pending'::text]))
);
`;

async function runSqlFix() {
  try {
    console.log('Running SQL fix for properties status constraint...');
    
    // Use Supabase's RPC or direct SQL execution if available
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error running SQL:', error);
      
      // Alternative approach: try using the service role key if available
      console.log('Trying alternative approach...');
      
      // If RPC is not available, we might need to use the Supabase dashboard
      console.log('Please run this SQL in your Supabase dashboard SQL editor:');
      console.log(sql);
      
    } else {
      console.log('SQL fix executed successfully!');
      console.log('Properties table now allows "pending" status.');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
    console.log('\nPlease manually run this SQL in your Supabase dashboard:');
    console.log(sql);
  }
}

runSqlFix();