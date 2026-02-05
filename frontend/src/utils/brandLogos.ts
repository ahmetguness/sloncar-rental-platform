
// Map of common car brands to Public CDN logos
export const getBrandLogo = (brandName: string): string => {
    const normalized = brandName.toLowerCase();

    const logos: Record<string, string> = {
        'bmw': 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
        'mercedes': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Benz_Logo_2010.svg',
        'audi': 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
        'toyota': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg',
        'honda': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honda_Logo.svg',
        'ford': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Ford_logo_flat.svg',
        'hyundai': 'https://upload.wikimedia.org/wikipedia/commons/4/41/Hyundai_Motor_Company_logo.svg',
        'fiat': 'https://upload.wikimedia.org/wikipedia/commons/1/12/Fiat_Automobiles_logo.svg',
        'renault': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Renault_2021_Textless_logo.svg',
        'volkswagen': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg',
        'vw': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg',
        'tesla': 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png',
        'peugeot': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg',
        'citroen': 'https://upload.wikimedia.org/wikipedia/commons/3/39/Citroen_2022_logo.svg',
        'skoda': 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Skoda_Auto_logo_%282023%29.svg',
    };

    // Return specific logo or a generic fallback icon URL
    // For production, these should be local assets or a reliable CDN
    return logos[normalized] || '';
};
