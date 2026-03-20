"use client";
import { useState, useEffect } from 'react';
import { BRANDS } from '../../constants/brands';

export const BrandLogo = ({ name, url, className = "w-8 h-8", variant = "dark" }: { name: string, url?: string, className?: string, variant?: "dark" | "light" }) => {
    const [imageSrc, setImageSrc] = useState<any>(url || null);
    const [hasError, setHasError] = useState(false);

    const getLocalLogo = (brandName: string) => {
        const brand = BRANDS.find(b => 
            b.name.toLowerCase() === brandName.toLowerCase() || 
            brandName.toLowerCase().includes(b.name.toLowerCase()) ||
            b.name.toLowerCase().includes(brandName.toLowerCase())
        );
        if (brand && brand.logoUrl) {
            return brand.logoUrl.src || brand.logoUrl;
        }
        return null;
    };

    useEffect(() => {
        if (url) {
            setImageSrc(url);
            setHasError(false);
        } else {
            const localLogo = getLocalLogo(name);
            if (localLogo) {
                setImageSrc(localLogo);
                setHasError(false);
            } else {
                setHasError(true);
            }
        }
    }, [url, name]);

    const handleError = () => {
        if (imageSrc === url && url) {
            const localLogo = getLocalLogo(name);
            if (localLogo) {
                setImageSrc(localLogo);
                setHasError(false);
            } else {
                setHasError(true);
            }
        } else {
            setHasError(true);
        }
    };

    if (hasError || !imageSrc) {
        const fallbackClasses = variant === "light"
            ? "bg-gray-100 text-gray-500 border-gray-200"
            : "bg-white/10 text-white border-white/10";
        return (
            <div className={`${className} rounded-full flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0 border ${fallbackClasses}`}>
                {name?.substring(0, 2)}
            </div>
        );
    }

    const imgClasses = variant === "light"
        ? "bg-gray-50 rounded-full p-0.5"
        : "bg-white/5 rounded-full p-0.5";

    return (
        <img
            src={imageSrc}
            alt={name}
            className={`${className} object-contain ${imgClasses}`}
            onError={handleError}
        />
    );
};
