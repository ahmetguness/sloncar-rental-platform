import fs from 'fs';
import path from 'path';
import { whatsAppService } from './whatsapp.js';
import prisma from './prisma.js';

// Log directory
const LOG_DIR = path.join(process.cwd(), 'logs');
const NOTIFICATION_LOG = path.join(LOG_DIR, 'notifications.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

interface NotificationData {
    to: string;
    subject: string;
    body: string;
}

class NotificationService {
    private async logNotification(type: 'EMAIL' | 'SMS' | 'WHATSAPP', data: NotificationData): Promise<void> {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type}] To: ${data.to} | Subject: ${data.subject} | Body: ${data.body}\n${'-'.repeat(80)}\n`;

        try {
            await fs.promises.appendFile(NOTIFICATION_LOG, logEntry);
            console.log(`[Notification] ${type} sent to ${data.to} (logged to file)`);
        } catch (error) {
            console.error('Failed to log notification:', error);
        }
    }

    async sendBookingConfirmation(booking: any): Promise<void> {
        // 1. Send Email (Mocked)
        await this.logNotification('EMAIL', {
            to: booking.customerEmail || 'no-email',
            subject: `Rezervasyon Onayı - ${booking.bookingCode}`,
            body: `Sayın ${booking.customerName},\n\nAracınız başarıyla ayırtıldı.\nKodunuz: ${booking.bookingCode}\nAlış: ${booking.pickupDate}\nTeslim: ${booking.dropoffDate}\nTutar: ${booking.totalPrice} TL\n\nİyi yolculuklar!`,
        });

        // 2. Send SMS (Mocked)
        await this.logNotification('SMS', {
            to: booking.customerPhone,
            subject: 'Rezervasyon',
            body: `Rent-a-Car: Araciniz ayrildi. Kod: ${booking.bookingCode}. Detaylar icin linke tiklayin.`,
        });

        // WhatsApp Notification to Customer
        // Uses 'booking_confirmation' template which bypasses the 24h window restriction for initiation.
        const components = [
            {
                type: 'body',
                parameters: [
                    { type: 'text', text: `${booking.customerName}` }, // {{1}} Name
                    { type: 'text', text: booking.bookingCode },       // {{2}} Code
                    { type: 'text', text: `${booking.car?.brand} ${booking.car?.model}` }, // {{3}} Car
                    { type: 'text', text: `${new Date(booking.pickupDate).toLocaleDateString('tr-TR')} - ${new Date(booking.dropoffDate).toLocaleDateString('tr-TR')}` }, // {{4}} Dates
                    { type: 'text', text: `${booking.totalPrice} TL` } // {{5}} Price
                ]
            }
        ];

        console.log(`[Notification] Sending 'booking_confirmation' template to Customer: ${booking.customerPhone}`);
        const templateSent = await whatsAppService.sendTemplateMessage(booking.customerPhone, 'booking_confirmation', 'tr', components);

        await this.logNotification('WHATSAPP', {
            to: booking.customerPhone,
            subject: `Rezervasyon Onayı (${templateSent ? 'SENT' : 'FAILED'})`,
            body: `Template: booking_confirmation | Params: ${JSON.stringify(components)}`
        });

        // 4. WhatsApp Notification to ALL Admins
        try {
            const admins = await prisma.user.findMany({
                where: {
                    role: 'ADMIN',
                    whatsappEnabled: true
                },
                select: { phone: true }
            });

            // Admin Notification Template: new_booking_alert
            // Params:
            // {{1}} Code (RNT-...)
            // {{2}} Customer Name
            // {{3}} Customer Phone
            // {{4}} Car Brand Model
            // {{5}} Dates
            // {{6}} Price

            for (const admin of admins) {
                if (admin.phone) {
                    const adminComponents = [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: booking.bookingCode },        // {{1}} Code
                                { type: 'text', text: `${booking.customerName} ${booking.customerSurname}` }, // {{2}} Name
                                { type: 'text', text: booking.customerPhone },      // {{3}} Phone
                                { type: 'text', text: `${booking.car?.brand} ${booking.car?.model}` }, // {{4}} Car
                                { type: 'text', text: `${new Date(booking.pickupDate).toLocaleDateString('tr-TR')} - ${new Date(booking.dropoffDate).toLocaleDateString('tr-TR')}` }, // {{5}} Dates
                                { type: 'text', text: `${booking.totalPrice} TL` }  // {{6}} Price
                            ]
                        }
                    ];

                    console.log(`[Notification] Sending 'new_booking_alert' template to Admin: ${admin.phone}`);
                    let sent = await whatsAppService.sendTemplateMessage(admin.phone, 'new_booking_alert', 'tr', adminComponents);

                    // Fallback to plain text if template fails
                    if (!sent) {
                        console.log(`[Notification] Template failed. Falling back to text message for Admin: ${admin.phone}`);
                        const textBody = `🏠 Yeni Rezervasyon!\n\nKod: ${booking.bookingCode}\nMüşteri: ${booking.customerName} ${booking.customerSurname}\nTelefon: ${booking.customerPhone}\nAraç: ${booking.car?.brand} ${booking.car?.model}\nTarih: ${new Date(booking.pickupDate).toLocaleDateString('tr-TR')} - ${new Date(booking.dropoffDate).toLocaleDateString('tr-TR')}\nTutar: ${booking.totalPrice} TL`;
                        sent = await whatsAppService.sendTextMessage(admin.phone, textBody);
                    }

                    await this.logNotification('WHATSAPP', {
                        to: admin.phone,
                        subject: `Yeni Rezervasyon Bildirimi (${sent ? 'SENT' : 'FAILED'})`,
                        body: `Result: ${sent ? 'Success' : 'Failed'} | Template: new_booking_alert`
                    });
                }
            }
        } catch (error) {
            console.error('[Notification] Failed to send admin WhatsApp notifications:', error);
        }
    }

    async sendPaymentReceipt(booking: any, amount: number): Promise<void> {
        await this.logNotification('EMAIL', {
            to: booking.customerEmail || 'no-email',
            subject: `Ödeme Alındı - ${booking.bookingCode}`,
            body: `Sayın ${booking.customerName},\n\n${amount} TL tutarındaki ödemeniz başarıyla alınmıştır.\nReferans No: ${booking.paymentRef}\n\nTeşekkür ederiz.`,
        });
    }

    async sendExtensionConfirmation(booking: any, additionalPrice: number): Promise<void> {
        await this.logNotification('EMAIL', {
            to: booking.customerEmail || 'no-email',
            subject: `Süre Uzatma Onayı - ${booking.bookingCode}`,
            body: `Sayın ${booking.customerName},\n\nRezervasyon süreniz uzatılmıştır.\nYeni Teslim Tarihi: ${booking.dropoffDate}\nEk Ücret: ${additionalPrice} TL\n\nİyi yolculuklar!`,
        });
    }
}

export const notificationService = new NotificationService();

