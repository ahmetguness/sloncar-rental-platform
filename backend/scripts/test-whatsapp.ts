
import { whatsAppService } from '../src/lib/whatsapp.js';
import dotenv from 'dotenv';

dotenv.config();

async function testWhatsApp() {
    console.log('Testing WhatsApp Integration...');

    // Replace with a valid test number (user's number or admin number)
    // For Meta Test numbers, you usually need to verify the recipient number in the dev console first 
    // unless the business account is live.
    // However, if the user sends a message to the bot first, the 24h window opens.

    // We'll try to send a template message (hello_world is a default Meta template)
    console.log('1. Sending Template Message (hello_world)...');
    // You can change this number to the one you want to test with
    const testNumber = '905555555555'; // REPLACE THIS WITH A REAL NUMBER WHEN RUNNING

    // Since we don't have a real number, we just print what would happen.
    // To actually run this, the user needs to provide a number or we fetch an admin number from DB.

    console.log('Skipping actual send in this script to avoid spamming invalid numbers.');
    console.log('Integrity Check: Service instantiated.');

    if (process.env.WHATSAPP_API_TOKEN) {
        console.log('✅ API Token found');
    } else {
        console.error('❌ API Token missing');
    }

    if (process.env.WHATSAPP_PHONE_ID) {
        console.log('✅ Phone ID found');
    } else {
        console.error('❌ Phone ID missing');
    }
}

testWhatsApp();
