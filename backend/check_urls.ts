
const urls = [
    'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
    'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Benz_Logo_2010.svg',
    'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg',
    'https://upload.wikimedia.org/wikipedia/commons/f/f9/Opel_Logo_2020.svg',
    'https://upload.wikimedia.org/wikipedia/en/8/8c/Porsche_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Textless_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/3/39/Citroen_2022_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/d/db/Dacia_Logo_2021.svg',
    'https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/9/9e/Alfa_Romeo_logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/8/8c/Nissan_logo.png',
    'https://upload.wikimedia.org/wikipedia/commons/1/12/Suzuki_logo_2.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/41/Hyundai_Motor_Company_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/4/47/Kia_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e8/JEEP_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png',
    'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Land_Rover_logo.svg/1200px-Land_Rover_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/e/e9/MINI_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/29/Volvo_Iron_Mark.svg',
    'https://upload.wikimedia.org/wikipedia/commons/a/ac/Skoda_Auto_logo_%282023%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/25/Seat_Logo_2012.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2c/Cupra_Logo.svg',
    'https://upload.wikimedia.org/wikipedia/en/2/2c/Chery_Automobile_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/b/b7/MG_Motor_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/7/7c/Togg_logo.svg',
];

async function checkUrls() {
    console.log('Checking URLs...');
    for (const url of urls) {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            if (res.ok) {
                console.log(`✅ ${url} - OK`);
            } else {
                console.log(`❌ ${url} - Status: ${res.status}`);
            }
        } catch (err) {
            console.log(`❌ ${url} - Error: ${err.message}`);
        }
    }
}

checkUrls();
