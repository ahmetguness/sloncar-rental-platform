import cron from 'node-cron';
import { cancelExpiredBookings } from '../modules/bookings/bookings.service.js';
import { insuranceService } from '../modules/insurance/insurance.service.js';

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

        // Run every day at midnight for daily tasks (e.g. insurances)
        cron.schedule('0 0 * * *', async () => {
            try {
                // console.log('[CRON] Running daily checks...');
                await insuranceService.checkInsuranceExpiries();
            } catch (error) {
                console.error('[CRON] Error during daily checks:', error);
            }
        });

        console.log('[CRON] Cron service initialized.');
    }
};
