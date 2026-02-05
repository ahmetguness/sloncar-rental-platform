
export const translateCategory = (category: string): string => {
    const map: Record<string, string> = {
        'ECONOMY': 'Ekonomi',
        'COMPACT': 'Kompakt',
        'MIDSIZE': 'Orta',
        'FULLSIZE': 'Büyük',
        'SUV': 'SUV',
        'VAN': 'Van',
        'LUXURY': 'Lüks',
    };
    return map[category] || category;
};

export const translateFuel = (fuel: string): string => {
    const map: Record<string, string> = {
        'PETROL': 'Benzin',
        'DIESEL': 'Dizel',
        'ELECTRIC': 'Elektrik',
        'HYBRID': 'Hibrit',
        'LPG': 'LPG',
    };
    return map[fuel] || fuel;
};
