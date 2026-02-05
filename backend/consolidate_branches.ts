
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    // 1. Find or Create the main "Manisa" branch
    let manisaBranch = await prisma.branch.findFirst({
        where: {
            name: { contains: 'Manisa', mode: 'insensitive' }
        }
    });

    if (!manisaBranch) {
        console.log('Creating main Manisa branch...');
        manisaBranch = await prisma.branch.create({
            data: {
                name: 'Manisa Merkez Ofis',
                city: 'Manisa',
                address: 'Merkez, Manisa',
                phone: '0850 123 45 67'
            }
        });
    } else {
        console.log('Using existing Manisa branch:', manisaBranch.name);
        // Ensure name is correct
        if (manisaBranch.name !== 'Manisa Merkez Ofis') {
            manisaBranch = await prisma.branch.update({
                where: { id: manisaBranch.id },
                data: { name: 'Manisa Merkez Ofis' }
            });
        }
    }

    const mainBranchId = manisaBranch.id;

    // 2. Find ALL other branches
    const otherBranches = await prisma.branch.findMany({
        where: {
            id: { not: mainBranchId }
        }
    });

    console.log(`Found ${otherBranches.length} other branches to migrate/delete.`);

    for (const oldBranch of otherBranches) {
        console.log(`Migrating data from ${oldBranch.name} (${oldBranch.id}) to Manisa...`);

        // Move Cars
        const cars = await prisma.car.updateMany({
            where: { branchId: oldBranch.id },
            data: { branchId: mainBranchId }
        });
        console.log(`  Moved ${cars.count} cars.`);

        // Move Pickup Bookings
        const pickups = await prisma.booking.updateMany({
            where: { pickupBranchId: oldBranch.id },
            data: { pickupBranchId: mainBranchId }
        });
        console.log(`  Moved ${pickups.count} pickup bookings.`);

        // Move Dropoff Bookings
        const dropoffs = await prisma.booking.updateMany({
            where: { dropoffBranchId: oldBranch.id },
            data: { dropoffBranchId: mainBranchId }
        });
        console.log(`  Moved ${dropoffs.count} dropoff bookings.`);

        // Delete the old branch
        try {
            await prisma.branch.delete({
                where: { id: oldBranch.id }
            });
            console.log(`  Deleted branch ${oldBranch.name}`);
        } catch (e) {
            console.error(`  Failed to delete branch ${oldBranch.name}:`, e);
        }
    }
}
main().finally(() => prisma.$disconnect());
