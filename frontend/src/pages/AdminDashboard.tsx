import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../services/api';
import type { DashboardStats, Booking } from '../services/types';
import { Button } from '../components/ui/Button';
import { translateCategory } from '../utils/translate';
import { Loader2, DollarSign, Calendar, Car as CarIcon, Settings, TrendingUp, Users, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Search, Filter, X, Building2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RevenueAnalytics {
    weekly: { week: string; revenue: number; bookings: number }[];
    monthly: { month: string; revenue: number; bookings: number }[];
    yearly: { year: number; revenue: number; bookings: number }[];
    availableYears: number[];
    summary: {
        currentMonth: number;
        lastMonth: number;
        currentYear: number;
        growth: number;
    };
}

const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: 'green' | 'blue' | 'purple' | 'orange' }) => {
    const colorClasses = {
        green: 'from-green-500/20 to-transparent border-green-500/30 text-green-400',
        blue: 'from-blue-500/20 to-transparent border-blue-500/30 text-blue-400',
        purple: 'from-purple-500/20 to-transparent border-purple-500/30 text-purple-400',
        orange: 'from-orange-500/20 to-transparent border-orange-500/30 text-orange-400',
    };

    const iconBgClasses = {
        green: 'bg-green-500/20 text-green-400',
        blue: 'bg-blue-500/20 text-blue-400',
        purple: 'bg-purple-500/20 text-purple-400',
        orange: 'bg-orange-500/20 text-orange-400',
    };

    return (
        <div className={`relative overflow-hidden bg-dark-surface-lighter/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:border-${color}-500/30 transition-all group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`} />
            <div className="relative flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconBgClasses[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-gray-400 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-black text-white">{value}</p>
                </div>
            </div>
        </div>
    );
};

const BookingDetailModal = ({ booking, onClose }: { booking: Booking; onClose: () => void }) => {
    if (!booking) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-dark-surface w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Rezervasyon Detayı</h2>
                        <p className="text-primary-400 font-mono text-sm mt-1">{booking.bookingCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
                    {/* Status Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-5 h-5 text-primary-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Müşteri Bilgileri</h3>
                            </div>
                            <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Ad Soyad</label>
                                    <p className="text-white font-medium">{booking.customerName} {booking.customerSurname}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Telefon</label>
                                    <p className="text-white font-mono">{booking.customerPhone}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">E-posta</label>
                                    <p className="text-white">{booking.customerEmail}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Ehliyet No</label>
                                        <p className="text-white font-mono">{booking.customerDriverLicense || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">TC Kimlik</label>
                                        <p className="text-white font-mono">{booking.customerTC || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Car Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <CarIcon className="w-5 h-5 text-primary-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Araç Bilgileri</h3>
                            </div>
                            <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-3">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Araç</label>
                                    <p className="text-white font-bold text-lg">{booking.car?.brand} {booking.car?.model}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Plaka</label>
                                        <p className="text-white font-mono">{booking.car?.plateNumber}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Kategori</label>
                                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-white">{translateCategory(booking.car?.category || '')}</span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-white/5 mt-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs text-gray-500">Toplam Tutar</label>
                                        <p className="text-xl font-bold text-primary-400">{Number(booking.totalPrice).toLocaleString()} ₺</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dates & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-primary-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Kiralama Süresi</h3>
                            </div>
                            <div className="bg-dark-bg p-4 rounded-xl border border-white/5 flex justify-between items-center text-center">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Alış</label>
                                    <p className="text-white font-medium">{new Date(booking.pickupDate).toLocaleDateString('tr-TR')}</p>
                                </div>
                                <div className="text-gray-600">➝</div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Teslim</label>
                                    <p className="text-white font-medium">{new Date(booking.dropoffDate).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>
                        </div>

                        {booking.notes && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-primary-500/20 text-primary-500 text-xs font-bold">i</div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Müşteri Notu</h3>
                                </div>
                                <div className="bg-dark-bg p-4 rounded-xl border border-white/5">
                                    <p className="text-gray-300 text-sm italic">"{booking.notes}"</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                    <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                        Kapat
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
    const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalBookings, setTotalBookings] = useState(0);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [franchiseApplications, setFranchiseApplications] = useState<any[]>([]);
    const [selectedFranchise, setSelectedFranchise] = useState<any | null>(null);
    const [franchiseLoading, setFranchiseLoading] = useState(false);
    const ITEMS_PER_PAGE = 10;

    const STATUS_OPTIONS = [
        { value: '', label: 'Tümü', color: 'gray' },
        { value: 'RESERVED', label: 'Rezerve', color: 'primary' },
        { value: 'ACTIVE', label: 'Aktif', color: 'green' },
        { value: 'COMPLETED', label: 'Tamamlandı', color: 'gray' },
        { value: 'CANCELLED', label: 'İptal', color: 'red' },
    ];

    const FRANCHISE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
        DRAFT: { label: 'Taslak', color: 'gray' },
        SUBMITTED: { label: 'Gönderildi', color: 'blue' },
        IN_REVIEW: { label: 'İnceleniyor', color: 'yellow' },
        APPROVED: { label: 'Onaylandı', color: 'green' },
        REJECTED: { label: 'Reddedildi', color: 'red' },
    };

    const loadData = async () => {
        try {
            const [statsData, revenueAnalytics, franchiseData] = await Promise.all([
                adminService.getDashboard(),
                adminService.getRevenueAnalytics(selectedYear),
                adminService.getFranchiseApplications({ limit: 50 })
            ]);
            setStats(statsData);
            setRevenueData(revenueAnalytics);
            setFranchiseApplications(franchiseData.data || []);
            await loadBookings(1);
        } catch (err) {
            console.error(err);
            navigate('/admin/login');
        } finally {
            setLoading(false);
        }
    };

    const loadBookings = async (page: number, search?: string, status?: string) => {
        setBookingsLoading(true);
        try {
            const params: any = {
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE
            };
            if (search) params.search = search;
            if (status) params.status = status;

            const bookingsData = await adminService.getBookings(params);
            setBookings(bookingsData.data);
            setTotalBookings(bookingsData.pagination?.total || bookingsData.data.length);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
        } finally {
            setBookingsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    // Auto-search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            loadBookings(1, searchTerm || undefined, statusFilter || undefined);
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    const handleCancel = async (id: string) => {
        if (!confirm('Bu rezervasyonu iptal etmek istediğinizden emin misiniz?')) return;
        try {
            await adminService.cancelBooking(id);
            loadData();
        } catch (err) {
            alert('İptal işlemi başarısız');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-dark-bg pt-24 flex justify-center items-center">
            <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
        </div>
    );

    if (!stats) return (
        <div className="min-h-screen bg-dark-bg pt-24 flex justify-center items-center">
            <div className="text-gray-400">Veri yükleme hatası</div>
        </div>
    );

    const getChartData = () => {
        if (!revenueData) return [];
        switch (chartView) {
            case 'weekly': return revenueData.weekly;
            case 'monthly': return revenueData.monthly;
            case 'yearly': return revenueData.yearly.map(y => ({ ...y, month: y.year.toString() }));
        }
    };

    const getDataKey = () => chartView === 'yearly' ? 'month' : (chartView === 'weekly' ? 'week' : 'month');

    return (
        <div className="min-h-screen bg-dark-bg pt-24 pb-12 px-6">
            {selectedBooking && (
                <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
            )}

            <div className="container mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">
                            GENEL <span className="text-primary-500">BAKIŞ</span>
                        </h1>
                        <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-transparent mt-2 rounded-full" />
                    </div>
                    <Link to="/admin/cars">
                        <Button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Araç Yönetimi
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Toplam Ciro"
                        value={`${stats.totalRevenue.toLocaleString()} ₺`}
                        icon={<DollarSign className="w-6 h-6" />}
                        color="green"
                    />
                    <StatCard
                        title="Toplam Rezervasyon"
                        value={stats.totalBookings}
                        icon={<Calendar className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Aktif Kiralama"
                        value={stats.activeBookings}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="purple"
                    />
                    <StatCard
                        title="Toplam Araç"
                        value={stats.totalCars}
                        icon={<CarIcon className="w-6 h-6" />}
                        color="orange"
                    />
                </div>

                {/* Revenue Chart Section */}
                {revenueData && (
                    <div className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                        <div className="p-6 border-b border-white/10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Gelir Analizi</h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-3xl font-black text-green-400">
                                            {revenueData.summary.currentYear.toLocaleString()} ₺
                                        </span>
                                        <span className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full ${revenueData.summary.growth >= 0
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {revenueData.summary.growth >= 0
                                                ? <ArrowUpRight className="w-4 h-4" />
                                                : <ArrowDownRight className="w-4 h-4" />
                                            }
                                            {Math.abs(revenueData.summary.growth)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Year Selector */}
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="px-4 py-2 bg-dark-bg border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        {revenueData.availableYears.map(year => (
                                            <option key={year} value={year} className="bg-dark-bg">{year}</option>
                                        ))}
                                    </select>
                                    {/* View Toggle */}
                                    <div className="flex bg-dark-bg rounded-xl p-1 border border-white/10">
                                        {(['weekly', 'monthly', 'yearly'] as const).map((view) => (
                                            <button
                                                key={view}
                                                onClick={() => setChartView(view)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${chartView === view
                                                    ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                                                    : 'text-gray-400 hover:text-white'
                                                    }`}
                                            >
                                                {view === 'weekly' ? 'Haftalık' : view === 'monthly' ? 'Aylık' : 'Yıllık'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartView === 'yearly' ? (
                                        <BarChart data={getChartData()}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis
                                                dataKey={getDataKey()}
                                                stroke="#9ca3af"
                                                fontSize={12}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="#9ca3af"
                                                fontSize={12}
                                                tickLine={false}
                                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    color: 'white'
                                                }}
                                                formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()} ₺`, 'Gelir']}
                                            />
                                            <Bar
                                                dataKey="revenue"
                                                fill="#6366f1"
                                                radius={[8, 8, 0, 0]}
                                            />
                                        </BarChart>
                                    ) : (
                                        <AreaChart data={getChartData()}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                            <XAxis
                                                dataKey={getDataKey()}
                                                stroke="#9ca3af"
                                                fontSize={12}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                stroke="#9ca3af"
                                                fontSize={12}
                                                tickLine={false}
                                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    color: 'white'
                                                }}
                                                formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()} ₺`, 'Gelir']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                            />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Bookings Table with Pagination */}
                <div className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                    <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-white">Tüm Rezervasyonlar</h2>
                            <span className="text-xs font-bold text-gray-400 bg-dark-bg px-3 py-1.5 rounded-full border border-white/5">
                                {totalBookings} kayıt
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${showFilters || statusFilter
                                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                                    : 'bg-dark-bg border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                {statusFilter && (
                                    <span className="text-xs font-bold">1</span>
                                )}
                            </button>
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="İsim ile ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-8 py-2 bg-dark-bg border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 w-52"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Filter Chips Row */}
                    {showFilters && (
                        <div className="px-6 py-4 border-b border-white/10 bg-dark-bg/30">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 uppercase">Durum:</span>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map((status) => (
                                        <button
                                            key={status.value}
                                            onClick={() => setStatusFilter(status.value)}
                                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === status.value
                                                ? status.color === 'green' ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' :
                                                    status.color === 'red' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                                                        status.color === 'primary' ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' :
                                                            'bg-gray-500 text-white shadow-[0_0_15px_rgba(107,114,128,0.4)]'
                                                : 'bg-dark-surface-lighter border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                                                }`}
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                                {/* Clear Filters */}
                                {statusFilter && (
                                    <button
                                        onClick={() => setStatusFilter('')}
                                        className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                        Filtreleri Temizle
                                    </button>
                                )}
                            </div>
                        </div>
                    )}


                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-dark-bg/50 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Kod</th>
                                    <th className="p-4">Müşteri</th>
                                    <th className="p-4">Araç</th>
                                    <th className="p-4">Tarihler</th>
                                    <th className="p-4">Durum</th>
                                    <th className="p-4">Detaylar</th>
                                    <th className="p-4">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                            <p className="text-gray-400">Henüz rezervasyon yok</p>
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map(booking => (
                                        <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono font-bold text-primary-400">{booking.bookingCode}</td>
                                            <td className="p-4">
                                                <div className="font-medium text-white">{booking.customerName} {booking.customerSurname}</div>
                                                <div className="text-xs text-gray-500">{booking.customerPhone}</div>
                                            </td>
                                            <td className="p-4 text-gray-300">{booking.car?.brand} {booking.car?.model}</td>
                                            <td className="p-4 text-sm text-gray-400">
                                                {new Date(booking.pickupDate).toLocaleDateString('tr-TR')} - <br />
                                                {new Date(booking.dropoffDate).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${booking.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                    booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                        booking.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
                                                            'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                                    }`}>
                                                    {booking.status === 'ACTIVE' ? 'Aktif' :
                                                        booking.status === 'CANCELLED' ? 'İptal' :
                                                            booking.status === 'COMPLETED' ? 'Tamamlandı' : 'Rezerve'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs px-3 py-1.5 border-primary-500/30 text-primary-400 hover:bg-primary-500/20"
                                                    onClick={() => setSelectedBooking(booking)}
                                                >
                                                    İncele
                                                </Button>
                                            </td>
                                            <td className="p-4">
                                                {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                                                    <Button
                                                        size="sm"
                                                        className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-lg"
                                                        onClick={() => handleCancel(booking.id)}
                                                    >
                                                        İptal Et
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalBookings > ITEMS_PER_PAGE && (
                        <div className="p-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                Sayfa {currentPage} / {Math.ceil(totalBookings / ITEMS_PER_PAGE)} ({totalBookings} kayıt)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => loadBookings(currentPage - 1)}
                                    disabled={currentPage === 1 || bookingsLoading}
                                    className="p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, Math.ceil(totalBookings / ITEMS_PER_PAGE)) }, (_, i) => {
                                        const totalPages = Math.ceil(totalBookings / ITEMS_PER_PAGE);
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
                                                onClick={() => loadBookings(pageNum)}
                                                disabled={bookingsLoading}
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
                                    onClick={() => loadBookings(currentPage + 1)}
                                    disabled={currentPage >= Math.ceil(totalBookings / ITEMS_PER_PAGE) || bookingsLoading}
                                    className="p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Franchise Applications Section */}
                <div className="bg-dark-surface rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-purple-400" />
                            </div>
                            Franchise Başvuruları
                        </h2>
                        <span className="text-sm text-gray-400">{franchiseApplications.length} başvuru</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5 text-left text-sm text-gray-400">
                                    <th className="p-4 font-semibold">Başvuran</th>
                                    <th className="p-4 font-semibold">İletişim</th>
                                    <th className="p-4 font-semibold">Şehir</th>
                                    <th className="p-4 font-semibold">Bütçe</th>
                                    <th className="p-4 font-semibold">Durum</th>
                                    <th className="p-4 font-semibold">Tarih</th>
                                    <th className="p-4 font-semibold">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {franchiseLoading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">Yükleniyor...</td></tr>
                                ) : franchiseApplications.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-gray-400">Henüz franchise başvurusu yok</td></tr>
                                ) : (
                                    franchiseApplications.map((app) => {
                                        const statusInfo = FRANCHISE_STATUS_LABELS[app.status] || { label: app.status, color: 'gray' };
                                        return (
                                            <tr key={app.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{app.contactName}</div>
                                                    {app.companyName && <div className="text-xs text-gray-400">{app.companyName}</div>}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-gray-300">{app.contactEmail}</div>
                                                    <div className="text-xs text-gray-500">{app.contactPhone}</div>
                                                </td>
                                                <td className="p-4 text-gray-300">{app.city || '-'}</td>
                                                <td className="p-4 text-sm text-gray-400">{app.details?.investmentBudget || '-'}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                        statusInfo.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                            statusInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                                                statusInfo.color === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                        }`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-400">
                                                    {new Date(app.submittedAt || app.createdAt).toLocaleDateString('tr-TR')}
                                                </td>
                                                <td className="p-4">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-xs px-3 py-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                                                        onClick={() => setSelectedFranchise(app)}
                                                    >
                                                        Detaylar
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Franchise Detail Modal */}
            {selectedFranchise && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedFranchise(null)}>
                    <div className="bg-dark-surface rounded-2xl border border-white/10 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-dark-surface z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white">Franchise Başvuru Detayları</h3>
                                <p className="text-sm text-gray-400 mt-1">{selectedFranchise.details?.applicationNumber || selectedFranchise.id}</p>
                            </div>
                            <button onClick={() => setSelectedFranchise(null)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Contact Info */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h4 className="text-sm font-bold text-primary-400 mb-3 uppercase tracking-wider">İletişim Bilgileri</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500">Ad Soyad:</span> <span className="text-white ml-2">{selectedFranchise.contactName}</span></div>
                                    <div><span className="text-gray-500">E-posta:</span> <span className="text-white ml-2">{selectedFranchise.contactEmail}</span></div>
                                    <div><span className="text-gray-500">Telefon:</span> <span className="text-white ml-2">{selectedFranchise.contactPhone}</span></div>
                                    {selectedFranchise.companyName && <div><span className="text-gray-500">Şirket:</span> <span className="text-white ml-2">{selectedFranchise.companyName}</span></div>}
                                </div>
                            </div>

                            {/* Location & Investment */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h4 className="text-sm font-bold text-primary-400 mb-3 uppercase tracking-wider">Lokasyon & Yatırım</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500">Şehir:</span> <span className="text-white ml-2">{selectedFranchise.city || '-'}</span></div>
                                    <div><span className="text-gray-500">Bütçe:</span> <span className="text-white ml-2">{selectedFranchise.details?.investmentBudget || '-'}</span></div>
                                </div>
                            </div>

                            {/* Experience & Message */}
                            {(selectedFranchise.details?.experience || selectedFranchise.details?.message) && (
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <h4 className="text-sm font-bold text-primary-400 mb-3 uppercase tracking-wider">Deneyim & Mesaj</h4>
                                    {selectedFranchise.details?.experience && (
                                        <div className="mb-4">
                                            <span className="text-gray-500 text-sm block mb-1">Deneyim:</span>
                                            <p className="text-gray-300 text-sm">{selectedFranchise.details.experience}</p>
                                        </div>
                                    )}
                                    {selectedFranchise.details?.message && (
                                        <div>
                                            <span className="text-gray-500 text-sm block mb-1">Mesaj:</span>
                                            <p className="text-gray-300 text-sm">{selectedFranchise.details.message}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Status */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <h4 className="text-sm font-bold text-primary-400 mb-3 uppercase tracking-wider">Durum</h4>
                                <div className="flex items-center justify-between">
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${selectedFranchise.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                        selectedFranchise.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                            selectedFranchise.status === 'IN_REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                                                selectedFranchise.status === 'SUBMITTED' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {FRANCHISE_STATUS_LABELS[selectedFranchise.status]?.label || selectedFranchise.status}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        {new Date(selectedFranchise.submittedAt || selectedFranchise.createdAt).toLocaleString('tr-TR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


