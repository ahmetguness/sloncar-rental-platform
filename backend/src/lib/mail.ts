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
const COMPANY_PHONE = '0 236 239 0 336';

// ─── Shared HTML wrapper ───────────────────────────────────────────────
function wrapHtml(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:#111111;padding:28px 32px;text-align:center;">
    <img src="cid:logo" alt="${FROM_NAME}" style="height:48px;border-radius:12px;"/>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:36px 32px;">${content}</td></tr>
  <!-- Footer -->
  <tr><td style="background:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">📧 ${FROM_EMAIL} &nbsp;&nbsp;📞 ${COMPANY_PHONE}</p>
    <p style="margin:0;font-size:11px;color:#9ca3af;">&copy; ${new Date().getFullYear()} ${FROM_NAME}. Tüm hakları saklıdır.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ─── Shared helpers ────────────────────────────────────────────────────
function sectionTitle(emoji: string, text: string): string {
    return `<h3 style="margin:24px 0 12px;font-size:15px;color:#111;font-weight:700;">${emoji} ${text}</h3>`;
}

function infoRow(label: string, value: string, bold = false): string {
    return `<tr>
        <td style="padding:10px 14px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#374151;width:40%;font-size:14px;">${label}</td>
        <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#111;font-size:14px;${bold ? 'font-weight:700;' : ''}">${value}</td>
    </tr>`;
}

function tableWrap(rows: string): string {
    return `<table style="width:100%;border-collapse:collapse;margin:8px 0;border-radius:8px;overflow:hidden;">${rows}</table>`;
}

function ctaButton(url: string, text: string): string {
    return `<div style="text-align:center;margin:28px 0 8px;">
        <a href="${url}" style="display:inline-block;padding:14px 36px;background:#E30613;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:0.5px;">${text}</a>
    </div>`;
}

function bulletList(items: string[]): string {
    return `<ul style="margin:8px 0 0;padding-left:20px;color:#374151;font-size:13px;line-height:2;">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}

// ─── Send mail ─────────────────────────────────────────────────────────
async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            to,
            subject,
            html,
            attachments: [{ filename: 'logo.jpg', path: LOGO_PATH, cid: 'logo' }],
        });
        Logger.info(`[Mail] ✅ Sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        Logger.error(`[Mail] ❌ Failed to send to ${to}:`, err);
        return false;
    }
}

// ─── 1. Booking Confirmation → Customer ────────────────────────────────
export async function sendBookingConfirmationToCustomer(booking: any): Promise<boolean> {
    const pickupDate = new Date(booking.pickupDate).toLocaleDateString('tr-TR');
    const dropoffDate = new Date(booking.dropoffDate).toLocaleDateString('tr-TR');
    const car = `${booking.car?.brand || ''} ${booking.car?.model || ''}`.trim();
    const bookingUrl = `${SITE_URL}/my-booking?code=${booking.bookingCode}`;

    const content = `
        <h2 style="margin:0 0 8px;color:#111;font-size:22px;">Rezervasyonunuz Onaylandı 🎉</h2>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 4px;">
            Sayın <strong>${booking.customerName} ${booking.customerSurname || ''}</strong>,
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
            Rezervasyonunuz başarıyla oluşturulmuş ve onaylanmıştır. Aşağıda rezervasyon detaylarınızı bulabilirsiniz:
        </p>

        ${sectionTitle('📋', 'Rezervasyon Detayları')}
        ${tableWrap(
            infoRow('Rezervasyon Kodu', booking.bookingCode, true) +
            infoRow('Araç', car) +
            infoRow('Alış Tarihi', pickupDate) +
            infoRow('Teslim Tarihi', dropoffDate) +
            infoRow('Toplam Tutar', `${booking.totalPrice} TL`, true)
        )}

        ${sectionTitle('🚗', 'Önemli Bilgiler')}
        ${bulletList([
            'Aracınızı belirtilen tarih ve saatte teslim alabilirsiniz.',
            'Lütfen teslim sırasında kimlik ve ehliyetinizi yanınızda bulundurunuz.',
            'Herhangi bir değişiklik için bizimle iletişime geçebilirsiniz.',
        ])}

        <p style="color:#374151;font-size:14px;margin:24px 0 4px;">👉 Rezervasyonunuzu görüntülemek için:</p>
        ${ctaButton(bookingUrl, 'Rezervasyonumu Görüntüle')}

        <p style="color:#6b7280;font-size:13px;margin-top:24px;line-height:1.6;">
            Herhangi bir sorunuz olması durumunda size yardımcı olmaktan memnuniyet duyarız.<br/>
            İyi yolculuklar dileriz.
        </p>
    `;

    return sendMail(
        booking.customerEmail,
        `Rezervasyonunuz Onaylandı 🎉 | ${booking.bookingCode}`,
        wrapHtml('Rezervasyon Onayı', content),
    );
}

// ─── 2. Booking Alert → Admin ──────────────────────────────────────────
export async function sendBookingAlertToAdmin(adminEmail: string, booking: any): Promise<boolean> {
    const pickupDate = new Date(booking.pickupDate).toLocaleDateString('tr-TR');
    const dropoffDate = new Date(booking.dropoffDate).toLocaleDateString('tr-TR');
    const car = `${booking.car?.brand || ''} ${booking.car?.model || ''}`.trim();

    const content = `
        <h2 style="margin:0 0 8px;color:#111;font-size:22px;">🔔 Yeni Rezervasyon Oluşturuldu</h2>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
            Yeni bir rezervasyon oluşturuldu.
        </p>

        ${sectionTitle('📋', 'Rezervasyon Bilgileri')}
        ${tableWrap(
            infoRow('Kod', booking.bookingCode, true) +
            infoRow('Müşteri', `${booking.customerName} ${booking.customerSurname || ''}`.trim()) +
            infoRow('Telefon', booking.customerPhone) +
            infoRow('E-posta', booking.customerEmail || '-') +
            infoRow('Araç', car) +
            infoRow('Tarih Aralığı', `${pickupDate} → ${dropoffDate}`) +
            infoRow('Toplam Tutar', `${booking.totalPrice} TL`, true)
        )}

        ${sectionTitle('⚠️', 'Yapılması Gerekenler')}
        ${bulletList([
            'Araç müsaitlik kontrolü',
            'Teslim planlaması',
            'Gerekli ise müşteri ile iletişime geçilmesi',
        ])}

        <p style="color:#9ca3af;font-size:12px;margin-top:24px;font-style:italic;">
            Sistem tarafından otomatik oluşturulmuştur.
        </p>
    `;

    return sendMail(
        adminEmail,
        `🔔 Yeni Rezervasyon Oluşturuldu | ${booking.bookingCode}`,
        wrapHtml('Yeni Rezervasyon', content),
    );
}

// ─── 3. Insurance Expiry Reminder → Admin ──────────────────────────────
export async function sendInsuranceExpiryReminder(adminEmail: string, insurances: any[]): Promise<boolean> {
    const rows = insurances.map((ins) => {
        const expiryDate = new Date(ins.startDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const urgencyColor = daysLeft <= 3 ? '#dc2626' : daysLeft <= 7 ? '#f59e0b' : '#16a34a';

        return `<tr>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-size:13px;">${ins.fullName}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-size:13px;">${ins.plate || '-'}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-size:13px;">${ins.branch}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-size:13px;">${ins.company}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-size:13px;">${ins.policyNo}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111;font-size:13px;">${expiryDate.toLocaleDateString('tr-TR')}</td>
            <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center;">
                <span style="display:inline-block;padding:3px 12px;border-radius:12px;background:${urgencyColor}15;color:${urgencyColor};font-weight:700;font-size:13px;">${daysLeft} gün</span>
            </td>
        </tr>`;
    }).join('');

    const minDays = Math.min(...insurances.map(ins => {
        const exp = new Date(ins.startDate);
        exp.setFullYear(exp.getFullYear() + 1);
        return Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    }));

    const content = `
        <h2 style="margin:0 0 8px;color:#111;font-size:22px;">⚠️ Sigorta Bitiş Uyarısı</h2>
        <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">
            Aşağıdaki <strong>${insurances.length}</strong> sigorta poliçesi yakında sona ermektedir.
        </p>

        ${sectionTitle('📋', 'Sigorta Detayları')}
        <table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:13px;">
            <thead>
                <tr style="background:#f9fafb;">
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;font-weight:600;">Ad Soyad</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;font-weight:600;">Plaka</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;font-weight:600;">Branş</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;font-weight:600;">Şirket</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;font-weight:600;">Poliçe No</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:left;color:#374151;font-weight:600;">Bitiş</th>
                    <th style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center;color:#374151;font-weight:600;">Kalan</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>

        ${sectionTitle('⚠️', 'Önemli')}
        ${bulletList([
            'Poliçelerin zamanında yenilenmesi gerekmektedir.',
            'Gecikmeler yasal ve operasyonel risk oluşturabilir.',
        ])}

        <p style="color:#9ca3af;font-size:12px;margin-top:24px;font-style:italic;">
            Bu bildirim otomatik olarak oluşturulmuştur.
        </p>
    `;

    return sendMail(
        adminEmail,
        `⚠️ Sigorta Bitiş Uyarısı | ${minDays} Gün Kaldı`,
        wrapHtml('Sigorta Bitiş Uyarısı', content),
    );
}
