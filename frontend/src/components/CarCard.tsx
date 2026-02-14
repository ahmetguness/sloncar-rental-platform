import type { Car } from '../services/types';
import { Button } from './ui/Button';
import { Fuel, Users, Cog, Car as CarIcon, ArrowRight, Gauge, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { translateCategory, translateFuel } from '../utils/translate';

interface CarCardProps {
    car: Car;
    brandLogoUrl?: string;
}

import { getBrandLogo } from '../utils/brandLogos';

export const CarCard = ({ car, brandLogoUrl }: CarCardProps) => {
    // Fallback to helper if prop not provided (or for now, just prioritize prop)
    const logoUrl = brandLogoUrl || getBrandLogo(car.brand);

    return (
        <div className="group relative bg-dark-surface-lighter rounded-3xl shadow-lg border border-white/5 hover:border-primary-500/30 overflow-hidden flex flex-col h-full hover:-translate-y-2 transition-all duration-500 hover:shadow-[0_0_30px_rgba(30,27,75,0.5)]">

            {/* Glow Effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Image Area */}
            <div className="h-64 bg-dark-bg relative overflow-hidden">
                {car.images && car.images.length > 0 ? (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-surface-lighter to-transparent z-10 opacity-60" />
                        <img
                            src={car.images[0]}
                            alt={`${car.brand} ${car.model}`}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100"
                        />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 flex-col bg-dark-bg">
                        <CarIcon className="w-16 h-16 mb-2 opacity-30" />
                        <span className="text-sm font-medium opacity-50">Görsel Bekleniyor</span>
                    </div>
                )}

                {/* Overlay Badge */}
                <div className="absolute top-4 left-4 z-20">
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                        {translateCategory(car.category)}
                    </span>
                </div>

                <div className="absolute bottom-4 right-4 z-20">
                    <span className="bg-primary-600/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 border border-primary-400/20">
                        <Check size={12} className="stroke-[3px]" /> Müsait
                    </span>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col flex-grow relative z-10">
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-3">
                            {logoUrl && (
                                <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 group-hover:border-primary-500/20 transition-colors">
                                    <img
                                        src={logoUrl}
                                        alt={car.brand}
                                        className="w-8 h-8 object-contain"
                                    />
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors leading-tight">
                                    {car.brand}
                                </h3>
                                <div className="text-sm text-gray-400 font-medium">{car.model} <span className="text-gray-600">•</span> {car.year}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                    <div className="bg-dark-bg/50 border border-white/5 rounded-xl p-2.5 flex items-center gap-3">
                        <Cog className="w-4 h-4 text-primary-500/70" />
                        <span className="text-xs font-medium text-gray-400">
                            {car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel'}
                        </span>
                    </div>
                    <div className="bg-dark-bg/50 border border-white/5 rounded-xl p-2.5 flex items-center gap-3">
                        <Fuel className="w-4 h-4 text-primary-500/70" />
                        <span className="text-xs font-medium text-gray-400 capitalize">
                            {translateFuel(car.fuel)}
                        </span>
                    </div>
                    <div className="bg-dark-bg/50 border border-white/5 rounded-xl p-2.5 flex items-center gap-3">
                        <Users className="w-4 h-4 text-primary-500/70" />
                        <span className="text-xs font-medium text-gray-400">{car.seats} Kişilik</span>
                    </div>
                    <div className="bg-dark-bg/50 border border-white/5 rounded-xl p-2.5 flex items-center gap-3">
                        <Gauge className="w-4 h-4 text-primary-500/70" />
                        <span className="text-xs font-medium text-gray-400">200+ km</span>
                    </div>
                </div>

                <div className="mt-auto pt-5 border-t border-white/5 flex items-end justify-between">
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                            {car.type === 'SALE' ? 'Satış Fiyatı' : 'Günlük'}
                        </p>
                        <p className="text-2xl font-bold text-white tracking-tight flex items-baseline gap-1">
                            {Number(car.type === 'SALE' ? car.salePrice : car.dailyPrice).toLocaleString()} <span className="text-sm font-semibold text-primary-500">₺</span>
                        </p>
                    </div>
                    <Link to={`/book/${car.id}`}>
                        <Button className="rounded-xl px-4 h-10 bg-white text-dark-bg font-bold hover:bg-primary-500 hover:text-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
