import { useEffect, useState } from 'react';
import { carService, brandService } from '../services/api';
import type { Car } from '../services/types';
import { CarCard } from '../components/CarCard';
import { Button } from '../components/ui/Button';
import { Loader2, Plus, Minus, Tag, ShieldCheck } from 'lucide-react';

export const SecondHand = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [brands, setBrands] = useState<{ id: string; name: string; logoUrl: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const fetchCars = async (pageToFetch = 1, append = false) => {
        setLoading(true);
        try {
            const queryParams = {
                limit: 12,
                page: pageToFetch,
                type: 'SALE'
            };

            const response = await carService.getAll(queryParams);

            if (append) {
                setCars(prev => [...prev, ...response.data]);
            } else {
                setCars(response.data);
            }

            setPagination(response.pagination);
            setPage(pageToFetch);

        } catch (error) {
            console.error('Failed to fetch cars', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBrands = async () => {
        try {
            const data = await brandService.getAll();
            setBrands(data);
        } catch (error) {
            console.error('Failed to fetch brands', error);
        }
    };

    useEffect(() => {
        fetchCars(1, false);
        fetchBrands();
    }, []);

    const getBrandLogoUrl = (brandName: string) => {
        const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
        return brand?.logoUrl;
    };

    return (
        <div className="space-y-12 pb-20 min-h-screen">
            {/* Hero Section: Luxury Sales Edition */}
            <section className="relative min-h-[500px] flex items-center justify-center text-center px-4 overflow-hidden -mt-[88px] pt-[120px]">
                {/* Background Watermark */}
                <div className="absolute bottom-[10%] left-0 w-full flex justify-center pointer-events-none z-0 opacity-[0.05]">
                    <h1 className="text-[20vw] font-black text-white tracking-tighter leading-none select-none uppercase">
                        İKİNCİ EL
                    </h1>
                </div>

                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                        alt="Luxury Car Showroom"
                        className="w-full h-full object-cover opacity-40 grayscale"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                    <div className="animate-fade-in-up">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 text-xs font-black tracking-[0.3em] uppercase">
                            ÖZEL SEÇİM
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-[#111111] tracking-tighter leading-none animate-fade-in-up delay-100">
                        HAYALİNDEKİ ARACA <br />
                        <span className="text-primary-500">GÜVENLE</span> SAHİP OL
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up delay-200">
                        Ekspertiz garantili ve size özel ödeme seçenekleriyle, Yaman Filo güvencesi altındaki ikinci el lüks araçlarımız yeni sahiplerini bekliyor.
                    </p>
                </div>
            </section>

            {/* Car Grid Section */}
            <section
                id="fleet"
                className="container mx-auto px-6 pt-12 scroll-mt-24 relative"
            >
                <div className="absolute top-1/2 left-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-primary-500/5 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />

                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-[#111111] tracking-tight uppercase italic">
                            Satılık <span className="text-primary-500">Araçlar</span>
                        </h2>
                        <div className="h-1 w-24 bg-primary-500 rounded-full" />
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-[10px] font-black text-gray-500 tracking-widest uppercase bg-[#F5F5F5] px-4 py-2 rounded-xl border border-[#E5E5E5]">
                        <ShieldCheck className="w-4 h-4 text-primary-500" />
                        Ekspertiz Garantili
                    </div>
                </div>

                {loading && cars.length === 0 ? (
                    <div className="flex justify-center items-center py-32">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
                    </div>
                ) : cars.length === 0 ? (
                    <div className="text-center py-32 bg-[#F5F5F5] rounded-[40px] border border-[#E5E5E5] shadow-2xl">
                        <div className="bg-primary-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary-500/20 shadow-inner">
                            <Tag className="w-10 h-10 text-primary-500" />
                        </div>
                        <h3 className="text-2xl font-black text-[#111111] mb-3 uppercase tracking-tight">Portföy Güncelleniyor</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-medium">Şu an kriterlerinize uygun satılık araç bulunmamaktadır. Yeni araçlar için takipte kalın.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {cars.map(car => (
                                <CarCard
                                    key={car.id}
                                    car={car}
                                    brandLogoUrl={getBrandLogoUrl(car.brand)}
                                />
                            ))}
                        </div>

                        {(page < pagination.totalPages || page > 1) && (
                            <div className="mt-20 flex justify-center gap-6">
                                {page > 1 && (
                                    <Button
                                        onClick={() => {
                                            fetchCars(1, false);
                                            document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        disabled={loading}
                                        className="bg-transparent border-2 border-primary-500/20 text-gray-400 hover:text-white hover:border-primary-500 px-10 py-4 rounded-2xl font-black text-xs tracking-[0.2em] transition-all flex items-center gap-3"
                                    >
                                        <Minus className="w-5 h-5" />
                                        DAHA AZ GÖSTER
                                    </Button>
                                )}

                                {page < pagination.totalPages && (
                                    <Button
                                        onClick={() => fetchCars(page + 1, true)}
                                        disabled={loading}
                                        className="bg-primary-500 text-white shadow-[0_10px_30px_rgba(204,31,38,0.3)] hover:shadow-[0_15px_50px_rgba(204,31,38,0.5)] px-10 py-4 rounded-2xl font-black text-xs tracking-[0.2em] transition-all flex items-center gap-3"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                        DAHA FAZLA GÖSTER
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
};
