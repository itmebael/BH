// Setup environment variables
// Run with: node setup_env.js

const fs = require('fs');
const path = require('path');

const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://jlahqyvpgdntlqfpxvoz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKIafk9hPg`;

const envPath = path.join(__dirname, '.env');

console.log('🔧 Setting up environment variables...');

try {
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
        console.log('⚠️ .env file already exists');
        console.log('Backing up to .env.backup');
        fs.copyFileSync(envPath, envPath + '.backup');
    }

    // Write the .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully');
    console.log('Location:', envPath);
    console.log('');
    console.log('Contents:');
    console.log(envContent);
    console.log('');
    console.log('Next steps:');
    console.log('1. Get valid API keys from Supabase dashboard');
    console.log('2. Update the .env file with new credentials');
    console.log('3. Restart your development server');
    console.log('4. Test with: node test_new_api_key.js');

} catch (error) {
    console.log('❌ Error creating .env file:', error.message);
    console.log('');
    console.log('Manual setup:');
    console.log('1. Create a file named ".env" in your project root');
    console.log('2. Add the following content:');
    console.log('');
    console.log(envContent);
}

