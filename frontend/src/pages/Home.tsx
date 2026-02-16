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
import { Loader2, Search, SlidersHorizontal, RotateCcw, Plus, Minus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { CampaignCarousel } from '../components/CampaignCarousel';
import { campaignService } from '../services/campaign.service';
import type { Campaign } from '../services/campaign.service';

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
    const [secondaryCampaign, setSecondaryCampaign] = useState<Campaign | null>(null);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const animationRef = useRef<number | null>(null);
    const scrollAccumulator = useRef(0);


    // Prepare display brands (triple buffer for infinite scroll)
    // Prepare display brands (triple buffer for infinite scroll)
    const effectiveBrands = useMemo(() => brands.length > 0 ? brands : [
        { name: 'BMW', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg' },
        { name: 'Mercedes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Benz_Logo_2010.svg' },
    ], [brands]);

    // Ensure we have enough items for scrolling to cover viewport + buffer
    const displayBrands = useMemo(() => {
        let base = effectiveBrands;
        // Duplicate until we have enough items to fill the viewport
        while (base.length < 12) {
            base = [...base, ...effectiveBrands];
        }
        return [...base, ...base]; // Double buffer (reduced from triple)
    }, [effectiveBrands]);

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
        // Initialize accumulator with current position
        if (scrollContainerRef.current) {
            scrollAccumulator.current = scrollContainerRef.current.scrollLeft;
        }

        const scrollLoop = () => {
            if (!scrollContainerRef.current) return;

            if (!isPaused) {
                const oneSetWidth = scrollContainerRef.current.scrollWidth / 2; // Double buffer

                // Increment accumulator
                scrollAccumulator.current += 0.5; // Speed: 0.5px/frame (approx 30px/sec) - Slow and elegant

                // Seamless Loop Logic: Double buffer [0][1]
                // If we reach end of set 1, jump back to set 0
                if (scrollAccumulator.current >= oneSetWidth) {
                    scrollAccumulator.current -= oneSetWidth;
                }
                // If we go backwards past 0, jump to end of set 0
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

        animationRef.current = requestAnimationFrame(scrollLoop);

        return () => {
            if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
        };
    }, [isPaused, displayBrands]); // Re-run if paused changes or brands update

    // Initial positioning
    useEffect(() => {
        if (displayBrands.length > 0 && scrollContainerRef.current) {
            // Initial center position setup
            setTimeout(() => {
                if (scrollContainerRef.current && scrollContainerRef.current.scrollLeft < 10) {
                    const oneSetWidth = scrollContainerRef.current.scrollWidth / 3;
                    scrollContainerRef.current.scrollLeft = oneSetWidth;
                    scrollAccumulator.current = oneSetWidth;
                }
            }, 100);
        }
    }, [displayBrands]);

    const fetchCars = async (pageToFetch = 1, append = false) => {
        setLoading(true);
        try {
            // Clean filters: remove empty strings
            const cleanedFilters: any = {
                ...filters,
                q: filters.brand, // Map brand input to general search 'q'
                limit: 12, // User requested limit 12 per page
                page: pageToFetch,
                type: 'RENTAL' // Enforce RENTAL type for Home page
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

    const fetchSecondaryCampaign = async () => {
        try {
            const campaigns = await campaignService.getPublic();
            const saleCampaign = campaigns.find(c => c.tag === 'YENİ HİZMET' || c.requiredCondition === 'HAS_SALE_CARS');

            if (saleCampaign) {
                // HAS_SALE_CARS condition is already checked by Layout on mount.
                // Show the campaign — the nav link visibility already gates the UX.
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
                    <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none animate-fade-in-up delay-100 drop-shadow-2xl">
                        YOLCULUĞUN <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple text-glow">GELECEĞİNİ</span> SÜR
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light animate-fade-in-up delay-200">
                        Sıradan olanı reddet. SlonCar ile en prestijli araçları, en zahmetsiz deneyimle keşfet.
                    </p>

                    <div className="animate-fade-in-up delay-300 pt-4">
                        <Button
                            onClick={() => document.getElementById('fleet')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_50px_rgba(99,102,241,0.7)] transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            <Sparkles className="w-5 h-5" />
                            ARAÇLARI İNCELE
                        </Button>
                    </div>
                </div>
            </section>

            {/* Floating Search Bar (Desktop) */}
            <div className="relative z-20 container mx-auto px-4 -mt-24 hidden md:block">
                <div className="max-w-6xl mx-auto bg-dark-surface-lighter/80 backdrop-blur-xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 border border-white/10">

                    {/* Date Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col group">
                            <label className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide group-hover:text-primary-400 transition-colors">Alış Tarihi</label>
                            <div className="relative">
                                <DatePicker
                                    selected={parseDateString(filters.pickupDate)}
                                    onChange={(date: Date | null) => {
                                        const val = date ? formatDateForAPI(date) : '';
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
                                        const val = date ? formatDateForAPI(date) : '';
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
                                <option value="" className="bg-dark-bg">Tüm Kategoriler</option>
                                <option value="ECONOMY" className="bg-dark-bg">{translateCategory('ECONOMY')}</option>
                                <option value="COMPACT" className="bg-dark-bg">{translateCategory('COMPACT')}</option>
                                <option value="MIDSIZE" className="bg-dark-bg">{translateCategory('MIDSIZE')}</option>
                                <option value="FULLSIZE" className="bg-dark-bg">{translateCategory('FULLSIZE')}</option>
                                <option value="SUV" className="bg-dark-bg">{translateCategory('SUV')}</option>
                                <option value="VAN" className="bg-dark-bg">{translateCategory('VAN')}</option>
                                <option value="LUXURY" className="bg-dark-bg">{translateCategory('LUXURY')}</option>
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
                                step="100"

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
                                step="100"
                            />
                        </div>

                        <div className="md:col-span-2 flex gap-2">
                            <Button onClick={() => fetchCars(1, false)} className="flex-1 h-[46px] text-base font-bold bg-white text-dark-bg hover:bg-primary-500 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all">
                                <Search className="w-5 h-5 mr-2" /> BUL
                            </Button>
                            {/* Clear Filters Button */}
                            {Object.values(filters).some(x => x !== '') && (
                                <Button
                                    onClick={() => {
                                        setFilters({ brand: '', category: '', minPrice: '', maxPrice: '', pickupDate: '', dropoffDate: '' });
                                        // Reset to page 1 and empty filters
                                        // We need to call fetchCars with empty filters, but fetchCars reads from state 'filters'
                                        // Since setState is async, we can pass a temporary override or just wait for effect if we had one on filters (which we don't)
                                        // Better way: manual call with empty object passed to service, but here we reuse fetchCars
                                        // Let's just reset filters and then trigger fetch in next tick or manually match logic

                                        // For simplicity, we just reload window or modify fetchCars to accept filters param. 
                                        // But reusing existing pattern:
                                        setTimeout(() => {
                                            // Trigger fetch after state update
                                            // Actually state update might not be ready. 
                                            // Let's manually call service here to be safe and fast UI response
                                            carService.getAll({ limit: 12, page: 1 }).then(res => {
                                                setCars(res.data);
                                                setPagination(res.pagination);
                                                setPage(1);
                                            });
                                        }, 0);
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

            {/* Mobile Search Trigger Button */}
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
                        {/* Dates */}
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
                                    className="w-full px-4 py-4 bg-dark-surface border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-white font-medium text-lg"
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
                                    className="w-full px-4 py-4 bg-dark-surface border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-white font-medium text-lg"
                                    minDate={parseDateString(filters.pickupDate) || new Date()}
                                    withPortal
                                />
                            </div>
                        </div>

                        {/* Filters */}
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
                                    className="w-full px-4 py-3 bg-dark-surface border border-white/10 rounded-xl text-white appearance-none h-12"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                >
                                    <option value="" className="bg-dark-bg">Tüm Kategoriler</option>
                                    <option value="ECONOMY" className="bg-dark-bg">{translateCategory('ECONOMY')}</option>
                                    <option value="COMPACT" className="bg-dark-bg">{translateCategory('COMPACT')}</option>
                                    <option value="MIDSIZE" className="bg-dark-bg">{translateCategory('MIDSIZE')}</option>
                                    <option value="FULLSIZE" className="bg-dark-bg">{translateCategory('FULLSIZE')}</option>
                                    <option value="SUV" className="bg-dark-bg">{translateCategory('SUV')}</option>
                                    <option value="VAN" className="bg-dark-bg">{translateCategory('VAN')}</option>
                                    <option value="LUXURY" className="bg-dark-bg">{translateCategory('LUXURY')}</option>
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
                            className="w-full h-14 text-lg font-bold bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-500/30 rounded-xl flex items-center justify-center gap-2"
                        >
                            <Search className="w-5 h-5" /> SONUÇLARI GÖSTER
                        </Button>
                        {Object.values(filters).some(x => x !== '') && (
                            <button
                                onClick={() => {
                                    setFilters({ brand: '', category: '', minPrice: '', maxPrice: '', pickupDate: '', dropoffDate: '' });
                                    setTimeout(() => {
                                        carService.getAll({ limit: 12, page: 1 }).then(res => {
                                            setCars(res.data);
                                            setPagination(res.pagination);
                                            setPage(1);
                                        });
                                    }, 0);
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

            {/* Campaign Carousel Section */}
            <div className="container mx-auto px-4 mt-12 md:mt-24">
                <CampaignCarousel />
            </div>

            {/* Second Hand Teaser Section - Dynamic */}
            {secondaryCampaign && (
                <div className="container mx-auto px-4 mt-20">
                    <div className={`relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 ${secondaryCampaign.imageUrl ? 'bg-gradient-to-r from-gray-900 to-gray-800' : 'bg-gradient-to-br from-primary-900/40 via-dark-surface to-dark-bg'}`}>
                        {secondaryCampaign.imageUrl ? (
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={secondaryCampaign.imageUrl}
                                    alt="Campaign Background"
                                    className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent" />
                            </div>
                        ) : (
                            /* Theme container for text-only campaigns */
                            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent opacity-50" />
                        )}

                        <div className={`relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8`}>
                            <div className={`max-w-2xl space-y-6`}>
                                {secondaryCampaign.tag && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3" /> {secondaryCampaign.tag}
                                    </div>
                                )}
                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight whitespace-pre-line">
                                    {secondaryCampaign.title}
                                </h2>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    {secondaryCampaign.description}
                                </p>
                                {secondaryCampaign.ctaLink && (
                                    <div className="flex flex-wrap gap-4 pt-2">
                                        <Button
                                            onClick={() => window.location.href = secondaryCampaign.ctaLink!}
                                            className="bg-white text-gray-900 hover:bg-blue-50 text-base px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-white/20 flex items-center gap-2"
                                        >
                                            {secondaryCampaign.ctaText || 'İNCELE'} <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Carousel Section */}
            <div className="container mx-auto px-6 mt-16 mb-0 relative group/carousel">
                <div
                    className="relative flex items-center justify-center"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    {/* Prev Button - Absolute & Glassmorphism */}
                    <button
                        onClick={scrollLeft}
                        className="hidden md:block absolute left-0 z-20 p-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/40 hover:border-primary-500/50 transition-all opacity-0 group-hover/carousel:opacity-100 -translate-x-6"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Scrollable Container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto gap-6 pb-4 pt-2 px-12 scroll-auto no-scrollbar max-w-[1200px]"
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
                                    // Immediate fetch with new brand
                                    carService.getAll({ q: brand.name, limit: 12, page: 1 }).then(res => {
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
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-xl flex items-center justify-center mb-3 p-2 shadow-inner transition-transform duration-300 group-hover:scale-110">
                                    <img
                                        src={brand.logoUrl}
                                        alt={brand.name}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className={`text-xs font-bold tracking-widest uppercase truncate w-full px-1 ${filters.brand.toLowerCase() === brand.name.toLowerCase() ? 'text-primary-400' : 'text-gray-400 group-hover:text-white'}`}>{brand.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Next Button - Absolute & Glassmorphism */}
                    <button
                        onClick={scrollRight}
                        className="hidden md:block absolute right-0 z-20 p-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/40 hover:border-primary-500/50 transition-all opacity-0 group-hover/carousel:opacity-100 translate-x-6"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Car Grid Section */}
            <section
                id="fleet"
                className="container mx-auto px-6 pt-12 scroll-mt-24 relative"
                style={{ overflowAnchor: 'none' }}
            >
                {/* Background Blobs */}
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary-900/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none" />

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
                                    brandLogoUrl={getBrandLogoUrl(car.brand)}
                                />
                            ))}
                        </div>

                        {/* Load More & Show Less Buttons */}
                        {(page < pagination.totalPages || page > 1) && (
                            <div className="mt-12 flex justify-center gap-4">
                                {page > 1 && (
                                    <Button
                                        onClick={() => {
                                            fetchCars(1, false);
                                            // Optional: Scroll back to top of fleet section
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
                                        onClick={(e) => {
                                            // Prevent default behavior and stop propagation
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Blur to avoid focus anchoring
                                            e.currentTarget.blur();
                                            fetchCars(page + 1, true);
                                        }}
                                        disabled={loading}
                                        className="bg-dark-surface-lighter border border-white/10 text-white hover:bg-primary-500 hover:border-primary-500 px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-primary-500/20 flex items-center gap-2"
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
