import { useEffect, useState } from 'react';

const BRAND_LOGOS = import.meta.glob('/src/assets/logo/brand_logos/*.png', { eager: true, query: '?url', import: 'default' });

interface BrandLogoProps {
    name: string;
    url?: string;
    className?: string;
}

export const BrandLogo = ({ name, url, className = "w-8 h-8" }: BrandLogoProps) => {
    const [imageSrc, setImageSrc] = useState<string | null>(url || null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (url) {
            setImageSrc(url);
            setHasError(false);
        } else {
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

    const handleError = () => {
        if (imageSrc === url && url) {
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
        } else {
            setHasError(true);
        }
    };

    if (hasError || !imageSrc) {
        return (
            <div className={`${className} rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase flex-shrink-0 border border-white/10`}>
                {name?.substring(0, 2)}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={name}
            className={`${className} object-contain bg-white/10 rounded-full p-1 border border-white/5 shadow-inner`}
            onError={handleError}
        />
    );
};
