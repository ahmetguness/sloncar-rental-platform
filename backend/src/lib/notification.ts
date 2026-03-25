import fs from 'fs';
import path from 'path';
import { whatsAppService } from './whatsapp.js';
import prisma from './prisma.js';
import { Logger } from './logger.js';
import { sendBookingConfirmationToCustomer, sendBookingAlertToAdmin, sendPaymentConfirmationToCustomer, sendBookingCancelledToCustomer } from './mail.js';

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
            Logger.info(`[Notification] ${type} sent to ${data.to} (logged to file)`);
        } catch (error) {
            Logger.error('Failed to log notification:', error);
        }
    }

    async sendBookingConfirmation(booking: any): Promise<void> {
        // 1. Send Email to Customer
        sendBookingConfirmationToCustomer(booking).catch(err => Logger.error('[Notification] Customer email failed:', err));

        // 2. Send Email to Admins
        try {
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN', emailBookingEnabled: true },
                select: { email: true }
            });
            for (const admin of admins) {
                if (admin.email) {
                    sendBookingAlertToAdmin(admin.email, booking).catch(err => Logger.error('[Notification] Admin email failed:', err));
                }
            }
        } catch (err) {
            Logger.error('[Notification] Failed to fetch admins for email:', err);
        }

        // 3. Log notification
        await this.logNotification('EMAIL', {
            to: booking.customerEmail || 'no-email',
            subject: `Rezervasyon Onayı - ${booking.bookingCode}`,
            body: `${booking.customerName} - ${booking.car?.brand} ${booking.car?.model} - ${booking.totalPrice} TL`,
        });

        // 4. Send SMS (Mocked)
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

        Logger.info(`[Notification] Sending 'booking_confirmation' template to Customer: ${booking.customerPhone}`);
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

                    Logger.info(`[Notification] Sending 'new_booking_alert' template to Admin: ${admin.phone}`);
                    let sent = await whatsAppService.sendTemplateMessage(admin.phone, 'new_booking_alert', 'tr', adminComponents);

                    // Fallback to plain text if template fails
                    if (!sent) {
                        Logger.warn(`[Notification] Template failed. Falling back to text message for Admin: ${admin.phone}`);
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
            Logger.error('[Notification] Failed to send admin WhatsApp notifications:', error);
        }
    }

    async sendPaymentReceipt(booking: any, amount: number): Promise<void> {
        // 1. Send payment confirmation email to customer
        sendPaymentConfirmationToCustomer(booking).catch(err => Logger.error('[Notification] Payment confirmation email failed:', err));

        // 2. Log notification
        await this.logNotification('EMAIL', {
            to: booking.customerEmail || 'no-email',
            subject: `Ödeme Alındı - ${booking.bookingCode}`,
            body: `Sayın ${booking.customerName}, ${amount} TL tutarındaki ödemeniz başarıyla alınmıştır. Ref: ${booking.paymentRef}`,
        });
    }

    async sendExtensionConfirmation(booking: any, additionalPrice: number): Promise<void> {
        await this.logNotification('EMAIL', {
            to: booking.customerEmail || 'no-email',
            subject: `Süre Uzatma Onayı - ${booking.bookingCode}`,
            body: `Sayın ${booking.customerName},\n\nRezervasyon süreniz uzatılmıştır.\nYeni Teslim Tarihi: ${booking.dropoffDate}\nEk Ücret: ${additionalPrice} TL\n\nİyi yolculuklar!`,
        });
    }

    async sendBookingCancellation(booking: any, reason?: string): Promise<void> {
        // 1. Send cancellation email to customer
        if (booking.customerEmail) {
            sendBookingCancelledToCustomer(booking, reason).catch(err => Logger.error('[Notification] Cancellation email failed:', err));
        }

        // 2. Log notification
        await this.logNotification('EMAIL', {
            to: booking.customerEmail || 'no-email',
            subject: `Rezervasyon İptal - ${booking.bookingCode}`,
            body: `Sayın ${booking.customerName}, ${booking.bookingCode} kodlu rezervasyonunuz iptal edilmiştir. Sebep: ${reason || 'Belirtilmedi'}`,
        });
    }
}

export const notificationService = new NotificationService();

