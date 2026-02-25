import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { carService } from '../services/api';
import type { Car } from '../services/types';
import { Button } from '../components/ui/Button';
import { Loader2, ArrowLeft, Fuel, Cog, Users, Gauge, CheckCircle, MessageCircle, Phone } from 'lucide-react';
import { translateFuel } from '../utils/translate';
import { CarDamageMap } from '../components/ui/CarDamageMap';
import { ImageCarousel } from '../components/ui/ImageCarousel';

export const CarDetail = () => {
    const { id } = useParams();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const loadCar = async () => {
            try {
                const data = await carService.getById(id);
                setCar(data);
            } catch (error) {
                console.error('Failed to load car details', error);
            } finally {
                setLoading(false);
            }
        };
        loadCar();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-primary-500 w-12 h-12 mb-4" />
            <p className="text-gray-400">Araç detayları yükleniyor...</p>
        </div>
    );

    if (!car) return (
        <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center pt-24">
            <div className="text-white text-xl mb-4">Araç bulunamadı.</div>
            <Link to="/second-hand">
                <Button variant="outline">Geri Dön</Button>
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-dark-bg pt-24 pb-20 px-4 md:px-8">
            <div className="container mx-auto max-w-7xl">
                {/* Back Button */}
                <Link to="/second-hand" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span>Satılık Araçlara Dön</span>
                </Link>

                {/* 1. Hero Section (Full Width) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
                    {/* Left: Interactive Gallery (8/12) */}
                    <div className="lg:col-span-8">
                        <ImageCarousel
                            images={car.images}
                            alt={`${car.brand} ${car.model}`}
                            category={car.category}
                        />
                    </div>

                    {/* Right: Quick Buy Box (4/12) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-dark-surface/40 backdrop-blur-md rounded-[2.5rem] p-5 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-primary-500/20 transition-all duration-700" />

                            <div className="space-y-4 mb-8">
                                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter">
                                    {car.brand} <span className="text-primary-500">{car.model}</span>
                                </h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="bg-white/5 text-gray-400 px-3 py-1 rounded-lg text-xs font-bold border border-white/5">{car.year}</span>
                                    <span className="bg-white/5 text-gray-400 px-3 py-1 rounded-lg text-xs font-bold border border-white/5">{car.mileage.toLocaleString()} KM</span>
                                </div>
                            </div>

                            <div className="bg-black/40 rounded-3xl p-4 sm:p-6 border border-white/5 mb-6 sm:mb-8">
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Satış Fiyatı</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl sm:text-5xl font-black text-white tracking-tighter">
                                        {Number(car.salePrice).toLocaleString()}
                                    </span>
                                    <span className="text-2xl font-bold text-primary-500">₺</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-black h-16 rounded-2xl flex items-center justify-center gap-3 shadow-[0_10px_40px_-10px_rgba(22,163,74,0.4)] active:scale-95 transition-all">
                                    <Phone className="w-5 h-5" />
                                    <span>Hemen Ara</span>
                                </Button>
                                <Button className="w-full bg-white/5 hover:bg-white/10 text-white font-bold h-16 rounded-2xl flex items-center justify-center gap-3 border border-white/5 transition-all">
                                    <MessageCircle className="w-5 h-5" />
                                    <span>WhatsApp</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Horizontal Specs Band (Minimalist & Glass) */}
                <div className="w-full bg-white/5 backdrop-blur-xl border-y border-white/5 py-4 sm:py-6 px-4 sm:px-8 mb-8 sm:mb-12 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-4 sm:gap-8 rounded-[1.5rem]">
                    {[
                        { icon: Cog, label: 'Şanzıman', value: car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel' },
                        { icon: Fuel, label: 'Yakıt', value: translateFuel(car.fuel) },
                        { icon: Users, label: 'Koltuk', value: `${car.seats} Kişilik` },
                        { icon: Gauge, label: 'Motor', value: '2.0L' }
                    ].map((spec, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                                <spec.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{spec.label}</p>
                                <p className="font-bold text-white text-sm capitalize">{spec.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Balanced Information Section (Two Columns) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Left: Modern Damage Map */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Hasar <span className="text-primary-500">Durumu</span></h3>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="bg-dark-surface/30 rounded-[2.5rem] p-4 sm:p-10 border border-white/5 flex items-center justify-center relative group min-h-[400px] sm:min-h-[500px]">
                            <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl rounded-full" />
                            <div className="relative z-10 w-full max-w-[100vw] sm:max-w-2xl overflow-visible">
                                <CarDamageMap
                                    changedParts={car.changedParts || []}
                                    paintedParts={car.paintedParts || []}
                                    readonly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Expert Data & Tags */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Ekspertiz <span className="text-primary-500">Notları</span></h3>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="bg-dark-surface/30 rounded-[2.5rem] p-5 sm:p-8 border border-white/5">
                            <p className="text-gray-400 italic leading-relaxed text-lg">
                                "{car.accidentDescription || "Araç hakkında herhangi bir kaza veya tramer kaydı bilgisi not düşülmemiştir."}"
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4 pl-1">Değişen Parçalar</p>
                                <div className="flex flex-wrap gap-2">
                                    {car.changedParts?.length ? car.changedParts.map((p, i) => (
                                        <span key={i} className="text-xs bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-bold border border-red-500/20">{p}</span>
                                    )) : <span className="text-xs text-gray-600 italic">Kayıt yok</span>}
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4 pl-1">Boyalı Parçalar</p>
                                <div className="flex flex-wrap gap-2">
                                    {car.paintedParts?.length ? car.paintedParts.map((p, i) => (
                                        <span key={i} className="text-xs bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl font-bold border border-amber-500/20">{p}</span>
                                    )) : <span className="text-xs text-gray-600 italic">Kayıt yok</span>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4 pl-1">Ekstra Donanımlar</p>
                            <div className="flex flex-wrap gap-2">
                                {car.features?.map((f, i) => (
                                    <span key={i} className="text-xs bg-primary-500/5 text-primary-400 px-4 py-2 rounded-xl font-bold border border-primary-500/10 flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3" />
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Description Section (Full Width) */}
                {car.description && (
                    <div className="space-y-6 max-w-4xl">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Genel <span className="text-primary-500">Açıklama</span></h3>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>
                        <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap">
                            {car.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
