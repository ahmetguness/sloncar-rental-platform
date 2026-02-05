
import prisma from '../src/lib/prisma';

interface BrandData {
    name: string;
    image: {
        optimized: string;
    };
}

async function main() {
    console.log('🌱 Starting Brand Seeding...');

    try {
        const response = await fetch('https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/data.json');

        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const brands: BrandData[] = await response.json();
        console.log(`📦 Fetched ${brands.length} brands from remote source.`);

        let count = 0;

        for (const brand of brands) {
            // We focus on popular brands to avoid clogging the DB with 300+ obscure ones, 
            // OR we just import them all. User said "search free api", so import all seems fair, 
            // but maybe limit to common ones if needed. For now, let's import all.

            // Upsert to avoid duplicates
            await prisma.carBrand.upsert({
                where: { name: brand.name },
                update: {
                    logoUrl: brand.image.optimized
                },
                create: {
                    name: brand.name,
                    logoUrl: brand.image.optimized
                }
            });
            process.stdout.write('.');
            count++;
        }

        console.log(`\n✅ Successfully seeded ${count} brands.`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
