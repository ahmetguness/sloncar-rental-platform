import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { adminService, bookingService } from '../services/api';
import type { DashboardStats, Booking, UserInsurance, ActionLog } from '../services/types';
import { Button } from '../components/ui/Button';
import { translateCategory } from '../utils/translate';
import { Loader2, Calendar, Car as CarIcon, TrendingUp, Users, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Search, Filter, X, Building2, AlertCircle, Download, Copy, Check, Key, Plus, CreditCard, Banknote, CheckCircle, Megaphone, DollarSign, Shield, Trash2, Info, Pencil, Clock } from 'lucide-react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, PieChart, Pie, Cell } from 'recharts';
import { storage } from '../utils/storage';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { tr } from 'date-fns/locale';
// html2canvas, ExcelJS, and file-saver are dynamically imported where used (export button)

registerLocale('tr', tr);

import { Skeleton } from '../components/ui/Skeleton';

interface RevenueAnalytics {
    weekly: { week: string; revenue: number; bookings: number }[];
    monthly: { month: string; revenue: number; bookings: number }[];
    yearly: { year: number; revenue: number; bookings: number }[];
    byCategory: { name: string; value: number }[];
    byBrand: { name: string; value: number }[];
    availableYears: number[];
    summary: {
        currentMonth: number;
        lastMonth: number;
        currentYear: number;
        growth: number;
    };
}

const StatCard = ({ title, value, icon, color, loading, trend, trendUp, data, onClick, isActive }: {
    title: string;
    value?: string | number;
    icon: React.ReactNode;
    color: 'green' | 'blue' | 'purple' | 'orange';
    loading?: boolean;
    trend?: string;
    trendUp?: boolean;
    data?: number[];
    onClick?: () => void;
    isActive?: boolean;
}) => {
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

    const activeClasses = isActive
        ? `ring-2 ring-${color}-500 shadow-[0_0_30px_rgba(var(--${color}-500-rgb),0.3)] bg-dark-surface-lighter`
        : 'hover:bg-dark-surface-lighter/90';

    return (
        <button
            onClick={onClick}
            className={`relative w-full text-left overflow-hidden bg-dark-surface-lighter/50 backdrop-blur-xl p-6 rounded-2xl border transition-all duration-300 group ${isActive ? `border-${color}-500` : 'border-white/10 hover:border-white/20'} ${activeClasses}`}
        >
            {/* Glow Effect */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClasses[color]} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {trend}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <p className="text-gray-400 text-sm font-medium tracking-wide">{title}</p>
                    {loading ? (
                        <Skeleton className="h-8 w-24 mt-1" />
                    ) : (
                        <div className="flex items-end justify-between gap-2">
                            <p className="text-3xl font-black text-white tracking-tight">{value}</p>

                            {/* Sparkline SVG */}
                            {data && data.length > 0 && (
                                <svg width="60" height="30" className={`stroke-${color}-500 opacity-50 group-hover:opacity-100 transition-opacity`} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d={`M0 ${30 - (data[0] / 100) * 30} L10 ${30 - (data[1] / 100) * 30} L20 ${30 - (data[2] / 100) * 30} L30 ${30 - (data[3] / 100) * 30} L40 ${30 - (data[4] / 100) * 30} L50 ${30 - (data[5] / 100) * 30} L60 ${30 - (data[6] / 100) * 30}`} />
                                </svg>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Active Indicator */}
            {isActive && (
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-${color}-500 rounded-t-full shadow-[0_-2px_10px_rgba(var(--${color}-500-rgb),0.5)]`} />
            )}
        </button>
    );
};

const BookingDetailModal = ({ booking, onClose, onUpdate }: { booking: Booking; onClose: () => void; onUpdate?: () => void }) => {
    const { addToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editDates, setEditDates] = useState({
        pickup: booking ? new Date(booking.pickupDate) : new Date(),
        dropoff: booking ? new Date(booking.dropoffDate) : new Date()
    });
    const [loading, setLoading] = useState(false);
    const [unavailableIntervals, setUnavailableIntervals] = useState<{ start: Date; end: Date }[]>([]);
    useEffect(() => {
        if (booking) {
            setEditDates({
                pickup: new Date(booking.pickupDate),
                dropoff: new Date(booking.dropoffDate)
            });
        }
    }, [booking]);

    useEffect(() => {
        if (isEditing && booking?.carId) {
            fetchUnavailableDates();
        }
    }, [isEditing, booking?.carId]);

    const fetchUnavailableDates = async () => {
        try {
            // Fetch all bookings for this car to calculate availability
            const res = await adminService.getBookings({ // Using adminService.getBookings which calls /admin/bookings
                carId: booking.carId,
                limit: 100 // Should be enough for near-term conflicts
            });

            if (res.data) {
                const intervals = res.data
                    .filter(b =>
                        // Exclude current booking
                        b.id !== booking.id &&
                        // Only count blocking statuses
                        (b.status === 'ACTIVE' || b.status === 'RESERVED') &&
                        // Exclude expired unpaid reservations
                        !(
                            b.status === 'RESERVED' &&
                            b.paymentStatus === 'UNPAID' &&
                            b.expiresAt &&
                            new Date() > new Date(b.expiresAt)
                        )
                    )
                    .map(b => ({
                        start: new Date(b.pickupDate),
                        end: new Date(b.dropoffDate)
                    }));
                setUnavailableIntervals(intervals);
            }
        } catch (err) {
            console.error('Failed to fetch availability', err);
        }
    };

    if (!booking) return null;

    const handleSaveDates = async () => {
        if (!editDates.pickup || !editDates.dropoff) return;
        setLoading(true);
        try {
            await adminService.updateBookingDates(booking.id, {
                pickupDate: editDates.pickup,
                dropoffDate: editDates.dropoff
            });
            addToast('Rezervasyon tarihleri güncellendi', 'success');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (err: any) {
            addToast(err.response?.data?.error?.message || 'Tarihler güncellenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={!!booking} onClose={onClose} title="Rezervasyon Detayı" size="lg">
            <div className="space-y-8">
                {/* Header Info */}
                <div className="-mt-2 mb-6 flex items-center justify-between pb-4 border-b border-white/10 text-sm">
                    <span className="text-gray-400">Rezervasyon Kodu: <span className="text-primary-400 font-mono font-bold">{booking.bookingCode}</span></span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt))
                        ? 'bg-orange-500/20 text-orange-400'
                        : booking.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400'
                            : booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400'
                                : booking.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400'
                                    : 'bg-primary-500/20 text-primary-400'
                        }`}>
                        {(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt))
                            ? 'Süre Doldu'
                            : booking.status === 'ACTIVE' ? 'Aktif'
                                : booking.status === 'CANCELLED' ? 'İptal'
                                    : booking.status === 'COMPLETED' ? 'Tamamlandı'
                                        : 'Rezerve'}
                    </span>
                </div>

                <div className="-mt-4 mb-6 text-xs text-gray-500 text-right">
                    {booking.createdAt && (
                        <>
                            Oluşturulma: <span className="text-gray-300 font-medium">{new Date(booking.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                    )}
                </div>

                {/* Expired Warning */}
                {(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt)) && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-400 mb-1">Ödeme Süresi Doldu</h4>
                            <p className="text-sm text-gray-400">
                                Müşteri 10 dakika içinde ödeme yapmadığı için bu rezervasyonun süresi dolmuştur.
                                <br />
                                <span className="text-gray-500 text-xs">Bitiş Zamanı: {new Date(booking.expiresAt).toLocaleTimeString('tr-TR')}</span>
                            </p>
                        </div>
                    </div>
                )}

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
                                <p className="text-white break-all">{booking.customerEmail}</p>
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
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Kiralama Süresi</h3>
                            </div>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-xs text-primary-400 hover:text-primary-300 font-bold transition-colors"
                                >
                                    DÜZENLE
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="bg-dark-bg p-4 rounded-xl border border-primary-500/30 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Alış Tarihi</label>
                                        <DatePicker
                                            selected={editDates.pickup}
                                            onChange={(date: Date | null) => date && setEditDates({ ...editDates, pickup: date })}
                                            className="w-full bg-dark-surface border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                                            dateFormat="dd/MM/yyyy"
                                            locale="tr"
                                            excludeDateIntervals={unavailableIntervals}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Teslim Tarihi</label>
                                        <DatePicker
                                            selected={editDates.dropoff}
                                            onChange={(date: Date | null) => date && setEditDates({ ...editDates, dropoff: date })}
                                            className="w-full bg-dark-surface border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                                            dateFormat="dd/MM/yyyy"
                                            minDate={editDates.pickup}
                                            locale="tr"
                                            excludeDateIntervals={unavailableIntervals}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="h-8 text-xs border-white/10 text-gray-400">
                                        İptal
                                    </Button>
                                    <Button size="sm" onClick={handleSaveDates} disabled={loading} className="h-8 text-xs bg-primary-500 text-white">
                                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Kaydet'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
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
                        )}
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

                <div className="flex justify-end pt-4">
                    <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                        Kapat
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const ManualBookingModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
    const { addToast } = useToast();
    // Helper to use addToast with 'toast' name if preferred, or just use addToast directly
    const toast = (msg: string, type: 'success' | 'error') => addToast(msg, type);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [dates, setDates] = useState<{ pickup: Date | null; dropoff: Date | null }>({ pickup: null, dropoff: null });
    const [availableCars, setAvailableCars] = useState<any[]>([]);
    const [selectedCar, setSelectedCar] = useState<any>(null);
    const [customer, setCustomer] = useState({
        name: '', surname: '', phone: '', email: '', tc: '', license: '', notes: ''
    });
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS'>('CASH');

    const formatDateForAPI = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSearchCars = async () => {
        if (!dates.pickup || !dates.dropoff) {
            toast('Lütfen tarihleri seçiniz', 'error');
            return;
        }
        setLoading(true);
        try {
            const res = await adminService.getCars({
                status: 'ACTIVE',
                pickupDate: formatDateForAPI(dates.pickup),
                dropoffDate: formatDateForAPI(dates.dropoff),
                limit: 100
            });
            setAvailableCars(res.data);
            setStep(2);
        } catch (err) {
            toast('Araçlar yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!dates.pickup || !dates.dropoff) return; // Should not happen

            // Sanitize payload: valid inputs only
            const payload: any = {
                carId: selectedCar.id,
                customerName: customer.name,
                customerSurname: customer.surname,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                customerDriverLicense: customer.license,
                pickupDate: formatDateForAPI(dates.pickup),
                dropoffDate: formatDateForAPI(dates.dropoff),
                pickupBranchId: selectedCar.branchId,
                dropoffBranchId: selectedCar.branchId,
                paymentMethod,
                isActive: true
            };

            if (customer.tc && customer.tc.trim() !== '') {
                payload.customerTC = customer.tc;
            }
            if (customer.notes && customer.notes.trim() !== '') {
                payload.notes = customer.notes;
            }

            await adminService.createManualBooking(payload);
            toast('Rezervasyon oluşturuldu', 'success');
            onSuccess();
            onClose();
            // Reset form
            setStep(1);
            setDates({ pickup: null, dropoff: null });
            setSelectedCar(null);
            setCustomer({ name: '', surname: '', phone: '', email: '', tc: '', license: '', notes: '' });
        } catch (err: any) {
            const errorData = err.response?.data?.error;
            let errorMessage = errorData?.message || 'Rezervasyon oluşturulamadı';

            // Should show specific validation error if available
            if (errorData?.code === 'VALIDATION_ERROR' && errorData?.details?.[0]) {
                errorMessage = errorData.details[0].message;
            }

            toast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Yeni Manuel Rezervasyon">
            <div className="space-y-6">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8 px-2 relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 -z-10" />
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-primary-500 text-white' : 'bg-dark-bg border border-white/20 text-gray-500'}`}>
                            {s}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="block text-sm text-gray-400 mb-1">Alış Tarihi</label>
                                <DatePicker
                                    selected={dates.pickup}
                                    onChange={(date: Date | null) => setDates({ ...dates, pickup: date })}
                                    className="w-full bg-dark-bg border border-white/10 rounded-lg p-2 text-white"
                                    placeholderText="Tarih seçiniz"
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    minDate={new Date()}
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="block text-sm text-gray-400 mb-1">Teslim Tarihi</label>
                                <DatePicker
                                    selected={dates.dropoff}
                                    onChange={(date: Date | null) => setDates({ ...dates, dropoff: date })}
                                    className="w-full bg-dark-bg border border-white/10 rounded-lg p-2 text-white"
                                    placeholderText="Tarih seçiniz"
                                    dateFormat="dd/MM/yyyy"
                                    locale="tr"
                                    minDate={dates.pickup ? new Date(dates.pickup.getTime() + 24 * 60 * 60 * 1000) : new Date()}
                                />
                            </div>
                        </div>
                        <Button className="w-full mt-4" onClick={handleSearchCars} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Müsait Araçları Ara'}
                        </Button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="text-white font-bold">Araç Seçimi</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {availableCars.map(car => (
                                <div
                                    key={car.id}
                                    onClick={() => setSelectedCar(car)}
                                    className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${selectedCar?.id === car.id ? 'bg-primary-500/20 border-primary-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={car.images?.[0] || '/placeholder-car.png'} alt="" className="w-12 h-8 object-cover rounded" />
                                        <div>
                                            <div className="text-white font-medium">{car.brand} {car.model}</div>
                                            <div className="text-xs text-gray-500">{car.plateNumber}</div>
                                        </div>
                                    </div>
                                    <div className="text-primary-400 font-bold">{car.dailyPrice} TL</div>
                                </div>
                            ))}
                            {availableCars.length === 0 && <div className="text-center text-gray-500 py-4">Müsait araç bulunamadı.</div>}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Geri</Button>
                            <Button onClick={() => setStep(3)} disabled={!selectedCar} className="flex-1">Devam Et</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <h3 className="text-white font-bold">Müşteri Bilgileri</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <input placeholder="Ad" className="bg-dark-bg border border-white/10 rounded p-2 text-white" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                            <input placeholder="Soyad" className="bg-dark-bg border border-white/10 rounded p-2 text-white" value={customer.surname} onChange={e => setCustomer({ ...customer, surname: e.target.value })} />
                            <input placeholder="Telefon (+90...)" className="bg-dark-bg border border-white/10 rounded p-2 text-white col-span-2" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                            <input placeholder="E-posta" className="bg-dark-bg border border-white/10 rounded p-2 text-white col-span-2" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} />
                            <input placeholder="TC Kimlik No (Opsiyonel)" className="bg-dark-bg border border-white/10 rounded p-2 text-white" value={customer.tc} onChange={e => setCustomer({ ...customer, tc: e.target.value })} />
                            <input placeholder="Ehliyet No" className="bg-dark-bg border border-white/10 rounded p-2 text-white" value={customer.license} onChange={e => setCustomer({ ...customer, license: e.target.value })} />
                            <input placeholder="Notlar" className="bg-dark-bg border border-white/10 rounded p-2 text-white col-span-2" value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Geri</Button>
                            <Button onClick={() => setStep(4)} disabled={!customer.name || !customer.phone} className="flex-1">Devam Et</Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-6">
                        <h3 className="text-white font-bold text-center">Ödeme Yöntemi</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setPaymentMethod('CASH')}
                                className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'CASH' ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                            >
                                <Banknote className="w-8 h-8" />
                                <span className="font-bold">Nakit</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('POS')}
                                className={`p-6 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'POS' ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                            >
                                <CreditCard className="w-8 h-8" />
                                <span className="font-bold">Kredi Kartı / POS</span>
                            </button>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg space-y-2 text-sm text-gray-400">
                            <div className="flex justify-between"><span>Araç:</span> <span className="text-white">{selectedCar?.brand} {selectedCar?.model}</span></div>
                            <div className="flex justify-between">
                                <span>Gün:</span>
                                <span className="text-white">
                                    {dates.pickup && dates.dropoff ? Math.ceil((dates.dropoff.getTime() - dates.pickup.getTime()) / (1000 * 60 * 60 * 24)) : 0} Gün
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold text-white">
                                <span>Toplam:</span>
                                <span className="text-green-400">
                                    {dates.pickup && dates.dropoff && selectedCar
                                        ? (selectedCar.dailyPrice * Math.ceil((dates.dropoff.getTime() - dates.pickup.getTime()) / (1000 * 60 * 60 * 24))).toLocaleString()
                                        : 0} TL
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Geri</Button>
                            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-green-500 hover:bg-green-600 text-white border-none">
                                {loading ? <Loader2 className="animate-spin" /> : 'Rezervasyonu Tamamla'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

const InsuranceDetailModal = ({ insurance, onClose, onUpdate, currentUser }: { insurance: UserInsurance; onClose: () => void; onUpdate?: () => void; currentUser: any }) => {
    const { addToast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingConfirmed, setIsDeletingConfirmed] = useState(false);

    const handleDelete = async () => {
        setIsDeletingConfirmed(true);
        try {
            await adminService.deleteInsurance(insurance.id);
            addToast('Sigorta kaydı başarıyla silindi', 'success');
            if (onUpdate) onUpdate();
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Sigorta silinirken bir hata oluştu', 'error');
            setIsDeletingConfirmed(false);
        }
    };

    return (
        <Modal isOpen={!!insurance} onClose={onClose} title="Sigorta Detayı" size="lg">
            <div className="space-y-8">
                {/* Header Info */}
                <div className="-mt-2 mb-6 flex items-center justify-between pb-4 border-b border-white/10 text-sm">
                    <span className="text-gray-400">Poliçe No: <span className="text-blue-400 font-mono font-bold">{insurance.policyNumber}</span></span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${insurance.isActive
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                        }`}>
                        {insurance.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                </div>

                <div className="-mt-4 mb-6 text-xs text-gray-500 text-right">
                    {insurance.createdAt && (
                        <>
                            Oluşturulma: <span className="text-gray-300 font-medium">{new Date(insurance.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                    )}
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Sigortalı Bilgileri</h3>
                        </div>
                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Ad Soyad</label>
                                <p className="text-white font-medium">{insurance.user?.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">E-posta</label>
                                <p className="text-white break-all">{insurance.user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Policy Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Poliçe Bilgileri</h3>
                        </div>
                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Sigorta Şirketi</label>
                                <p className="text-white font-bold text-lg">{insurance.companyName}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Poliçe Türü</label>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white">{insurance.policyType || '-'}</span>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Kapsam Türü</label>
                                    <span className="text-xs text-gray-400">{insurance.coverageType || '-'}</span>
                                </div>
                            </div>
                            {(insurance.premiumAmount || insurance.coverageLimit) && (
                                <div className="pt-2 border-t border-white/5 mt-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500">Prim Tutarı</label>
                                        <p className="text-lg font-bold text-blue-400">{insurance.premiumAmount ? `${Number(insurance.premiumAmount).toLocaleString()} ₺` : '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Teminat Limiti</label>
                                        <p className="text-sm font-medium text-white">{insurance.coverageLimit ? `${Number(insurance.coverageLimit).toLocaleString()} ₺` : '-'}</p>
                                    </div>
                                </div>
                            )}
                            {insurance.deductibleAmount && (
                                <div>
                                    <label className="text-xs text-gray-500">Muafiyet Bedeli</label>
                                    <p className="text-sm text-gray-300">{Number(insurance.deductibleAmount).toLocaleString()} ₺</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dates & Agent */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Geçerlilik süresi</h3>
                            </div>
                        </div>

                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 flex justify-between items-center text-center">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Başlangıç</label>
                                <p className="text-white font-medium">{new Date(insurance.startDate).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <div className="text-gray-600">➝</div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Bitiş</label>
                                <p className="text-white font-medium">{new Date(insurance.endDate).toLocaleDateString('tr-TR')}</p>
                            </div>
                        </div>
                        {insurance.renewalDate && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span className="text-sm text-blue-200">Yenileme Tarihi: <span className="font-bold">{new Date(insurance.renewalDate).toLocaleDateString('tr-TR')}</span></span>
                            </div>
                        )}
                    </div>

                    {(insurance.agentName || insurance.agentPhone || insurance.agentEmail) && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Acente İletişim</h3>
                            </div>
                            <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-2">
                                {insurance.agentName && <div><span className="text-xs text-gray-500">Yetkili:</span> <span className="text-white text-sm ml-2">{insurance.agentName}</span></div>}
                                {insurance.agentPhone && <div><span className="text-xs text-gray-500">Tel:</span> <span className="text-white text-sm ml-2">{insurance.agentPhone}</span></div>}
                                {insurance.agentEmail && <div><span className="text-xs text-gray-500">Email:</span> <span className="text-white text-sm ml-2">{insurance.agentEmail}</span></div>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Description/Notes */}
                {insurance.description && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Açıklama / Kapsam Detayı</h3>
                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 text-sm text-gray-300">
                            {insurance.description}
                        </div>
                    </div>
                )}

                {/* Document Link */}
                {insurance.documentUrl && (
                    <div className="flex justify-end">
                        <a href={insurance.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-bold">
                            <Download className="w-4 h-4" />
                            Poliçe Dokümanını İndir
                        </a>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    {currentUser?.role === 'ADMIN' ? (
                        isDeleting ? (
                            <div className="flex items-center gap-4 w-full justify-between bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-full">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Bu sigorta kaydını silmek istediğinize emin misiniz?</p>
                                        <p className="text-xs text-red-300">Bu işlem geri alınamaz.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsDeleting(false)}
                                        className="h-8 text-xs border-white/10 text-white hover:bg-white/10"
                                    >
                                        İptal
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleDelete}
                                        className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-none"
                                    >
                                        {isDeletingConfirmed ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Evet, Sil'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {currentUser?.role === 'ADMIN' && (
                                    <Button
                                        onClick={() => setIsDeleting(true)}
                                        variant="outline"
                                        className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Sil
                                    </Button>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                                        Kapat
                                    </Button>
                                </div>
                            </>
                        )
                    ) : (
                        <div className="flex justify-end w-full">
                            <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                                Kapat
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

const CreateInsuranceModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<{ id: string; name: string; email: string; phone: string }[]>([]);
    const [formData, setFormData] = useState<Partial<UserInsurance>>({
        isActive: true,
        paymentStatus: 'PAID',

        policyType: 'Trafik',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await adminService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Convert strings to numbers for financial fields
            const dataToSubmit = {
                ...formData,
                startDate: new Date(formData.startDate as string).toISOString(),
                endDate: new Date(formData.endDate as string).toISOString(),
                premiumAmount: Number(formData.premiumAmount),
                coverageLimit: Number(formData.coverageLimit),
                deductibleAmount: Number(formData.deductibleAmount),
            };
            await adminService.createInsurance(dataToSubmit);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Sigorta Ekle" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Selection */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Kullanıcı</label>
                        <select
                            name="userId"
                            required
                            className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                            value={formData.userId || ''}
                        >
                            <option value="">Seçiniz...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>

                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Sigorta Şirketi</label>
                        <input type="text" name="companyName" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Poliçe No</label>
                        <input type="text" name="policyNumber" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>

                    {/* Dates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Başlangıç Tarihi</label>
                        <input type="date" name="startDate" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.startDate?.toString().split('T')[0]} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bitiş Tarihi</label>
                        <input type="date" name="endDate" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.endDate?.toString().split('T')[0]} />
                    </div>

                    {/* Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Poliçe Türü</label>
                        <select name="policyType" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.policyType}>
                            <option value="Trafik">Trafik</option>
                            <option value="Kasko">Kasko</option>
                            <option value="Ferdi Kaza">Ferdi Kaza</option>
                            <option value="Konut">Konut</option>
                            <option value="DASK">DASK</option>
                            <option value="Sağlık">Sağlık</option>
                            <option value="Seyahat">Seyahat</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Ödeme Durumu</label>
                        <select name="paymentStatus" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.paymentStatus}>
                            <option value="PAID">Ödendi</option>
                            <option value="UNPAID">Ödenmedi</option>
                            <option value="CANCELLED">İptal</option>
                        </select>
                    </div>

                    {/* Financials */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Prim Tutarı (₺)</label>
                        <input type="number" name="premiumAmount" step="0.01" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Teminat Limiti (₺)</label>
                        <input type="number" name="coverageLimit" step="0.01" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>

                    {/* Agent */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Acente Adı</label>
                        <input type="text" name="agentName" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Acente Tel</label>
                        <input type="text" name="agentPhone" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Açıklama / Notlar</label>
                        <textarea name="description" rows={3} className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10 gap-3">
                    <Button type="button" onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                        İptal
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// Helper component for table rows to allow hooks usage
const BookingRow = ({
    booking,
    onView,
    onAction,
    isHighlighted
}: {
    booking: Booking;
    onView: (b: Booking) => void;
    onAction: (action: 'cancel' | 'start' | 'complete', id: string) => void;
    isHighlighted?: boolean;
}) => {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleCopyCode = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        addToast('Kod kopyalandı', 'success');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const name = booking.customerName || '';
    const surname = booking.customerSurname || '';
    // Safe initials generation
    const initials = ((name.charAt(0) || '') + (surname.charAt(0) || '')).toUpperCase() || '?';
    const days = Math.ceil((new Date(booking.dropoffDate).getTime() - new Date(booking.pickupDate).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <tr className={`transition-all group border-b border-white/5 last:border-0 ${isHighlighted
            ? 'bg-primary-500/20 hover:bg-primary-500/30 shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]'
            : 'hover:bg-white/5'
            }`}>
            <td className="p-4 text-center">
                <button
                    onClick={() => handleCopyCode(booking.bookingCode, booking.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-bg border border-white/5 hover:border-primary-500/50 hover:bg-primary-500/10 transition-all group/btn"
                    title="Kodu Kopyala"
                >
                    <span className="font-mono font-bold text-primary-400">{booking.bookingCode}</span>
                    {copiedId === booking.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                    ) : (
                        <Copy className="w-3 h-3 text-gray-500 group-hover/btn:text-primary-400 opacity-0 group-hover/btn:opacity-100 transition-all" />
                    )}
                </button>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {initials}
                    </div>
                    <div>
                        <div className="font-medium text-white truncate max-w-[150px]" title={`${name} ${surname}`}>{name} {surname}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]" title={booking.customerPhone}>{booking.customerPhone}</div>
                        <div className="text-[10px] text-gray-600 truncate max-w-[150px]" title={booking.customerEmail}>{booking.customerEmail}</div>
                    </div>
                </div>
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <CarIcon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-gray-300 truncate max-w-[150px]" title={`${booking.car?.brand} ${booking.car?.model}`}>{booking.car?.brand} {booking.car?.model}</span>
                </div>
            </td>
            <td className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span>{new Date(booking.pickupDate).toLocaleDateString('tr-TR').replace(/\./g, '/')}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <span>{new Date(booking.dropoffDate).toLocaleDateString('tr-TR').replace(/\./g, '/')}</span>
                        </div>
                    </div>
                    <div className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-1 rounded w-fit mx-auto">
                        {days} Gün
                    </div>
                </div>
            </td>
            <td className="p-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                    <div className="text-primary-400 font-bold whitespace-nowrap">{Number(booking.totalPrice).toLocaleString()} ₺</div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border w-fit ${booking.paymentStatus === 'PAID'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        } whitespace-nowrap`}>
                        <span className={`w-1 h-1 rounded-full ${booking.paymentStatus === 'PAID' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        {booking.paymentStatus === 'PAID' ? 'Ödendi' : 'Ödenmedi'}
                    </span>
                </div>
            </td>
            <td className="p-4 text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt))
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : booking.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : booking.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : booking.status === 'COMPLETED' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                : 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                    } whitespace-nowrap`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt))
                        ? 'bg-orange-500'
                        : booking.status === 'ACTIVE' ? 'bg-green-500'
                            : booking.status === 'CANCELLED' ? 'bg-red-500'
                                : booking.status === 'COMPLETED' ? 'bg-gray-500'
                                    : 'bg-primary-500'
                        }`} />
                    {(booking.status === 'RESERVED' && booking.paymentStatus === 'UNPAID' && booking.expiresAt && new Date() > new Date(booking.expiresAt))
                        ? 'Süre Doldu'
                        : booking.status === 'ACTIVE' ? 'Aktif'
                            : booking.status === 'CANCELLED' ? 'İptal'
                                : booking.status === 'COMPLETED' ? 'Tamamlandı'
                                    : 'Rezerve'}
                </span>
            </td>
            <td className="p-4 text-center">
                <Button
                    size="sm"
                    variant="outline"
                    className="opacity-70 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 border-white/10 text-white hover:bg-white/10 whitespace-nowrap mx-auto"
                    onClick={() => onView(booking)}
                >
                    Detaylar
                </Button>
            </td>
            <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    {booking.status === 'RESERVED' && booking.paymentStatus === 'PAID' && (
                        (() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const pickup = new Date(booking.pickupDate);
                            pickup.setHours(0, 0, 0, 0);
                            const isArrived = today >= pickup;

                            if (isArrived) {
                                return (
                                    <Button
                                        size="sm"
                                        className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:border-green-500/30 transition-all font-medium rounded-lg whitespace-nowrap"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAction('start', booking.id);
                                        }}
                                    >
                                        <Key className="w-4 h-4 mr-1.5" />
                                        Teslim Et
                                    </Button>
                                );
                            } else {
                                return (
                                    <span className="text-xs text-gray-500 italic px-2 py-1.5 border border-white/5 rounded-lg bg-white/5 select-none whitespace-nowrap">
                                        Teslim Bekleniyor
                                    </span>
                                );
                            }
                        })()
                    )}

                    {
                        booking.status === 'ACTIVE' && (
                            <Button
                                size="sm"
                                className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all font-medium rounded-lg whitespace-nowrap"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAction('complete', booking.id);
                                }}
                            >
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                Teslim Al
                            </Button>
                        )
                    }{booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                        <Button
                            size="sm"
                            className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all font-medium rounded-lg whitespace-nowrap"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAction('cancel', booking.id);
                            }}
                        >
                            İptal
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
};

const EditUserModal = ({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(user.role);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminService.updateUser(user.id, { role });
            addToast('Kullanıcı rolü güncellendi', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Güncelleme hatası', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Kullanıcı Rolünü Düzenle">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-400">Kullanıcı:</p>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Rol</label>
                    <select
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                    >
                        <option value="STAFF">Personel (Kısıtlı)</option>
                        <option value="ADMIN">Yönetici</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="border-white/10 text-white hover:bg-white/10">İptal</Button>
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600 text-white">
                        {loading ? <Loader2 className="animate-spin" /> : 'Güncelle'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const CreateUserModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'STAFF'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminService.createUser(formData);
            addToast('Kullanıcı başarıyla oluşturuldu', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.error?.message || error.message || 'Kullanıcı oluşturulurken bir hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Kullanıcı Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Ad Soyad</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">E-posta</label>
                    <input
                        type="email"
                        required
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Telefon</label>
                    <input
                        type="tel"
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Şifre</label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Rol</label>
                    <select
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="STAFF">Personel (Kısıtlı)</option>
                        <option value="ADMIN">Yönetici</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="border-white/10 text-white hover:bg-white/10">İptal</Button>
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600 text-white">
                        {loading ? <Loader2 className="animate-spin" /> : 'Oluştur'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const { addToast: toast } = useToast();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
    const [selectedInsurance, setSelectedInsurance] = useState<UserInsurance | null>(null);
    const [isCreateInsuranceModalOpen, setIsCreateInsuranceModalOpen] = useState(false);
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
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const [bookingAction, setBookingAction] = useState<'cancel' | 'start' | 'complete' | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

    // Franchise States
    const [franchisePage, setFranchisePage] = useState(1);
    const [totalFranchises, setTotalFranchises] = useState(0);
    const [franchiseLoading, setFranchiseLoading] = useState(false);
    const [franchiseSearchTerm, setFranchiseSearchTerm] = useState('');
    const [highlightedFranchiseId, setHighlightedFranchiseId] = useState<string | null>(null);

    // Insurance States
    const [insurances, setInsurances] = useState<any[]>([]);
    const [insuranceLoading, setInsuranceLoading] = useState(false);
    const [insurancePage, setInsurancePage] = useState(1);
    const [totalInsurances, setTotalInsurances] = useState(0);
    const [insuranceSearchTerm, setInsuranceSearchTerm] = useState('');

    // User Management States
    const [users, setUsers] = useState<{ id: string; name: string; email: string; phone: string; role: 'ADMIN' | 'STAFF'; createdAt: string }[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any | null>(null);
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [selectedUserToEdit, setSelectedUserToEdit] = useState<any | null>(null);

    // Audit Logs Preview State
    const [auditLogs, setAuditLogs] = useState<ActionLog[]>([]);
    const [auditLogsLoading, setAuditLogsLoading] = useState(false);

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

    const [showManualModal, setShowManualModal] = useState(false);

    // Auto-refresh for notifications
    useEffect(() => {
        const interval = setInterval(() => {
            refreshStats();
        }, 60000); // 60s instead of 30s — reduces database load
        return () => clearInterval(interval);
    }, []);

    const isFirstRender = React.useRef(true);

    const refreshStats = async () => {
        try {
            const statsData = await adminService.getDashboard();
            setStats(statsData);
        } catch (err) {
            console.error('Silent refresh failed', err);
        }
    };

    useEffect(() => {
        const user = storage.getUser();
        if (user) {
            setCurrentUser(user);
            if (user.role === 'ADMIN' || user.role === 'STAFF') {
                loadLogs();
            }
        }
    }, []);

    useEffect(() => {
        if (currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF')) {
            loadUsers();
        }
    }, [currentUser]);

    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const data = await adminService.getUsers();
            setUsers(data as any);
        } catch (error) {
            console.error(error);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        try {
            await adminService.deleteUser(id);
            toast('Kullanıcı başarıyla silindi', 'success');
            loadUsers();
        } catch (error: any) {
            toast(error.response?.data?.error?.message || 'Silme işlemi başarısız', 'error');
        }
    };

    const loadData = async () => {
        try {
            // All 5 data fetches run in parallel — no waterfall
            const [statsData, revenueAnalytics] = await Promise.all([
                adminService.getDashboard(),
                adminService.getRevenueAnalytics(selectedYear),
                loadBookings(1),
                loadFranchiseApplications(1),
                loadInsurances(1)
            ]);
            setStats(statsData);
            setRevenueData(revenueAnalytics);
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data?.message || err.message || 'Bilinmeyen bir hata oluştu';
            setError(`Hata: ${errorMessage} (Kod: ${err.response?.status})`);

            if (err.response?.status === 401) {
                // Only redirect if absolutely necessary, but we want to show the error first maybe?
                // navigate('/admin/login');
                setError('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
            }
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

    const loadFranchiseApplications = async (page: number, search?: string) => {
        setFranchiseLoading(true);
        try {
            const params: any = {
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE
            };
            if (search) params.search = search;


            const franchiseData = await adminService.getFranchiseApplications(params);
            setFranchiseApplications(franchiseData.data || []);
            setTotalFranchises(franchiseData.pagination?.total || franchiseData.data?.length || 0);
            setFranchisePage(page);
        } catch (err) {
            console.error(err);
            toast('Franchise başvuruları yüklenirken hata oluştu', 'error');
        } finally {
            setFranchiseLoading(false);
        }
    };

    const loadInsurances = async (page: number, search?: string) => {
        setInsuranceLoading(true);
        try {
            const res = await adminService.getInsurances({
                page,
                limit: ITEMS_PER_PAGE,
                searchTerm: search
            });
            if (res.success) {
                setInsurances(res.data);
                setTotalInsurances(res.pagination.total);
                setInsurancePage(page);
            }
        } catch (err) {
            console.error('Failed to load insurances', err);
            toast('Sigortalar yüklenirken hata oluştu', 'error');
        } finally {
            setInsuranceLoading(false);
        }
    };

    const handleExportInsurances = async () => {
        try {
            const response = await adminService.exportInsurances();
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const { saveAs } = await import('file-saver');
            saveAs(blob, `Sigortalar_${new Date().toLocaleDateString('tr-TR')}.xlsx`);

            toast('Excel başarıyla indirildi', 'success');
        } catch (error) {
            console.error('Export error:', error);
            toast('Excel indirilirken bir hata oluştu', 'error');
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    // Auto-search with debounce
    useEffect(() => {
        if (isFirstRender.current) return;
        const timer = setTimeout(() => {
            loadBookings(1, searchTerm || undefined, statusFilter || undefined);
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter]);

    // Auto-search with debounce for Franchise
    useEffect(() => {
        if (isFirstRender.current) return;
        const timer = setTimeout(() => {
            loadFranchiseApplications(1, franchiseSearchTerm || undefined);
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [franchiseSearchTerm]);

    // Auto-search with debounce for Insurance
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            loadInsurances(1, insuranceSearchTerm || undefined);
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [insuranceSearchTerm]);

    const handleAction = (action: 'cancel' | 'start' | 'complete', id: string) => {
        setCancelingId(id);
        setBookingAction(action);
    };

    const confirmAction = async () => {
        if (!cancelingId || !bookingAction) return;
        try {
            if (bookingAction === 'cancel') {
                await adminService.cancelBooking(cancelingId);
                toast('Rezervasyon başarıyla iptal edildi', 'success');
            } else if (bookingAction === 'start') {
                await adminService.startBooking(cancelingId);
                toast('Kiralama başlatıldı (Teslim Edildi)', 'success');
            } else if (bookingAction === 'complete') {
                await adminService.completeBooking(cancelingId);
                toast('Araç teslim alındı (Tamamlandı)', 'success');
            }

            // Refresh bookings and stats without full page reload
            await loadBookings(currentPage, searchTerm, statusFilter);
            const statsData = await adminService.getDashboard();
            setStats(statsData);
        } catch (err: any) {
            toast(err.response?.data?.message || 'İşlem başarısız', 'error');
        } finally {
            setCancelingId(null);
            setBookingAction(null);
        }
    };

    const loadLogs = async () => {
        setAuditLogsLoading(true);
        try {
            const res = await adminService.getAuditLogs({ page: 1, limit: 10 });
            setAuditLogs(res.data);
        } catch (error) {
            console.error('Audit logs load failed:', error);
        } finally {
            setAuditLogsLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-dark-bg pt-24 flex justify-center items-center">
            <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
        </div>
    );

    if (!stats) return (
        <div className="min-h-screen bg-dark-bg pt-24 flex justify-center items-center flex-col gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="text-white text-lg font-bold">Veri yükleme hatası</div>
            {error && (
                <div className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20 max-w-md text-center">
                    {error}
                </div>
            )}
            <Button onClick={() => window.location.reload()} variant="outline">
                Sayfayı Yenile
            </Button>
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

            <Modal
                isOpen={!!cancelingId}
                onClose={() => setCancelingId(null)}
                title={bookingAction === 'start' ? "Kiralamayı Başlat" : bookingAction === 'complete' ? "Teslim Al" : "Rezervasyonu İptal Et"}
                size="sm"
            >
                <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${bookingAction === 'start' ? 'bg-green-500/20' : bookingAction === 'complete' ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                        {bookingAction === 'start' ? <Key className="w-6 h-6 text-green-500" /> : bookingAction === 'complete' ? <CheckCircle className="w-6 h-6 text-blue-500" /> : <AlertCircle className="w-6 h-6 text-red-500" />}
                    </div>
                    <p className="text-gray-300 text-center">
                        {bookingAction === 'start'
                            ? 'Aracı teslim etmek ve kiralamayı başlatmak istediğinize emin misiniz?'
                            : bookingAction === 'complete'
                                ? 'Aracı teslim almak ve kiralamayı tamamlamak istediğinize emin misiniz?'
                                : 'Bu rezervasyonu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.'}
                    </p>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setCancelingId(null)}>Vazgeç</Button>
                        <Button
                            className={`${bookingAction === 'start' ? 'bg-green-500 hover:bg-green-600' : bookingAction === 'complete' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'} text-white border-none`}
                            onClick={confirmAction}
                        >
                            {bookingAction === 'start' ? 'Evet, Başlat' : bookingAction === 'complete' ? 'Evet, Teslim Al' : 'Evet, İptal Et'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Manual Booking Modal */}
            <ManualBookingModal
                isOpen={showManualModal}
                onClose={() => setShowManualModal(false)}
                onSuccess={() => {
                    loadBookings(1);
                    refreshStats();
                }}
            />

            <div className="container mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">
                            GENEL <span className="text-primary-500">BAKIŞ</span>
                        </h1>
                        <div className="h-1 w-20 bg-gradient-to-r from-primary-500 to-transparent mt-2 rounded-full" />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Navigation Modules */}
                        <div className="flex items-center gap-3 mr-4 border-r border-white/10 pr-4">
                            <Link to="/admin/campaigns">
                                <Button variant="secondary" className="flex items-center gap-2">
                                    <Megaphone className="w-4 h-4" />
                                    Kampanyalar
                                </Button>
                            </Link>
                            <Link to="/admin/cars/rental">
                                <Button variant="secondary" className="flex items-center gap-2">
                                    <Key className="w-4 h-4" />
                                    Kiralık
                                </Button>
                            </Link>
                            <Link to="/admin/cars/sale">
                                <Button variant="secondary" className="flex items-center gap-2 bg-dark-bg/50 border-white/10 hover:bg-white/10 text-white">
                                    <DollarSign className="w-4 h-4" />
                                    Satılık
                                </Button>
                            </Link>
                            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF') && (
                                <Link to="/admin/audit-logs">
                                    <Button variant="secondary" className="flex items-center gap-2 bg-dark-bg/50 border-white/10 hover:bg-white/10 text-white">
                                        <Shield className="w-4 h-4" />
                                        İşlem Geçmişi
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Primary Action */}
                        <Button
                            variant="primary"
                            onClick={() => setShowManualModal(true)}
                            className="mr-2"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Rezervasyon
                        </Button>

                        {/* Notification Bell */}
                        <div className="relative">
                            <Button
                                variant="secondary"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative w-11 h-11 p-0 rounded-xl"
                            >
                                {(() => {
                                    const newBookings = stats?.latestNewBookings || [];
                                    const pendingFranchise = stats?.latestPendingFranchiseApplications || [];
                                    const paidBookings = stats?.latestPaidBookings || [];

                                    const unreadCount = [
                                        ...newBookings.filter(b => !b.adminRead),
                                        ...pendingFranchise.filter(f => !f.adminRead),
                                        ...paidBookings.filter(b => !b.adminRead)
                                    ].length;

                                    return unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-dark-bg">
                                            {unreadCount}
                                        </span>
                                    );
                                })()}
                                <AlertCircle size={20} />
                            </Button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-4 w-96 bg-dark-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                        <h3 className="font-bold text-white">Bildirimler</h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        setShowNotifications(false); // Close immediately for better UX
                                                        await adminService.markAllNotificationsRead();
                                                        refreshStats();
                                                    } catch (err) {
                                                        console.error("Failed to mark all read", err);
                                                    }
                                                }}
                                                className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors mr-2"
                                            >
                                                Tümünü Temizle
                                            </button>
                                            <button
                                                onClick={() => setShowNotifications(false)}
                                                className="text-xs font-bold text-gray-400 hover:text-gray-300 transition-colors"
                                            >
                                                Kapat
                                            </button>
                                            <button onClick={() => setShowNotifications(false)} className="text-gray-500 hover:text-white bg-transparent"><X size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {(() => {
                                            const newBookings = (stats?.latestNewBookings || []).map(b => ({
                                                id: b.id,
                                                type: 'booking',
                                                title: 'Yeni Rezervasyon (Bekliyor)',
                                                desc: `${b.car?.brand} ${b.car?.model} - ${b.customerName} ${b.customerSurname}`,
                                                code: b.bookingCode || b.id,
                                                date: b.createdAt,
                                                icon: <CarIcon size={16} />,
                                                color: 'primary',
                                                read: b.adminRead
                                            }));

                                            const paidBookings = (stats?.latestPaidBookings || []).map(b => ({
                                                id: b.id + '_paid',
                                                originalId: b.id,
                                                type: 'booking',
                                                title: 'Ödeme Alındı',
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
                                                title: 'Bayilik Başvurusu',
                                                desc: f.companyName || f.contactName,
                                                date: f.submittedAt,
                                                icon: <Building2 size={16} />,
                                                color: 'yellow',
                                                read: f.adminRead
                                            }));

                                            const allNotifications = [...newBookings, ...paidBookings, ...pendingFranchise]
                                                .filter(item => !item.read)
                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                            if (allNotifications.length === 0) {
                                                return (
                                                    <div className="p-8 text-center text-gray-500 text-sm">
                                                        <Check className="w-8 h-8 mx-auto mb-2 text-green-500/20" />
                                                        Bildirim yok.
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
                                                            setSearchTerm('');
                                                            setHighlightedBookingId(bookingId);
                                                            loadBookings(1, '', statusFilter);
                                                            setTimeout(() => setHighlightedBookingId(null), 5000);
                                                            const element = document.getElementById('bookings-section');
                                                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                                                        } else if (item.type === 'franchise') {
                                                            setFranchiseSearchTerm('');
                                                            setHighlightedFranchiseId(item.id);
                                                            loadFranchiseApplications(1, '');
                                                            setTimeout(() => setHighlightedFranchiseId(null), 5000);
                                                            const element = document.getElementById('franchise-section');
                                                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                                                        }

                                                        // 2. Background API Call
                                                        if (!item.read) {
                                                            const idToMark = (item as any).originalId || item.id;
                                                            // Fire and forget, don't await
                                                            adminService.markNotificationRead(idToMark, item.type as any)
                                                                .then(() => refreshStats())
                                                                .catch(err => console.error("Failed to mark read", err));
                                                        }
                                                    }}
                                                    className={`p-4 border-b border-white/5 last:border-0 transition-colors cursor-pointer flex gap-4 items-start ${!item.read ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5 opacity-60'
                                                        } ${item.color === 'green' ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-primary-500'}`}
                                                >
                                                    <div className={`mt-1 p-2 rounded-lg ${item.color === 'green' ? 'bg-green-500/20 text-green-400' : 'bg-primary-500/20 text-primary-400'}`}>
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <div className={`text-sm font-bold ${!item.read ? 'text-white' : 'text-gray-400'}`}>{item.title}</div>
                                                            {!item.read && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />}
                                                        </div>
                                                        <div className="text-xs text-gray-300 mt-0.5">{item.desc}</div>
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
                    </div>
                </div>

                {/* Stats Cards */}
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Toplam Ciro"
                        value={`${stats.totalRevenue.toLocaleString()} ₺`}
                        icon={<span className="text-2xl font-bold">₺</span>}
                        color="green"
                        trend="%12.5"
                        trendUp={true}
                        data={[40, 35, 55, 70, 60, 80, 75]}
                    />
                    <StatCard
                        title="Toplam Rezervasyon"
                        value={stats.totalBookings}
                        icon={<Calendar className="w-6 h-6" />}
                        color="blue"
                        trend="%5.2"
                        trendUp={true}
                        data={[20, 30, 25, 40, 35, 50, 45]}
                        onClick={() => { setStatusFilter(''); loadBookings(1); }}
                        isActive={statusFilter === ''}
                    />
                    <StatCard
                        title="Aktif Kiralama"
                        value={stats.activeBookings}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="purple"
                        trend="%2.1"
                        trendUp={false}
                        data={[60, 50, 45, 40, 30, 25, 30]}
                        onClick={() => { setStatusFilter('ACTIVE'); loadBookings(1, searchTerm, 'ACTIVE'); }}
                        isActive={statusFilter === 'ACTIVE'}
                    />
                    <StatCard
                        title="Toplam Araç"
                        value={stats.totalCars}
                        icon={<CarIcon className="w-6 h-6" />}
                        color="orange"
                        trend="Sabit"
                        trendUp={true}
                        data={[80, 80, 82, 82, 85, 85, 85]}
                    />
                </div>

                {/* Revenue Analytics Section */}
                {revenueData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Revenue Chart (Dual Axis) */}
                        <div className="lg:col-span-2 bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
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
                                                {Math.abs(Number(revenueData.summary.growth.toFixed(1)))}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            className="px-4 py-2 bg-dark-bg border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            {revenueData.availableYears.map(year => (
                                                <option key={year} value={year} className="bg-dark-bg">{year}</option>
                                            ))}
                                        </select>
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
                                        <button
                                            onClick={async () => {
                                                if (!revenueData) return;

                                                // Dynamic imports — loaded only when export is triggered
                                                const [{ default: ExcelJS }, { default: html2canvas }, { saveAs }] = await Promise.all([
                                                    import('exceljs'),
                                                    import('html2canvas'),
                                                    import('file-saver'),
                                                ]);

                                                const workbook = new ExcelJS.Workbook();
                                                const worksheet = workbook.addWorksheet('Gelir Raporu');

                                                // 1. Add Title
                                                worksheet.mergeCells('A1:E1');
                                                const titleCell = worksheet.getCell('A1');
                                                titleCell.value = `SlonCar Gelir Raporu (${selectedYear}) - ${chartView === 'weekly' ? 'Haftalık' : chartView === 'monthly' ? 'Aylık' : 'Yıllık'}`;
                                                titleCell.font = { name: 'Arial', family: 4, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
                                                titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }; // Dark gray bg
                                                titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
                                                worksheet.getRow(1).height = 30;

                                                // 2. Add Summary Data
                                                worksheet.addRow(['']);
                                                const summaryRow = worksheet.addRow(['Toplam Ciro', 'Adet', 'Büyüme', 'Şu Anki Dönem', 'Geçen Dönem']);
                                                summaryRow.font = { bold: true };

                                                const summaryDataRow = worksheet.addRow([
                                                    revenueData.summary.currentYear,
                                                    revenueData.yearly.reduce((acc, curr) => acc + curr.bookings, 0),
                                                    revenueData.summary.growth / 100, // For percentage format
                                                    revenueData.summary.currentMonth,
                                                    revenueData.summary.lastMonth
                                                ]);

                                                // Format Summary
                                                summaryDataRow.getCell(1).numFmt = '#,##0 "₺"';
                                                summaryDataRow.getCell(3).numFmt = '0.0%';
                                                summaryDataRow.getCell(4).numFmt = '#,##0 "₺"';
                                                summaryDataRow.getCell(5).numFmt = '#,##0 "₺"';

                                                // 3. Add Main Table Data
                                                worksheet.addRow(['']);
                                                worksheet.addRow(['']); // Spacer

                                                const headers = ['Dönem', 'Gelir', 'Rezervasyon Sayısı', 'Ortalama Gelir'];
                                                const headerRow = worksheet.addRow(headers);
                                                headerRow.eachCell((cell) => {
                                                    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } }; // Gray-600
                                                    cell.alignment = { horizontal: 'center' };
                                                });

                                                const chartData = getChartData();
                                                chartData.forEach((d: any) => {
                                                    const row = worksheet.addRow([
                                                        d[getDataKey()],
                                                        d.revenue,
                                                        d.bookings,
                                                        d.bookings > 0 ? d.revenue / d.bookings : 0
                                                    ]);
                                                    row.getCell(2).numFmt = '#,##0 "₺"';
                                                    row.getCell(4).numFmt = '#,##0 "₺"';
                                                    row.getCell(1).alignment = { horizontal: 'center' };
                                                    row.getCell(3).alignment = { horizontal: 'center' };
                                                });

                                                // Auto-width columns
                                                worksheet.columns.forEach(column => {
                                                    column.width = 20;
                                                });
                                                worksheet.getColumn(1).width = 25; // Period column slightly wider

                                                // 4. Capture and Add Charts
                                                try {
                                                    const mainChart = document.getElementById('main-revenue-chart');
                                                    if (mainChart) {
                                                        const canvas = await html2canvas(mainChart, { backgroundColor: '#111827' }); // Use dark bg
                                                        const imageId = workbook.addImage({
                                                            base64: canvas.toDataURL('image/png'),
                                                            extension: 'png',
                                                        });
                                                        worksheet.addImage(imageId, {
                                                            tl: { col: 6, row: 2 }, // Start at column G, row 3
                                                            ext: { width: 600, height: 300 }
                                                        });
                                                    }

                                                    const pieChart = document.getElementById('category-pie-chart');
                                                    if (pieChart) {
                                                        const canvas = await html2canvas(pieChart, { backgroundColor: '#1f2937' });
                                                        const imageId = workbook.addImage({
                                                            base64: canvas.toDataURL('image/png'),
                                                            extension: 'png',
                                                        });
                                                        worksheet.addImage(imageId, {
                                                            tl: { col: 6, row: 20 },
                                                            ext: { width: 400, height: 250 }
                                                        });
                                                    }

                                                    const barChart = document.getElementById('brand-bar-chart');
                                                    if (barChart) {
                                                        const canvas = await html2canvas(barChart, { backgroundColor: '#1f2937' });
                                                        const imageId = workbook.addImage({
                                                            base64: canvas.toDataURL('image/png'),
                                                            extension: 'png',
                                                        });
                                                        worksheet.addImage(imageId, {
                                                            tl: { col: 12, row: 20 }, // Offset for side-by-side
                                                            ext: { width: 400, height: 250 }
                                                        });
                                                    }
                                                } catch (error) {
                                                    console.error("Error capturing charts:", error);
                                                    toast("Grafikler, Excel'e eklenirken bir hata oluştu ama veriler indirildi.", "error");
                                                }

                                                // Generate Buffer
                                                const buffer = await workbook.xlsx.writeBuffer();
                                                saveAs(new Blob([buffer]), `SlonCar_Gelir_Raporu_${selectedYear}.xlsx`);
                                            }}
                                            className="p-2.5 rounded-xl bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-primary-500/50 transition-all"
                                            title="Excel İndir (Grafikli)"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="h-80" id="main-revenue-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={getChartData()}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                                                }}
                                                itemStyle={{ padding: 0 }}
                                                labelStyle={{ marginBottom: '8px', fontWeight: 'bold', color: '#e2e8f0' }}
                                                formatter={(value: any, name: any) => [
                                                    name === 'revenue'
                                                        ? <span key="revenue" className="text-primary-400 font-bold">{Number(value).toLocaleString()} ₺</span>
                                                        : <span key="bookings" className="text-orange-400 font-bold">{value} Adet</span>,
                                                    name === 'revenue' ? 'Gelir' : 'Rezervasyon'
                                                ]}
                                            />
                                            <Area
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#6366f1"
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
                        <div className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                            <div className="p-6 border-b border-white/10">
                                <h2 className="text-xl font-bold text-white">Kategori Dağılımı</h2>
                                <p className="text-xs text-gray-500 mt-1">Hasılatın araç türüne göre dağılımı</p>
                            </div>
                            <div className="p-6">
                                <div className="h-[200px] relative" id="category-pie-chart">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'SUV', value: 35, color: '#6366f1' },       // Indigo
                                                    { name: 'Sedan', value: 25, color: '#8b5cf6' },     // Violet
                                                    { name: 'Lüks', value: 20, color: '#ec4899' },      // Pink
                                                    { name: 'Hatchback', value: 15, color: '#06b6d4' }, // Cyan
                                                    { name: 'Van', value: 5, color: '#10b981' }         // Emerald
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {[
                                                    { name: 'SUV', value: 35, color: '#6366f1' },
                                                    { name: 'Sedan', value: 25, color: '#8b5cf6' },
                                                    { name: 'Lüks', value: 20, color: '#ec4899' },
                                                    { name: 'Hatchback', value: 15, color: '#06b6d4' },
                                                    { name: 'Van', value: 5, color: '#10b981' }
                                                ].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    color: 'white'
                                                }}
                                                formatter={(value: any) => [`%${value}`, 'Pay']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-3xl font-black text-white">5</span>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Kategori</span>
                                    </div>
                                </div>
                                {/* Legend */}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {[
                                        { name: 'SUV', value: 35, color: 'bg-primary-500' },
                                        { name: 'Sedan', value: 25, color: 'bg-violet-500' },
                                        { name: 'Lüks', value: 20, color: 'bg-pink-500' },
                                        { name: 'Hatchback', value: 15, color: 'bg-cyan-500' },
                                        { name: 'Van', value: 5, color: 'bg-emerald-500' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                            <span className="text-sm text-gray-400">{item.name}</span>
                                            <span className="text-sm font-bold text-white ml-auto">%{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Bookings Table with Pagination */}
                <div id="bookings-section" className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
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


                    <div className="overflow-x-auto custom-scrollbar pb-4">
                        <table className="w-full text-left min-w-[1200px]">
                            <thead className="bg-dark-bg/50 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 text-center">Kod</th>
                                    <th className="p-4">Müşteri</th>
                                    <th className="p-4">Araç</th>
                                    <th className="p-4 text-center">Tarihler</th>
                                    <th className="p-4 text-center">Ödeme & Tutar</th>
                                    <th className="p-4 text-center">Durum</th>
                                    <th className="p-4 text-center">Detaylar</th>
                                    <th className="p-4 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 relative">
                                {bookingsLoading ? (
                                    <tr>
                                        <td colSpan={9} className="p-12 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                            <p className="text-gray-400">Henüz rezervasyon yok</p>
                                        </td>
                                    </tr>
                                ) : (
                                    bookings.map((booking) => (
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

                {/* Audit Logs Preview Section */}
                {currentUser?.role === 'ADMIN' && (
                    <div className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-orange-400" />
                                    </div>
                                    Son İşlemler
                                </h2>
                                <span className="text-xs font-bold text-gray-400 bg-dark-bg px-3 py-1.5 rounded-full border border-white/5">
                                    Son 10 işlem
                                </span>
                            </div>
                            <Link
                                to="/admin/audit-logs"
                                className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium transition-colors"
                            >
                                Tümünü Gör
                                <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-dark-bg/50 text-gray-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Tarih</th>
                                        <th className="p-4">Kullanıcı</th>
                                        <th className="p-4">İşlem</th>
                                        <th className="p-4">Detaylar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 relative">
                                    {auditLogsLoading ? (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : auditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-gray-500">
                                                Henüz işlem kaydı yok
                                            </td>
                                        </tr>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 text-sm text-gray-400 font-mono">
                                                    {new Date(log.createdAt).toLocaleString('tr-TR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        day: '2-digit',
                                                        month: '2-digit'
                                                    })}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-white">{log.user?.name || 'Sistem'}</span>
                                                        <span className="text-xs text-gray-500">{log.user?.role || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded text-[10px] font-bold bg-white/5 text-gray-300 border border-white/10 font-mono">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-400 max-w-[300px] truncate" title={log.details}>
                                                    {log.details || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {/* Franchise Applications Section */}
                <div id="franchise-section" className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                    <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-purple-400" />
                                </div>
                                Franchise Başvuruları
                            </h2>
                            <span className="text-xs font-bold text-gray-400 bg-dark-bg px-3 py-1.5 rounded-full border border-white/5">
                                {totalFranchises} başvuru
                            </span>
                        </div>
                        <div className="flex-1 max-w-md flex justify-end">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="İsim, Şirket veya Şehir ile ara..."
                                    value={franchiseSearchTerm}
                                    onChange={(e) => setFranchiseSearchTerm(e.target.value)}
                                    className="w-full bg-dark-bg/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                                />
                                {franchiseSearchTerm && (
                                    <button
                                        onClick={() => setFranchiseSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>


                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-dark-bg/50 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Başvuran</th>
                                    <th className="p-4">İletişim</th>
                                    <th className="p-4">Lokasyon</th>
                                    <th className="p-4">Bütçe</th>
                                    <th className="p-4">Durum</th>
                                    <th className="p-4">Tarih</th>
                                    <th className="p-4">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 relative">
                                {franchiseLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : franchiseApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center">
                                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                            <p className="text-gray-400">Henüz franchise başvurusu yok</p>
                                        </td>
                                    </tr>
                                ) : (
                                    franchiseApplications.map((app) => {
                                        const statusInfo = FRANCHISE_STATUS_LABELS[app.status] || { label: app.status, color: 'gray' };
                                        const isHighlighted = highlightedFranchiseId === app.id;
                                        return (
                                            <tr
                                                key={app.id}
                                                className={`transition-all group border-b border-white/5 last:border-0 ${isHighlighted
                                                    ? 'bg-purple-500/20 hover:bg-purple-500/30 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]'
                                                    : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <td className="p-4 max-w-[200px]">
                                                    <div className="font-medium text-white truncate" title={app.contactName}>{app.contactName}</div>
                                                    {app.companyName && <div className="text-xs text-gray-400 truncate" title={app.companyName}>{app.companyName}</div>}
                                                </td>
                                                <td className="p-4 max-w-[200px]">
                                                    <div className="text-sm text-gray-300 truncate" title={app.contactEmail}>{app.contactEmail}</div>
                                                    <div className="text-xs text-gray-500 truncate">{app.contactPhone}</div>
                                                </td>
                                                <td className="p-4 text-gray-300 truncate max-w-[150px]" title={app.city}>{app.city || '-'}</td>
                                                <td className="p-4 text-sm text-gray-400">{app.details?.investmentBudget || '-'}</td>
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
                                                <td className="p-4 text-sm text-gray-400">
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
                    {totalFranchises > ITEMS_PER_PAGE && (
                        <div className="p-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                Sayfa {franchisePage} / {Math.ceil(totalFranchises / ITEMS_PER_PAGE)} ({totalFranchises} kayıt)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => loadFranchiseApplications(franchisePage - 1)}
                                    disabled={franchisePage === 1 || franchiseLoading}
                                    className="p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, Math.ceil(totalFranchises / ITEMS_PER_PAGE)) }, (_, i) => {
                                        const totalPages = Math.ceil(totalFranchises / ITEMS_PER_PAGE);
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
                                                onClick={() => loadFranchiseApplications(pageNum)}
                                                disabled={franchiseLoading}
                                                className={`w-10 h-10 rounded-lg font-bold transition-all ${franchisePage === pageNum
                                                    ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                                    : 'bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => loadFranchiseApplications(franchisePage + 1)}
                                    disabled={franchisePage >= Math.ceil(totalFranchises / ITEMS_PER_PAGE) || franchiseLoading}
                                    className="p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>


                {/* Insurance Section */}
                <div id="insurance-section" className="bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                    <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-400" />
                                </div>
                                Sigortalar
                            </h2>
                            <span className="text-xs font-bold text-gray-400 bg-dark-bg px-3 py-1.5 rounded-full border border-white/5">
                                {totalInsurances} kayıt
                            </span>
                        </div>
                        <div className="flex-1 max-w-2xl flex justify-end items-center gap-4">
                            <Button
                                onClick={handleExportInsurances}
                                className="bg-[#107c41] hover:bg-[#0c5c30] text-white border-none shadow-lg shadow-green-900/20 flex items-center gap-2 transition-all hover:scale-105 whitespace-nowrap px-6"
                            >
                                <Download className="w-4 h-4" />
                                <span className="font-semibold">Excel İndir</span>
                            </Button>
                            <Button
                                onClick={() => setIsCreateInsuranceModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" />
                                Yeni Sigorta
                            </Button>
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Poliçe, Şirket veya Kullanıcı Ara..."
                                    value={insuranceSearchTerm}
                                    onChange={(e) => {
                                        setInsuranceSearchTerm(e.target.value);
                                        if (e.target.value.length >= 2 || e.target.value.length === 0) {
                                            loadInsurances(1, e.target.value);
                                        }
                                    }}
                                    className="w-full bg-dark-bg/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-dark-bg/50 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Kullanıcı</th>
                                    <th className="p-4">Sigorta Şirketi</th>
                                    <th className="p-4">Poliçe No / Tip</th>
                                    <th className="p-4">Tutar</th>
                                    <th className="p-4">Tarihler</th>
                                    <th className="p-4 text-center">Durum</th>
                                    <th className="p-4 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 relative">
                                {insuranceLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : insurances.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center">
                                            <Shield className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                            <p className="text-gray-400">Henüz sigorta kaydı yok</p>
                                        </td>
                                    </tr>
                                ) : (
                                    insurances.map((ins) => {
                                        const daysLeft = Math.ceil((new Date(ins.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        const isExpiring = daysLeft <= 10 && daysLeft >= 0;
                                        const isExpired = daysLeft < 0;

                                        return (
                                            <tr
                                                key={ins.id}
                                                className={`transition-all border-b border-white/5 last:border-0 group ${isExpired
                                                    ? 'bg-red-500/10 hover:bg-red-500/20 shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]'
                                                    : isExpiring
                                                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20 shadow-[inset_0_0_10px_rgba(234,179,8,0.1)]'
                                                        : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{ins.user?.name}</div>
                                                    <div className="text-xs text-gray-500">{ins.user?.email}</div>
                                                </td>
                                                <td className="p-4 text-gray-300">{ins.companyName}</td>
                                                <td className="p-4">
                                                    <div className="font-mono text-sm text-blue-400">{ins.policyNumber}</div>
                                                    {ins.policyType && <div className="text-xs text-gray-500">{ins.policyType}</div>}
                                                </td>
                                                <td className="p-4 text-sm text-gray-300">
                                                    {ins.premiumAmount ? `${Number(ins.premiumAmount).toLocaleString()} ₺` : '-'}
                                                </td>
                                                <td className="p-4 text-sm text-gray-400">
                                                    <div className="flex flex-col text-xs">
                                                        <span>{new Date(ins.startDate).toLocaleDateString('tr-TR')}</span>
                                                        <span className="text-gray-600">↓</span>
                                                        <span className={isExpired ? 'text-red-400 font-bold flex items-center gap-1' : isExpiring ? 'text-yellow-400 font-bold flex items-center gap-1' : ''}>
                                                            {new Date(ins.endDate).toLocaleDateString('tr-TR')}
                                                            {isExpiring && <span className="bg-yellow-500/20 text-yellow-400 px-1.5 rounded text-[10px]">{daysLeft} gün</span>}
                                                            {isExpired && <span className="bg-red-500/20 text-red-400 px-1.5 rounded text-[10px]">Süresi Doldu</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ins.isActive
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${ins.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        {ins.isActive ? 'Aktif' : 'Pasif'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="opacity-70 group-hover:opacity-100 transition-opacity text-xs px-3 py-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                                                        onClick={() => setSelectedInsurance(ins)}
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
                    {totalInsurances > ITEMS_PER_PAGE && (
                        <div className="p-4 border-t border-white/10 flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                                Sayfa {insurancePage} / {Math.ceil(totalInsurances / ITEMS_PER_PAGE)} ({totalInsurances} kayıt)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => loadInsurances(insurancePage - 1)}
                                    disabled={insurancePage === 1 || insuranceLoading}
                                    className="p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, Math.ceil(totalInsurances / ITEMS_PER_PAGE)) }, (_, i) => {
                                        const totalPages = Math.ceil(totalInsurances / ITEMS_PER_PAGE);
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
                                                onClick={() => loadInsurances(pageNum)}
                                                disabled={insuranceLoading}
                                                className={`w-10 h-10 rounded-lg font-bold transition-all ${insurancePage === pageNum
                                                    ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                                                    : 'bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => loadInsurances(insurancePage + 1)}
                                    disabled={insurancePage >= Math.ceil(totalInsurances / ITEMS_PER_PAGE) || insuranceLoading}
                                    className="p-2 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>


                {/* Users Section */}
                {currentUser?.role === 'ADMIN' && (
                    <div id="users-section" className="mt-8 bg-dark-surface-lighter/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)]">
                        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-orange-400" />
                                    </div>
                                    Kullanıcı Yönetimi
                                </h2>
                                <span className="text-xs font-bold text-gray-400 bg-dark-bg px-3 py-1.5 rounded-full border border-white/5">
                                    {users.length} kullanıcı
                                </span>
                            </div>
                            <div className="flex-1 max-w-2xl flex justify-end items-center gap-4">
                                <div className="relative group flex items-center">
                                    <Info className="w-5 h-5 text-gray-400 cursor-help hover:text-white transition-colors" />
                                    <div className="absolute right-0 bottom-full mb-2 w-64 p-4 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-xs text-gray-300 backdrop-blur-xl">
                                        <div className="mb-3 pb-3 border-b border-white/10">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                <span className="text-white font-bold">Yönetici</span>
                                            </div>
                                            <p>Tam yetki (Kullanıcı oluşturma/silme, tüm verileri düzenleme)</p>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                <span className="text-white font-bold">Personel</span>
                                            </div>
                                            <p>Kısıtlı yetki (Görüntüleme, düzenleme, ancak silme ve kullanıcı oluşturma yok)</p>
                                        </div>
                                    </div>
                                </div>
                                {currentUser?.role === 'ADMIN' && (
                                    <Button
                                        onClick={() => setShowCreateUserModal(true)}
                                        className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 whitespace-nowrap"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Yeni Kullanıcı
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-dark-bg/50 text-gray-400 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Ad Soyad</th>
                                        <th className="p-4">E-posta</th>
                                        <th className="p-4">Telefon</th>
                                        <th className="p-4">Rol</th>
                                        <th className="p-4">Kayıt Tarihi</th>
                                        {currentUser?.role === 'ADMIN' && <th className="p-4 text-center">İşlem</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 relative">
                                    {usersLoading ? (
                                        <tr>
                                            <td colSpan={currentUser?.role === 'ADMIN' ? 6 : 5} className="p-12 text-center">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={currentUser?.role === 'ADMIN' ? 6 : 5} className="p-12 text-center">
                                                <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                                <p className="text-gray-400">Henüz kullanıcı bulunmuyor</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-medium text-white">{user.name}</td>
                                                <td className="p-4 text-gray-300">{user.email}</td>
                                                <td className="p-4 text-gray-300 font-mono text-sm">{user.phone || '-'}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                                                        user.role === 'STAFF' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-green-500/20 text-green-400'
                                                        }`}>
                                                        {user.role === 'ADMIN' ? 'Yönetici' : user.role === 'STAFF' ? 'Personel' : 'Kullanıcı'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-400 text-sm">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                                                </td>
                                                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF') && (
                                                    <td className="p-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-blue-400 hover:bg-blue-500/10 border-blue-500/30"
                                                                onClick={() => setSelectedUserToEdit(user)}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            {currentUser?.role === 'ADMIN' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-red-400 hover:bg-red-500/10 border-red-500/30"
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    disabled={user.id === currentUser.id} // Cannot delete self
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {
                showCreateUserModal && (
                    <CreateUserModal
                        onClose={() => setShowCreateUserModal(false)}
                        onSuccess={() => loadUsers()}
                    />
                )
            }

            {/* Edit User Modal */}
            {
                selectedUserToEdit && (
                    <EditUserModal
                        user={selectedUserToEdit}
                        onClose={() => setSelectedUserToEdit(null)}
                        onSuccess={() => loadUsers()}
                    />
                )
            }

            {/* Insurance Detail Modal */}
            {
                selectedInsurance && (
                    <InsuranceDetailModal
                        insurance={selectedInsurance}
                        onClose={() => setSelectedInsurance(null)}
                        onUpdate={() => loadInsurances(insurancePage)}
                        currentUser={currentUser}
                    />
                )
            }

            {/* Create Insurance Modal */}
            {
                isCreateInsuranceModalOpen && (
                    <CreateInsuranceModal
                        onClose={() => setIsCreateInsuranceModalOpen(false)}
                        onSuccess={() => loadInsurances(1)}
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
                            loadBookings(currentPage, searchTerm, statusFilter);
                            // Also refresh selected booking to show new dates immediately if staying open?
                            // But finding the updated booking in the list might be complex.
                            // For now just reloading the list is good. The modal might still show old data if 'booking' prop isn't updated.
                            // To fix that, we can close the modal or fetch the single booking.
                            // Let's close the modal for simplicity on successful update? 
                            // No, handleSaveDates sets isEditing(false). Modal stays open.
                            // We should re-fetch the specific booking or update the local 'booking' object if possible.
                            // Since 'bookings' array will be refreshed, if we find the booking in 'bookings' it might be updated?
                            // Not automatically.
                            // Let's just close the modal for now to avoid sync issues, OR fetch single booking.
                            // Actually, loadBookings updates 'bookings' state.
                            // If 'selectedBooking' is just a reference to an object in 'bookings' array, it won't update automatically because loadBookings creates NEW objects.
                            // We need to sync selectedBooking.
                            bookingService.getByCode(selectedBooking.bookingCode).then(res => {
                                if (res && res.booking) {
                                    setSelectedBooking(res.booking);
                                }
                            });
                        }}
                    />
                )
            }

            {/* Franchise Detail Modal */}
            {
                selectedFranchise && (
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
                                                <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{selectedFranchise.details.experience}</p>
                                            </div>
                                        )}
                                        {selectedFranchise.details?.message && (
                                            <div>
                                                <span className="text-gray-500 text-sm block mb-1">Mesaj:</span>
                                                <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{selectedFranchise.details.message}</p>
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
                )
            }
        </div >
    );
};
