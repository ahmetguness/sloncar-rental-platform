
import axios from 'axios';



export class WhatsAppService {
    private token: string;
    private phoneId: string;
    private baseUrl: string = 'https://graph.facebook.com/v22.0';

    constructor() {
        this.token = process.env.WHATSAPP_API_TOKEN || '';
        this.phoneId = process.env.WHATSAPP_PHONE_ID || '';
    }

    private get headers() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Helper to format phone number to E.164 format (remove spaces, ensure country code)
     * Assuming Turkish numbers for now if no country code provided
     */
    private formatPhoneNumber(phone: string): string {
        // Remove all non-digits
        let cleaned = phone.replace(/\D/g, '');

        // Handle Case 1: Already starts with 90 (Turkish country code)
        // Ensure it has 12 digits (90 + 10 digits)
        if (cleaned.startsWith('90') && cleaned.length === 12) {
            return cleaned;
        }

        // Handle Case 2: Starts with 0 (e.g. 05446455135 -> 905446455135)
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }

        // Handle Case 3: 10 digit number (e.g. 5446455135 -> 905446455135)
        if (cleaned.length === 10) {
            cleaned = '90' + cleaned;
        }

        return cleaned;
    }

    /**
     * Send a template message
     */
    async sendTemplateMessage(to: string, templateName: string, languageCode: string = 'tr', components: any[] = []): Promise<boolean> {
        if (!this.token || !this.phoneId) {
            console.warn('[WhatsApp] Credentials missing. Skipping message.');
            return false;
        }

        const url = `${this.baseUrl}/${this.phoneId}/messages`;
        const formattedTo = this.formatPhoneNumber(to);

        const data = {
            messaging_product: 'whatsapp',
            to: formattedTo,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode
                },
                components: components
            }
        };

        try {
            const response = await axios.post(url, data, { headers: this.headers });
            console.log(`[WhatsApp] Template '${templateName}' sent to ${formattedTo}. ID: ${response.data.messages[0].id}`);
            return true;
        } catch (error: any) {
            const errMsg = error?.response?.data || error.message;
            const code = error?.response?.data?.error?.code;

            if (code === 131030) {
                console.error(`[WhatsApp] Recipient ${formattedTo} not in allowed list (Sandbox Mode).`);
            } else if (code === 132001) {
                console.error(`[WhatsApp] Template '${templateName}' or translation 'tr' missing.`);
            } else {
                console.error('[WhatsApp] Global Error:', JSON.stringify(errMsg));
            }
            // Log to file for debugging
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.join(process.cwd(), 'logs', 'whatsapp-error.log');
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] [TEMPLATE-FAIL] To: ${to} (fmt: ${formattedTo}) | Error: ${JSON.stringify(errMsg)}\n`);
            } catch (e) { /* ignore */ }
            return false;
        }
    }

    /**
     * Send a free-form text message (Only works if user contacted business within last 24h)
     * Good for admin notifications as admin can initiate chat with bot.
     */
    async sendTextMessage(to: string, body: string): Promise<boolean> {
        if (!this.token || !this.phoneId) {
            console.warn('[WhatsApp] Credentials missing. Skipping message.');
            return false;
        }

        const url = `${this.baseUrl}/${this.phoneId}/messages`;
        const formattedTo = this.formatPhoneNumber(to);

        const data = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedTo,
            type: 'text',
            text: {
                preview_url: false,
                body: body
            }
        };

        try {
            const response = await axios.post(url, data, { headers: this.headers });
            console.log(`[WhatsApp] Text message sent to ${formattedTo}. ID: ${response.data.messages[0].id}`);
            return true;
        } catch (error: any) {
            const errMsg = error?.response?.data || error.message;
            console.error('[WhatsApp] Text Error:', errMsg);
            // Log to file for debugging
            try {
                const fs = await import('fs');
                const path = await import('path');
                const logPath = path.join(process.cwd(), 'logs', 'whatsapp-error.log');
                fs.appendFileSync(logPath, `[${new Date().toISOString()}] [TEXT-FAIL] To: ${to} | Error: ${JSON.stringify(errMsg)}\n`);
            } catch (e) { /* ignore */ }
            return false;
        }
    }
}

export const whatsAppService = new WhatsAppService();
