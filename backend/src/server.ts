import app from './app.js';
import { env } from './config/env.js';
import prisma from './lib/prisma.js';
import { initBackupScheduler } from './modules/backup/backup.scheduler.js';
import { initInsuranceReminderScheduler } from './modules/insurance/insurance.scheduler.js';
import { cronService } from './services/cron.service.js';

const PORT = env.APP_PORT;

async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Initialize Backup Scheduler
        initBackupScheduler();

        // Initialize Insurance Reminder Scheduler
        initInsuranceReminderScheduler();

        // Initialize Cron Service (Booking Expiration)
        cronService.init();

	app.set("trust proxy", 1);

        // Start server
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
            console.log(`🔧 Environment: ${env.NODE_ENV}`);
        });

        // Graceful shutdown function
        const shutdown = async (signal: string) => {
            console.log(`${signal} received, shutting down gracefully...`);

            server.close(async () => {
                console.log('HTTP server closed.');
                try {
                    await prisma.$disconnect();
                    console.log('Database connection closed.');
                    process.exit(0);
                } catch (err) {
                    console.error('Error during database disconnect:', err);
                    process.exit(1);
                }
            });

            // Force close after 10s if hanging
            setTimeout(() => {
                console.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
