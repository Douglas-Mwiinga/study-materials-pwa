const http = require('http');

async function testPendingApprovals() {
    // Test data
    const adminEmail = 'muchimbamwiingadouglas@gmail.com';
    const adminPassword = 'phenolformaldehyde';

    try {
        // Step 1: Login as admin
        console.log('🔐 Step 1: Login as admin...');
        const loginBody = JSON.stringify({
            email: adminEmail,
            password: adminPassword
        });

        const loginResponse = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/auth/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(loginBody)
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            });

            req.on('error', reject);
            req.write(loginBody);
            req.end();
        });

        if (loginResponse.status !== 200) {
            console.error('❌ Login failed:', loginResponse.data);
            return;
        }

        const loginData = JSON.parse(loginResponse.data);
        const token = loginData.token;
        console.log('✅ Login successful. Token:', token.substring(0, 20) + '...');

        // Step 2: Fetch pending approvals
        console.log('\n📋 Step 2: Fetch pending approvals...');
        const pendingResponse = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/student-access/pending',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            });

            req.on('error', reject);
            req.end();
        });

        console.log('Status:', pendingResponse.status);
        const pendingData = JSON.parse(pendingResponse.data);
        
        console.log('✅ Pending approvals response:');
        console.log(JSON.stringify(pendingData, null, 2));

        if (pendingData.data && pendingData.data.length > 0) {
            console.log('\n✨ Sample approval item structure:');
            console.log(JSON.stringify(pendingData.data[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPendingApprovals();
