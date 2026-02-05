import fs from 'fs';
import path from 'path';

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
    private async logNotification(type: 'EMAIL' | 'SMS', data: NotificationData): Promise<void> {
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
        // Send Email
        await this.logNotification('EMAIL', {
            to: booking.customerEmail || 'no-email',
            subject: `Rezervasyon Onayı - ${booking.bookingCode}`,
            body: `Sayın ${booking.customerName},\n\nAracınız başarıyla ayırtıldı.\nKodunuz: ${booking.bookingCode}\nAlış: ${booking.pickupDate}\nTeslim: ${booking.dropoffDate}\nTutar: ${booking.totalPrice} TL\n\nİyi yolculuklar!`,
        });

        // Send SMS
        await this.logNotification('SMS', {
            to: booking.customerPhone,
            subject: 'Rezervasyon',
            body: `Rent-a-Car: Araciniz ayrildi. Kod: ${booking.bookingCode}. Detaylar icin linke tiklayin.`,
        });
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
