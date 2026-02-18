
import { PrismaClient } from '@prisma/client';
import { whatsAppService } from '../src/lib/whatsapp.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from backend root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();
const LOG_FILE = path.join(process.cwd(), 'logs', 'whatsapp-debug.log');

// Ensure logs dir exists
if (!fs.existsSync(path.dirname(LOG_FILE))) {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function log(msg: string) {
    console.log(msg);
    try {
        fs.appendFileSync(LOG_FILE, msg + '\r\n');
    } catch (e) {
        // ignore
    }
}

// Override console.error to capture service logs
const originalConsoleError = console.error;
console.error = (...args) => {
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : a)).join(' ');
    originalConsoleError(msg);
    try {
        fs.appendFileSync(LOG_FILE, `[ERROR] ${msg}\r\n`);
    } catch (e) {
        // ignore
    }
};

async function debugWhatsApp() {
    try {
        fs.writeFileSync(LOG_FILE, `--- START DEBUG ${new Date().toISOString()} ---\r\n`);
    } catch (e) {
        console.error('Failed to init log file', e);
    }

    log('🔍 Debugging WhatsApp Integration...');

    // 1. Check Env Vars
    log('1. Checking Environment Variables:');
    log(`WHATSAPP_API_TOKEN: ${process.env.WHATSAPP_API_TOKEN ? '✅ Present' : '❌ Missing'}`);
    log(`WHATSAPP_PHONE_ID: ${process.env.WHATSAPP_PHONE_ID ? '✅ Present' : '❌ Missing'}`);

    // 1.5 Verify Token
    log('\n1.5 Verifying Token Validity (v22.0)...');
    try {
        const axios = (await import('axios')).default;
        const meUrl = `https://graph.facebook.com/v22.0/me?access_token=${process.env.WHATSAPP_API_TOKEN}`;

        try {
            const meRes = await axios.get(meUrl);
            log(`✅ Token seems valid. User: ${meRes.data.name} (ID: ${meRes.data.id})`);
        } catch (err: any) {
            const errMsg = err?.response?.data?.error?.message || err.message;
            log(`❌ Token Check /me FAILED: ${errMsg}`);
            if (errMsg.includes('API access blocked')) {
                log('   -> API Access Blocked. This usually means the token is invalid, expired, or the app/user is restricted.');
            }
        }
    } catch (e: any) {
        log(`Failed to run token check: ${e.message}`);
    }

    // 2. Fetch Admins
    log('\n2. Fetching Admins from DB...');
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' }
        });
        log(`Found ${admins.length} admins.`);

        if (admins.length > 0) {
            log('List of Admins:');
            admins.forEach(a => log(`- Name: ${a.name}, Phone: ${a.phone}`));
        } else {
            log('⚠️ No admins found.');
        }

        // 3. Try sending 'hello_world' template to the SPECIFIC admin requested
        // User asked to ignore the random one and focus on 05446455135
        const targetPhone = '5446455135';
        const targetAdmin = admins.find(a => a.phone && a.phone.replace(/\D/g, '').includes(targetPhone));

        if (!targetAdmin) {
            log(`❌ No admin found matching phone number *${targetPhone}*`);
            log('Available Admins:');
            admins.forEach(a => log(`- ${a.name}: ${a.phone}`));
        } else {
            log(`\n3. Attempting to send 'hello_world' template to Target Admin: ${targetAdmin.name} (Phone: ${targetAdmin.phone})...`);

            // Call service
            try {
                const success = await whatsAppService.sendTemplateMessage(
                    targetAdmin.phone!,
                    'hello_world',
                    'en_US'
                );

                if (success) {
                    log('✅ Template Message SENT SUCCESSFULLY!');
                } else {
                    log('❌ Template Message FAILED. (Check [ERROR] logs above)');
                }
            } catch (err: any) {
                log(`❌ Error calling sendTemplateMessage: ${err.message}`);
            }

            log('\n--- Attempting FREE-FORM TEXT ---');
            try {
                const textSuccess = await whatsAppService.sendTextMessage(
                    targetAdmin.phone!,
                    'Debug Test Message from Rent-a-Car System'
                );

                if (textSuccess) {
                    log('✅ Text Message SENT SUCCESSFULLY!');
                } else {
                    log('❌ Text Message FAILED. (Expected if outside 24h window)');
                }
            } catch (err: any) {
                log(`❌ Error calling sendTextMessage: ${err.message}`);
            }
        }
    } catch (e: any) {
        log(`❌ Database Error or other crash: ${e.message}`);
    } finally {
        await prisma.$disconnect();
        log('\n--- END DEBUG ---');
    }
}

debugWhatsApp().catch(e => {
    log(`Script Fatal Error: ${e}`);
    process.exit(1);
});
