
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// verified working

async function main() {
    console.log('Starting verification...');

    // 1. Find a user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No user found to test with.');
        process.exit(1);
    }
    console.log(`Found user: ${user.email} (${user.id})`);

    // 2. Create UserInsurance
    const policyNumber = `POL-${Date.now()}`;
    console.log(`Creating insurance with policy number: ${policyNumber}`);

    const insurance = await prisma.userInsurance.create({
        data: {
            userId: user.id,
            companyName: 'Test Insurance Co',
            policyNumber: policyNumber,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            coverageType: 'Full Coverage',
            isActive: true,
        },
    });

    console.log('Insurance created successfully:', insurance);

    // 3. Verify retrieval
    const retrieved = await prisma.userInsurance.findUnique({
        where: { id: insurance.id },
        include: { user: true },
    });

    if (!retrieved) {
        console.error('Failed to retrieve created insurance.');
        process.exit(1);
    }

    if (retrieved.user.id !== user.id) {
        console.error('Relation mismatch.');
        process.exit(1);
    }

    console.log('Verification successful! Insurance record linked to user.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
