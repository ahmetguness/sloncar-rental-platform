import { useState, useEffect } from 'react';
import type { Car } from '../services/types';
import { Fuel, Cog, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { translateCategory, translateFuel } from '../utils/translate';

interface CarCardProps {
    car: Car;
    brandLogoUrl?: string;
}

const CarImageCarousel = ({ images, alt, autoPlay }: { images: string[], alt: string, autoPlay?: boolean }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        if (autoPlay && images && images.length > 1) {
            intervalId = setInterval(() => {
                setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
            }, 4000);
        } else if (!autoPlay) {
            setCurrentIndex(0);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [autoPlay, images]);

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
            <div className="w-full h-full flex items-center justify-center text-gray-700 flex-col bg-dark-bg relative">
                {/* Minimalist vector silhouette placeholder */}
                <svg width="200" height="80" viewBox="0 0 200 80" fill="none" className="opacity-10 absolute">
                    <path d="M20 70 L40 30 L80 20 L150 20 L180 30 L190 70 Z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="50" cy="70" r="10" stroke="currentColor" strokeWidth="2" />
                    <circle cx="160" cy="70" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
                <div className="z-10 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Görsel Bekleniyor</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full group/carousel overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent z-10 opacity-60 pointer-events-none" />

            {/* Images */}
            <div
                className="flex transition-transform duration-500 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {images.map((img, idx) => (
                    <div key={idx} className="w-full h-full flex-shrink-0 overflow-hidden relative">
                        <img
                            src={img}
                            alt={`${alt} - ${idx + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover brightness-90 group-hover/card:brightness-100 transition-all duration-700 group-hover/card:scale-110"
                        />
                    </div>
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

export const CarCard = ({ car }: CarCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const targetLink = car.type === 'SALE' ? `/car/${car.id}` : `/book/${car.id}`;

    return (
        <Link
            to={targetLink}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group/card block h-full relative bg-white rounded-3xl shadow-sm border border-[#E5E5E5] hover:border-primary-500/30 overflow-hidden hover:-translate-y-2 transition-all duration-500 hover:shadow-md"
        >
            {/* Glow Effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Image Area: Standardized Studio Environment */}
            <div className="aspect-[16/10] bg-[#090909] relative overflow-hidden">
                <CarImageCarousel images={car.images} alt={`${car.brand} ${car.model}`} autoPlay={isHovered} />

                {/* Top Badges */}
                <div className="absolute top-5 left-5 z-20 flex flex-col gap-2">
                </div>

                <div className="absolute top-5 right-5 z-20">
                    <span className="bg-[#F5F5F5] px-3 py-1.5 rounded-lg text-[10px] font-black text-[#111111] uppercase tracking-widest border border-[#E5E5E5]">
                        {translateCategory(car.category)}
                    </span>
                </div>

                {/* Overlay Gradient for asset consistency */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none opacity-60" />
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col relative z-10">
                <div className="mb-4">
                    <h3 className="text-2xl font-black text-[#111111] group-hover/card:text-primary-500 transition-colors leading-tight tracking-tighter truncate">
                        {car.brand} <span className="text-[#777777] font-medium">{car.model}</span>
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-black uppercase tracking-widest text-[#3c3c3b]">
                        <span>{car.year}</span>
                        <span className="w-1 h-1 rounded-full bg-primary-500/30" />
                        <span className="text-[#777777]">{car.color}</span>
                    </div>
                </div>

                {/* Specs: Minimal Line Icons */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Cog className="w-3.5 h-3.5 text-primary-500" />
                        {car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <Fuel className="w-3.5 h-3.5 text-primary-500" />
                        {translateFuel(car.fuel)}
                    </div>
                </div>

                {/* Footer with Price */}
                <div className="mt-auto pt-5 border-t border-[#E5E5E5] flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-[#3c3c3b] font-black uppercase tracking-[0.2em] mb-1">
                            {car.type === 'SALE' ? 'Satış Fiyatı' : 'Günlük Kiralama'}
                        </p>
                        <div className="text-2xl font-black text-[#111111] flex items-baseline gap-1">
                            {Number(car.type === 'SALE' ? car.salePrice : car.dailyPrice).toLocaleString()}
                            <span className="text-xs font-black text-primary-500 tracking-widest ml-0.5">TL</span>
                        </div>
                    </div>

                    <div className="group/btn relative overflow-hidden bg-primary-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-sm transition-all flex items-center gap-2 hover:-translate-y-1">
                        ŞİMDİ KİRALA
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </Link>
    );
};
