import { google } from 'googleapis';
import readline from 'readline';
import fs from 'fs';
import 'dotenv/config';

/**
 * One-time script to generate a Refresh Token for Google Drive.
 * Requires GDRIVE_CLIENT_ID and GDRIVE_CLIENT_SECRET in .env
 */

const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function getRefreshToken() {
    const clientId = process.env.GDRIVE_CLIENT_ID;
    const clientSecret = process.env.GDRIVE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('❌ Error: GDRIVE_CLIENT_ID and GDRIVE_CLIENT_SECRET must be set in .env');
        process.exit(1);
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'http://localhost' // Redirect URI for desktop apps
    );

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Critical to get a refresh_token
        scope: SCOPES,
        prompt: 'consent'
    });

    console.log('\n--- Google Drive Authorization ---');
    console.log('1. Open this URL in your browser:');
    console.log('\x1b[36m%s\x1b[0m', authUrl);
    console.log('\n2. Sign in, authorize the app, and you will be redirected to a "cannot reach page" (localhost).');
    console.log('3. Copy the "code" parameter from the URL in your browser address bar.');
    console.log('   (e.g., http://localhost/?code=4/0AfgeX...)');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('\nPaste the "code" here: ', async (code) => {
        rl.close();
        try {
            const { tokens } = await oauth2Client.getToken(code);
            console.log('\n✅ Success! Here is your Refresh Token:');
            console.log('\x1b[32m%s\x1b[0m', tokens.refresh_token);
            fs.writeFileSync('gdrive_token.txt', tokens.refresh_token || '');
            console.log('\nToken also saved to gdrive_token.txt');
        } catch (error: any) {
            console.error('❌ Error exchanging code for tokens:', error.message);
        }
    });
}

getRefreshToken();
