
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const brands = [
    // German
    { name: 'BMW', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
    { name: 'Mercedes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Benz_Logo_2010.svg' },
    { name: 'Audi', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg' },
    { name: 'Volkswagen', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg' },
    { name: 'Opel', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Opel_Logo_2020.svg' },
    { name: 'Porsche', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Porsche_logo.svg' },
    // French
    { name: 'Renault', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Textless_logo.svg' },
    { name: 'Peugeot', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg' },
    { name: 'Citroen', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Citroen_2022_logo.svg' },
    { name: 'Dacia', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/db/Dacia_Logo_2021.svg' },
    // Italian
    { name: 'Fiat', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg' },
    { name: 'Alfa Romeo', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Alfa_Romeo_logo.png' },
    // Japanese
    { name: 'Toyota', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg' },
    { name: 'Honda', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg' },
    { name: 'Nissan', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png' },
    { name: 'Suzuki', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg' },
    // Korean
    { name: 'Hyundai', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Hyundai_Motor_Company_logo.svg' },
    { name: 'Kia', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo.svg' },
    // American
    { name: 'Ford', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg' },
    { name: 'Jeep', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/JEEP_logo.svg' },
    { name: 'Tesla', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png' },
    // British
    { name: 'Land Rover', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Land_Rover_logo.svg/1200px-Land_Rover_logo.svg.png' },
    { name: 'Mini', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/MINI_logo.svg' },
    // Other
    { name: 'Volvo', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Volvo_Iron_Mark.svg' },
    { name: 'Skoda', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Skoda_Auto_logo_%282023%29.svg' },
    { name: 'SEAT', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Seat_Logo_2012.svg' },
    { name: 'Cupra', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Cupra_Logo.svg' },
    { name: 'Chery', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2c/Chery_Automobile_logo.svg' },
    { name: 'MG', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/MG_Motor_logo.svg' },
    { name: 'TOGG', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Togg_logo.svg' },
];

async function main() {
    console.log('Updating brand logos...');
    for (const brand of brands) {
        // Find if brand exists
        const existing = await prisma.carBrand.findFirst({ where: { name: brand.name } });
        if (existing) {
            await prisma.carBrand.update({
                where: { id: existing.id },
                data: { logoUrl: brand.logoUrl }
            });
            console.log(`Updated ${brand.name} logo`);
        } else {
            console.log(`Brand ${brand.name} not found, skipping.`);
        }
    }
    console.log('Done!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
