const API_URL = 'http://localhost:3000/api';

async function verify() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@rentacar.com',
                password: 'password123'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);

        const loginData = await loginRes.json();
        const token = loginData.data.token;
        console.log('Logged in. Token:', token.substring(0, 10) + '...');

        const authHeader = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Get Data for Booking
        console.log('Fetching cars and branches...');
        const carsRes = await fetch(`${API_URL}/cars`);
        const carsData = await carsRes.json();
        const carId = carsData.data[0].id;

        const branchesRes = await fetch(`${API_URL}/branches`);
        const branchesData = await branchesRes.json();
        const branchId = branchesData.data[0].id;

        // 3. Create Booking
        console.log('Creating booking...');
        const bookingRes = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                carId,
                pickupBranchId: branchId,
                dropoffBranchId: branchId,
                pickupDate: new Date(Date.now() + 86400000).toISOString(),
                dropoffDate: new Date(Date.now() + 172800000).toISOString(),
                customerName: 'Test Persistence',
                customerSurname: 'User',
                customerPhone: '5551234567',
                customerEmail: 'test@example.com',
                customerTC: '11111111111',
                customerDriverLicense: 'B-123456'
            })
        });

        if (!bookingRes.ok) {
            const errText = await bookingRes.text();
            console.error('Booking creation failed status:', bookingRes.status);
            require('fs').writeFileSync('error_response.json', errText);
            throw new Error(`Booking creation failed`);
        }

        const bookingData = await bookingRes.json();
        const bookingId = bookingData.data.booking.id;
        console.log('Booking created:', bookingId);

        // 4. Check Dashboard Stats (Should be Unread)
        console.log('Checking dashboard stats (Expect UNREAD)...');
        const statsRes1 = await fetch(`${API_URL}/admin/dashboard`, { headers: authHeader });
        const statsData1 = await statsRes1.json();

        const newBooking = statsData1.data.latestNewBookings.find(b => b.id === bookingId);

        if (!newBooking) {
            console.error('Booking not found in dashboard stats!');
            return;
        }
        console.log('Booking found. adminRead:', newBooking.adminRead);

        if (newBooking.adminRead !== false) {
            console.error('FAIL: Booking should be unread (false) but is', newBooking.adminRead);
            return;
        }

        // 5. Mark as Read
        console.log('Marking as read...');
        await fetch(`${API_URL}/admin/notifications/mark-read`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({
                id: bookingId,
                type: 'booking'
            })
        });
        console.log('Marked as read.');

        // 6. Check Dashboard Stats (Should be Read)
        console.log('Checking dashboard stats (Expect READ)...');
        const statsRes2 = await fetch(`${API_URL}/admin/dashboard`, { headers: authHeader });
        const statsData2 = await statsRes2.json();
        const readBooking = statsData2.data.latestNewBookings.find(b => b.id === bookingId);

        console.log('Booking found. adminRead:', readBooking.adminRead);

        if (readBooking.adminRead === true) {
            console.log('SUCCESS: Booking is marked as read persistently.');
        } else {
            console.error('FAIL: Booking should be read (true) but is', readBooking.adminRead);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

verify();
