import nodemailer from 'nodemailer';
import path from 'path';
import { Logger } from './logger.js';

const LOGO_PATH = path.join(process.cwd(), 'src', 'assets', 'logo', 'logo.jpg');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM_NAME = process.env.SMTP_FROM_NAME || 'Rent a Car';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || '';
const SITE_URL = process.env.SITE_URL || 'http://localhost:5173';

function wrapHtml(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
  <tr><td style="background:#111111;padding:24px 32px;text-align:center;">
    <img src="cid:logo" alt="${FROM_NAME}" style="height:48px;"/>
  </td></tr>
  <tr><td style="padding:32px;">${content}</td></tr>
  <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} ${FROM_NAME}. Tüm hakları saklıdır.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            to,
            subject,
            html,
            attachments: [
                {
                    filename: 'logo.jpg',
                    path: LOGO_PATH,
                    cid: 'logo',
                },
            ],
        });
        Logger.info(`[Mail] ✅ Sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        Logger.error(`[Mail] ❌ Failed to send to ${to}:`, err);
        return false;
    }
}

export async function sendBookingConfirmationToCustomer(booking: any): Promise<boolean> {
    const pickupDate = new Date(booking.pickupDate).toLocaleDateString('tr-TR');
    const dropoffDate = new Date(booking.dropoffDate).toLocaleDateString('tr-TR');
    const bookingUrl = `${SITE_URL}/my-booking?code=${booking.bookingCode}`;

    const content = `
        <h2 style="margin:0 0 16px;color:#111;">Rezervasyonunuz Onaylandı 🎉</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;">
            Sayın <strong>${booking.customerName} ${booking.customerSurname || ''}</strong>,<br/>
            Rezervasyonunuz başarıyla oluşturulmuştur.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;width:40%;">Rezervasyon Kodu</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-weight:700;font-size:16px;">${booking.bookingCode}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Araç</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${booking.car?.brand || ''} ${booking.car?.model || ''}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Alış Tarihi</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${pickupDate}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Teslim Tarihi</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${dropoffDate}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Toplam Tutar</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-weight:700;">${booking.totalPrice} TL</td></tr>
        </table>
        <div style="text-align:center;margin:24px 0;">
            <a href="${bookingUrl}" style="display:inline-block;padding:12px 32px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Rezervasyonumu Görüntüle</a>
        </div>
        <p style="color:#6b7280;font-size:13px;margin-top:20px;">Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.</p>
    `;

    return sendMail(
        booking.customerEmail,
        `Rezervasyon Onayı - ${booking.bookingCode}`,
        wrapHtml('Rezervasyon Onayı', content),
    );
}

export async function sendBookingAlertToAdmin(adminEmail: string, booking: any): Promise<boolean> {
    const pickupDate = new Date(booking.pickupDate).toLocaleDateString('tr-TR');
    const dropoffDate = new Date(booking.dropoffDate).toLocaleDateString('tr-TR');

    const content = `
        <h2 style="margin:0 0 16px;color:#111;">Yeni Rezervasyon 🔔</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;">Yeni bir rezervasyon oluşturuldu.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;width:40%;">Kod</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-weight:700;">${booking.bookingCode}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Müşteri</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${booking.customerName} ${booking.customerSurname || ''}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Telefon</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${booking.customerPhone}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">E-posta</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${booking.customerEmail || '-'}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Araç</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${booking.car?.brand || ''} ${booking.car?.model || ''}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Tarih</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${pickupDate} → ${dropoffDate}</td></tr>
            <tr><td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;">Tutar</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-weight:700;">${booking.totalPrice} TL</td></tr>
        </table>
    `;

    return sendMail(
        adminEmail,
        `🔔 Yeni Rezervasyon - ${booking.bookingCode}`,
        wrapHtml('Yeni Rezervasyon', content),
    );
}

export async function sendInsuranceExpiryReminder(adminEmail: string, insurances: any[]): Promise<boolean> {
    const rows = insurances.map((ins) => {
        const expiryDate = new Date(ins.startDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const urgencyColor = daysLeft <= 3 ? '#dc2626' : daysLeft <= 7 ? '#f59e0b' : '#16a34a';

        return `<tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${ins.fullName}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${ins.policyNo}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${ins.branch}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${ins.company}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${ins.plate || '-'}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;">${expiryDate.toLocaleDateString('tr-TR')}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center;">
                <span style="display:inline-block;padding:2px 10px;border-radius:12px;background:${urgencyColor}20;color:${urgencyColor};font-weight:600;font-size:13px;">${daysLeft} gün</span>
            </td>
        </tr>`;
    }).join('');

    const content = `
        <h2 style="margin:0 0 16px;color:#111;">Sigorta Bitiş Hatırlatması ⚠️</h2>
        <p style="color:#374151;font-size:15px;line-height:1.6;">
            Aşağıdaki <strong>${insurances.length}</strong> sigorta poliçesinin süresi 10 gün içinde dolacaktır.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
            <thead>
                <tr style="background:#f9fafb;">
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;">Ad Soyad</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;">Poliçe No</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;">Branş</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;">Şirket</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;">Plaka</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;">Bitiş</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center;color:#374151;">Kalan</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <p style="color:#6b7280;font-size:13px;margin-top:16px;">Lütfen ilgili poliçelerin yenilenmesi için gerekli işlemleri başlatınız.</p>
    `;

    return sendMail(
        adminEmail,
        `⚠️ Sigorta Bitiş Hatırlatması (${insurances.length} poliçe)`,
        wrapHtml('Sigorta Hatırlatması', content),
    );
}
