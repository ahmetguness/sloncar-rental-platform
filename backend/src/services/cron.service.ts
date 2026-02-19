import cron from 'node-cron';
import { cancelExpiredBookings } from '../modules/bookings/bookings.service.js';

export const cronService = {
    init: () => {
        // Run every minute
        cron.schedule('* * * * *', async () => {
            try {
                // console.log('[CRON] Checking for expired bookings...');
                await cancelExpiredBookings();
            } catch (error) {
                console.error('[CRON] Error cancelling expired bookings:', error);
            }
        });

        console.log('[CRON] Cron service initialized.');
    }
};
