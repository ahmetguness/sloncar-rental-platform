
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    let output = '--- Debugging Brands ---\n';

    // 1. Get cars
    const cars = await prisma.car.findMany({
        select: { brand: true, model: true },
        distinct: ['brand']
    });
    output += `Unique Brands in Car Table: ${cars.map(c => c.brand).join(', ')}\n`;

    // 2. Get CarBrands
    const carBrands = await prisma.carBrand.findMany();
    output += '\nAll CarBrands in DB:\n';
    carBrands.forEach(b => {
        output += `- Name: "${b.name}", Active: ${b.isActive}, Logo: ${b.logoUrl}\n`;
    });

    // 3. Match Logic
    const existingBrandNames = new Set(cars.map(c => c.brand.toLowerCase()));
    const matched = carBrands.filter(b => existingBrandNames.has(b.name.toLowerCase()));

    output += '\nMatched Brands (Sent to Frontend):\n';
    matched.forEach(b => {
        output += `- ${b.name}: ${b.logoUrl}\n`;
    });

    fs.writeFileSync('debug_output.txt', output);
    console.log('Output written to debug_output.txt');
}

main()
    .catch((e: unknown) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
