
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    // Find the Ankara branch (or any branch that needs renaming)
    const ankaraBranch = await prisma.branch.findFirst({
        where: { name: { contains: 'Ankara', mode: 'insensitive' } }
    });

    if (ankaraBranch) {
        console.log(`Found Ankara branch: ${ankaraBranch.name} (${ankaraBranch.id})`);
        const updated = await prisma.branch.update({
            where: { id: ankaraBranch.id },
            data: {
                name: 'Manisa Merkez Ofis',
                city: 'Manisa',
                address: 'Merkez, Manisa',
                phone: '0850 123 45 67'
            }
        });
        console.log('✅ Updated to Manisa Merkez Ofis:', updated);
    } else {
        console.log('No Ankara branch found. Checking for Manisa...');
        const manisaBranch = await prisma.branch.findFirst({
            where: { city: 'Manisa' }
        });
        if (manisaBranch) {
            console.log('Manisa branch already exists:', manisaBranch);
        } else {
            console.log('Creating Manisa branch...');
            await prisma.branch.create({
                data: {
                    name: 'Manisa Merkez Ofis',
                    city: 'Manisa',
                    address: 'Merkez, Manisa',
                    phone: '0850 123 45 67'
                }
            });
            console.log('✅ Created Manisa Merkez Ofis');
        }
    }
}
main().finally(() => prisma.$disconnect());
