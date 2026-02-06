
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating brand logos to local paths...');

    const mappingPath = path.join(process.cwd(), 'brand_mapping.json');
    if (!fs.existsSync(mappingPath)) {
        console.error('brand_mapping.json not found!');
        return;
    }

    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

    for (const [name, logoUrl] of Object.entries(mapping)) {
        // Find if brand exists
        const existing = await prisma.carBrand.findFirst({ where: { name } });
        if (existing) {
            await prisma.carBrand.update({
                where: { id: existing.id },
                data: { logoUrl: logoUrl as string } // e.g. /brands/bmw.svg
            });
            console.log(`Updated ${name} -> ${logoUrl}`);
        } else {
            console.log(`Brand ${name} not found in DB, skipping.`);
        }
    }
    console.log('Done!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
