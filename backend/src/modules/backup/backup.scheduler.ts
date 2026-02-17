import cron from 'node-cron';
import { runBackup } from './backup.service.js';
import { Logger } from '../../lib/logger.js';

/**
 * Initialize the daily backup scheduler.
 * Runs at midnight (00:00) every day.
 */
export function initBackupScheduler(): void {
    // Schedule: 00:00 every day
    cron.schedule('0 0 * * *', async () => {
        Logger.info('[Backup Scheduler] Triggered daily backup job.');
        try {
            await runBackup();
        } catch (err) {
            Logger.error(`[Backup Scheduler] Unhandled error: ${err}`);
        }
    }, {
        timezone: 'Europe/Istanbul', // Turkish time zone
    });

    Logger.info('[Backup Scheduler] ✅ Daily backup scheduled at 00:00 (Europe/Istanbul)');
}
