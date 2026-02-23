import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const totalCount = await prisma.insurance.count();
    const uniqueTCCount = await (await prisma.insurance.groupBy({ by: ['tcNo'] })).length;

    console.log(`Total Records: ${totalCount}`);
    console.log(`Unique Clients (TC): ${uniqueTCCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
