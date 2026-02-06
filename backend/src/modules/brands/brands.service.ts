import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';

export async function listBrands() {
    // 1. Get distinct brands from the Car table (ignoring status to match general visibility)
    const distinctCarBrands = await prisma.car.findMany({
        where: {
            status: { not: 'INACTIVE' }
        },
        select: { brand: true },
        distinct: ['brand']
    });

    const existingBrandNames = new Set(distinctCarBrands.map(c => c.brand.toLowerCase()));

    // 2. Fetch all active brand logos
    const allBrands = await prisma.carBrand.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });

    // 3. Filter: Return only brands that exist in the Car table
    return allBrands.filter(b => existingBrandNames.has(b.name.toLowerCase()));
}

// Returns ALL brands (for admin car form dropdown)
export async function listAllBrands() {
    return prisma.carBrand.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });
}

