import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { adminService, uploadService, brandService } from '../services/api';
import type { Car } from '../services/types';
import { Button } from '../components/ui/Button';
import { translateCategory, translateFuel } from '../utils/translate';
import { Loader2, Plus, Edit2, Trash2, X, Upload, Car as CarIcon, ArrowLeft, Search, ChevronLeft, ChevronRight, AlertTriangle, Filter } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { storage } from '../utils/storage';
import { CarDamageMap } from '../components/ui/CarDamageMap';

interface Brand {
    id: string;
    name: string;
    logoUrl: string;
}

interface Branch {
    id: string;
    name: string;
    city: string;
}

const initialFormData = {
    brand: '',
    model: '',
    year: new Date().getFullYear() as number | string,
    transmission: 'AUTO' as 'MANUAL' | 'AUTO',
    fuel: 'PETROL' as 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'LPG',
    category: 'MIDSIZE' as 'ECONOMY' | 'COMPACT' | 'MIDSIZE' | 'FULLSIZE' | 'SUV' | 'VAN' | 'LUXURY',
    seats: 5 as number | string,
    doors: 4 as number | string,
    color: '',
    plateNumber: '',
    salePrice: 0 as number | string,
    mileage: 0 as number | string,
    branchId: '',
    images: [] as string[],
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE',
    isFeatured: false,
    accidentDescription: '',
    changedParts: '', // comma separated for input
    paintedParts: '', // comma separated for input
    features: '',      // comma separated for input
    type: 'SALE' as 'SALE'
};

const BrandLogo = ({ name, url, className = "w-8 h-8" }: { name: string, url?: string, className?: string }) => {
    const [error, setError] = useState(false);

    useEffect(() => {
        setError(false);
    }, [url]);

    if (!url || error) {
        return (
            <div className={`${className} rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0 border border-white/10`}>
                {name.substring(0, 2)}
            </div>
        );
    }

    return (
        <img
            src={url}
            alt={name}
            className={`${className} object-contain`}
            onError={() => setError(true)}
        />
    );
};

export const AdminSaleCars = () => {
    const { addToast: toast } = useToast();
    const [cars, setCars] = useState<Car[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

    // Scroll to form when it opens or when editing car changes
    useEffect(() => {
        if (showForm && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [showForm, editingCar]);

    const [formData, setFormData] = useState(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        const user = storage.getUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    // Filters & Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCars, setTotalCars] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [branchFilter, setBranchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [fuelFilter, setFuelFilter] = useState('');

    const ITEMS_PER_PAGE = 10;

    const loadData = async () => {
        try {
            const [branchesData, brandsData] = await Promise.all([
                adminService.getBranches(),
                brandService.getAllAdmin()
            ]);
            setBranches(branchesData);
            setBrands(brandsData);

            if (branchesData.length > 0 && !formData.branchId) {
                const defaultBranch = branchesData.find(b =>
                    b.city.toLowerCase().includes('manisa') ||
                    b.name.toLowerCase().includes('merkez')
                ) || branchesData[0];

                setFormData(prev => ({ ...prev, branchId: defaultBranch.id }));
            }
            await loadCars(1);
        } catch (err) {
            console.error(err);
            toast('Veriler yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadCars = async (page: number = 1) => {
        setTableLoading(true);
        try {
            const params: any = {
                limit: ITEMS_PER_PAGE,
                page: page,
                type: 'SALE' // Enforce SALE type
            };
            if (searchTerm) params.search = searchTerm;
            if (branchFilter) params.branchId = branchFilter;
            if (statusFilter) params.status = statusFilter;
            if (fuelFilter) params.fuel = fuelFilter;

            const carsData = await adminService.getCars(params);
            setCars(carsData.data);
            setTotalCars(carsData.pagination?.total || carsData.data.length);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
            toast('Araç listesi yüklenemedi', 'error');
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Debounced search and filters
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading) { // Don't trigger on initial load
                loadCars(1); // Reset to page 1 on filter change
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, branchFilter, statusFilter, fuelFilter]);

    const handlePageChange = (newPage: number) => {
        loadCars(newPage);
    };

    const handleEdit = (car: Car) => {
        setEditingCar(car);
        setFormData({
            brand: car.brand,
            model: car.model,
            year: car.year,
            transmission: car.transmission,
            fuel: car.fuel,
            category: car.category,
            seats: car.seats,
            doors: car.doors,
            color: car.color,
            plateNumber: car.plateNumber,
            salePrice: car.salePrice || 0,
            mileage: car.mileage,
            branchId: car.branchId,
            images: car.images || [],
            description: car.description || '',
            status: car.status,
            isFeatured: car.isFeatured || false,
            accidentDescription: car.accidentDescription || '',
            changedParts: car.changedParts?.join(', ') || '',
            paintedParts: car.paintedParts?.join(', ') || '',
            features: car.features?.join(', ') || '',
            type: 'SALE'
        });
        setShowForm(true);
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingCar(null);

        const defaultBranch = branches.find(b =>
            b.city.toLowerCase().includes('manisa') ||
            b.name.toLowerCase().includes('merkez')
        ) || branches[0];

        setFormData({ ...initialFormData, branchId: defaultBranch?.id || '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        // Manual validation since we use noValidate to allow mixed step logic
        if (!formData.brand || !formData.model || !formData.plateNumber || !formData.color || Number(formData.salePrice) < 0) {
            toast('Lütfen tüm zorunlu alanları doldurun', 'error');
            setSubmitting(false);
            return;
        }

        if (Number(formData.salePrice) > 99999999) {
            toast('Satış fiyatı çok yüksek (Max: 99.999.999)', 'error');
            setSubmitting(false);
            return;
        }

        try {
            const carData = {
                ...formData,
                salePrice: Number(formData.salePrice),
                mileage: Number(formData.mileage),
                year: Number(formData.year),
                seats: Number(formData.seats),
                doors: Number(formData.doors),
                isFeatured: formData.isFeatured,
                accidentDescription: formData.accidentDescription,
                changedParts: formData.changedParts.split(',').map(s => s.trim()).filter(Boolean),
                paintedParts: formData.paintedParts.split(',').map(s => s.trim()).filter(Boolean),
                features: formData.features.split(',').map(s => s.trim()).filter(Boolean),
                type: 'SALE' // Enforce SALE
            };

            if (editingCar) {
                await adminService.updateCar(editingCar.id, carData);
                toast('Araç başarıyla güncellendi', 'success');
            } else {
                await adminService.createCar(carData);
                toast('Yeni satılık araç başarıyla eklendi', 'success');
            }

            handleCancelForm();
            loadCars(currentPage);
        } catch (err: any) {
            toast(err.response?.data?.error?.message || 'İşlem başarısız', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await adminService.deleteCar(deleteId);
            toast('Araç başarıyla silindi', 'success');
            // Check if page empty after delete
            if (cars.length === 1 && currentPage > 1) {
                loadCars(currentPage - 1);
            } else {
                loadCars(currentPage);
            }
        } catch (err: any) {
            toast(err.response?.data?.error?.message || 'Silme işlemi başarısız', 'error');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-dark-bg border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-white placeholder-gray-600";
    const labelClass = "block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide";
    const selectClass = "px-4 py-2 bg-dark-bg border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

    const clearFilters = () => {
        setSearchTerm('');
        setBranchFilter('');
        setStatusFilter('');
        setFuelFilter('');
    };

    if (loading) return (
        <div className="min-h-screen bg-dark-bg pt-24 pb-12 px-6">
            <div className="container mx-auto max-w-7xl space-y-8">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-12 w-32 rounded-xl" />
                </div>
                <div className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-16 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-dark-bg pt-24 pb-12 px-6">
            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Aracı Sil"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-gray-300 text-center">
                        Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>İptal</Button>
                        <Button
                            className="bg-red-500 hover:bg-red-600 text-white border-none"
                            onClick={confirmDelete}
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Evet, Sil'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <div className="container mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link to="/admin/dashboard" className="p-2 rounded-lg bg-dark-surface-lighter border border-white/10 text-gray-400 hover:text-white hover:border-primary-500/50 transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-tight">
                                    SATILIK <span className="text-primary-500">ARAÇLAR</span>
                                </h1>
                                <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-transparent mt-2 rounded-full" />
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            {!showForm && (
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${showFilters
                                            ? 'bg-primary-500/20 border-primary-500/50 text-white'
                                            : 'bg-dark-surface-lighter border-white/10 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <Filter className="w-5 h-5" />
                                        <span className="hidden md:inline">Filtrele</span>
                                        {(branchFilter || statusFilter || fuelFilter) && (
                                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                                        )}
                                    </Button>
                                    <div className="relative flex-1 md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Ara: Plaka, Marka..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-dark-surface-lighter border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                                        />
                                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => { setEditingCar(null); setFormData({ ...initialFormData, branchId: branches[0]?.id || '' }); setShowForm(true); }}
                                        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="hidden md:inline">Ekle</span>
                                    </Button>
                                </div>
                            )}
                            {showForm && (
                                <Button
                                    onClick={handleCancelForm}
                                    className="bg-dark-surface-lighter border border-white/10 text-gray-400 hover:text-white hover:border-red-500/50 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                                >
                                    <X className="w-5 h-5" />
                                    İptal
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {!showForm && showFilters && (
                        <div className="bg-dark-surface-lighter/50 border border-white/10 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-500 uppercase">Şube:</span>
                                    <select
                                        value={branchFilter}
                                        onChange={(e) => setBranchFilter(e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="" className="bg-dark-bg">Tümü</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id} className="bg-dark-bg">{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="h-8 w-px bg-white/10 hidden md:block" />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-500 uppercase">Durum:</span>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="" className="bg-dark-bg">Tümü</option>
                                        <option value="ACTIVE" className="bg-dark-bg">Aktif</option>
                                        <option value="MAINTENANCE" className="bg-dark-bg">Bakımda</option>
                                        <option value="INACTIVE" className="bg-dark-bg">Pasif</option>
                                    </select>
                                </div>
                                <div className="h-8 w-px bg-white/10 hidden md:block" />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-500 uppercase">Yakıt:</span>
                                    <select
                                        value={fuelFilter}
                                        onChange={(e) => setFuelFilter(e.target.value)}
                                        className={selectClass}
                                    >
                                        <option value="" className="bg-dark-bg">Tümü</option>
                                        <option value="PETROL" className="bg-dark-bg">Benzin</option>
                                        <option value="DIESEL" className="bg-dark-bg">Dizel</option>
                                        <option value="ELECTRIC" className="bg-dark-bg">Elektrik</option>
                                        <option value="HYBRID" className="bg-dark-bg">Hibrit</option>
                                        <option value="LPG" className="bg-dark-bg">LPG</option>
                                    </select>
                                </div>

                                {(branchFilter || statusFilter || fuelFilter || searchTerm) && (
                                    <button
                                        onClick={clearFilters}
                                        className="ml-auto text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
                                    >
                                        <X className="w-3 h-3" />
                                        Temizle
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Add/Edit Car Form */}
                {showForm && (
                    <div ref={formRef} className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-[0_0_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-top-4 duration-300">
                        <h2 className="text-2xl font-bold text-white mb-6 animate-pulse">{editingCar ? 'Satılık Araç Düzenle' : 'Yeni Satılık Araç Ekle'}</h2>

                        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClass}>Marka *</label>
                                <select required className={inputClass} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })}>
                                    <option value="" className="bg-dark-bg">Marka Seçin</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.name} className="bg-dark-bg">
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                {formData.brand && (
                                    <div className="mt-2 flex items-center gap-3 p-2.5 bg-dark-bg rounded-xl border border-white/10">
                                        <BrandLogo
                                            name={formData.brand}
                                            url={brands.find(b => b.name === formData.brand)?.logoUrl}
                                        />
                                        <span className="text-sm font-medium text-white">{formData.brand}</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Model *</label>
                                <input type="text" required className={inputClass} value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} placeholder="320i" />
                            </div>
                            <div>
                                <label className={labelClass}>Yıl *</label>
                                <input type="number" required min="2000" max="2030" className={inputClass} value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value === '' ? '' : Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className={labelClass}>Vites *</label>
                                <select required className={inputClass} value={formData.transmission} onChange={e => setFormData({ ...formData, transmission: e.target.value as any })}>
                                    <option value="AUTO" className="bg-dark-bg">Otomatik</option>
                                    <option value="MANUAL" className="bg-dark-bg">Manuel</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Yakıt *</label>
                                <select required className={inputClass} value={formData.fuel} onChange={e => setFormData({ ...formData, fuel: e.target.value as any })}>
                                    <option value="PETROL" className="bg-dark-bg">Benzin</option>
                                    <option value="DIESEL" className="bg-dark-bg">Dizel</option>
                                    <option value="ELECTRIC" className="bg-dark-bg">Elektrik</option>
                                    <option value="HYBRID" className="bg-dark-bg">Hibrit</option>
                                    <option value="LPG" className="bg-dark-bg">LPG</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Kategori *</label>
                                <select required className={inputClass} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                                    <option value="ECONOMY" className="bg-dark-bg">{translateCategory('ECONOMY')}</option>
                                    <option value="COMPACT" className="bg-dark-bg">{translateCategory('COMPACT')}</option>
                                    <option value="MIDSIZE" className="bg-dark-bg">{translateCategory('MIDSIZE')}</option>
                                    <option value="FULLSIZE" className="bg-dark-bg">{translateCategory('FULLSIZE')}</option>
                                    <option value="SUV" className="bg-dark-bg">{translateCategory('SUV')}</option>
                                    <option value="VAN" className="bg-dark-bg">{translateCategory('VAN')}</option>
                                    <option value="LUXURY" className="bg-dark-bg">{translateCategory('LUXURY')}</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Koltuk *</label>
                                <input type="number" required min="2" max="12" className={inputClass} value={formData.seats} onChange={e => setFormData({ ...formData, seats: e.target.value === '' ? '' : Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className={labelClass}>Kapı *</label>
                                <input type="number" required min="2" max="6" className={inputClass} value={formData.doors} onChange={e => setFormData({ ...formData, doors: e.target.value === '' ? '' : Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className={labelClass}>Renk *</label>
                                <input type="text" required className={inputClass} value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} placeholder="Siyah" />
                            </div>
                            <div>
                                <label className={labelClass}>Plaka *</label>
                                <input type="text" required className={inputClass} value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value })} placeholder="34 ABC 123" />
                            </div>
                            <div>
                                <label className={labelClass}>Satış Fiyatı (₺) *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1000"
                                    className={inputClass}
                                    value={formData.salePrice}
                                    onChange={e => setFormData({ ...formData, salePrice: e.target.value === '' ? '' : Number(e.target.value) })}
                                    onKeyDown={(e) => {
                                        if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setFormData(prev => ({ ...prev, salePrice: Number(prev.salePrice) + 1000 }));
                                        } else if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            const newVal = Number(formData.salePrice) - 1000;
                                            setFormData(prev => ({ ...prev, salePrice: newVal < 0 ? 0 : newVal }));
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Kilometre *</label>
                                <input type="number" required min="0" className={inputClass} value={formData.mileage} onChange={e => setFormData({ ...formData, mileage: e.target.value === '' ? '' : Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className={labelClass}>Şube *</label>
                                <div className="relative">
                                    <select
                                        required
                                        disabled
                                        className={inputClass + " opacity-50 cursor-not-allowed appearance-none"}
                                        value={formData.branchId}
                                        onChange={() => { }} // Read-only
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id} className="bg-dark-bg">{b.name} - {b.city}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 pointer-events-none">
                                        <span className="text-xs font-bold text-primary-500">TEK ŞUBE</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1.5 ml-1">* Şu an sadece Manisa şubesi aktiftir.</p>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Durum</label>
                                <select className={inputClass} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })}>
                                    <option value="ACTIVE" className="bg-dark-bg">Aktif</option>
                                    <option value="INACTIVE" className="bg-dark-bg">Pasif</option>
                                    <option value="MAINTENANCE" className="bg-dark-bg">Bakımda</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center gap-3 p-3 bg-dark-bg border border-white/10 rounded-xl cursor-pointer hover:border-primary-500/50 transition-all w-full h-[50px]">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-white/20 text-primary-500 focus:ring-primary-500 bg-dark-surface"
                                        checked={formData.isFeatured}
                                        onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    />
                                    <span className="font-bold text-white text-sm">Öne Çıkar</span>
                                </label>
                            </div>
                            <div className="lg:col-span-3">
                                <label className={labelClass}>Araç Fotoğrafı</label>
                                <div className="mt-2">
                                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary-500/50 hover:bg-white/5 transition-all cursor-pointer group relative bg-dark-bg/50">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                try {
                                                    setSubmitting(true);
                                                    const url = await uploadService.uploadImage(file);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        images: [url] // Replace existing images with new one
                                                    }));
                                                    toast('Fotoğraf yüklendi', 'success');
                                                } catch (err) {
                                                    console.error(err);
                                                    toast('Resim yüklenirken hata oluştu', 'error');
                                                } finally {
                                                    setSubmitting(false);
                                                }
                                            }}
                                        />
                                        <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-primary-500/20 group-hover:border-primary-500/50">
                                            <Upload className="w-8 h-8 text-primary-500" />
                                        </div>
                                        <p className="text-base font-bold text-white mb-2">Fotoğraf Yüklemek İçin Tıklayın</p>
                                        <p className="text-sm text-gray-500">veya dosyayı buraya sürükleyin</p>
                                        <p className="text-xs text-gray-600 mt-2">PNG, JPG, WEBP (Max 5MB)</p>
                                    </div>
                                </div>

                                {/* Preview uploaded images */}
                                {formData.images.length > 0 && (
                                    <div className="mt-6">
                                        <label className={labelClass}>Yüklenen Fotoğraf</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
                                            {formData.images.map((img, idx) => (
                                                <div key={idx} className="relative group aspect-[4/3] bg-black rounded-xl overflow-hidden border border-white/10 shadow-lg">
                                                    <img src={img} alt={`Car ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transform scale-90 hover:scale-100 transition-all shadow-lg"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="lg:col-span-2">
                                <label className={labelClass}>Açıklama</label>
                                <textarea rows={2} className={inputClass} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Araç hakkında notlar..." />
                            </div>
                            <div className="lg:col-span-3 border-t border-white/10 pt-6 mt-2">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-primary-500" />
                                    Ekspertiz ve Özellikler
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Ekspertiz / Tramer Açıklaması</label>
                                        <textarea rows={2} className={inputClass} value={formData.accidentDescription} onChange={e => setFormData({ ...formData, accidentDescription: e.target.value })} placeholder="Hasar kaydı ve ekspertiz detayları..." />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Görsel Hasar Kaydı (Parçalara Tıklayın)</label>
                                        <CarDamageMap
                                            changedParts={formData.changedParts.split(',').map(s => s.trim()).filter(Boolean)}
                                            paintedParts={formData.paintedParts.split(',').map(s => s.trim()).filter(Boolean)}
                                            onChange={(partName, newState) => {
                                                const changedArray = formData.changedParts.split(',').map(s => s.trim()).filter(Boolean);
                                                const paintedArray = formData.paintedParts.split(',').map(s => s.trim()).filter(Boolean);

                                                // Remove from both first
                                                const newChanged = changedArray.filter(p => p !== partName);
                                                const newPainted = paintedArray.filter(p => p !== partName);

                                                if (newState === 'CHANGED') newChanged.push(partName);
                                                if (newState === 'PAINTED') newPainted.push(partName);

                                                setFormData({
                                                    ...formData,
                                                    changedParts: newChanged.join(', '),
                                                    paintedParts: newPainted.join(', ')
                                                });
                                            }}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Ekstra Özellikler (Virgülle ayırın)</label>
                                        <input type="text" className={inputClass} value={formData.features} onChange={e => setFormData({ ...formData, features: e.target.value })} placeholder="Sunroof, Navigasyon, Deri Koltuk..." />
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-3 flex justify-end gap-4 pt-6 border-t border-white/10">
                                <Button type="button" onClick={handleCancelForm} className="px-6 py-3 bg-dark-bg border border-white/10 text-gray-400 hover:text-white rounded-xl transition-all">
                                    İptal
                                </Button>
                                <Button type="submit" disabled={submitting} className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all flex items-center gap-2">
                                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {editingCar ? 'Güncelle' : 'Ekle'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Cars Table */}
                <div className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-white">Araç Listesi</h2>
                            <span className="text-xs font-bold text-gray-400 bg-dark-bg px-3 py-1.5 rounded-full border border-white/5">{totalCars} araç</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-dark-bg/50 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Araç</th>
                                    <th className="p-4">Plaka</th>
                                    <th className="p-4">Kategori</th>
                                    <th className="p-4">Vites / Yakıt</th>
                                    <th className="p-4">Satış Fiyatı</th>
                                    <th className="p-4">Durum</th>
                                    <th className="p-4">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tableLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                                            <td className="p-4"><Skeleton className="h-8 w-24" /></td>
                                            <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                                            <td className="p-4"><Skeleton className="h-6 w-32" /></td>
                                            <td className="p-4"><Skeleton className="h-8 w-24" /></td>
                                            <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                            <td className="p-4"><Skeleton className="h-8 w-16" /></td>
                                        </tr>
                                    ))
                                ) : cars.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center bg-dark-surface-lighter/50">
                                            <div className="flex flex-col items-center justify-center p-8 rounded-3xl border border-white/5 bg-dark-bg/50 max-w-md mx-auto">
                                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                                                    <CarIcon className="w-10 h-10 text-gray-500" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2">Araç Bulunamadı</h3>
                                                <p className="text-gray-400 text-sm mb-6">Aradığınız kriterlere uygun araç bulunamadı veya henüz araç eklenmemiş.</p>
                                                <Button
                                                    onClick={() => {
                                                        setEditingCar(null);
                                                        setFormData({ ...initialFormData, branchId: branches[0]?.id || '' });
                                                        setShowForm(true);
                                                    }}
                                                    className="bg-primary-500/20 text-primary-400 hover:bg-primary-500 hover:text-white border border-primary-500/30 transition-all font-bold px-6"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Yeni Araç Ekle
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    cars.map(car => (
                                        <tr key={car.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <BrandLogo
                                                        name={car.brand}
                                                        url={brands.find(b => b.name === car.brand)?.logoUrl}
                                                    />
                                                    <div>
                                                        <div className="font-medium text-white">{car.brand} {car.model}</div>
                                                        <div className="text-xs text-gray-500">{car.year} • {car.color}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-primary-400">{car.plateNumber}</td>
                                            <td className="p-4 text-gray-300">{translateCategory(car.category)}</td>
                                            <td className="p-4 text-sm text-gray-400">
                                                {car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel'} / {translateFuel(car.fuel)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-green-400">{Number(car.salePrice).toLocaleString()} ₺</span>
                                                    {car.isFeatured && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full w-fit mt-1 border border-primary-500/20">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                                                            ÖNE ÇIKAN
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${car.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                    car.status === 'MAINTENANCE' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                    }`}>
                                                    {car.status === 'ACTIVE' ? 'Aktif' : car.status === 'MAINTENANCE' ? 'Bakımda' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(car)}
                                                        className="p-2 rounded-lg bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-all"
                                                        title="Düzenle"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {currentUser?.role === 'ADMIN' && (
                                                        <button
                                                            onClick={() => setDeleteId(car.id)}
                                                            disabled={submitting}
                                                            className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalCars > ITEMS_PER_PAGE && (
                        <div className="p-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                Toplam {totalCars} araç, sayfa {currentPage} / {Math.ceil(totalCars / ITEMS_PER_PAGE)}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || tableLoading}
                                    className="p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, Math.ceil(totalCars / ITEMS_PER_PAGE)) }, (_, i) => {
                                        const totalPages = Math.ceil(totalCars / ITEMS_PER_PAGE);
                                        let pageNum: number;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                disabled={tableLoading}
                                                className={`w-10 h-10 rounded-lg font-bold transition-all ${currentPage === pageNum
                                                    ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                                                    : 'bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-primary-500/50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage >= Math.ceil(totalCars / ITEMS_PER_PAGE) || tableLoading}
                                    className="p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
