import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale/tr';
import "react-datepicker/dist/react-datepicker.css";
import { carService, brandService } from '../services/api';
import type { Car } from '../services/types';
import { CarCard } from '../components/CarCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2, Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

// Register Turkish locale
registerLocale('tr', tr);

export const Home = () => {
    const location = useLocation();
    const [cars, setCars] = useState<Car[]>([]);
    const [brands, setBrands] = useState<{ id: string; name: string; logoUrl: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        brand: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        pickupDate: '',
        dropoffDate: '',
    });

    const fetchCars = async () => {
        setLoading(true);
        try {
            // Clean filters: remove empty strings
            const cleanedFilters: any = {
                ...filters,
                q: filters.brand // Map brand input to general search 'q'
            };
            delete cleanedFilters.brand;

            const finalFilters = Object.fromEntries(
                Object.entries(cleanedFilters).filter(([_, v]) => v !== '')
            );
            const data = await carService.getAll(finalFilters);
            setCars(data.data);
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
        fetchCars();
        fetchBrands();
    }, []);

    // Handle hash navigation to scroll to fleet section
    useEffect(() => {
        if (location.hash === '#fleet') {
            const el = document.getElementById('fleet');
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [location]);

    const getBrandLogoUrl = (brandName: string) => {
        const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
        return brand?.logoUrl;
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const parseDateString = (dateStr: string) => {
        if (!dateStr) return null;
        return new Date(dateStr);
    };

    return (
        <div className="space-y-12 pb-20 bg-dark-bg min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[700px] flex items-center justify-center text-center px-4 overflow-hidden -mt-[88px] pt-[88px]">
                {/* Background Image & Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1617788138017-80ad40651399?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                        alt="Luxury Car Dark"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-primary-900/40 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/90 via-transparent to-dark-bg/90" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-5xl mx-auto space-y-8">
                    <div className="animate-fade-in-up">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-primary-500/10 border border-primary-500/50 text-primary-300 text-sm font-bold tracking-[0.2em] uppercase backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                            Premium Kiralama Deneyimi
                        </span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none animate-fade-in-up delay-100 drop-shadow-2xl">
                        YOLCULUĞUN <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple text-glow">GELECEĞİNİ</span> SÜR
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in-up delay-200">
                        Sıradan olanı reddet. SlonCar ile en prestijli araçları, en zahmetsiz deneyimle keşfet.
                    </p>
                </div>
            </section>

            {/* Floating Search Bar */}
            <div className="relative z-20 container mx-auto px-4 -mt-24">
                <div className="max-w-6xl mx-auto bg-dark-surface-lighter/80 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 border border-white/10">

                    {/* Date Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col group">
                            <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide group-hover:text-primary-400 transition-colors">Alış Tarihi</label>
                            <div className="relative">
                                <DatePicker
                                    selected={parseDateString(filters.pickupDate)}
                                    onChange={(date: Date | null) => {
                                        const val = date ? date.toISOString() : '';
                                        setFilters(prev => ({ ...prev, pickupDate: val }));
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    placeholderText="Seçiniz"
                                    className="w-full px-4 py-3 bg-dark-bg border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-white placeholder-gray-600 font-medium"
                                    minDate={new Date()}
                                    wrapperClassName="w-full"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col group">
                            <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide group-hover:text-primary-400 transition-colors">Teslim Tarihi</label>
                            <div className="relative">
                                <DatePicker
                                    selected={parseDateString(filters.dropoffDate)}
                                    onChange={(date: Date | null) => {
                                        const val = date ? date.toISOString() : '';
                                        setFilters(prev => ({ ...prev, dropoffDate: val }));
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    placeholderText="Seçiniz"
                                    className="w-full px-4 py-3 bg-dark-bg border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-white placeholder-gray-600 font-medium"
                                    minDate={parseDateString(filters.pickupDate) || new Date()}
                                    wrapperClassName="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-t border-white/5 pt-6">
                        <div className="md:col-span-3">
                            <Input
                                label="Marka / Model"
                                name="brand"
                                placeholder="Örn: BMW"
                                value={filters.brand}
                                onChange={handleFilterChange}
                                className="bg-dark-bg border-white/10 text-white placeholder-gray-600 focus:border-primary-500"
                            />
                        </div>

                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Kategori</label>
                            <select
                                name="category"
                                className="w-full px-4 py-3 bg-dark-bg border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-white appearance-none"
                                value={filters.category}
                                onChange={handleFilterChange}
                            >
                                <option value="" className="bg-dark-bg">Tümü</option>
                                <option value="ECONOMY" className="bg-dark-bg">Ekonomik</option>
                                <option value="COMPACT" className="bg-dark-bg">Kompakt</option>
                                <option value="SUV" className="bg-dark-bg">SUV</option>
                                <option value="LUXURY" className="bg-dark-bg">Lüks</option>
                                <option value="VAN" className="bg-dark-bg">Van</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <Input
                                label="Min (₺)"
                                name="minPrice"
                                type="number"
                                placeholder="0"
                                value={filters.minPrice}
                                onChange={handleFilterChange}
                                className="bg-dark-bg border-white/10 text-white placeholder-gray-600 focus:border-primary-500"

                            />
                        </div>

                        <div className="md:col-span-2">
                            <Input
                                label="Max (₺)"
                                name="maxPrice"
                                type="number"
                                placeholder="Max"
                                value={filters.maxPrice}
                                onChange={handleFilterChange}
                                className="bg-dark-bg border-white/10 text-white placeholder-gray-600 focus:border-primary-500"
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-2">
                            <Button onClick={fetchCars} className="flex-1 h-[46px] text-base font-bold bg-white text-dark-bg hover:bg-primary-500 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all">
                                <Search className="w-5 h-5 mr-2" /> BUL
                            </Button>
                            {/* Clear Filters Button */}
                            {Object.values(filters).some(x => x !== '') && (
                                <Button
                                    onClick={() => {
                                        setFilters({ brand: '', category: '', minPrice: '', maxPrice: '', pickupDate: '', dropoffDate: '' });
                                        carService.getAll({}).then(res => setCars(res.data));
                                    }}
                                    className="h-[46px] px-4 bg-dark-bg text-gray-400 border border-white/10 hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all group"
                                    title="Filtreleri Temizle"
                                >
                                    <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Brand Marquee / Filter Section */}
            <div className="container mx-auto px-6 mt-16 mb-0">
                <div className="flex flex-wrap justify-center gap-6 opacity-70 hover:opacity-100 transition-opacity">
                    {(brands.length > 0 ? brands : [
                        { name: 'BMW', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
                        { name: 'Mercedes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Benz_Logo_2010.svg' },
                    ]).slice(0, 8).map(brand => (
                        <button
                            key={brand.name}
                            onClick={() => {
                                setFilters(prev => ({ ...prev, brand: brand.name }));
                                carService.getAll({ q: brand.name }).then(res => setCars(res.data));
                            }}
                            className={`group flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 w-28 h-28 md:w-32 md:h-32 
                                ${filters.brand.toLowerCase() === brand.name.toLowerCase()
                                    ? 'bg-primary-500/10 border-primary-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-110'
                                    : 'bg-dark-surface-lighter border-white/5 hover:border-primary-500/50 hover:bg-dark-surface-lighter/80 hover:scale-105'}`}
                        >
                            <img
                                src={brand.logoUrl}
                                alt={brand.name}
                                className={`w-12 h-12 md:w-14 md:h-14 object-contain mb-3 transition-all duration-300 
                                    ${filters.brand.toLowerCase() === brand.name.toLowerCase()
                                        ? 'filter-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                                        : 'filter grayscale opacity-50 group-hover:filter-none group-hover:opacity-100'}`}
                            />
                            <span className={`text-xs font-bold tracking-widest uppercase ${filters.brand.toLowerCase() === brand.name.toLowerCase() ? 'text-primary-400' : 'text-gray-500 group-hover:text-white'}`}>{brand.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Car Grid Section */}
            <section id="fleet" className="container mx-auto px-6 pt-12 scroll-mt-24">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight">ARAÇ <span className="text-primary-500">FİLOSU</span></h2>
                        <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-transparent mt-2 rounded-full" />
                    </div>
                    <div className="hidden md:flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-400 bg-dark-surface-lighter px-5 py-2.5 rounded-full border border-white/5 shadow-inner">
                        <SlidersHorizontal className="w-4 h-4 text-primary-500" />
                        <span>{Object.values(filters).filter(Boolean).length} FİLTRE AKTİF</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
                    </div>
                ) : cars.length === 0 ? (
                    <div className="text-center py-32 bg-dark-surface-lighter/50 rounded-3xl border border-white/5">
                        <div className="bg-dark-surface w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                            <Search className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Sonuç Bulunamadı</h3>
                        <p className="text-gray-400 max-w-md mx-auto">Aradığınız kriterlere uygun araç şu an filomuzda görünmüyor.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {cars.map(car => (
                            <CarCard
                                key={car.id}
                                car={car}
                                brandLogoUrl={getBrandLogoUrl(car.brand)}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
