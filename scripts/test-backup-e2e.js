async function testE2E() {
    try {
        console.log('--- Phase 1: Authentication ---');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'sloncar@gmail.com', password: 'sloncar' })
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);

        if (!loginRes.ok) {
            console.error('Login Failed:', JSON.stringify(loginData));
            process.exit(1);
        }

        const token = loginData.data?.token || loginData.token;
        console.log('Got token:', token ? 'YES' : 'NO');

        if (!token) {
            console.error('No token in response:', JSON.stringify(loginData));
            process.exit(1);
        }

        const triggerBackup = async () => {
            const res = await fetch('http://localhost:3000/api/admin/backup/run', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            let data;
            try {
                data = await res.json();
            } catch (e) {
                data = { error: 'Failed to parse JSON' };
            }
            return { status: res.status, data };
        };

        console.log('\n--- Phase 2: First Manual Trigger ---');
        const b1 = await triggerBackup();
        console.log('B1 Response:', b1.status, JSON.stringify(b1.data));

        console.log('\n--- Phase 3: Immediate Second Trigger (Rate Limit Check) ---');
        const b2 = await triggerBackup();
        console.log('B2 Response:', b2.status, JSON.stringify(b2.data));

        if (b2.status === 429) {
            console.log('\n✅ RATE LIMIT TEST PASSED (Blocked as expected)');
        } else if (b2.status === 200 && b2.data.status === 'SKIPPED') {
            console.log('\n✅ RATE LIMIT TEST PASSED (Returned SKIPPED)');
        } else {
            console.log('\n❌ RATE LIMIT TEST FAILED (Unexpected status/data)');
        }

        process.exit(0);
    } catch (err) {
        console.error('Fatal Test Error:', err);
        process.exit(1);
    }
}

testE2E();
