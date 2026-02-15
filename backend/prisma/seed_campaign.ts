import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Sale Campaign...');

    const campaign = await prisma.campaign.create({
        data: {
            title: 'SADECE KİRALAMA,\nSAHİP OL.',
            description: 'SlonCar güvencesiyle, bakımlı ve ekspertiz garantili 2. el lüks araçlarımız satışta. Hayalinizdeki araca hemen ulaşın.',
            imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
            tag: 'YENİ HİZMET',
            requiredCondition: 'HAS_SALE_CARS',
            ctaText: 'ARAÇLARI İNCELE',
            ctaLink: '/second-hand',
            isActive: true,
            order: 10
        },
    });

    console.log('Created campaign:', campaign);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
