import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Brands ---');

    console.log('1. Checking Distinct Brands in Car Table:');
    const cars = await prisma.car.findMany({
        select: { brand: true, status: true },
        distinct: ['brand', 'status']
    });
    console.log(JSON.stringify(cars, null, 2));

    console.log('\n2. Checking CarBrand Table:');
    const brands = await prisma.carBrand.findMany({
        select: { name: true, isActive: true },
    });
    console.log(JSON.stringify(brands, null, 2));

    console.log('\n3. Checking Intersection:');
    const distinctNames = [...new Set(cars.map(c => c.brand))];
    const brandNames = brands.map(b => b.name);

    const missing = distinctNames.filter(d => !brandNames.some(b => b.toLowerCase() === d.toLowerCase()));
    console.log('Brands in Car but MISSING in CarBrand:', missing);

    const match = brandNames.filter(b => distinctNames.some(d => d.toLowerCase() === b.toLowerCase()));
    console.log('Matching Brands (should appear):', match);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
