import { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale/tr';
import { translateCategory } from '../utils/translate';
import "react-datepicker/dist/react-datepicker.css";
import { carService, brandService } from '../services/api';
import type { Car } from '../services/types';
import { CarCard } from '../components/CarCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2, Search, Plus, Minus, ChevronLeft, ChevronRight, Sparkles, Clock, Tag, ShieldCheck, MapPin, RotateCcw } from 'lucide-react';
import { CampaignCarousel } from '../components/CampaignCarousel';
import { campaignService } from '../services/campaign.service';
import type { Campaign } from '../services/campaign.service';

// Register Turkish locale
registerLocale('tr', tr);

export const Home = () => {
    const location = useLocation();
    const [cars, setCars] = useState<Car[]>([]);
    const [brands, setBrands] = useState<{ id: string; name: string; logoUrl: string }[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        brand: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        pickupDate: '',
        dropoffDate: '',
    });
    const [secondaryCampaign, setSecondaryCampaign] = useState<Campaign | null>(null);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const animationRef = useRef<number | null>(null);
    const scrollAccumulator = useRef(0);

    // Ensure we have enough items for scrolling to cover viewport + buffer
    const displayBrands = useMemo(() => {
        if (brands.length < 8) return brands;

        let base = brands;
        // Duplicate until we have enough items to fill the viewport
        while (base.length < 12) {
            base = [...base, ...brands];
        }
        return [...base, ...base]; // Double buffer
    }, [brands]);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    // Robust Auto-scroll with requestAnimationFrame and sub-pixel accumulation
    useEffect(() => {
        if (brands.length < 8) return;

        // Initialize accumulator with current position
        if (scrollContainerRef.current) {
            scrollAccumulator.current = scrollContainerRef.current.scrollLeft;
        }

        const scrollLoop = () => {
            if (!scrollContainerRef.current) return;

            if (!isPaused) {
                const oneSetWidth = scrollContainerRef.current.scrollWidth / 2; // Double buffer

                // Increment accumulator
                scrollAccumulator.current += 0.5; // Speed: 0.5px/frame

                // Seamless Loop Logic
                if (scrollAccumulator.current >= oneSetWidth) {
                    scrollAccumulator.current -= oneSetWidth;
                }
                else if (scrollAccumulator.current <= 0) {
                    scrollAccumulator.current += oneSetWidth;
                }

                // Apply to DOM
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = scrollAccumulator.current;
                }
            } else {
                // While paused, track the DOM scroll position (user dragging)
                if (scrollContainerRef.current) {
                    scrollAccumulator.current = scrollContainerRef.current.scrollLeft;
                }
            }

            animationRef.current = requestAnimationFrame(scrollLoop);
        };

        // Intersection Observer to pause animation when off-screen
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting) {
                    if (animationRef.current === null) {
                        animationRef.current = requestAnimationFrame(scrollLoop);
                    }
                } else {
                    if (animationRef.current !== null) {
                        cancelAnimationFrame(animationRef.current);
                        animationRef.current = null;
                    }
                }
            },
            { threshold: 0 }
        );

        if (scrollContainerRef.current) {
            observer.observe(scrollContainerRef.current);
        }

        return () => {
            if (animationRef.current !== null) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
            }
            observer.disconnect();
        };
    }, [isPaused, brands.length]);

    // Initial positioning
    useEffect(() => {
        if (brands.length >= 8 && displayBrands.length > 0 && scrollContainerRef.current) {
            setTimeout(() => {
                if (scrollContainerRef.current && scrollContainerRef.current.scrollLeft < 10) {
                    const oneSetWidth = scrollContainerRef.current.scrollWidth / 2;
                    scrollContainerRef.current.scrollLeft = oneSetWidth;
                    scrollAccumulator.current = oneSetWidth;
                }
            }, 100);
        }
    }, [displayBrands, brands.length]);

    const fetchCars = async (pageToFetch = 1, append = false) => {
        setLoading(true);
        try {
            const cleanedFilters: any = {
                ...filters,
                q: filters.brand,
                limit: 12,
                page: pageToFetch,
                type: 'RENTAL'
            };
            delete cleanedFilters.brand;

            const finalFilters = Object.fromEntries(
                Object.entries(cleanedFilters).filter(([, v]) => v !== '')
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
            const [allBrands, usedBrandNames, usedCategories] = await Promise.all([
                brandService.getAllAdmin(),
                carService.getUsedBrands('RENTAL'),
                carService.getUsedCategories('RENTAL')
            ]);

            const filteredBrands = allBrands.filter(b =>
                usedBrandNames.some(ub => ub.name.toLowerCase() === b.name.toLowerCase())
            );

            setBrands(filteredBrands);
            setCategories(usedCategories);
        } catch (error) {
            console.error('Failed to fetch filter data', error);
        }
    };

    const fetchSecondaryCampaign = async () => {
        try {
            const campaigns = await campaignService.getPublic();
            const saleCampaign = campaigns.find(c => c.tag === 'YENİ HİZMET' || c.requiredCondition === 'HAS_SALE_CARS');

            if (saleCampaign) {
                setSecondaryCampaign(saleCampaign);
            }
        } catch (error) {
            console.error('Failed to fetch campaigns', error);
        }
    };

    useEffect(() => {
        fetchCars(1, false);
        fetchBrands();
        fetchSecondaryCampaign();
    }, []);

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

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = async () => {
        const emptyFilters = {
            brand: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            pickupDate: '',
            dropoffDate: ''
        };
        setFilters(emptyFilters);
        setLoading(true);
        try {
            const res = await carService.getAll({
                limit: 12,
                page: 1,
                type: 'RENTAL'
            });
            setCars(res.data);
            setPagination(res.pagination);
            setPage(1);
        } catch (error) {
            console.error('Failed to reset filters', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateForAPI = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDateString = (dateStr: string) => {
        if (!dateStr) return null;
        return new Date(dateStr);
    };

    return (
        <div className="space-y-12 pb-20 bg-dark-bg min-h-screen">
            {/* Hero Section: Panoramic Luxury Restoration */}
            <section className="relative min-h-[900px] lg:min-h-screen flex items-center justify-center px-4 overflow-hidden -mt-[88px] pt-[88px] pb-40 bg-[#111111]">
                {/* Layer 1 (Deepest): Background texture */}
                <div className="absolute bottom-[12%] left-0 w-full flex justify-center pointer-events-none z-0">
                    <h1 className="text-[25vw] font-black text-white/[0.08] tracking-tighter leading-none select-none uppercase">
                        YAMAN
                    </h1>
                </div>

                {/* Abstract Ambient Lights */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary-900/10 rounded-full blur-[160px] mix-blend-screen" />
                    <div className="absolute bottom-0 -left-1/4 w-[600px] h-[600px] bg-primary-800/5 rounded-full blur-[120px] mix-blend-screen" />
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 py-20">

                    {/* Left Column: Center-Left Headline Block */}
                    <div className="w-full lg:w-1/2 space-y-10 text-center lg:text-left animate-fade-in-up">
                        <div className="space-y-4">

                            <h2 className="text-5xl md:text-7xl xl:text-8xl font-black text-white tracking-tighter leading-[0.9] flex flex-col">
                                <span>YOLCULUĞUN</span>
                                <span className="text-primary-500">GELECEĞİNİ</span>
                                <span>SÜR</span>
                            </h2>
                        </div>

                        <div className="space-y-8">
                            <p className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                                Prestij ve konforun buluştuğu nokta. Yaman Filo ile premium araç kiralama deneyimini kişiye özel hizmet anlayışıyla yeniden tanımlayın.
                            </p>

                            <div className="flex justify-center lg:justify-start">
                                <Button
                                    onClick={() => document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-transparent text-white border-2 border-primary-500 px-10 py-5 rounded-2xl font-black text-base shadow-[0_10px_40px_rgba(204,31,38,0.1)] hover:bg-primary-500 hover:shadow-[0_15px_50px_rgba(204,31,38,0.4)] transition-all duration-500 tracking-widest"
                                >
                                    ARAÇLARI İNCELE
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Luxury Service Pillars */}
                    <div className="w-full lg:w-[40%] space-y-6 relative z-20">
                        {[
                            {
                                icon: <MapPin className="w-6 h-6" />,
                                title: "VIP Teslimat",
                                desc: "Havalimanı & Adrese Hızlı Teslimat",
                                delay: "400ms"
                            },
                            {
                                icon: <Clock className="w-6 h-6" />,
                                title: "7/24 VIP Destek",
                                desc: "Kesintisiz VIP Canlı Destek Hattı",
                                delay: "500ms"
                            },
                            {
                                icon: <ShieldCheck className="w-6 h-6" />,
                                title: "Elite Güvence",
                                desc: "Kapsamlı Premium Kasko Güvencesi",
                                delay: "600ms"
                            }
                        ].map((pillar, i) => (
                            <div
                                key={i}
                                className="group p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl hover:bg-white/[0.06] hover:border-primary-500/30 transition-all duration-500 animate-fade-in-up"
                                style={{ animationDelay: pillar.delay }}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500 shadow-xl shadow-primary-500/5">
                                        {pillar.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black text-lg tracking-tight uppercase">{pillar.title}</h4>
                                        <p className="text-gray-500 text-sm font-medium">{pillar.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Layer 4: Standardized Filter Panel (Bottom-Center, Z-30 to clear background text) */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4 z-30 hidden md:block">
                    <div className="p-8 rounded-[38px] bg-[#1a1a1a]/60 backdrop-blur-[32px] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9)] scale-105 lg:scale-100 relative group/filter">
                        {Object.values(filters).some(x => x !== '') && (
                            <button
                                onClick={resetFilters}
                                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 hover:scale-110 transition-all z-10 animate-fade-in"
                                title="Filtreleri Sıfırla"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        )}
                        <div className="grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Alış Tarihi</label>
                                <DatePicker
                                    selected={parseDateString(filters.pickupDate)}
                                    onChange={(date: Date | null) => setFilters(prev => ({ ...prev, pickupDate: date ? formatDateForAPI(date) : '' }))}
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    placeholderText="Seçiniz"
                                    className="w-full h-14 px-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white focus:border-primary-500/50 transition-all outline-none text-sm"
                                    minDate={new Date()}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">İade Tarihi</label>
                                <DatePicker
                                    selected={parseDateString(filters.dropoffDate)}
                                    onChange={(date: Date | null) => setFilters(prev => ({ ...prev, dropoffDate: date ? formatDateForAPI(date) : '' }))}
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    placeholderText="Seçiniz"
                                    className="w-full h-14 px-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white focus:border-primary-500/50 transition-all outline-none text-sm"
                                    minDate={parseDateString(filters.pickupDate) || new Date()}
                                />
                            </div>
                            <div className="col-span-3 space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Marka / Model</label>
                                <Input
                                    name="brand"
                                    placeholder="Örn: Mercedes"
                                    value={filters.brand}
                                    onChange={handleFilterChange}
                                    className="bg-white/[0.03] border-white/5 text-white h-14 rounded-2xl focus:border-primary-500/50 transition-all text-sm"
                                />
                            </div>
                            <div className="col-span-3 space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Kategori</label>
                                <select
                                    name="category"
                                    className="w-full h-14 px-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white focus:border-primary-500/50 transition-all outline-none appearance-none text-sm"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                >
                                    <option value="" className="bg-[#1a1a1a]">Tüm Segmentler</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat} className="bg-[#1a1a1a]">
                                            {translateCategory(cat)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <button
                                    onClick={() => fetchCars(1, false)}
                                    className="w-full h-14 bg-primary-500 text-white font-black tracking-[0.1em] rounded-2xl shadow-[0_10px_30px_rgba(204,31,38,0.3)] hover:shadow-[0_15px_50px_rgba(204,31,38,0.5)] transition-all flex items-center justify-center text-sm"
                                >
                                    FİLTRELE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile Search Trigger */}
            <div className="md:hidden relative z-20 px-4 -mt-10">
                <Button
                    onClick={() => setIsMobileSearchOpen(true)}
                    className="w-full h-16 bg-dark-surface-lighter/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-center justify-between px-6"
                >
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">Müsait Araçları Ara</span>
                        <span className="text-white font-medium text-sm truncate">
                            {filters.pickupDate || filters.dropoffDate ?
                                `${filters.pickupDate ? filters.pickupDate : 'Tarih'} - ${filters.dropoffDate ? filters.dropoffDate : 'Seçiniz'}`
                                : 'Tarih ve Araç Seçimi Yapınız'}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <Search className="w-5 h-5 text-white" />
                    </div>
                </Button>
            </div>

            {/* Mobile Search Modal */}
            {isMobileSearchOpen && (
                <div className="fixed inset-0 z-50 bg-dark-bg/95 backdrop-blur-sm flex flex-col md:hidden">
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold text-white">Filtrele & Ara</h2>
                        <button
                            onClick={() => setIsMobileSearchOpen(false)}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white"
                        >
                            <Minus className="w-6 h-6 rotate-45" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Alış Tarihi</label>
                                <DatePicker
                                    selected={parseDateString(filters.pickupDate)}
                                    onChange={(date: Date | null) => {
                                        const val = date ? formatDateForAPI(date) : '';
                                        setFilters(prev => ({ ...prev, pickupDate: val }));
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    placeholderText="Seçiniz"
                                    className="w-full px-4 py-4 bg-dark-surface border border-white/10 rounded-2xl text-white font-medium text-lg"
                                    minDate={new Date()}
                                    withPortal
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Teslim Tarihi</label>
                                <DatePicker
                                    selected={parseDateString(filters.dropoffDate)}
                                    onChange={(date: Date | null) => {
                                        const val = date ? formatDateForAPI(date) : '';
                                        setFilters(prev => ({ ...prev, dropoffDate: val }));
                                    }}
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    placeholderText="Seçiniz"
                                    className="w-full px-4 py-4 bg-dark-surface border border-white/10 rounded-2xl text-white font-medium text-lg"
                                    minDate={parseDateString(filters.pickupDate) || new Date()}
                                    withPortal
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <Input
                                label="Marka / Model"
                                name="brand"
                                placeholder="Örn: BMW"
                                value={filters.brand}
                                onChange={handleFilterChange}
                                className="bg-dark-surface border-white/10 text-white h-12"
                            />

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Kategori</label>
                                <select
                                    name="category"
                                    className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-2xl text-white appearance-none h-12"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                >
                                    <option value="" className="bg-dark-bg">Tüm Kategoriler</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat} className="bg-dark-bg">
                                            {translateCategory(cat)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Min (₺)"
                                    name="minPrice"
                                    type="number"
                                    placeholder="0"
                                    value={filters.minPrice}
                                    onChange={handleFilterChange}
                                    className="bg-dark-surface border-white/10 text-white"
                                />
                                <Input
                                    label="Max (₺)"
                                    name="maxPrice"
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxPrice}
                                    onChange={handleFilterChange}
                                    className="bg-dark-surface border-white/10 text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 bg-dark-surface">
                        <Button
                            onClick={() => {
                                fetchCars(1, false);
                                setIsMobileSearchOpen(false);
                            }}
                            className="w-full h-14 text-lg font-bold bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-500/30 rounded-2xl flex items-center justify-center gap-2"
                        >
                            <Search className="w-5 h-5" /> SONUÇLARI GÖSTER
                        </Button>
                        {Object.values(filters).some(x => x !== '') && (
                            <button
                                onClick={() => {
                                    resetFilters();
                                    setIsMobileSearchOpen(false);
                                }}
                                className="w-full mt-3 py-3 text-sm font-medium text-gray-400 hover:text-white"
                            >
                                Filtreleri Temizle
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Campaign Carousel */}
            <div className="container mx-auto px-4 mt-6 md:mt-24">
                <CampaignCarousel />
            </div>

            {/* Secondary Campaign */}
            {secondaryCampaign && (
                <div className="container mx-auto px-4 mt-20">
                    <div className={`relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 ${secondaryCampaign.imageUrl ? 'bg-gradient-to-r from-gray-900 to-gray-800' : 'bg-gradient-to-br from-primary-900/40 via-dark-surface to-dark-bg'}`}>
                        {secondaryCampaign.imageUrl && (
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={secondaryCampaign.imageUrl}
                                    alt="Campaign"
                                    className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent" />
                            </div>
                        )}
                        <div className="relative z-10 p-6 md:p-16 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                            <div className="max-w-2xl space-y-6">
                                {secondaryCampaign.tag && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3" /> {secondaryCampaign.tag}
                                    </div>
                                )}
                                <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight whitespace-pre-line">
                                    {secondaryCampaign.title}
                                </h2>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    {secondaryCampaign.description}
                                </p>
                                {secondaryCampaign.ctaLink && (
                                    <Button
                                        onClick={() => window.location.href = secondaryCampaign.ctaLink!}
                                        className="bg-white text-gray-900 hover:bg-blue-50 text-base px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 w-full md:w-fit"
                                    >
                                        {secondaryCampaign.ctaText || 'İNCELE'} <ChevronRight className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Carousel */}
            <div className="container mx-auto px-4 md:px-6 mt-10 md:mt-16 mb-0 relative group/carousel">
                <div
                    className="relative flex items-center justify-center"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {brands.length >= 8 && (
                        <button
                            onClick={scrollLeft}
                            className="hidden md:block absolute left-0 z-20 p-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/40 transition-all opacity-0 group-hover/carousel:opacity-100 -translate-x-6"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    <div
                        ref={scrollContainerRef}
                        className={`flex overflow-x-auto gap-6 pb-4 pt-2 px-12 scroll-auto no-scrollbar max-w-[1200px] ${brands.length < 8 ? 'justify-center mx-auto' : ''}`}
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                        }}
                    >
                        {displayBrands.map((brand, index) => (
                            <button
                                key={`${brand.name}-${index}`}
                                onClick={() => {
                                    setFilters(prev => ({ ...prev, brand: brand.name }));
                                    carService.getAll({ q: brand.name, limit: 12, page: 1, type: 'RENTAL' }).then(res => {
                                        setCars(res.data);
                                        setPagination(res.pagination);
                                        setPage(1);
                                    });
                                }}
                                className={`flex-shrink-0 snap-center group flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 w-28 h-32 md:w-32 md:h-36 
                                ${filters.brand.toLowerCase() === brand.name.toLowerCase()
                                        ? 'bg-primary-500/10 border-primary-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-110'
                                        : 'bg-dark-surface-lighter border-white/5 hover:border-primary-500/50 hover:bg-dark-surface-lighter/80 hover:scale-105'}`}
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-3 p-2 shadow-inner transition-transform group-hover:scale-110">
                                    <img
                                        src={brand.logoUrl}
                                        alt={brand.name}
                                        className={`w-full h-full object-contain filter transition-all duration-300 ${filters.brand.toLowerCase() === brand.name.toLowerCase()
                                            ? 'grayscale-0 opacity-100'
                                            : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'
                                            }`}
                                    />
                                </div>
                                <span className={`text-xs font-bold tracking-widest uppercase truncate w-full px-1 ${filters.brand.toLowerCase() === brand.name.toLowerCase() ? 'text-primary-400' : 'text-gray-400 group-hover:text-white'}`}>{brand.name}</span>
                            </button>
                        ))}
                    </div>

                    {brands.length >= 8 && (
                        <button
                            onClick={scrollRight}
                            className="hidden md:block absolute right-0 z-20 p-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/40 transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-6"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Car Grid */}
            <section id="fleet" className="container mx-auto px-6 pt-12 scroll-mt-24 relative">
                <div className="absolute top-1/2 left-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-primary-900/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-neon-purple/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />

                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">ARAÇ <span className="text-primary-500">FİLOSU</span></h2>
                        <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-transparent mt-2 rounded-full" />
                    </div>
                </div>

                {loading && cars.length === 0 ? (
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
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {cars.map(car => (
                                <CarCard
                                    key={car.id}
                                    car={car}
                                />
                            ))}
                        </div>

                        {(page < pagination.totalPages || page > 1) && (
                            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                                {page > 1 && (
                                    <Button
                                        onClick={() => {
                                            fetchCars(1, false);
                                            document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        disabled={loading}
                                        className="bg-dark-surface-lighter border border-white/10 text-gray-400 hover:text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2"
                                    >
                                        <Minus className="w-5 h-5" /> DAHA AZ GÖSTER
                                    </Button>
                                )}

                                {page < pagination.totalPages && (
                                    <Button
                                        onClick={() => fetchCars(page + 1, true)}
                                        disabled={loading}
                                        className="bg-dark-surface-lighter border border-white/10 text-white hover:bg-primary-500 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2"
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

            {/* Bento Features Section: Trust & Performance */}
            <section className="container mx-auto px-6 py-20 md:py-32 border-t border-white/5">
                <div className="text-center mb-16 md:mb-24">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase">
                        NEDEN <span className="text-primary-500">YAMAN FİLO?</span>
                    </h2>
                    <p className="text-gray-500 mt-4 font-medium tracking-widest uppercase text-xs">Premium Hizmet Standartları</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Bento Card 1 */}
                    <div className="group bg-[#1a1a1a] border border-white/5 p-10 rounded-[32px] flex flex-col items-start hover:border-primary-500/30 transition-all duration-500 hover:-translate-y-2">
                        <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(204,31,38,0.3)]">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Yeni Model Araçlar</h3>
                        <p className="text-gray-500 text-base leading-relaxed font-medium">Sadece en son model, mükemmel kondisyondaki premium araçlarla hizmet veriyoruz. Asset güvenliği ve konfor önceliğimizdir.</p>
                    </div>

                    {/* Bento Card 2 */}
                    <div className="group bg-[#1a1a1a] border border-white/5 p-10 rounded-[32px] flex flex-col items-start hover:border-primary-500/30 transition-all duration-500 hover:-translate-y-2">
                        <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(204,31,38,0.3)]">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 tracking-tight">7/24 VIP Destek</h3>
                        <p className="text-gray-500 text-base leading-relaxed font-medium">Yolculuğunuzun her anında yanınızdayız. Profesyonel ekibimizle kesintisiz, VIP müşteri desteği sunuyoruz.</p>
                    </div>

                    {/* Bento Card 3 */}
                    <div className="group bg-[#1a1a1a] border border-white/5 p-10 rounded-[32px] flex flex-col items-start hover:border-primary-500/30 transition-all duration-500 hover:-translate-y-2">
                        <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(204,31,38,0.3)]">
                            <Tag className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Şeffaf Fiyatlandırma</h3>
                        <p className="text-gray-500 text-base leading-relaxed font-medium">Lüks segment kiralama hizmetini her zaman en rekabetçi, şeffaf ve sürprizsiz fiyatlarla alın.</p>
                    </div>
                </div>
            </section>


        </div>
    );
};
