import 'dotenv/config';
import {
    sendBookingConfirmationToCustomer,
    sendBookingAlertToAdmin,
    sendInsuranceExpiryReminder,
} from '../src/lib/mail.js';

const TEST_EMAIL = 'ahmetgunes.ceng@gmail.com';

const mockBooking = {
    bookingCode: 'RNT-TEST123',
    customerName: 'Ahmet',
    customerSurname: 'Güneş',
    customerPhone: '0544 645 51 35',
    customerEmail: TEST_EMAIL,
    car: { brand: 'Mercedes', model: 'C200' },
    pickupDate: new Date('2026-03-20'),
    dropoffDate: new Date('2026-03-25'),
    totalPrice: '3.500',
};

const mockInsurances = [
    {
        fullName: 'Ahmet Güneş',
        policyNo: 'POL-001',
        branch: 'KASKO',
        company: 'Allianz',
        plate: '45 ABC 123',
        startDate: new Date(Date.now() - 360 * 24 * 60 * 60 * 1000), // expires in ~5 days
    },
    {
        fullName: 'Mehmet Yılmaz',
        policyNo: 'POL-002',
        branch: 'TRAFİK',
        company: 'Axa',
        plate: '45 DEF 456',
        startDate: new Date(Date.now() - 363 * 24 * 60 * 60 * 1000), // expires in ~2 days
    },
];

async function main() {
    console.log('1/3 - Sending booking confirmation to customer...');
    const r1 = await sendBookingConfirmationToCustomer(mockBooking);
    console.log(r1 ? '✅ Customer mail sent' : '❌ Customer mail failed');

    console.log('2/3 - Sending booking alert to admin...');
    const r2 = await sendBookingAlertToAdmin(TEST_EMAIL, mockBooking);
    console.log(r2 ? '✅ Admin booking mail sent' : '❌ Admin booking mail failed');

    console.log('3/3 - Sending insurance expiry reminder...');
    const r3 = await sendInsuranceExpiryReminder(TEST_EMAIL, mockInsurances);
    console.log(r3 ? '✅ Insurance reminder sent' : '❌ Insurance reminder failed');

    console.log('\nDone!');
    process.exit(0);
}

main();
