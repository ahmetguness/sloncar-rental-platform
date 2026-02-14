import { useEffect, useState, useRef, useMemo } from 'react'; // Reusing Home.tsx logic but simplified
import { translateCategory } from '../utils/translate';
import { carService, brandService } from '../services/api';
import type { Car } from '../services/types';
import { CarCard } from '../components/CarCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2, Search, RotateCcw, Plus, Minus, Tag } from 'lucide-react';

export const SecondHand = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [brands, setBrands] = useState<{ id: string; name: string; logoUrl: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        brand: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        type: 'SALE', // Enforce SALE type
    });
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const fetchCars = async (pageToFetch = 1, append = false) => {
        setLoading(true);
        try {
            const cleanedFilters: any = {
                ...filters,
                q: filters.brand,
                limit: 12,
                page: pageToFetch,
                type: 'SALE'
            };
            delete cleanedFilters.brand;

            const finalFilters = Object.fromEntries(
                Object.entries(cleanedFilters).filter(([_, v]) => v !== '')
            );

            const response = await carService.getAll(finalFilters);

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

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-12 pb-20 bg-dark-bg min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[500px] flex items-center justify-center text-center px-4 overflow-hidden -mt-[88px] pt-[88px]">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                        alt="Luxury Car Showroom"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-primary-900/40 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/90 via-transparent to-dark-bg/90" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                    <div className="animate-fade-in-up">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-blue-500/10 border border-blue-500/50 text-blue-300 text-sm font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            2. El Satış Platformu
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none animate-fade-in-up delay-100 drop-shadow-2xl">
                        HAYALİNDEKİ ARACA <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 text-glow">SAHİP OL</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in-up delay-200">
                        Güvenilir, ekspertiz garantili ve size özel ödeme seçenekleriyle ikinci el lüks araçlarımız sizi bekliyor.
                    </p>
                </div>
            </section>

            {/* Search Bar (Desktop) */}
            <div className="relative z-20 container mx-auto px-4 -mt-24 hidden md:block">
                <div className="max-w-4xl mx-auto bg-dark-surface-lighter/80 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-6 border border-white/10">
                    <div className="flex gap-4 items-end">
                        <div className="flex-grow">
                            <Input
                                label="Marka / Model Ara"
                                name="brand"
                                placeholder="Örn: BMW 5.20"
                                value={filters.brand}
                                onChange={handleFilterChange}
                                className="bg-dark-bg border-white/10 text-white placeholder-gray-600 focus:border-blue-500 h-12"
                            />
                        </div>

                        <div className="w-32">
                            <Input
                                label="Min (₺)"
                                name="minPrice"
                                type="number"
                                placeholder="Min"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                className="bg-dark-bg border-white/10 text-white placeholder-gray-600 focus:border-blue-500 h-12"
                                step="10000"
                            />
                        </div>

                        <div className="w-32">
                            <Input
                                label="Max (₺)"
                                name="maxPrice"
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                className="bg-dark-bg border-white/10 text-white placeholder-gray-600 focus:border-blue-500 h-12"
                                step="10000"
                            />
                        </div>

                        <Button onClick={() => fetchCars(1, false)} className="h-12 px-8 text-base font-bold bg-white text-dark-bg hover:bg-blue-500 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all rounded-xl">
                            <Search className="w-5 h-5" />
                        </Button>

                        {Object.values(filters).some(x => x !== '' && x !== 'SALE') && (
                            <Button
                                onClick={() => {
                                    setFilters({ brand: '', category: '', minPrice: '', maxPrice: '', type: 'SALE' });
                                    setTimeout(() => {
                                        carService.getAll({ limit: 12, page: 1, type: 'SALE' }).then(res => {
                                            setCars(res.data);
                                            setPagination(res.pagination);
                                            setPage(1);
                                        });
                                    }, 0);
                                }}
                                className="h-12 px-4 bg-dark-bg text-gray-400 border border-white/10 hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all group rounded-xl"
                                title="Filtreleri Temizle"
                            >
                                <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Car Grid Section */}
            <section
                id="fleet"
                className="container mx-auto px-6 pt-12 scroll-mt-24 relative"
            >
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight">SATILIK <span className="text-blue-500">ARAÇLAR</span></h2>
                        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-transparent mt-2 rounded-full" />
                    </div>
                </div>

                {loading && cars.length === 0 ? (
                    <div className="flex justify-center items-center py-32">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    </div>
                ) : cars.length === 0 ? (
                    <div className="text-center py-32 bg-dark-surface-lighter/50 rounded-3xl border border-white/5">
                        <div className="bg-dark-surface w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                            <Tag className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Sonuç Bulunamadı</h3>
                        <p className="text-gray-400 max-w-md mx-auto">Aradığınız kriterlere uygun satılık araç şu an portföyümüzde görünmüyor.</p>
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
                            <div className="mt-12 flex justify-center gap-4">
                                {page > 1 && (
                                    <Button
                                        onClick={() => {
                                            fetchCars(1, false);
                                            document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        disabled={loading}
                                        className="bg-dark-surface-lighter border border-white/10 text-gray-400 hover:text-white hover:border-white/20 px-8 py-4 rounded-xl font-bold transition-all flex items-center gap-2 group"
                                    >
                                        <Minus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        DAHA AZ GÖSTER
                                    </Button>
                                )}

                                {page < pagination.totalPages && (
                                    <Button
                                        onClick={() => fetchCars(page + 1, true)}
                                        disabled={loading}
                                        className="bg-dark-surface-lighter border border-white/10 text-white hover:bg-blue-500 hover:border-blue-500 px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
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
