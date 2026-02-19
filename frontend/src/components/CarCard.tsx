import { useState } from 'react';
import type { Car } from '../services/types';
import { Fuel, Cog, Car as CarIcon, ArrowRight, Gauge, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { translateCategory, translateFuel } from '../utils/translate';
import { getBrandLogo } from '../utils/brandLogos';

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

    const goToSlide = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex(index);
    };

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-700 flex-col bg-dark-bg">
                <CarIcon className="w-16 h-16 mb-2 opacity-30" />
                <span className="text-sm font-medium opacity-50">Görsel Bekleniyor</span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full group/carousel overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-surface-lighter to-transparent z-10 opacity-60 pointer-events-none" />

            {/* Images */}
            <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, idx) => (
                    <img
                        key={idx}
                        src={img}
                        alt={`${alt} - ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover flex-shrink-0 brightness-90 group-hover/card:brightness-100 transition-all duration-700 group-hover/card:scale-110"
                    />
                ))}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-primary-500 transition-all opacity-0 group-hover/carousel:opacity-100"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-primary-500 transition-all opacity-0 group-hover/carousel:opacity-100"
                    >
                        <ChevronRight size={16} />
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                        {images.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => goToSlide(e, idx)}
                                className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-primary-500 w-4' : 'bg-white/30 w-1 hover:bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export const CarCard = ({ car, brandLogoUrl }: CarCardProps) => {
    // Fallback to helper if prop not provided, prioritizing car.brandLogo
    const logoUrl = car.brandLogo || brandLogoUrl || getBrandLogo(car.brand);

    const targetLink = car.type === 'SALE' ? `/car/${car.id}` : `/book/${car.id}`;

    return (
        <Link
            to={targetLink}
            className="group/card block h-full relative bg-dark-surface-lighter rounded-3xl shadow-lg border border-white/5 hover:border-primary-500/30 overflow-hidden hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_0_30px_rgba(30,27,75,0.5)]"
        >
            {/* Glow Effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Image Area */}
            <div className="aspect-video bg-dark-bg relative overflow-hidden">
                <CarImageCarousel images={car.images} alt={`${car.brand} ${car.model}`} />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
                        {translateCategory(car.category)}
                    </span>
                    {car.isFeatured && (
                        <span className="bg-primary-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg border border-primary-400/20 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            Fırsat
                        </span>
                    )}
                </div>

                {/* Bottom Badge (Status or Mileage) */}
                <div className="absolute bottom-4 left-4 z-20">
                    {car.type === 'SALE' ? (
                        <div className="bg-dark-surface/80 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg flex items-center gap-1.5 border border-white/10">
                            <Gauge className="w-3.5 h-3.5 text-primary-500" />
                            {car.mileage.toLocaleString()} KM
                        </div>
                    ) : (
                        <span className="bg-green-600/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 border border-green-400/20">
                            <Check size={12} className="stroke-[3px]" /> Müsait
                        </span>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-black text-white group-hover/card:text-primary-400 transition-colors leading-tight mb-1 truncate" title={`${car.brand} ${car.model}`}>
                            {car.brand} <span className="font-medium text-gray-300">{car.model}</span>
                        </h3>
                        <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                            {car.year}
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span className="capitalize">{car.color}</span>
                        </div>
                    </div>
                    {logoUrl && (
                        <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                            <img src={logoUrl} alt={car.brand} className="w-6 h-6 object-contain opacity-80 group-hover/card:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>

                {/* Specs Grid - Simplified */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-dark-bg/50 px-3 py-2 rounded-lg border border-white/5">
                        <Cog className="w-3.5 h-3.5 text-primary-500" />
                        {car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-dark-bg/50 px-3 py-2 rounded-lg border border-white/5">
                        <Fuel className="w-3.5 h-3.5 text-primary-500" />
                        <span className="capitalize">{translateFuel(car.fuel)}</span>
                    </div>
                </div>

                {/* Footer with Price */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">
                            {car.type === 'SALE' ? 'Satış Fiyatı' : 'Günlük Kiralama'}
                        </p>
                        <div className="text-2xl font-black text-white flex items-baseline gap-1">
                            {Number(car.type === 'SALE' ? car.salePrice : car.dailyPrice).toLocaleString()}
                            <span className="text-sm font-bold text-primary-500">₺</span>
                        </div>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-white text-dark-bg flex items-center justify-center group-hover/card:bg-primary-500 group-hover/card:text-white transition-all transform group-hover/card:scale-110 shadow-lg">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </Link>
    );
};
