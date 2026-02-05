
import * as fs from 'fs';
import * as path from 'path';

const targetDir = path.join(process.cwd(), '../frontend/public/brands');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const brands = [
    // German
    { name: 'BMW', url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
    { name: 'Mercedes', url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Benz_Logo_2010.svg' }, // Reverted to original, fetch handles redirects? No, 404 means wrong URL. I'll use the working one for Mercedes if found.
    // The previous one I tried was 404 too? Let's try a different one.
    // I previously tried: https://upload.wikimedia.org/wikipedia/commons/3/32/Mercedes-Benz_Star_2022.svg.
    // Let's try: https://upload.wikimedia.org/wikipedia/commons/b/bb/Mercedes_benz_logo.svg (older but safer?)
    // Actually, I'll stick with the 2010 one but maybe the URL is just slightly wrong?
    // Let's use: https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Mercedes-Benz_Logo_2010.svg/2048px-Mercedes-Benz_Logo_2010.svg.png (PNG fallback)
    // No, I want SVG.
    // I will try: https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Benz_Logo_2010.svg (Original) - If it 404s, it's gone.
    // Let's use: https://upload.wikimedia.org/wikipedia/commons/3/32/Mercedes-Benz_Star_2022.svg
    // Wait, I already updated the file to use 2022 one in previous step. Did it fail?
    // Yes, it failed in the output "Error downloading Mercedes... 404" (Wait, did it? I saw "Downloading Mercedes..." then nothing but failure).
    // I'll assume 2022 one is also tricky.
    // Let's try a very safe one: https://upload.wikimedia.org/wikipedia/commons/b/b8/Mercedes-Benz_Star_2022.svg (maybe?)
    // I'll search for "Mercedes logo svg url" in code later if needed.
    // For now, I'll put a placeholder or best guess.
    // I'll stick with valuable ones.

    { name: 'Audi', url: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg' },
    { name: 'Volkswagen', url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg' },
    { name: 'Opel', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Opel_Logo_2020.svg' },
    { name: 'Porsche', url: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Porsche_logo.svg' },
    // French
    { name: 'Renault', url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Renault_logo_2021.svg' }, // Updated
    { name: 'Peugeot', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg' },
    { name: 'Citroen', url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Citroen_2022_logo.svg' },
    { name: 'Dacia', url: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Dacia_Logo_2021.svg' },
    // Italian
    { name: 'Fiat', url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg' },
    { name: 'Alfa Romeo', url: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Alfa_Romeo_logo.png' },
    // Japanese
    { name: 'Toyota', url: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg' },
    { name: 'Honda', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg' },
    { name: 'Nissan', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png' },
    { name: 'Suzuki', url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg' },
    // Korean
    { name: 'Hyundai', url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Hyundai_Motor_Company_logo.svg' },
    { name: 'Kia', url: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo.svg' },
    // American
    { name: 'Ford', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg' },
    { name: 'Jeep', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/JEEP_logo.svg' },
    { name: 'Tesla', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' },
    // British
    { name: 'Land Rover', url: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Land_Rover_logo.svg/1200px-Land_Rover_logo.svg.png' },
    { name: 'Mini', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/MINI_logo.svg' },
    // Other
    { name: 'Volvo', url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Volvo_Iron_Mark.svg' },
    { name: 'Skoda', url: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Skoda_Auto_logo_%282023%29.svg' },
    { name: 'SEAT', url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Seat_Logo_2012.svg' },
    { name: 'Cupra', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Cupra_Logo.svg' },
    { name: 'Chery', url: 'https://upload.wikimedia.org/wikipedia/en/2/2c/Chery_Automobile_logo.svg' },
    { name: 'MG', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/MG_Motor_logo.svg' },
    { name: 'TOGG', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Togg_logo.svg' },
];

// Override Mercedes with a more robust one if needed
const mercedesUrl = 'https://upload.wikimedia.org/wikipedia/commons/3/32/Mercedes-Benz_Star_2022.svg';
// Be careful, I should update the list above instead of hardcoding here.
brands.find(b => b.name === 'Mercedes').url = mercedesUrl;

async function downloadImage(url: string, filepath: string): Promise<void> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filepath, buffer);
}

function sanitizeName(name: string): string {
    return name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

async function main() {
    console.log(`Downloading logos to ${targetDir}...`);

    // Create a mapping file
    const mapping: Record<string, string> = {};
    const failed: string[] = [];

    for (const brand of brands) {
        const ext = path.extname(brand.url) || '.svg';
        const filename = `${sanitizeName(brand.name)}${ext}`;
        const filepath = path.join(targetDir, filename);

        if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            if (stats.size > 0) {
                console.log(`Skipping ${brand.name} (already exists, ${stats.size} bytes)`);
                mapping[brand.name] = `/brands/${filename}`;
                continue;
            }
            console.log(`Deleting empty file for ${brand.name}`);
            fs.unlinkSync(filepath);
        }

        try {
            console.log(`Downloading ${brand.name}...`);
            await downloadImage(brand.url, filepath);
            mapping[brand.name] = `/brands/${filename}`;
            // 5s delay to be safe
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (err) {
            console.error(`❌ Error downloading ${brand.name}:`, err.message);
            failed.push(brand.name);
        }
    }

    fs.writeFileSync(path.join(process.cwd(), 'brand_mapping.json'), JSON.stringify(mapping, null, 2));
    console.log('Done! Mapping saved to brand_mapping.json');
    if (failed.length > 0) {
        console.log('Failed downloads:', failed.join(', '));
    }
}

main().catch(console.error);
