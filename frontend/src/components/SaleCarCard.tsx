"use client";
import { useState } from 'react';
import type { Car } from '../services/types';
import {
    Fuel, Cog, ArrowRight, ChevronLeft, ChevronRight,
    Gauge, Calendar, Palette
} from 'lucide-react';
import Link from 'next/link';
import { translateFuel } from '../utils/translate';
import { optimizeCloudinaryUrl } from '../utils/cloudinaryOptimize';

interface SaleCarCardProps {
    car: Car;
}

const SaleImageCarousel = ({ images, alt }: { images: string[], alt: string }) => {
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
                    <div key={idx} className="w-full h-full flex-shrink-0 flex items-center justify-center p-4">
                        <img
                            src={optimizeCloudinaryUrl(img, 'card')}
                            alt={`${alt} - ${idx + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="max-w-full max-h-full object-contain"
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

export const SaleCarCard = ({ car }: SaleCarCardProps) => {
    return (
        <Link
            href={`/arac/${car.id}`}
            className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-black/5"
        >
            {/* Header */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div>
                    <span className="text-[11px] font-semibold text-green-600 uppercase tracking-wide">
                        2. El Satılık
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mt-0.5 truncate">
                        {car.brand} {car.model}
                    </h3>
                </div>
            </div>

            {/* Image */}
            <div className="aspect-[16/9] bg-white border-y border-gray-100">
                <SaleImageCarousel images={car.images} alt={`${car.brand} ${car.model} satılık araç Manisa`} />
            </div>

            {/* Key Specs - Grid */}
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
                <SpecBadge icon={<Gauge size={14} />} label="Kilometre" value={`${Number(car.mileage).toLocaleString('tr-TR')} km`} />
                <SpecBadge icon={<Fuel size={14} />} label="Yakıt" value={translateFuel(car.fuel)} />
                <SpecBadge icon={<Cog size={14} />} label="Vites" value={car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel'} />
                <SpecBadge icon={<Palette size={14} />} label="Renk" value={car.color} />
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mx-4" />

            {/* Price + CTA */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Satış Fiyatı</p>
                    <div className="text-xl font-bold text-green-600 flex items-baseline gap-0.5">
                        {Number(car.salePrice).toLocaleString('tr-TR')}
                        <span className="text-xs font-semibold text-green-500">₺</span>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors whitespace-nowrap">
                    Detayları Gör
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
            </div>
        </Link>
    );
};

const SpecBadge = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
        <span className="text-gray-400 flex-shrink-0">{icon}</span>
        <div className="min-w-0">
            <p className="text-[10px] text-gray-400 font-medium uppercase leading-none">{label}</p>
            <p className="text-sm text-gray-800 font-semibold truncate">{value}</p>
        </div>
    </div>
);
