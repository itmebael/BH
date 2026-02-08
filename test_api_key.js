// Test API key validity
// Run with: node test_api_key.js

const https = require('https');

const supabaseUrl = 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKIafk9hPg';

function testApiKey() {
    console.log('🔍 Testing API Key Validity...');
    console.log('URL:', supabaseUrl);
    console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
    console.log('');

    const options = {
        hostname: 'jlahqyvpgdntlqfpxvoz.supabase.co',
        port: 443,
        path: '/rest/v1/',
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        console.log('Status Code:', res.statusCode);
        console.log('Status Message:', res.statusMessage);
        console.log('Headers:', res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ API Key is valid!');
                console.log('Response:', data.substring(0, 200) + '...');
            } else if (res.statusCode === 401) {
                console.log('❌ API Key is invalid (401 Unauthorized)');
                console.log('Response:', data);
            } else if (res.statusCode === 403) {
                console.log('❌ API Key is forbidden (403 Forbidden)');
                console.log('Response:', data);
            } else {
                console.log('❌ Unexpected response:', res.statusCode);
                console.log('Response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.log('❌ Network error:', error.message);
    });

    req.end();
}

// Run the test
testApiKey();

