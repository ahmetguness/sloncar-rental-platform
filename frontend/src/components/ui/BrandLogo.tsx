import { useState, useEffect } from 'react';

// Load all brand logos from assets
const BRAND_LOGOS = import.meta.glob('/src/assets/logo/brand_logos/*.png', { eager: true, query: '?url', import: 'default' });

export const BrandLogo = ({ name, url, className = "w-8 h-8" }: { name: string, url?: string, className?: string }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(url || null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (url) {
            setImageSrc(url);
            setHasError(false);
        } else {
            // Try to find local logo
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

            const localLogoKey = Object.keys(BRAND_LOGOS).find(key => {
                const fileName = key.split('/').pop()?.replace('.png', '') || '';
                return normalize(fileName) === normalize(name);
            });

            if (localLogoKey) {
                setImageSrc(BRAND_LOGOS[localLogoKey] as string);
                setHasError(false);
            } else {
                setHasError(true);
            }
        }
    }, [url, name]);

    // Handle image load error
    const handleError = () => {
        if (imageSrc === url && url) {
            // If remote URL failed, try local
            const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
            const localLogoKey = Object.keys(BRAND_LOGOS).find(key => {
                const fileName = key.split('/').pop()?.replace('.png', '') || '';
                return normalize(fileName) === normalize(name);
            });

            if (localLogoKey) {
                setImageSrc(BRAND_LOGOS[localLogoKey] as string);
                setHasError(false); // Reset error because we have a new candidate
            } else {
                setHasError(true);
            }
        } else {
            setHasError(true);
        }
    };

    if (hasError || !imageSrc) {
        return (
            <div className={`${className} rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white uppercase flex-shrink-0 border border-white/10`}>
                {name?.substring(0, 2)}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={name}
            className={`${className} object-contain bg-white/5 rounded-full p-0.5`}
            onError={handleError}
        />
    );
};
