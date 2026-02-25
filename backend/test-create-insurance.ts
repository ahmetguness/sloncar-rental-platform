import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.insurance.updateMany({
            where: {
                policyNo: 'EXPIRE-12345678'
            },
            data: {
                adminRead: false
            }
        });
        console.log('Success updated expiring insurance to unread:', result);
    } catch (error) {
        console.error('Error during update:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
