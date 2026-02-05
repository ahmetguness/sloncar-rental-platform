
import * as fs from 'fs';
import * as path from 'path';

const targetDir = path.join(process.cwd(), '../frontend/public/brands');
const brands: { name: string; slug: string }[] = [
    { name: 'Opel', slug: 'opel' },
    { name: 'Porsche', slug: 'porsche' },
    { name: 'Renault', slug: 'renault' },
    { name: 'Citroen', slug: 'citroen' },
    { name: 'Dacia', slug: 'dacia' },
    { name: 'Alfa Romeo', slug: 'alfa-romeo' },
    { name: 'Nissan', slug: 'nissan' },
    { name: 'Suzuki', slug: 'suzuki' },
    { name: 'Hyundai', slug: 'hyundai' },
    { name: 'Kia', slug: 'kia' },
    { name: 'Jeep', slug: 'jeep' },
    { name: 'Land Rover', slug: 'land-rover' },
    { name: 'Volvo', slug: 'volvo' },
    { name: 'Skoda', slug: 'skoda' },
    { name: 'SEAT', slug: 'seat' },
    { name: 'Cupra', slug: 'cupra' },
    { name: 'Chery', slug: 'chery' },
    { name: 'MG', slug: 'mg-motor' }, // guessed slug
    { name: 'TOGG', slug: 'togg' },
];

async function downloadImage(url: string, filepath: string): Promise<boolean> {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`Failed ${url}: ${res.status}`);
            return false;
        }
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(filepath, buffer);
        return true;
    } catch (err: any) {
        console.error(`Error ${url}:`, err.message);
        return false;
    }
}

async function main() {
    const mappingPath = path.join(process.cwd(), 'brand_mapping.json');
    let mapping: Record<string, string> = {};
    if (fs.existsSync(mappingPath)) {
        mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    }

    /*
    Source: https://github.com/filippofilip95/car-logos-dataset
    Base URL: https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/{slug}.png
    */

    for (const brand of brands) {
        // Check if map already has it AND file exists
        const currentPath = mapping[brand.name];
        if (currentPath) {
            const localPath = path.join(targetDir, path.basename(currentPath));
            if (fs.existsSync(localPath) && fs.statSync(localPath).size > 0) {
                console.log(`Skipping ${brand.name} (already exists)`);
                continue;
            }
        }

        const filename = `${brand.slug}.png`;
        const filepath = path.join(targetDir, filename);
        const url = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized/${brand.slug}.png`;

        console.log(`Downloading ${brand.name} from ${url}...`);
        const success = await downloadImage(url, filepath);

        if (success) {
            mapping[brand.name] = `/brands/${filename}`;
            console.log(`✅ Downloaded ${brand.name}`);
        } else {
            // Try alternative slug
            const altUrl = `https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/original/${brand.slug}.svg`;
            console.log(`Trying fallback SVG: ${altUrl}`);
            const svgSuccess = await downloadImage(altUrl, filepath.replace('.png', '.svg'));
            if (svgSuccess) {
                mapping[brand.name] = `/brands/${brand.slug}.svg`;
                console.log(`✅ Downloaded ${brand.name} (SVG)`);
            } else {
                console.log(`❌ Failed to download ${brand.name}`);
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
    console.log('Done! Updated brand_mapping.json');
}

main().catch((err: unknown) => console.error(err));
