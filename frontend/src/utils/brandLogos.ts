
import { BRANDS } from '../constants/brands';

// Map of common car brands to local assets
export const getBrandLogo = (brandName: string): string => {
    const normalized = brandName.toLowerCase().trim();

    // Find the brand in our static list
    const brand = BRANDS.find(b => {
        const name = b.name.toLowerCase();
        // Handle variations
        if (name === normalized) return true;
        if (normalized === 'vw' && name === 'volkswagen') return true;
        if (normalized.includes('mercedes') && name === 'mercedes-benz') return true;
        return name.includes(normalized) || normalized.includes(name);
    });

    return brand ? brand.logoUrl : '';
};

