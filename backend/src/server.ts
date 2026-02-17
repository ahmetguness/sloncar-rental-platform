import app from './app.js';
import { env } from './config/env.js';
import prisma from './lib/prisma.js';
import { initBackupScheduler } from './modules/backup/backup.scheduler.js';

const PORT = env.APP_PORT;

async function main() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Initialize Backup Scheduler
        initBackupScheduler();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📚 API Docs available at http://localhost:${PORT}/api-docs`);
            console.log(`🔧 Environment: ${env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

main();
