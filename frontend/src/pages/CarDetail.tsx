import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { carService } from '../services/api';
import type { Car } from '../services/types';
import { Button } from '../components/ui/Button';
import { Loader2, ArrowLeft, Fuel, Cog, Users, Gauge, CheckCircle, AlertTriangle, MessageCircle, Phone, Info } from 'lucide-react';
import { translateCategory, translateFuel } from '../utils/translate';

export const CarDetail = () => {
    const { id } = useParams();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);

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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Gallery */}
                    <div className="space-y-4">
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-dark-surface border border-white/5 shadow-2xl group">
                            {car.images && car.images.length > 0 ? (
                                <img
                                    src={car.images[activeImage]}
                                    alt={car.model}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">Görsel Yok</div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-white/10 uppercase tracking-wider">
                                    {translateCategory(car.category)}
                                </span>
                                {car.isFeatured && (
                                    <span className="bg-primary-500/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-primary-400/20 flex items-center gap-1.5 animate-pulse">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        Öne Çıkan
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {car.images && car.images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {car.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img} alt={`View ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-2">{car.brand} <span className="text-primary-500">{car.model}</span></h1>
                            <div className="flex items-center gap-4 text-gray-400 font-medium text-lg">
                                <span>{car.year}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span>{car.mileage.toLocaleString()} KM</span>
                                <span className="w-1 h-1 rounded-full bg-gray-600" />
                                <span>{car.color}</span>
                            </div>
                        </div>

                        {/* Price Card */}
                        <div className="bg-dark-surface-lighter/50 rounded-2xl p-6 border border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Satış Fiyatı</p>
                                <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                    {Number(car.salePrice).toLocaleString()} <span className="text-lg font-bold text-primary-500">₺</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                    <Phone className="w-5 h-5" />
                                    <span className="hidden sm:inline">Hemen Ara</span>
                                </Button>
                                <Button className="bg-dark-surface border border-white/10 hover:bg-white/5 text-white font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Key Specs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-dark-surface/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary-500/10 text-primary-500"><Cog className="w-6 h-6" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Vites</p>
                                    <p className="font-bold text-white">{car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel'}</p>
                                </div>
                            </div>
                            <div className="bg-dark-surface/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary-500/10 text-primary-500"><Fuel className="w-6 h-6" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Yakıt</p>
                                    <p className="font-bold text-white capitalize">{translateFuel(car.fuel)}</p>
                                </div>
                            </div>
                            <div className="bg-dark-surface/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary-500/10 text-primary-500"><Users className="w-6 h-6" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Koltuk</p>
                                    <p className="font-bold text-white">{car.seats} Kişilik</p>
                                </div>
                            </div>
                            <div className="bg-dark-surface/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary-500/10 text-primary-500"><Gauge className="w-6 h-6" /></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Motor</p>
                                    <p className="font-bold text-white">2.0L</p>
                                </div>
                            </div>
                        </div>

                        {/* Expert Report & Features */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary-500" />
                                Araç Durumu & Özellikler
                            </h3>

                            {/* Accident Description */}
                            <div className="bg-dark-surface/30 rounded-xl p-5 border border-white/5">
                                <p className="text-sm font-bold text-gray-400 uppercase mb-2">Ekspertiz / Tramer Kaydı</p>
                                <p className="text-gray-200 leading-relaxed">
                                    {car.accidentDescription || "Hasar kaydı bilgisi girilmemiştir."}
                                </p>
                            </div>

                            {/* Changed/Painted Parts Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm font-bold text-red-400 uppercase mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Değişen Parçalar
                                    </p>
                                    {car.changedParts && car.changedParts.length > 0 ? (
                                        <ul className="space-y-2">
                                            {car.changedParts.map((part, i) => (
                                                <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                    {part}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Değişen parça yok.</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-yellow-400 uppercase mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Boyalı Parçalar
                                    </p>
                                    {car.paintedParts && car.paintedParts.length > 0 ? (
                                        <ul className="space-y-2">
                                            {car.paintedParts.map((part, i) => (
                                                <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                    {part}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Boyalı parça yok.</p>
                                    )}
                                </div>
                            </div>

                            {/* Features List */}
                            <div>
                                <p className="text-sm font-bold text-blue-400 uppercase mb-3 flex items-center gap-2 mt-4">
                                    <CheckCircle className="w-4 h-4" /> Ekstra Özellikler
                                </p>
                                {car.features && car.features.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {car.features.map((feature, i) => (
                                            <div key={i} className="bg-dark-surface/50 px-3 py-2 rounded-lg border border-white/5 text-sm text-gray-300 flex items-center gap-2">
                                                <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Ekstra özellik girilmemiştir.</p>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {car.description && (
                            <div className="pt-6 border-t border-white/5">
                                <h3 className="text-lg font-bold text-white mb-3">Açıklama</h3>
                                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                                    {car.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
