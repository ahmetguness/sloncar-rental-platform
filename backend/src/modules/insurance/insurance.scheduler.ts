import cron from 'node-cron';
import prisma from '../../lib/prisma.js';
import { Logger } from '../../lib/logger.js';
import { sendInsuranceExpiryReminder } from '../../lib/mail.js';

/**
 * Check for insurances expiring within 10 days and email admins.
 * Runs daily at 09:00 Istanbul time.
 */
export function initInsuranceReminderScheduler(): void {
    cron.schedule('0 9 * * *', async () => {
        Logger.info('[Insurance Scheduler] Checking for expiring insurances...');
        try {
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Start of today

            const tenDaysFromNow = new Date(now);
            tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
            tenDaysFromNow.setHours(23, 59, 59, 999); // End of the 10th day

            // Insurance expires at startDate + 1 year
            // We want: now <= startDate + 1year <= tenDaysFromNow
            // So: now - 1year <= startDate <= tenDaysFromNow - 1year
            const startLower = new Date(now);
            startLower.setFullYear(startLower.getFullYear() - 1);
            const startUpper = new Date(tenDaysFromNow);
            startUpper.setFullYear(startUpper.getFullYear() - 1);

            const expiringInsurances = await prisma.insurance.findMany({
                where: {
                    startDate: {
                        gte: startLower,
                        lte: startUpper,
                    },
                    renewed: false,
                },
                orderBy: { startDate: 'asc' },
            });

            if (expiringInsurances.length === 0) {
                Logger.info('[Insurance Scheduler] No expiring insurances found.');
                return;
            }

            Logger.info(`[Insurance Scheduler] Found ${expiringInsurances.length} expiring insurance(s).`);

            // Get admin emails
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN', emailInsuranceEnabled: true },
                select: { email: true },
            });

            for (const admin of admins) {
                if (admin.email) {
                    await sendInsuranceExpiryReminder(admin.email, expiringInsurances);
                }
            }

            Logger.info('[Insurance Scheduler] Reminder emails sent.');
        } catch (err) {
            Logger.error('[Insurance Scheduler] Error:', err);
        }
    }, {
        timezone: 'Europe/Istanbul',
    });

    Logger.info('[Insurance Scheduler] ✅ Daily insurance reminder scheduled at 09:00 (Europe/Istanbul)');
}
