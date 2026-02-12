
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning database...');

    const tables = [
        'FranchiseAuditLog',
        'FranchiseProfile',
        'FranchiseApplication',
        'Booking',
        'Car',
        'Branch',
        'CarBrand',
        'User'
    ];

    for (const table of tables) {
        console.log(`Deleting from ${table}...`);
        try {
            await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
            console.log(`✅ Deleted from ${table}`);
        } catch (e) {
            console.error(`❌ Failed to delete from ${table}:`, e);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
