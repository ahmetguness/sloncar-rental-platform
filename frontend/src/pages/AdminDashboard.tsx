import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchDashboardStats, fetchRevenueAnalytics } from '../features/dashboard/dashboardSlice';
import { fetchBookings, selectAllBookings } from '../features/bookings/bookingsSlice';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { adminService } from '../services/api';
import type { Booking, UserInsurance } from '../services/types';

import { Button } from '../components/ui/Button';
import { Loader2, Calendar, Car as CarIcon, TrendingUp, Users, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Filter, X, Building2, AlertCircle, Download, Check, Key, Plus, CheckCircle, Megaphone, DollarSign, Shield, Clock, Database, Bell, Settings, ChevronDown, Upload, ShieldCheck, ArrowRight, RefreshCcw, Eye, EyeOff, Banknote, Globe } from 'lucide-react';

import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale/tr';
import "react-datepicker/dist/react-datepicker.css";
import { storage } from '../utils/storage';

// Register Turkish locale
registerLocale('tr', tr);

import DebouncedInput from '../components/ui/DebouncedInput';
import SettingsModal from '../components/modals/SettingsModal';
import SiteSettingsModal from '../components/modals/SiteSettingsModal';
import BookingDetailModal from '../components/modals/BookingDetailModal';
import ManualBookingModal from '../components/modals/ManualBookingModal';
import InsuranceDetailModal from '../components/modals/InsuranceDetailModal';
import CreateInsuranceModal from '../components/modals/CreateInsuranceModal';

import { StatCard } from '../components/admin/StatCard';
import { BookingRow } from '../components/admin/BookingRow';


export const AdminDashboard = () => {
    const ITEMS_PER_PAGE = 10;

    const queryClient = useQueryClient();
    const { addToast: toast } = useToast();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedFranchise, setSelectedFranchise] = useState<any | null>(null);
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const [bookingAction, setBookingAction] = useState<'cancel' | 'start' | 'complete' | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Close notification dropdown on click outside
    useEffect(() => {
        if (!showNotifications) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);
    const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

    // Franchise States
    const [franchisePage, setFranchisePage] = useState(1);
    const [franchiseSearchTerm, setFranchiseSearchTerm] = useState('');
    const [highlightedFranchiseId, setHighlightedFranchiseId] = useState<string | null>(null);

    // Insurance States
    const [selectedInsurance, setSelectedInsurance] = useState<UserInsurance | null>(null);
    const [isCreateInsuranceModalOpen, setIsCreateInsuranceModalOpen] = useState(false);
    const [insurancePage, setInsurancePage] = useState(1);
    const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');
    const [insuranceStatusFilter, setInsuranceStatusFilter] = useState<string>('');
    const [expandedTCs, setExpandedTCs] = useState<Set<string>>(new Set());
    const [renewingId, setRenewingId] = useState<string | null>(null);
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewDate, setRenewDate] = useState<Date | null>(new Date());
    const [showInsuranceCharts, setShowInsuranceCharts] = useState(false);


    // User Management States
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(false);
    const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
    const systemMenuRef = useRef<HTMLDivElement>(null);

    // Close system menu on click outside
    useEffect(() => {
        if (!isSystemMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (systemMenuRef.current && !systemMenuRef.current.contains(e.target as Node)) {
                setIsSystemMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSystemMenuOpen]);


    const handleUpdateUser = (updatedUser: any) => {
        setCurrentUser(updatedUser);
        storage.setUser(updatedUser);
    };

    // Memoized Search Handlers to prevent infinite re-renders in DebouncedInput
    const handleBookingSearch = useCallback((val: string) => {
        setSearchTerm(val);
        setCurrentPage(1);
    }, []);

    const handleFranchiseSearch = useCallback((val: string) => {
        setFranchiseSearchTerm(val);
        setFranchisePage(1);
    }, []);

    const handleInsuranceSearch = useCallback((val: string) => {
        setInsuranceSearchTerm(val);
        setInsurancePage(1);
    }, []);

    const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'franchise' | 'insurance'>('overview');
    const [chartView, setChartView] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

    // Load current user from storage
    useEffect(() => {
        const user = storage.getUser();
        if (user) setCurrentUser(user);
    }, []);

    // Redux State
    const dispatch = useAppDispatch();
    const { stats, revenueData, loading: dashboardLoading, error } = useAppSelector(state => state.dashboard);

    useEffect(() => {
        dispatch(fetchDashboardStats());
        // Auto-refresh every 30 seconds for notifications and stats
        const intervalId = setInterval(() => {
            dispatch(fetchDashboardStats());
        }, 30000);

        return () => clearInterval(intervalId);
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchRevenueAnalytics(selectedYear));
    }, [dispatch, selectedYear]);

    // Bookings Redux
    const {
        loading: bookingsLoading,
        total: totalBookings,
        totalPages: totalBookingPages
    } = useAppSelector(state => state.bookings);
    const bookingsList = useAppSelector(selectAllBookings);

    // Alias and structure for compatibility
    const bookingsQueryLoading = bookingsLoading;
    const bookingsData = {
        data: bookingsList,
        pagination: {
            total: totalBookings,
            totalPages: totalBookingPages,
            page: currentPage,
            limit: ITEMS_PER_PAGE
        }
    };

    useEffect(() => {
        if (activeTab === 'bookings' || activeTab === 'overview') {
            dispatch(fetchBookings({
                limit: ITEMS_PER_PAGE,
                offset: (currentPage - 1) * ITEMS_PER_PAGE,
                search: searchTerm || undefined,
                status: statusFilter || undefined
            }));
        }
    }, [dispatch, activeTab, currentPage, searchTerm, statusFilter]);

    const { data: franchiseData, isLoading: franchisesQueryLoading } = useQuery({
        queryKey: ['admin-franchises', franchisePage, franchiseSearchTerm],
        queryFn: () => adminService.getFranchiseApplications({
            limit: ITEMS_PER_PAGE,
            offset: (franchisePage - 1) * ITEMS_PER_PAGE,
            search: franchiseSearchTerm || undefined
        }),
        enabled: activeTab === 'franchise',
        staleTime: 60000,
    });

    const { data: insuranceData, isLoading: insurancesQueryLoading, refetch: refetchInsurances } = useQuery({
        queryKey: ['admin-insurances', insurancePage, insuranceSearchTerm, insuranceStatusFilter],
        queryFn: () => adminService.getInsurances({
            page: insurancePage,
            limit: ITEMS_PER_PAGE,
            searchTerm: insuranceSearchTerm || undefined,
            status: insuranceStatusFilter || undefined
        }),
        enabled: activeTab === 'insurance',
        staleTime: 60000,
    });

    const { data: insuranceStatsData } = useQuery({
        queryKey: ['admin-insurance-stats'],
        queryFn: () => adminService.getInsuranceStats(),
        enabled: activeTab === 'insurance',
        staleTime: 60000,
    });

    const getInsuranceStatus = useCallback((insurance: any) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(insurance.startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setHours(0, 0, 0, 0);
        const diffTime = endDate.getTime() - today.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (days < 0) return { type: 'EXPIRED', days, priority: 2, color: 'red' };
        if (days >= 0 && days <= 10) return { type: 'CRITICAL', days, priority: 1, color: 'orange' };
        if (days > 10 && days <= 30) return { type: 'UPCOMING', days, priority: 3, color: 'yellow' };
        return { type: 'ACTIVE', days, priority: 4, color: 'green' };
    }, []);

    const sortedInsurances = useMemo(() => {
        if (!insuranceData?.data) return [];

        return [...insuranceData.data].sort((a: any, b: any) => {
            const getGroupPriority = (group: any) => {
                const priorities = group.insurances.map((i: any) => getInsuranceStatus(i).priority);
                return Math.min(...priorities);
            };

            const pA = getGroupPriority(a);
            const pB = getGroupPriority(b);

            if (pA !== pB) return pA - pB;

            const dateA = new Date(a.representativeInsurance.startDate).getTime();
            const dateB = new Date(b.representativeInsurance.startDate).getTime();
            return dateA - dateB;
        });
    }, [insuranceData?.data, getInsuranceStatus]);

    // Mutations
    const actionMutation = useMutation({
        mutationFn: ({ action, id }: { action: 'cancel' | 'start' | 'complete' | 'pay'; id: string }) => {
            if (action === 'cancel') return adminService.cancelBooking(id);
            if (action === 'start') return adminService.startBooking(id);
            if (action === 'pay') return adminService.markBookingAsPaid(id);
            return adminService.completeBooking(id);
        },
        onSuccess: (_, variables) => {
            const actionText = variables.action === 'cancel' ? 'iptal edildi' : variables.action === 'start' ? 'baslatildi' : variables.action === 'pay' ? 'ödendi olarak isaretlendi' : 'tamamlandi';
            toast(`Rezervasyon basariyla ${actionText}`, 'success');
            dispatch(fetchBookings({
                limit: ITEMS_PER_PAGE,
                offset: (currentPage - 1) * ITEMS_PER_PAGE,
                search: searchTerm || undefined,
                status: statusFilter || undefined
            }));
            dispatch(fetchDashboardStats());
        },
        onError: (err: any) => {
            toast(err.response?.data?.message || 'Islem basarisiz', 'error');
        }
    });

    const STATUS_OPTIONS = [
        { value: '', label: 'Tümü', color: 'gray' },
        { value: 'RESERVED', label: 'Rezerve', color: 'primary' },
        { value: 'ACTIVE', label: 'Aktif', color: 'green' },
        { value: 'COMPLETED', label: 'Tamamlandi', color: 'gray' },
        { value: 'CANCELLED', label: 'Iptal', color: 'red' },
    ];

    const FRANCHISE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
        DRAFT: { label: 'Taslak', color: 'gray' },
        SUBMITTED: { label: 'Gönderildi', color: 'blue' },
        IN_REVIEW: { label: 'Inceleniyor', color: 'yellow' },
        APPROVED: { label: 'Onaylandi', color: 'green' },
        REJECTED: { label: 'Reddedildi', color: 'red' },
    };

    const [showManualModal, setShowManualModal] = useState(false);

    const handleAction = (action: 'cancel' | 'start' | 'complete', id: string) => {
        setBookingAction(action);
        setCancelingId(id);
    };

    const confirmAction = async () => {
        if (!cancelingId || !bookingAction) return;
        try {
            await actionMutation.mutateAsync({ action: bookingAction, id: cancelingId });
        } catch (err: any) {
            // Error handled in mutation
        } finally {
            setCancelingId(null);
            setBookingAction(null);
        }
    };

    const handleRenew = (id: string) => {
        setRenewingId(id);
        setRenewDate(new Date());
        setShowRenewModal(true);
    };

    const closeRenewModal = () => {
        setShowRenewModal(false);
        setRenewingId(null);
    };

    const confirmRenew = async () => {
        if (!renewingId || !renewDate) return;
        try {
            const formattedDate = renewDate.toISOString().split('T')[0];
            await adminService.renewInsurance(renewingId, formattedDate);
            refetchInsurances();
            toast('Poliçe başarıyla yenilendi!', 'success');
        } catch (error: any) {
            console.error('Poliçe yenileme hatası:', error);
            toast(error.response?.data?.message || 'Yenileme işlemi sırasında bir hata oluştu.', 'error');
        } finally {
            closeRenewModal();
        }
    };

    const getChartData = useMemo(() => {
        if (!revenueData) return [];
        switch (chartView) {
            case 'weekly': return revenueData?.weekly || [];
            case 'monthly': return revenueData?.monthly || [];
            case 'yearly': return (revenueData?.yearly || []).map((y: { year: number; revenue: number; bookings: number }) => ({ ...y, month: y.year.toString() }));
            default: return [];
        }
    }, [revenueData, chartView]);

    const getDataKey = useCallback(() => chartView === 'yearly' ? 'month' : (chartView === 'weekly' ? 'week' : 'month'), [chartView]);

    if (dashboardLoading || (!stats && !error)) return (
        <div className="min-h-screen pt-24 flex justify-center items-center">
            <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
        </div>
    );

    if (error) return (
        <div className="min-h-screen pt-24 flex justify-center items-center flex-col gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="text-white text-lg font-bold">Veri yükleme hatasi</div>
            <Button onClick={() => dispatch(fetchDashboardStats())} variant="outline">
                Tekrar Dene
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-12 px-3 md:px-6">

            <Modal
                isOpen={!!cancelingId}
                onClose={() => setCancelingId(null)}
                title={bookingAction === 'start' ? "Kiralamayi Baslat" : bookingAction === 'complete' ? "Teslim Al" : "Rezervasyonu Iptal Et"}
                size="sm"
            >
                <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${bookingAction === 'start' ? 'bg-green-500/20' : bookingAction === 'complete' ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                        {bookingAction === 'start' ? <Key className="w-6 h-6 text-green-500" /> : bookingAction === 'complete' ? <CheckCircle className="w-6 h-6 text-blue-500" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
                    </div>
                    <p className="text-gray-600 text-center">
                        {bookingAction === 'start'
                            ? 'Araci teslim etmek ve kiralamayi baslatmak istediginize emin misiniz?'
                            : bookingAction === 'complete'
                                ? 'Araci teslim almak ve kiralamayi tamamlamak istediginize emin misiniz?'
                                : 'Bu rezervasyonu iptal etmek istediginizden emin misiniz? Bu islem geri alinamaz.'}
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setCancelingId(null)}>Vazgeç</Button>
                        <Button
                            className={`${bookingAction === 'start' ? 'bg-green-500 hover:bg-green-600' : bookingAction === 'complete' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'} text-white border-none`}
                            onClick={confirmAction}
                        >
                            {bookingAction === 'start' ? 'Evet, Baslat' : bookingAction === 'complete' ? 'Evet, Teslim Al' : 'Evet, Iptal Et'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Insurance Renewal Modal */}
            <Modal
                isOpen={showRenewModal}
                onClose={closeRenewModal}
                title="Poliçeyi Yenile"
                size="sm"
            >
                <div className="flex flex-col items-center justify-center space-y-6 pt-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <RefreshCcw className="w-8 h-8 text-blue-500 animate-[spin_3s_linear_infinite]" />
                    </div>
                    <div className="space-y-4 w-full text-center">
                        <p className="text-gray-300 text-sm leading-relaxed max-w-[280px] mx-auto">
                            Bu poliçeyi yenilemek istediğinize emin misiniz? <br />
                            Lütfen yeni poliçe başlangıç tarihini seçin.
                        </p>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-600">Poliçe Başlangıç Tarihi</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                                <DatePicker
                                    selected={renewDate}
                                    onChange={(date: Date | null) => setRenewDate(date)}
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    portalId="root"
                                    popperPlacement="bottom-start"
                                    className="w-full bg-black/[0.03] border border-black/10 rounded-xl py-3 pl-10 pr-4 text-[#111111] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                                    placeholderText="Tarih Seçiniz"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6 w-full border-t border-black/10">
                        <Button variant="outline" onClick={closeRenewModal} className="px-6 border-black/10 text-gray-700 hover:bg-black/5">Vazgeç</Button>
                        <Button
                            className="bg-primary-500 hover:bg-primary-600 text-white border-none px-8 font-bold shadow-lg shadow-primary-500/20"
                            onClick={confirmRenew}
                        >
                            Yenile
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                user={currentUser}
                onUpdate={handleUpdateUser}
            />

            {/* Site Settings Modal */}
            <SiteSettingsModal
                isOpen={isSiteSettingsOpen}
                onClose={() => setIsSiteSettingsOpen(false)}
            />

            {/* Manual Booking Modal */}
            <ManualBookingModal
                isOpen={showManualModal}
                onClose={() => setShowManualModal(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
                    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
                }}
            />

            {/* Create Insurance Modal */}
            {isCreateInsuranceModalOpen && (
                <CreateInsuranceModal
                    onClose={() => setIsCreateInsuranceModalOpen(false)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['admin-insurances'] });
                    }}
                />
            )}

            <div className="container mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black text-[#111111] tracking-tight">
                            GENEL <span className="text-primary-500">BAKIS</span>
                        </h1>
                        <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-transparent mt-2 rounded-full" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Business Modules Group */}
                        <div className="flex items-center bg-black/[0.03] rounded-xl p-1 border border-black/10">
                            {[
                                { to: '/admin/campaigns', icon: <Megaphone className="w-4 h-4" />, label: 'Kampanya' },
                                { to: '/admin/cars/rental', icon: <Key className="w-4 h-4" />, label: 'Kiralik' },
                                { to: '/admin/cars/sale', icon: <DollarSign className="w-4 h-4" />, label: 'Satilik' },
                            ].map((item) => (
                                <Link key={item.to} to={item.to}>
                                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#111111] hover:bg-black/[0.05] transition-all duration-200">
                                        {item.icon}
                                        <span className="hidden sm:inline">{item.label}</span>
                                    </button>
                                </Link>
                            ))}
                        </div>

                        {/* System Modules Dropdown */}
                        <div className="relative" ref={systemMenuRef}>
                            <button
                                onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${isSystemMenuOpen ? 'bg-black/[0.08] text-[#111111] border-black/20' : 'bg-black/[0.03] text-gray-600 border-black/10 hover:bg-black/[0.08] hover:text-[#111111]'}`}
                            >
                                <Settings className="w-4 h-4" />
                                <span className="hidden sm:inline">Sistem</span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${isSystemMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSystemMenuOpen && (
                                <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-black/10 rounded-xl shadow-xl overflow-hidden z-[70] animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-1">
                                        {currentUser?.role === 'ADMIN' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setIsSiteSettingsOpen(true);
                                                        setIsSystemMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#111111] hover:bg-black/5 rounded-lg transition-colors text-left"
                                                >
                                                    <Globe className="w-4 h-4 text-primary-500" />
                                                    Site Ayarlari
                                                </button>
                                                <Link to="/admin/audit-logs" onClick={() => setIsSystemMenuOpen(false)}>
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#111111] hover:bg-black/5 rounded-lg transition-colors text-left">
                                                        <Clock className="w-4 h-4 text-amber-500" />
                                                        Islem Geçmisi
                                                    </button>
                                                </Link>
                                                <Link to="/admin/users" onClick={() => setIsSystemMenuOpen(false)}>
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#111111] hover:bg-black/5 rounded-lg transition-colors text-left">
                                                        <Users className="w-4 h-4 text-emerald-500" />
                                                        Kullanicilar
                                                    </button>
                                                </Link>
                                                <Link to="/admin/backup" onClick={() => setIsSystemMenuOpen(false)}>
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#111111] hover:bg-black/5 rounded-lg transition-colors text-left">
                                                        <Database className="w-4 h-4 text-blue-500" />
                                                        Yedekleme
                                                    </button>
                                                </Link>
                                                <div className="h-px bg-black/10 my-1" />
                                            </>
                                        )}
                                        <button
                                            onClick={() => {
                                                setIsSettingsOpen(true);
                                                setIsSystemMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[#111111] hover:bg-black/5 rounded-lg transition-colors text-left"
                                        >
                                            <Megaphone className="w-4 h-4 text-purple-500" />
                                            Bildirim Ayarlari
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-px h-8 bg-black/10 mx-1 hidden sm:block" />

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                            {/* Notification Bell */}
                            <div className="relative" ref={notificationRef}>
                                <Button
                                    variant="secondary"
                                    className="relative w-11 h-11 p-0 rounded-xl bg-black/[0.04] border-black/[0.06] hover:bg-black/[0.08]"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                >
                                    {(() => {
                                        const newBookings = stats?.latestNewBookings || [];
                                        const pendingFranchise = stats?.latestPendingFranchiseApplications || [];
                                        const paidBookings = stats?.latestPaidBookings || [];
                                        const expiringInsurances = stats?.latestExpiringInsurances || [];

                                        const unreadCount = [
                                            ...newBookings.filter(b => !b.adminRead),
                                            ...pendingFranchise.filter(f => !f.adminRead),
                                            ...paidBookings.filter(b => !b.adminRead),
                                            ...expiringInsurances.filter(i => !i.adminRead)
                                        ].length;

                                        return unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-dark-bg">
                                                {unreadCount}
                                            </span>
                                        );
                                    })()}
                                    <Bell className="w-5 h-5 text-gray-600" />
                                </Button>

                                {/* Notification Dropdown */}
                                {showNotifications && (
                                    <div className="fixed inset-x-3 top-20 sm:inset-x-auto sm:top-auto sm:absolute sm:right-0 sm:mt-4 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-[70] animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                                        <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Bildirimler</h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            setShowNotifications(false); // Close immediately for better UX
                                                            await adminService.markAllNotificationsRead();
                                                            await dispatch(fetchDashboardStats());
                                                            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
                                                        } catch (err) {
                                                            console.error("Failed to mark all read", err);
                                                        }
                                                    }}
                                                    className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors mr-2"
                                                >
                                                    Tümünü Temizle
                                                </button>
                                                <button
                                                    onClick={() => setShowNotifications(false)}
                                                    className="text-gray-500 hover:text-white bg-transparent"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {(() => {
                                                const newBookings = (stats?.latestNewBookings || []).map(b => ({
                                                    id: b.id,
                                                    type: 'booking',
                                                    title: 'Yeni Rezervasyon (Bekliyor)',
                                                    desc: `${b.car?.brand || ''} ${b.car?.model || ''} - ${b.customerName || ''} ${b.customerSurname || ''}`,
                                                    code: b.bookingCode || b.id,
                                                    date: b.createdAt,
                                                    icon: <CarIcon size={16} />,
                                                    color: 'primary',
                                                    read: !!b.adminRead
                                                }));

                                                const paidBookings = (stats?.latestPaidBookings || []).map(b => ({
                                                    id: b.id + '_paid',
                                                    originalId: b.id,
                                                    type: 'booking',
                                                    title: 'Ödeme Alindi',
                                                    desc: `${b.car?.brand} ${b.car?.model} - ${b.customerName} ${b.customerSurname}`,
                                                    code: b.bookingCode || b.id,
                                                    date: b.paidAt,
                                                    icon: <Check size={16} />,
                                                    color: 'green',
                                                    read: b.adminRead
                                                }));

                                                const pendingFranchise = (stats?.latestPendingFranchiseApplications || []).map(f => ({
                                                    id: f.id,
                                                    type: 'franchise',
                                                    title: 'Bayilik Basvurusu',
                                                    desc: f.companyName || f.contactName,
                                                    date: f.submittedAt,
                                                    icon: <Building2 size={16} />,
                                                    color: 'yellow',
                                                    read: f.adminRead
                                                }));

                                                const expiringList = (stats?.latestExpiringInsurances || []).map(i => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    // Insurance policies are 1-year: endDate = startDate + 1 year
                                                    const startDate = new Date(i.startDate);
                                                    const endDate = new Date(startDate);
                                                    endDate.setFullYear(endDate.getFullYear() + 1);
                                                    endDate.setHours(0, 0, 0, 0);
                                                    const diffTime = endDate.getTime() - today.getTime();
                                                    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                    let statusText = daysRemaining < 0 ? 'Süresi Doldu' : (daysRemaining === 0 ? 'Bugün Sona Eriyor' : `${daysRemaining} Gün Kaldı`);

                                                    return {
                                                        id: i.id + '_insurance',
                                                        originalId: i.id,
                                                        type: 'insurance',
                                                        title: `Sigorta Süresi Uyarısı (${statusText})`,
                                                        desc: `${i.fullName || i.user?.name || ''} - Poliçe: ${i.policyNo || ''}`,
                                                        date: endDate.toISOString(),
                                                        icon: <Shield size={16} />,
                                                        color: daysRemaining <= 0 ? 'red' : 'yellow',
                                                        read: !!i.adminRead,
                                                        insuranceData: i
                                                    };
                                                });

                                                const allNotifications = [...newBookings, ...paidBookings, ...pendingFranchise, ...expiringList]
                                                    .filter(item => !item.read)
                                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                                if (allNotifications.length === 0) {
                                                    return (
                                                        <div className="p-10 text-center">
                                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <Bell className="w-8 h-8 text-gray-300" />
                                                            </div>
                                                            <p className="text-gray-900 font-bold">Harika!</p>
                                                            <p className="text-gray-500 text-sm mt-1">Okunmamış bildiriminiz bulunmuyor.</p>
                                                        </div>
                                                    );
                                                }

                                                return allNotifications.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            // 1. Immediate UI Feedback (Navigation)
                                                            setShowNotifications(false);

                                                            if (item.type === 'booking') {
                                                                const bookingId = (item as any).originalId || item.id;
                                                                setActiveTab('bookings');
                                                                setSearchTerm('');
                                                                setStatusFilter('');
                                                                setHighlightedBookingId(bookingId);
                                                                setCurrentPage(1);
                                                                // Force refresh bookings to show the new reservation
                                                                dispatch(fetchBookings({
                                                                    limit: ITEMS_PER_PAGE,
                                                                    offset: 0,
                                                                    search: undefined,
                                                                    status: undefined
                                                                }));
                                                                setTimeout(() => setHighlightedBookingId(null), 5000);
                                                                const element = document.getElementById('bookings-section');
                                                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                                                            } else if (item.type === 'franchise') {
                                                                setActiveTab('franchise');
                                                                setFranchiseSearchTerm('');
                                                                setHighlightedFranchiseId(item.id);
                                                                setFranchisePage(1);
                                                                setTimeout(() => setHighlightedFranchiseId(null), 5000);
                                                                const element = document.getElementById('franchise-section');
                                                                if (element) element.scrollIntoView({ behavior: 'smooth' });
                                                            } else if (item.type === 'insurance') {
                                                                setActiveTab('insurance');
                                                                setInsuranceSearchTerm('');
                                                                setInsurancePage(1);
                                                                // Open the insurance detail modal if data is available
                                                                if ((item as any).insuranceData) {
                                                                    setSelectedInsurance((item as any).insuranceData);
                                                                }
                                                                setTimeout(() => {
                                                                    const element = document.getElementById('insurance-section') || document.querySelector('.overflow-x-auto.custom-scrollbar table');
                                                                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                                                                }, 100);
                                                            }

                                                            // 2. Background API Call
                                                            if (!item.read) {
                                                                const idToMark = (item as any).originalId || item.id;
                                                                // Fire and forget, don't await
                                                                adminService.markNotificationRead(idToMark, item.type as any)
                                                                    .then(async () => {
                                                                        await dispatch(fetchDashboardStats());
                                                                        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
                                                                    })
                                                                    .catch(err => console.error("Failed to mark read", err));
                                                            }
                                                        }}
                                                        className={`p-3 sm:p-4 border-b border-gray-50 last:border-0 transition-colors cursor-pointer flex gap-3 sm:gap-4 items-start ${!item.read ? 'bg-primary-50/30 hover:bg-primary-50/50' : 'hover:bg-gray-50 opacity-60'
                                                            } ${item.color === 'green' ? 'border-l-2 border-l-green-500' : item.color === 'red' ? 'border-l-2 border-l-red-500' : item.color === 'yellow' ? 'border-l-2 border-l-yellow-500' : 'border-l-2 border-l-primary-500'}`}
                                                    >
                                                        <div className={`mt-0.5 sm:mt-1 p-1.5 sm:p-2 rounded-lg shrink-0 ${item.color === 'green' ? 'bg-green-500/20 text-green-400' : item.color === 'red' ? 'bg-red-500/20 text-red-400' : item.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary-500/20 text-primary-400'}`}>
                                                            {item.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <div className={`text-sm font-bold ${!item.read ? 'text-[#111111]' : 'text-gray-600'}`}>{item.title}</div>
                                                                {!item.read && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />}
                                                            </div>
                                                            <div className="text-xs text-gray-700 mt-0.5 truncate">{item.desc}</div>
                                                            <div className="text-[10px] text-gray-500 mt-2 font-medium">
                                                                {new Date(item.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                <span className="mx-1">•</span>
                                                                {new Date(item.date).toLocaleDateString('tr-TR')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Primary Action */}
                            <button
                                onClick={() => setShowManualModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-[0_4px_20px_rgba(204,31,38,0.3)] hover:shadow-[0_4px_25px_rgba(204,31,38,0.5)] transition-all duration-300"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Yeni Rezervasyon</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <StatCard
                        title="Toplam Ciro"
                        value={`${(stats?.totalRevenue || 0).toLocaleString()} ₺`}
                        icon={<Banknote className="w-6 h-6" />}
                        color="green"
                        trend="%12.5"
                        trendUp={true}
                        data={[40, 35, 55, 70, 60, 80, 75]}
                    />
                    <StatCard
                        title="Toplam Rezervasyon"
                        value={stats?.totalBookings || 0}
                        icon={<Calendar className="w-6 h-6" />}
                        color="blue"
                        trend="%5.2"
                        trendUp={true}
                        data={[20, 30, 25, 40, 35, 50, 45]}
                        onClick={() => { setStatusFilter(''); setActiveTab('bookings'); setCurrentPage(1); }}
                        isActive={statusFilter === ''}
                    />
                    <StatCard
                        title="Aktif Kiralama"
                        value={stats?.activeBookings || 0}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="purple"
                        trend="%2.1"
                        trendUp={false}
                        data={[60, 50, 45, 40, 30, 25, 30]}
                        onClick={() => { setStatusFilter('ACTIVE'); setActiveTab('bookings'); setCurrentPage(1); }}
                        isActive={statusFilter === 'ACTIVE'}
                    />
                    <StatCard
                        title="Toplam Araç"
                        value={stats?.totalCars || 0}
                        icon={<CarIcon className="w-6 h-6" />}
                        color="orange"
                        trend="Sabit"
                        trendUp={true}
                        data={[80, 80, 82, 82, 85, 85, 85]}
                    />
                </div>

                {/* Tab Navigation */}
                <div className="sticky top-4 md:top-6 z-[60] w-full flex justify-center mb-6 px-1 sm:px-4 transform-gpu">
                    {/* Background mask for smooth scrolling effect hiding elements under */}
                    <div className="absolute -top-6 -inset-x-10 h-32 bg-gradient-to-b from-dark-bg via-dark-bg/95 to-transparent pointer-events-none -z-10" />

                    <div className="relative flex items-center bg-[#1a1b26]/80 backdrop-blur-2xl rounded-2xl md:rounded-[1.25rem] p-1.5 md:p-2 border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-x-auto no-scrollbar w-full md:w-auto justify-start md:justify-center ring-1 ring-black/20">
                        {([
                            { key: 'overview', label: 'Genel Bakis', icon: <TrendingUp className="w-4 h-4" />, count: null },
                            { key: 'bookings', label: 'Rezervasyonlar', icon: <Calendar className="w-4 h-4" />, count: stats?.totalBookings || null },
                            { key: 'franchise', label: 'Franchise', icon: <Building2 className="w-4 h-4" />, count: stats?.pendingFranchiseApplications || null },
                            { key: 'insurance', label: 'Sigorta', icon: <Shield className="w-4 h-4" />, count: stats?.totalInsurances || null },
                        ] as const).map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveTab(tab.key as typeof activeTab);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`relative flex items-center gap-2 px-4 md:px-7 py-2.5 md:py-3.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-300 ease-out whitespace-nowrap overflow-hidden ${isActive
                                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-[0_4px_20px_rgba(204,31,38,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] scale-[1.02]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/[0.06] hover:scale-[1.02]'
                                        }`}
                                >
                                    <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                                        {tab.icon}
                                    </span>
                                    <span>{tab.label}</span>
                                    {tab.count !== null && tab.count > 0 && (
                                        <span className={`ml-0.5 min-w-[20px] h-5 flex items-center justify-center text-[11px] font-bold rounded-full px-1.5 transition-all duration-300 ${isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/[0.08] text-gray-400'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                    {isActive && (
                                        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-400 rounded-full blur-[2px]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Revenue Analytics Section */}
                {
                    activeTab === 'overview' && (
                        <>
                            {revenueData && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Main Revenue Chart (Dual Axis) */}
                                    <div className="lg:col-span-2 bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-black/10">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                                <div>
                                                    <h2 className="text-xl font-bold text-[#111111]">Gelir Analizi</h2>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-3xl font-black text-green-600">
                                                            {(revenueData?.summary?.currentYear || 0).toLocaleString()} ₺
                                                        </span>
                                                        <span className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full ${(revenueData?.summary?.growth || 0) >= 0
                                                            ? 'bg-green-500/20 text-green-600'
                                                            : 'bg-red-500/20 text-red-600'
                                                            }`}>
                                                            {(revenueData?.summary?.growth || 0) >= 0
                                                                ? <ArrowUpRight className="w-4 h-4" />
                                                                : <ArrowDownRight className="w-4 h-4" />
                                                            }
                                                            {Math.abs(Number((revenueData?.summary?.growth || 0).toFixed(1)))}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                                    <select
                                                        value={selectedYear}
                                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                                        className="px-4 py-2 bg-black/[0.03] border border-black/10 rounded-xl text-[#111111] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    >
                                                        {(revenueData?.availableYears || []).map((year: number) => (
                                                            <option key={year} value={year} className="bg-dark-bg">{year}</option>
                                                        ))}
                                                    </select>
                                                    <div className="flex bg-black/[0.03] rounded-xl p-1 border border-black/10">
                                                        {(['weekly', 'monthly', 'yearly'] as const).map((view) => (
                                                            <button
                                                                key={view}
                                                                onClick={() => setChartView(view)}
                                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${chartView === view
                                                                    ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(204,31,38,0.4)]'
                                                                    : 'text-gray-600 hover:text-[#111111]'
                                                                    }`}
                                                            >
                                                                {view === 'weekly' ? 'Haftalik' : view === 'monthly' ? 'Aylik' : 'Yillik'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            if (!revenueData) return;

                                                            // Dynamic imports Ã¢â‚¬â€ loaded only when export is triggered
                                                            const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
                                                                import('exceljs'),
                                                                import('file-saver'),
                                                            ]);

                                                            const workbook = new ExcelJS.Workbook();
                                                            const worksheet = workbook.addWorksheet('Gelir Raporu');

                                                            // 1. Add Title
                                                            worksheet.mergeCells('A1:E1');
                                                            const titleCell = worksheet.getCell('A1');
                                                            titleCell.value = `Yaman Filo Gelir Raporu (${selectedYear}) - ${chartView === 'weekly' ? 'Haftalik' : chartView === 'monthly' ? 'Aylik' : 'Yillik'}`;
                                                            titleCell.font = { name: 'Arial', family: 4, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
                                                            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
                                                            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
                                                            worksheet.getRow(1).height = 30;

                                                            // 2. Add Summary Data
                                                            worksheet.addRow(['']);
                                                            const summaryRow = worksheet.addRow(['Toplam Ciro', 'Adet', 'Büyüme', 'Su Anki Dönem', 'Geçen Dönem']);
                                                            summaryRow.font = { bold: true };

                                                            const summaryDataRow = worksheet.addRow([
                                                                revenueData?.summary?.currentYear || 0,
                                                                (revenueData?.yearly || []).reduce((acc: number, curr: { bookings: number }) => acc + (curr.bookings || 0), 0),
                                                                (revenueData?.summary?.growth || 0) / 100,
                                                                revenueData?.summary?.currentMonth || 0,
                                                                revenueData?.summary?.lastMonth || 0
                                                            ]);

                                                            summaryDataRow.getCell(1).numFmt = '#,##0 "?"';
                                                            summaryDataRow.getCell(3).numFmt = '0.0%';
                                                            summaryDataRow.getCell(4).numFmt = '#,##0 "?"';
                                                            summaryDataRow.getCell(5).numFmt = '#,##0 "?"';

                                                            // 3. Add Main Table Data
                                                            worksheet.addRow(['']);
                                                            worksheet.addRow(['']);

                                                            const headers = ['Dönem', 'Gelir', 'Rezervasyon Sayisi', 'Ortalama Gelir'];
                                                            const headerRow = worksheet.addRow(headers);
                                                            headerRow.eachCell((cell) => {
                                                                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                                                                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } };
                                                                cell.alignment = { horizontal: 'center' };
                                                            });

                                                            const chartData = getChartData;
                                                            chartData.forEach((d: any) => {
                                                                const row = worksheet.addRow([
                                                                    d[getDataKey()],
                                                                    d.revenue,
                                                                    d.bookings,
                                                                    d.bookings > 0 ? d.revenue / d.bookings : 0
                                                                ]);
                                                                row.getCell(2).numFmt = '#,##0 "?"';
                                                                row.getCell(4).numFmt = '#,##0 "?"';
                                                                row.getCell(1).alignment = { horizontal: 'center' };
                                                                row.getCell(3).alignment = { horizontal: 'center' };
                                                            });

                                                            // 4. Add Category Breakdown
                                                            if (revenueData?.byCategory?.length) {
                                                                worksheet.addRow(['']);
                                                                worksheet.addRow(['']);
                                                                const catHeader = worksheet.addRow(['Kategori', 'Gelir']);
                                                                catHeader.eachCell((cell) => {
                                                                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                                                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
                                                                    cell.alignment = { horizontal: 'center' };
                                                                });
                                                                (revenueData?.byCategory || []).forEach((c: { name: string; value: number }) => {
                                                                    const row = worksheet.addRow([c.name, c.value]);
                                                                    row.getCell(2).numFmt = '#,##0 "?"';
                                                                });
                                                            }

                                                            // 5. Add Brand Breakdown
                                                            if (revenueData?.byBrand?.length) {
                                                                worksheet.addRow(['']);
                                                                const brandHeader = worksheet.addRow(['Marka', 'Gelir']);
                                                                brandHeader.eachCell((cell) => {
                                                                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                                                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
                                                                    cell.alignment = { horizontal: 'center' };
                                                                });
                                                                (revenueData?.byBrand || []).forEach((b: { name: string; value: number }) => {
                                                                    const row = worksheet.addRow([b.name, b.value]);
                                                                    row.getCell(2).numFmt = '#,##0 "?"';
                                                                });
                                                            }

                                                            // Auto-width columns
                                                            worksheet.columns.forEach(column => {
                                                                column.width = 20;
                                                            });
                                                            worksheet.getColumn(1).width = 25;

                                                            // Generate Buffer
                                                            const buffer = await workbook.xlsx.writeBuffer();
                                                            saveAs(new Blob([buffer]), `Yaman_Filo_Gelir_Raporu_${selectedYear}.xlsx`);
                                                        }}
                                                        className="p-2.5 rounded-xl bg-white border border-black/10 text-gray-600 hover:text-[#111111] hover:border-primary-500/50 transition-all"
                                                        title="Excel Indir (Grafikli)"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="w-full" id="main-revenue-chart">
                                                <ResponsiveContainer width="100%" height={280}>
                                                    <ComposedChart data={getChartData}>
                                                        <defs>
                                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#CC1F26" stopOpacity={0.4} />
                                                                <stop offset="95%" stopColor="#CC1F26" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                                        <XAxis
                                                            dataKey={getDataKey()}
                                                            stroke="#9ca3af"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <YAxis
                                                            yAxisId="left"
                                                            stroke="#9ca3af"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                                        />
                                                        <YAxis
                                                            yAxisId="right"
                                                            orientation="right"
                                                            stroke="#9ca3af"
                                                            fontSize={12}
                                                            tickLine={false}
                                                            axisLine={false}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#1a1a1a',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                borderRadius: '12px',
                                                                color: 'white',
                                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                                                            }}
                                                            itemStyle={{ padding: 0 }}
                                                            labelStyle={{ marginBottom: '8px', fontWeight: 'bold', color: '#e2e8f0' }}
                                                            formatter={(value: any, name: any) => [
                                                                name === 'revenue'
                                                                    ? <span key="revenue" className="text-primary-400 font-bold">{(Number(value) || 0).toLocaleString()} ₺</span>
                                                                    : <span key="bookings" className="text-orange-400 font-bold">{value || 0} Adet</span>,
                                                                name === 'revenue' ? 'Gelir' : 'Rezervasyon'
                                                            ]}
                                                        />
                                                        <Area
                                                            yAxisId="left"
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="#CC1F26"
                                                            strokeWidth={3}
                                                            fillOpacity={1}
                                                            fill="url(#colorRevenue)"
                                                        />
                                                        <Line
                                                            yAxisId="right"
                                                            type="monotone"
                                                            dataKey="bookings"
                                                            stroke="#f97316"
                                                            strokeWidth={3}
                                                            dot={{ r: 4, fill: '#1e293b', stroke: '#f97316', strokeWidth: 2 }}
                                                            activeDot={{ r: 6, fill: '#f97316' }}
                                                        />
                                                    </ComposedChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Breakdown (Mock Pie Chart) */}
                                    <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                                        <div className="p-6 border-b border-black/10">
                                            <h2 className="text-xl font-bold text-[#111111]">Kategori Dagilimi</h2>
                                            <p className="text-xs text-gray-500 mt-1">Hasilatin araç türüne göre dagilimi</p>
                                        </div>
                                        <div className="p-6">
                                            <div className="w-full relative" id="category-pie-chart">
                                                <ResponsiveContainer width="100%" height={240}>
                                                    <PieChart>
                                                        <Pie
                                                            data={revenueData?.byCategory || []}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={65}
                                                            outerRadius={85}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {(revenueData?.byCategory || []).map((_: any, index: number) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={['#CC1F26', '#99171C', '#801318', '#660F13', '#4D0B0E', '#B31B21', '#3c3c3b', '#1a1a1a', '#262626'][index % 9]}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                backgroundColor: '#1e293b',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                borderRadius: '12px',
                                                                color: 'white',
                                                                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                                                            }}
                                                            formatter={(value: any) => [`${Number(value).toLocaleString()} ₺`, 'Hasilat']}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                {/* Center Text */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-3xl font-black text-[#111111]">{revenueData?.byCategory?.length || 0}</span>
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kategori</span>
                                                </div>
                                            </div>
                                            {/* Legend */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-6">
                                                {(revenueData?.byCategory || []).slice(0, 6).map((item: any, i: number) => {
                                                    const total = (revenueData?.byCategory || []).reduce((acc: number, curr: any) => acc + curr.value, 0);
                                                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                                                    const colors = ['bg-[#6366f1]', 'bg-[#8b5cf6]', 'bg-[#ec4899]', 'bg-[#06b6d4]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#3b82f6]'];

                                                    return (
                                                        <div key={i} className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-lg border border-white/[0.05]">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-center gap-2">
                                                                    <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                                                                    <span className="text-xs font-black text-[#111111]">%{percentage}</span>
                                                                </div>
                                                                <div className="text-[10px] text-gray-600 font-mono mt-0.5">{Number(item.value).toLocaleString()} ₺</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )
                }

                {/* All Bookings Table with Pagination */}
                {
                    activeTab === 'bookings' && (
                        <div id="bookings-section" className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-black/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-[#111111]">Tüm Rezervasyonlar</h2>
                                    <span className="text-xs font-bold text-gray-600 bg-black/[0.03] px-3 py-1.5 rounded-full border border-black/5">
                                        {bookingsData?.pagination?.total || 0} kayit
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">

                                    {/* Filter Toggle */}
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${showFilters || statusFilter
                                            ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                                            : 'bg-white border-black/10 text-gray-600 hover:text-[#111111] hover:border-black/20'
                                            }`}
                                    >
                                        <Filter className="w-4 h-4" />
                                        {statusFilter && (
                                            <span className="text-xs font-bold">1</span>
                                        )}
                                    </button>
                                    {/* Search Input */}
                                    <DebouncedInput
                                        value={searchTerm}
                                        onChange={handleBookingSearch}
                                        placeholder="Isim ile ara..."
                                        className="w-52"
                                    />
                                </div>
                            </div>
                            {/* Filter Chips Row */}
                            {showFilters && (
                                <div className="px-6 py-4 border-b border-black/10 bg-black/[0.02]">
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
                                                        : 'bg-white border border-black/10 text-gray-600 hover:text-[#111111] hover:border-black/20'
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


                            <div className="overflow-x-auto w-full custom-scrollbar pb-4">
                                <table className="w-full text-left min-w-[1000px] md:min-w-full">
                                    <thead className="bg-black/[0.02] text-gray-600 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4 text-center">Kod</th>
                                            <th className="p-4">Müsteri</th>
                                            <th className="p-4 w-[250px]">Araç</th>
                                            <th className="p-4 text-center">Tarihler</th>
                                            <th className="p-4 text-center">Ödeme & Tutar</th>
                                            <th className="p-4 text-center">Durum</th>
                                            <th className="p-4 text-center">Detaylar</th>
                                            <th className="p-4 text-center">Islem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 relative">
                                        {bookingsQueryLoading ? (
                                            <tr>
                                                <td colSpan={9} className="p-12 text-center">
                                                    <div className="flex justify-center items-center">
                                                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : !(bookingsData?.data?.length) ? (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center">
                                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                    <p className="text-gray-600">Henüz rezervasyon yok</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            (bookingsData?.data || []).map((booking: Booking) => (
                                                <BookingRow
                                                    key={booking.id}
                                                    booking={booking}
                                                    onView={setSelectedBooking}
                                                    onAction={handleAction}
                                                    isHighlighted={highlightedBookingId === booking.id}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            {bookingsData?.pagination && (bookingsData?.pagination?.total || 0) > ITEMS_PER_PAGE && (
                                <div className="p-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-sm text-gray-600">
                                        Sayfa {currentPage} / {bookingsData?.pagination?.totalPages || 1} ({bookingsData?.pagination?.total || 0} kayit)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                            disabled={currentPage === 1 || bookingsQueryLoading}
                                            className="p-2 rounded-lg bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        {/* Page Numbers */}
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, bookingsData?.pagination?.totalPages || 1) }, (_, i) => {
                                                const totalPages = bookingsData?.pagination?.totalPages || 1;
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
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        disabled={bookingsQueryLoading}
                                                        className={`w-10 h-10 rounded-lg font-bold transition-all ${currentPage === pageNum
                                                            ? 'bg-primary-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                                                            : 'bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-primary-500/50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            disabled={currentPage >= (bookingsData?.pagination?.totalPages || 1) || bookingsQueryLoading}
                                            className="p-2 rounded-lg bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }


                {/* Franchise Applications Section */}
                {
                    activeTab === 'franchise' && (
                        <div id="franchise-section" className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-black/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-[#111111] flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-purple-600" />
                                        </div>
                                        Franchise Basvurulari
                                    </h2>
                                    <span className="text-xs font-bold text-gray-600 bg-black/[0.03] px-3 py-1.5 rounded-full border border-black/5">
                                        {franchiseData?.pagination?.total || 0} basvuru
                                    </span>
                                </div>
                                <div className="flex-1 max-w-md flex justify-end">
                                    <div className="w-full">
                                        <DebouncedInput
                                            value={franchiseSearchTerm}
                                            onChange={handleFranchiseSearch}
                                            placeholder="Isim, Sirket veya Sehir ile ara..."
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>


                            <div className="overflow-x-auto w-full custom-scrollbar pb-4">
                                <table className="w-full text-left min-w-[800px] md:min-w-full">
                                    <thead className="bg-black/[0.02] text-gray-600 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Basvuran</th>
                                            <th className="p-4">Iletisim</th>
                                            <th className="p-4">Lokasyon</th>
                                            <th className="p-4">Bütçe</th>
                                            <th className="p-4">Durum</th>
                                            <th className="p-4">Tarih</th>
                                            <th className="p-4">Islem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 relative">
                                        {franchisesQueryLoading ? (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center">
                                                    <div className="flex justify-center items-center">
                                                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : !franchiseData?.data?.length ? (
                                            <tr>
                                                <td colSpan={7} className="p-12 text-center">
                                                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                                    <p className="text-gray-600">Henüz franchise basvurusu yok</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            (franchiseData?.data || []).map((app: any) => {
                                                const statusInfo = FRANCHISE_STATUS_LABELS[app.status] || { label: app.status, color: 'gray' };
                                                const isHighlighted = highlightedFranchiseId === app.id;
                                                return (
                                                    <tr
                                                        key={app.id}
                                                        className={`transition-all group border-b border-black/5 last:border-0 ${isHighlighted
                                                            ? 'bg-purple-500/20 hover:bg-purple-500/30 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]'
                                                            : 'hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <td className="p-4 max-w-[200px]">
                                                            <div className="font-medium text-[#111111] truncate" title={app.contactName}>{app.contactName}</div>
                                                            {app.companyName && <div className="text-xs text-gray-600 truncate" title={app.companyName}>{app.companyName}</div>}
                                                        </td>
                                                        <td className="p-4 max-w-[200px]">
                                                            <div className="text-sm text-gray-700 truncate" title={app.contactEmail}>{app.contactEmail}</div>
                                                            <div className="text-xs text-gray-600 truncate">{app.contactPhone}</div>
                                                        </td>
                                                        <td className="p-4 text-gray-700 truncate max-w-[150px]" title={app.city}>{app.city || '-'}</td>
                                                        <td className="p-4 text-sm text-gray-600">{app.details?.investmentBudget || '-'}</td>
                                                        <td className="p-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.color === 'green' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                                statusInfo.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                    statusInfo.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                                        statusInfo.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                                }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.color === 'green' ? 'bg-green-500' :
                                                                    statusInfo.color === 'red' ? 'bg-red-500' :
                                                                        statusInfo.color === 'yellow' ? 'bg-yellow-500' :
                                                                            statusInfo.color === 'blue' ? 'bg-blue-500' :
                                                                                'bg-gray-500'
                                                                    }`} />
                                                                {statusInfo.label}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-600">
                                                            {new Date(app.submittedAt || app.createdAt).toLocaleDateString('tr-TR')}
                                                        </td>
                                                        <td className="p-4">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="opacity-70 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
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

                            {/* Pagination Controls */}
                            {franchiseData?.pagination && (franchiseData?.pagination?.total || 0) > ITEMS_PER_PAGE && (
                                <div className="p-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-sm text-gray-600">
                                        Sayfa {franchisePage} / {franchiseData?.pagination?.totalPages || 1} ({franchiseData?.pagination?.total || 0} basvuru)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setFranchisePage(prev => prev - 1)}
                                            disabled={franchisePage === 1 || franchisesQueryLoading}
                                            className="p-2 rounded-lg bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        {/* Page Numbers */}
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, franchiseData?.pagination?.totalPages || 1) }, (_, i) => {
                                                const totalPages = franchiseData?.pagination?.totalPages || 1;
                                                let pageNum: number;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (franchisePage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (franchisePage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = franchisePage - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setFranchisePage(pageNum)}
                                                        disabled={franchisesQueryLoading}
                                                        className={`w-10 h-10 rounded-lg font-bold transition-all ${franchisePage === pageNum
                                                            ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                                            : 'bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-purple-500/50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setFranchisePage(prev => prev + 1)}
                                            disabled={franchisePage >= (franchiseData?.pagination?.totalPages || 1) || franchisesQueryLoading}
                                            className="p-2 rounded-lg bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }


                {/* Insurance Section */}
                {
                    activeTab === 'insurance' && (
                        <div id="insurance-section" className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-black/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-[#111111] flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        Sigortalar
                                    </h2>
                                    <span className="text-xs font-bold text-gray-600 bg-black/[0.03] px-3 py-1.5 rounded-full border border-black/5">
                                        {insuranceData?.pagination?.total || 0} kayit
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-wrap justify-end items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowInsuranceCharts(!showInsuranceCharts)}
                                        className="text-gray-600 border-black/10 hover:bg-black/5 px-4 py-2"
                                    >
                                        {showInsuranceCharts ? (
                                            <>
                                                <EyeOff className="w-4 h-4 mr-2" />
                                                Grafikleri Gizle
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Grafikleri Göster
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => setIsCreateInsuranceModalOpen(true)}
                                        className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 font-medium px-4 py-2 whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Yeni Sigorta Ekle
                                    </Button>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            id="insurance-import-upload"
                                            className="hidden"
                                            accept=".xlsx, .xls"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                try {
                                                    const response = await adminService.importInsurances(formData);
                                                    const result = response.data;
                                                    const msg = `${result.insertedCount} yeni kayıt eklendi. ${result.duplicateCount} kayıt zaten vardı. ${result.failedCount} satırda hata oluştu.`;

                                                    if (result.failedCount > 0) {
                                                        toast(msg, 'error');
                                                    } else if (result.duplicateCount > 0) {
                                                        toast(msg, 'success');
                                                    } else {
                                                        toast(`${result.insertedCount} yeni kayıt başarıyla eklendi!`, 'success');
                                                    }

                                                    queryClient.invalidateQueries({ queryKey: ['admin-insurances'] });
                                                } catch (err: any) {

                                                    toast(err.response?.data?.message || 'Yükleme başarısız', 'error');
                                                }

                                                e.target.value = '';
                                            }}
                                        />
                                        <Button
                                            onClick={() => document.getElementById('insurance-import-upload')?.click()}
                                            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 flex items-center gap-2 transition-all hover:scale-105 whitespace-nowrap px-6"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span className="font-semibold">Excel Yükle</span>
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={async () => {
                                            try {
                                                const response = await adminService.exportInsurances();
                                                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                                const { saveAs } = await import('file-saver');
                                                saveAs(blob, `Sigortalar_${new Date().toLocaleDateString('tr-TR')}.xlsx`);
                                                toast('Excel basariyla indirildi', 'success');
                                            } catch (error) {
                                                console.error('Export error:', error);
                                                toast('Excel indirilirken bir hata olustu', 'error');
                                            }
                                        }}
                                        className="bg-[#107c41] hover:bg-[#0c5c30] text-white border-none shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all hover:scale-105 whitespace-nowrap px-6"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="font-semibold">Excel Indir</span>
                                    </Button>
                                    <DebouncedInput
                                        value={insuranceSearchTerm}
                                        onChange={handleInsuranceSearch}
                                        placeholder="İsim veya TC No ile Ara..."
                                        className="w-full max-w-lg"
                                    />
                                </div>
                            </div>

                            {/* Insurance Analysis Charts */}
                            {showInsuranceCharts && insuranceStatsData?.data && (
                                <div className="p-4 md:p-6 bg-black/[0.02] border-b border-black/5">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Policy Distribution (Pie Chart) */}
                                        <div className="bg-black/[0.02] rounded-2xl border border-black/10 p-4 md:p-6 h-[320px] md:h-[380px] flex flex-col">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                                                    Poliçe Dağılımı (Adet)
                                                </h3>
                                            </div>
                                            <div className="w-full relative">
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <PieChart>
                                                        <Pie
                                                            data={insuranceStatsData.data}
                                                            cx="40%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={100}
                                                            paddingAngle={5}
                                                            dataKey="count"
                                                            nameKey="branch"
                                                            animationBegin={0}
                                                            animationDuration={1500}
                                                        >
                                                            {insuranceStatsData.data.map((_: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'][index % 7]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#111' }}
                                                            itemStyle={{ color: '#111' }}
                                                            labelStyle={{ color: '#6b7280' }}
                                                            formatter={(value: any) => [`${Number(value || 0).toLocaleString()} Adet`, 'Poliçe Sayısı']}
                                                        />
                                                        <Legend
                                                            layout="vertical"
                                                            align="right"
                                                            verticalAlign="middle"
                                                            iconType="circle"
                                                            formatter={(value) => <span className="text-gray-700 text-sm font-medium">{value}</span>}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Revenue Analysis (Bar Chart) */}
                                        <div className="bg-black/[0.02] rounded-2xl border border-black/10 p-4 md:p-6 h-[320px] md:h-[380px] flex flex-col">
                                            <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-600" />
                                                    Branş Bazlı Kazanç (TL)
                                                </h3>
                                            </div>
                                            <div className="w-full">
                                                <ResponsiveContainer width="100%" height={250}>
                                                    <BarChart data={insuranceStatsData.data} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                                                        <XAxis
                                                            dataKey="branch"
                                                            stroke="#9ca3af"
                                                            fontSize={11}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            angle={-45}
                                                            textAnchor="end"
                                                            interval={0}
                                                            height={60}
                                                        />
                                                        <YAxis
                                                            stroke="#9ca3af"
                                                            fontSize={11}
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                                        />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', color: '#111' }}
                                                            itemStyle={{ color: '#111' }}
                                                            labelStyle={{ color: '#6b7280' }}
                                                            formatter={(value: any) => [`${Number(value || 0).toLocaleString()} ₺`, 'Kazanç']}
                                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                        />
                                                        <Bar
                                                            dataKey="revenue"
                                                            radius={[6, 6, 0, 0]}
                                                            animationDuration={1500}
                                                        >
                                                            {insuranceStatsData.data.map((_: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'][index % 7]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Filter Tabs */}
                            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-black/5 bg-black/[0.02] flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mr-2">Filtrele:</span>
                                {[
                                    { key: '', label: 'Hepsi', activeClass: 'bg-gray-200 text-gray-700 border-gray-300' },
                                    { key: 'CRITICAL', label: 'Son 10 Gün', activeClass: 'bg-orange-100 text-orange-700 border-orange-300' },
                                    { key: 'EXPIRED', label: 'Süresi Doldu', activeClass: 'bg-red-100 text-red-700 border-red-300' },
                                    { key: 'ACTIVE', label: 'Aktif', activeClass: 'bg-green-100 text-green-700 border-green-300' }
                                ].map((filter) => {
                                    const isActive = insuranceStatusFilter === filter.key;
                                    return (
                                        <button
                                            key={filter.key}
                                            onClick={() => {
                                                setInsuranceStatusFilter(filter.key);
                                                setInsurancePage(1);
                                            }}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 border ${isActive
                                                ? filter.activeClass
                                                : 'bg-black/[0.03] text-gray-600 border-black/5 hover:bg-black/[0.05]'
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="overflow-x-auto w-full custom-scrollbar">
                                <table className="w-full text-left min-w-[700px] md:min-w-full">
                                    <thead className="bg-black/[0.02] text-gray-600 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Müşteri</th>
                                            <th className="p-4">Şirket / Poliçe No</th>
                                            <th className="p-4">Araç & Ek Bilgi</th>
                                            <th className="p-4">Tarih & Durum</th>
                                            <th className="p-4">İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {insurancesQueryLoading ? (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-gray-500">
                                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                                                    Yükleniyor...
                                                </td>
                                            </tr>
                                        ) : !insuranceData?.data?.length ? (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-gray-500">
                                                    Kayit bulunamadi.
                                                </td>
                                            </tr>
                                        ) : (
                                            (sortedInsurances || []).map((group: any) => {
                                                const statuses = group.insurances.map((i: any) => getInsuranceStatus(i));
                                                const worstStatus = statuses.sort((a: any, b: any) => a.priority - b.priority)[0];
                                                const isExpanded = expandedTCs.has(group.tcNo);

                                                let rowStyle = "hover:bg-black/[0.02] transition-colors border-b border-black/5";
                                                let badge = null;

                                                if (worstStatus.type === 'EXPIRED') {
                                                    rowStyle = "bg-red-500/10 hover:bg-red-500/20";
                                                    badge = (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                            Süresi Doldu
                                                        </div>
                                                    );
                                                } else if (worstStatus.type === 'CRITICAL') {
                                                    rowStyle = "bg-orange-500/10 hover:bg-orange-500/20 shadow-[inset_4px_0_0_#f97316]";
                                                    badge = (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/20 text-[10px] font-black uppercase tracking-wider">
                                                            <AlertCircle className="w-3 h-3" />
                                                            KRİTİK
                                                        </div>
                                                    );
                                                } else if (worstStatus.type === 'UPCOMING') {
                                                    rowStyle = "bg-yellow-500/5 hover:bg-yellow-500/10";
                                                    badge = (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 text-[10px] font-bold uppercase tracking-wider">
                                                            <Clock className="w-3 h-3" />
                                                            Yaklaşıyor
                                                        </div>
                                                    );
                                                } else {
                                                    badge = (
                                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/10 text-[10px] font-medium uppercase tracking-wider">
                                                            <ShieldCheck className="w-3 h-3" />
                                                            Aktif
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <React.Fragment key={group.tcNo}>
                                                        <tr
                                                            className={`${rowStyle} transition-all duration-300 cursor-pointer`}
                                                            onClick={() => {
                                                                setExpandedTCs(prev => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(group.tcNo)) next.delete(group.tcNo);
                                                                    else next.add(group.tcNo);
                                                                    return next;
                                                                });
                                                            }}
                                                        >
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-1 rounded-lg bg-black/5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                                        <ChevronDown className="w-4 h-4" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-[#111111] tracking-tight">{group.fullName}</div>
                                                                        <div className="text-[11px] text-gray-600 font-medium flex items-center gap-2 mt-1">
                                                                            <span className="bg-black/5 px-1.5 py-0.5 rounded text-gray-700 border border-black/5">{group.tcNo}</span>
                                                                            <span>•</span>
                                                                            <span className="text-gray-600">{group.phone || '-'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                                                                        {group.insuranceCount} POLİÇE
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                        <Building2 className="w-3 h-3" />
                                                                        {group.representativeInsurance.company}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="text-[11px] text-gray-500 italic flex items-center gap-1">
                                                                    <CarIcon className="w-3 h-3" />
                                                                    {group.plate || 'Plaka Belirtilmedi'}
                                                                </div>
                                                                <div className="text-[10px] text-gray-600 mt-1 uppercase font-bold tracking-tighter">
                                                                    {group.profession || 'Meslek Belirtilmedi'}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                {badge}
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 px-2 border-black/10 text-gray-500 hover:text-[#111111] hover:bg-black/5"
                                                                >
                                                                    {isExpanded ? 'Kapat' : 'Detaylar'}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                        {isExpanded && (
                                                            <tr className="bg-black/[0.02]">
                                                                <td colSpan={5} className="p-0 border-b border-black/5">
                                                                    <div className="p-4 pl-12 bg-black/[0.03] space-y-2 animate-in slide-in-from-top-2 duration-200">
                                                                        {group.insurances.map((ins: any) => {
                                                                            const status = getInsuranceStatus(ins);
                                                                            const expDate = new Date(ins.startDate);
                                                                            expDate.setFullYear(expDate.getFullYear() + 1);

                                                                            return (
                                                                                <div
                                                                                    key={ins.id}
                                                                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-black/[0.02] border border-black/5 hover:bg-black/[0.05] transition-colors group/item gap-3"
                                                                                >
                                                                                    <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                                                                        <div className="w-24">
                                                                                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-0.5">Branş</div>
                                                                                            <div className="text-xs font-bold text-blue-600 uppercase">{ins.branch}</div>
                                                                                        </div>
                                                                                        <div className="w-32">
                                                                                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-0.5">Poliçe No</div>
                                                                                            <div className="text-xs font-mono text-gray-700">{ins.policyNo}</div>
                                                                                        </div>
                                                                                        <div className="w-32">
                                                                                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-0.5">Bitiş Tarihi</div>
                                                                                            <div className="text-xs text-gray-700 flex items-center gap-1.5">
                                                                                                <Calendar className="w-3 h-3 text-gray-500" />
                                                                                                {expDate.toLocaleDateString('tr-TR')}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="w-24">
                                                                                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mb-0.5">Tutar</div>
                                                                                            <div className="text-xs font-black text-[#111111]">{parseFloat(ins.amount).toLocaleString()} TL</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                                                                            status.type === 'EXPIRED' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                                                                                            status.type === 'CRITICAL' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                                                                                            status.type === 'UPCOMING' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' :
                                                                                            'bg-green-500/10 text-green-600 border border-green-500/20'
                                                                                        }`}>
                                                                                            {status.type === 'EXPIRED' ? `Süresi Doldu (${-status.days} g)` : status.type === 'CRITICAL' ? `Son ${status.days} Gün` : status.type === 'UPCOMING' ? `${status.days} Gün Kaldı` : 'Aktif'}
                                                                                        </div>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            className="h-8 w-8 p-0 border-black/10 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-blue-500/10 text-blue-500"
                                                                                            title="Poliçeyi Yenile"
                                                                                            disabled={renewingId === ins.id}
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleRenew(ins.id);
                                                                                            }}
                                                                                        >
                                                                                            {renewingId === ins.id ? (
                                                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                                            ) : (
                                                                                                <RefreshCcw className="w-3.5 h-3.5" />
                                                                                            )}
                                                                                        </Button>
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            className="h-8 px-3 border-black/10 opacity-0 group-hover/item:opacity-100 transition-opacity bg-black/[0.03] hover:bg-black/[0.06] text-[#111111] text-xs font-semibold flex items-center gap-1.5"
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setSelectedInsurance(ins);
                                                                                            }}
                                                                                        >
                                                                                            <span>Detaylar</span>
                                                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {insuranceData?.pagination && (insuranceData?.pagination?.total || 0) > ITEMS_PER_PAGE && (
                                <div className="p-4 border-t border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="text-sm text-gray-600">
                                        Sayfa {insurancePage} / {insuranceData?.pagination?.totalPages || 1} ({insuranceData?.pagination?.total || 0} kayit)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setInsurancePage(prev => prev - 1)}
                                            disabled={insurancePage === 1 || insurancesQueryLoading}
                                            className="p-2 rounded-lg bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, insuranceData?.pagination?.totalPages || 1) }, (_, i) => {
                                                const totalPages = insuranceData?.pagination?.totalPages || 1;
                                                let pageNum: number;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (insurancePage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (insurancePage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = insurancePage - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setInsurancePage(pageNum)}
                                                        disabled={insurancesQueryLoading}
                                                        className={`w-10 h-10 rounded-lg font-bold transition-all ${insurancePage === pageNum
                                                            ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                                            : 'bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-blue-500/50'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setInsurancePage(prev => prev + 1)}
                                            disabled={insurancePage >= (insuranceData?.pagination?.totalPages || 1) || insurancesQueryLoading}
                                            className="p-2 rounded-lg bg-black/[0.03] border border-black/10 text-gray-600 hover:text-[#111111] hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }
            </div>

            {/* Insurance Detail Modal */}
            {
                selectedInsurance && (
                    <InsuranceDetailModal
                        insurance={selectedInsurance}
                        onClose={() => setSelectedInsurance(null)}
                        onUpdate={() => {
                            queryClient.invalidateQueries({ queryKey: ['admin-insurances'] });
                        }}
                        currentUser={currentUser}
                    />
                )
            }

            {/* Create Insurance Modal */}
            {
                isCreateInsuranceModalOpen && (
                    <CreateInsuranceModal
                        onClose={() => setIsCreateInsuranceModalOpen(false)}
                        onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ['admin-insurances'] });
                        }}
                    />
                )
            }

            {/* Booking Detail Modal */}
            {
                selectedBooking && (
                    <BookingDetailModal
                        booking={selectedBooking}
                        onClose={() => setSelectedBooking(null)}
                        onUpdate={() => {
                            dispatch(fetchBookings({
                                limit: ITEMS_PER_PAGE,
                                offset: (currentPage - 1) * ITEMS_PER_PAGE,
                                search: searchTerm || undefined,
                                status: statusFilter || undefined
                            }));
                            dispatch(fetchDashboardStats());
                        }}
                    />
                )
            }

            {/* Franchise Detail Modal */}
            {
                selectedFranchise && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setSelectedFranchise(null)}>
                        <div className="bg-white rounded-2xl border border-black/10 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-black/10 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-[#111111]">Franchise Basvuru Detaylari</h3>
                                    <p className="text-sm text-gray-600 mt-1">{String(selectedFranchise.details?.applicationNumber || selectedFranchise.id || '')}</p>
                                </div>
                                <button onClick={() => setSelectedFranchise(null)} className="text-gray-600 hover:text-[#111111] p-2 rounded-lg hover:bg-black/5">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Contact Info */}
                                <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                                    <h4 className="text-sm font-bold text-primary-500 mb-3 uppercase tracking-wider">Iletisim Bilgileri</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-gray-600">Ad Soyad:</span> <span className="text-[#111111] ml-2 font-medium">{selectedFranchise.contactName}</span></div>
                                        <div><span className="text-gray-600">E-posta:</span> <span className="text-[#111111] ml-2 font-medium">{selectedFranchise.contactEmail}</span></div>
                                        <div><span className="text-gray-600">Telefon:</span> <span className="text-[#111111] ml-2 font-medium">{selectedFranchise.contactPhone}</span></div>
                                        {selectedFranchise.companyName && <div><span className="text-gray-600">Sirket:</span> <span className="text-[#111111] ml-2 font-medium">{selectedFranchise.companyName}</span></div>}
                                    </div>
                                </div>

                                {/* Location & Investment */}
                                <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                                    <h4 className="text-sm font-bold text-primary-500 mb-3 uppercase tracking-wider">Lokasyon & Yatirim</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div><span className="text-gray-600">Sehir:</span> <span className="text-[#111111] ml-2 font-medium">{String(selectedFranchise.city || '-')}</span></div>
                                        <div><span className="text-gray-600">Bütçe:</span> <span className="text-[#111111] ml-2 font-medium">{String(selectedFranchise.details?.investmentBudget || '-')}</span></div>
                                    </div>
                                </div>

                                {/* Experience & Message */}
                                {(selectedFranchise.details?.experience || selectedFranchise.details?.message) && (
                                    <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                                        <h4 className="text-sm font-bold text-primary-500 mb-3 uppercase tracking-wider">Deneyim & Mesaj</h4>
                                        {selectedFranchise.details?.experience && (
                                            <div className="mb-4">
                                                <span className="text-gray-600 text-sm block mb-1 font-medium">Deneyim:</span>
                                                <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                                                    {typeof selectedFranchise.details.experience === 'object' 
                                                        ? Object.entries(selectedFranchise.details.experience)
                                                            .filter(([_, v]) => v)
                                                            .map(([k, v]) => `${k}: ${v}`)
                                                            .join(' | ')
                                                        : String(selectedFranchise.details.experience)
                                                    }
                                                </p>
                                            </div>
                                        )}
                                        {selectedFranchise.details?.message && (
                                            <div>
                                                <span className="text-gray-600 text-sm block mb-1 font-medium">Mesaj:</span>
                                                <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                                                    {typeof selectedFranchise.details.message === 'object'
                                                        ? JSON.stringify(selectedFranchise.details.message)
                                                        : String(selectedFranchise.details.message)
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Status */}
                                <div className="bg-black/[0.02] rounded-xl p-4 border border-black/5">
                                    <h4 className="text-sm font-bold text-primary-500 mb-3 uppercase tracking-wider">Durum</h4>
                                    <div className="flex items-center justify-between">
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${selectedFranchise.status === 'APPROVED' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                                            selectedFranchise.status === 'REJECTED' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                                                selectedFranchise.status === 'IN_REVIEW' ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20' :
                                                    selectedFranchise.status === 'SUBMITTED' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                                                        'bg-gray-500/10 text-gray-600 border border-gray-500/20'
                                            }`}>
                                            {String(FRANCHISE_STATUS_LABELS[selectedFranchise.status]?.label || selectedFranchise.status || '')}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {new Date(selectedFranchise.submittedAt || selectedFranchise.createdAt).toLocaleString('tr-TR')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
