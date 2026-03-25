"use client";
import { useState } from 'react';
import type { Car } from '../services/types';
import {
    Users, Briefcase, ShieldCheck, Fuel, Cog,
    ArrowRight, ChevronLeft, ChevronRight, IdCard, UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { translateCategory, translateFuel } from '../utils/translate';
import { optimizeCloudinaryUrl } from '../utils/cloudinaryOptimize';

interface CarCardProps {
    car: Car;
    brandLogoUrl?: string;
}

const CarImageCarousel = ({ images, alt }: { images: string[], alt: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <svg width="160" height="64" viewBox="0 0 200 80" fill="none" className="opacity-10">
                    <path d="M20 70 L40 30 L80 20 L150 20 L180 30 L190 70 Z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="50" cy="70" r="10" stroke="currentColor" strokeWidth="2" />
                    <circle cx="160" cy="70" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full group/carousel overflow-hidden bg-white">
            <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, idx) => (
                    <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center p-1.5">
                        <img
                            src={optimizeCloudinaryUrl(img, 'card')}
                            alt={`${alt} - ${idx + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain"
                        />
                    </div>
                ))}
            </div>

            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white/80 border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-white transition-all opacity-0 group-hover/carousel:opacity-100"
                        aria-label="Önceki görsel"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white/80 border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-white transition-all opacity-0 group-hover/carousel:opacity-100"
                        aria-label="Sonraki görsel"
                    >
                        <ChevronRight size={16} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex(idx); }}
                                className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-primary-500 w-4' : 'bg-gray-300 w-1.5'}`}
                                aria-label={`Görsel ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const CarCard = ({ car, brandLogoUrl }: CarCardProps) => {
    const seats = car.seats ?? 5;
    const largeLuggage = car.largeLuggage ?? 1;
    const smallLuggage = car.smallLuggage ?? 1;
    const hasAirbag = car.hasAirbag ?? true;
    const hasABS = car.hasABS ?? true;
    const minDriverAge = car.minDriverAge ?? 21;
    const minLicenseYear = car.minLicenseYear ?? 1;
    const logoSrc = car.brandLogo || brandLogoUrl;

    return (
        <Link
            href={`/rezervasyon/${car.id}`}
            className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-black/5"
        >
            {/* Header: Category + Name */}
            <div className="px-4 pt-4 pb-2">
                <span className="text-[11px] font-semibold text-primary-500 uppercase tracking-wide">
                    {translateCategory(car.category)} Kiralık Araç
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                    {logoSrc && (
                        <img
                            src={logoSrc}
                            alt={`${car.brand} logo`}
                            className="w-7 h-7 object-contain flex-shrink-0"
                        />
                    )}
                    <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">
                        {car.brand} {car.model}
                    </h3>
                </div>
            </div>

            {/* Image */}
            <div className="aspect-[16/10] mx-4 mt-1 rounded-lg bg-gray-50 overflow-hidden">
                <CarImageCarousel images={car.images} alt={`${car.brand} ${car.model} kiralık araç Manisa`} />
            </div>

            {/* Features List */}
            <div className="px-4 py-2.5 space-y-1.5">
                <FeatureRow icon={<Users size={15} />} text={`${seats} Yetişkin`} />
                <FeatureRow icon={<Briefcase size={15} />} text={`${largeLuggage} Büyük, ${smallLuggage} Küçük Bavul`} />
                <FeatureRow icon={<ShieldCheck size={15} />} text={hasAirbag ? 'Airbag' : 'Airbag Yok'} />
                <FeatureRow icon={<ShieldCheck size={15} />} text={hasABS ? 'ABS' : 'ABS Yok'} />
                <FeatureRow icon={<Fuel size={15} />} text={translateFuel(car.fuel)} />
                <FeatureRow icon={<Cog size={15} />} text={car.transmission === 'AUTO' ? 'Otomatik Vites' : 'Manuel Vites'} />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mx-4" />

            {/* Requirements */}
            <div className="px-4 py-3 space-y-1.5">
                <RequirementRow icon={<UserCheck size={14} />} text={`${minDriverAge} Yaş ve Üstü`} />
                <RequirementRow icon={<IdCard size={14} />} text={`Ehliyet Yaşı ${minLicenseYear} ve Üzeri`} />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mx-4" />

            {/* Price + CTA */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Günlük</p>
                    <div className="text-xl font-bold text-gray-900 flex items-baseline gap-0.5">
                        {Number(car.dailyPrice).toLocaleString('tr-TR')}
                        <span className="text-xs font-semibold text-gray-500">₺</span>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap">
                    Hemen Kirala
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
            </div>
        </Link>
    );
};

const FeatureRow = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <div className="flex items-center gap-2.5">
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <span className="text-sm text-gray-700 font-medium">{text}</span>
    </div>
);

const RequirementRow = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <div className="flex items-center gap-2">
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <span className="text-xs text-gray-500 font-medium">{text}</span>
    </div>
);
