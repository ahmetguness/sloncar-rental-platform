"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { carService, bookingService } from '../services/api';
import type { Car, CreateBookingRequest } from '../services/types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2, CheckCircle, MapPin, Users, Fuel, Cog, Gauge, Copy, Check, Shield, Info } from 'lucide-react';
import { ImageCarousel } from '../components/ui/ImageCarousel';
import Link from 'next/link';
import { translateFuel } from '../utils/translate';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { tr } from 'date-fns/locale/tr';
import { formatPhoneNumber, cleanPhoneNumber, normalizeEmail } from '../utils/formatters';
import { useAppSelector } from '../store/hooks';
registerLocale('tr', tr);

import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const AnimatedNumber = ({ value }: { value: number }) => {
    return (
        <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={value}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {value.toLocaleString()}
        </motion.span>
    );
};

export const Booking = () => {
    const { carId } = useParams();
    const [car, setCar] = useState<Car | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCode, setSuccessCode] = useState<string | null>(null);

    // Price State
    const [totalDays, setTotalDays] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [bookedDates, setBookedDates] = useState<Date[]>([]);
    const [copied, setCopied] = useState(false);
    const { data: settings, loading: settingsLoading } = useAppSelector(state => state.settings);
    const { user } = useAppSelector(state => state.auth);
    const isPaymentEnabled = !settingsLoading && settings['paymentEnabled'] !== 'false';

    // Form State
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const [formData, setFormData] = useState<Partial<CreateBookingRequest>>({
        pickupDate: '',
        dropoffDate: '',
        customerName: '',
        customerSurname: '',
        customerPhone: '',
        customerEmail: '',
        customerDriverLicense: '',
        customerTC: '',
        notes: '',
        pickupBranchId: '', // Ideally fetched from car.branchId or separate branch list
        dropoffBranchId: '',
    });

    // Pre-fill form with logged-in user data
    useEffect(() => {
        if (user) {
            const nameParts = (user.name || '').trim().split(' ');
            const firstName = nameParts[0] || '';
            const surname = nameParts.slice(1).join(' ') || '';
            setFormData(prev => ({
                ...prev,
                customerName: prev.customerName || firstName,
                customerSurname: prev.customerSurname || surname,
                customerEmail: prev.customerEmail || user.email || '',
                customerPhone: prev.customerPhone || (user.phone ? formatPhoneNumber(user.phone) : ''),
                customerTC: prev.customerTC || (user as any).tcNo || '',
            }));
        }
    }, [user]);

    useEffect(() => {
        if (!carId) {
            setLoading(false);
            return;
        }

        const loadCar = async () => {
            try {
                const carData = await carService.getById(carId as string);
                setCar(carData);
                setFormData(prev => ({
                    ...prev,
                    carId: carData.id,
                    pickupBranchId: carData.branchId,
                    dropoffBranchId: carData.branchId,
                }));
            } catch (err) {
                setError('Araç bilgileri yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };

        const loadAvailability = async () => {
            try {
                const today = new Date();
                const sixMonthsLater = new Date();
                sixMonthsLater.setMonth(today.getMonth() + 6);

                const fromStr = today.toISOString().split('T')[0];
                const toStr = sixMonthsLater.toISOString().split('T')[0];

                const schedule = await carService.getAvailability(carId as string, fromStr, toStr);

                if (schedule && schedule.calendar) {
                    const booked = schedule.calendar
                        .filter((day: any) => day.status === 'booked')
                        .map((day: any) => {
                            const [y, m, d] = day.date.split('-').map(Number);
                            return new Date(y, m - 1, d);
                        });
                    setBookedDates(booked);
                }
            } catch (err) {
                console.error('Failed to load availability', err);
            }
        };

        loadCar();
        loadAvailability();
    }, [carId]);

    // Calculate total price when dates change
    // Update formData when dates change
    useEffect(() => {
        const formatDateForAPI = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (startDate) {
            setFormData(prev => ({ ...prev, pickupDate: formatDateForAPI(startDate) }));
        }
        if (endDate) {
            setFormData(prev => ({ ...prev, dropoffDate: formatDateForAPI(endDate) }));
        }
    }, [startDate, endDate]);

    // Calculate total price when dates change
    useEffect(() => {
        if (startDate && endDate && car) {
            // Check if dates are valid
            if (endDate >= startDate) {
                const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                // Calculate days (min 1 day)
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

                setTotalDays(days);
                setTotalPrice(days * Number(car.dailyPrice));
            } else {
                setTotalDays(0);
                setTotalPrice(0);
            }
        }
    }, [startDate, endDate, car]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let value = e.target.value;
        if (e.target.name === 'customerPhone') {
            value = formatPhoneNumber(cleanPhoneNumber(value));
        } else if (e.target.name === 'customerEmail') {
            value = normalizeEmail(value);
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Basic client-side validation
        if (!formData.pickupDate || !formData.dropoffDate) {
            setError('Lütfen tarihleri seçiniz.');
            setSubmitting(false);
            return;
        }

        if (!car?.branchId) {
            setError('Araç şube bilgisi eksik, rezervasyon yapılamıyor.');
            setSubmitting(false);
            return;
        }

        try {
            // Clean payload
            const payload = {
                ...formData,
                carId: car.id,
                // Ensure branch IDs are present. For now, default to car's branch if not selected.
                pickupBranchId: formData.pickupBranchId || car.branchId,
                dropoffBranchId: formData.dropoffBranchId || car.branchId,
                // Ensure dates are string for JSON (backend coerces them)
                pickupDate: formData.pickupDate,
                dropoffDate: formData.dropoffDate,
            };

            if (!payload.customerTC) delete payload.customerTC;
            if (!payload.customerDriverLicense) delete payload.customerDriverLicense;
            if (!payload.notes) delete payload.notes;

            const res = await bookingService.create(payload as CreateBookingRequest);
            setSuccessCode(res.data.bookingCode);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#E30613', '#111111', '#ffffff']
            });
        } catch (err: any) {
            console.error('Booking Error:', err);

            // Handle different error structures
            let errorMessage = 'Rezervasyon oluşturulurken bir hata oluştu';

            if (err.response?.data) {
                const data = err.response.data;

                // Case: { error: { message: "..." } }
                if (data.error && typeof data.error === 'object' && data.error.message) {
                    errorMessage = data.error.message;
                }
                // Case: { message: "..." }
                else if (typeof data.message === 'string') {
                    errorMessage = data.message;
                }
                // Case: { error: "..." }
                else if (typeof data.error === 'string') {
                    errorMessage = data.error;
                }
                // Case: { code: "...", message: "..." } directly in data
                else if (data.code && data.message) {
                    errorMessage = data.message;
                }
                // Fallback: try to stringify if it's an object but not a known structure?
                // Better to show generic error than raw JSON
            }

            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center pt-20">
            <Loader2 className="animate-spin text-primary-600 w-12 h-12 mb-4" />
            <p className="text-[#777777] font-medium">Araç bilgileri yükleniyor...</p>
        </div>
    );
    if (!car) return <div className="text-center p-20 text-[#111111]">Araç bulunamadı.</div>;

    if (car.status !== 'ACTIVE') {
        return (
            <div className="max-w-md mx-auto mt-10 bg-[#F5F5F5] p-6 md:p-8 rounded-3xl shadow-2xl border border-yellow-500/20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-amber-400" />
                <div className="bg-yellow-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#111111] mb-2">Araç Şu Anda Müsait Değil</h2>
                <p className="text-[#777777] mb-8 px-4">
                    <span className="text-[#111111] font-medium">{car.brand} {car.model}</span> şu anda
                    {car.status === 'MAINTENANCE' ? ' bakımda' : ' pasif durumda'} olduğu için kiralamaya uygun değildir.
                </p>
                <Link href="/">
                    <Button variant="outline" className="w-full h-12 text-base border-[#E5E5E5] text-[#777777] hover:text-[#111111] hover:border-[#CCCCCC]">Diğer Araçlara Göz At</Button>
                </Link>
            </div>
        );
    }

    if (successCode) {
        return (
            <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center bg-mesh relative overflow-hidden">
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="max-w-xl w-full glass-card rounded-[2rem] p-8 md:p-12 text-center relative z-10"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]"
                        >
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl md:text-4xl text-luxury text-[#111111] mb-5 leading-tight"
                        >
                            Rezervasyon <br /> <span className="text-primary-500">Tamamlandı!</span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-[#777777] mb-10 text-base font-medium leading-relaxed max-w-sm mx-auto"
                        >
                            Rezervasyonunuz oluşturuldu, ödemeniz beklenmektedir. Aracınızı güvence altına almak için en kısa sürede bizimle iletişime geçin.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.45 }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
                        >
                            <a href="tel:02362573232" className="flex items-center gap-2 px-5 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-700 font-bold text-sm hover:bg-green-500/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                0236 257 32 32
                            </a>
                            <a href="tel:05462392626" className="flex items-center gap-2 px-5 py-3 bg-primary-500/10 border border-primary-500/20 rounded-xl text-primary-600 font-bold text-sm hover:bg-primary-500/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                0546 239 26 26
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="glass-dark p-8 rounded-[2rem] mb-10 relative group overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-all duration-700" />
                            <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] mb-5 font-black">Referans Kodunuz</p>
                            <div className="flex items-center justify-center gap-5">
                                <p className="text-3xl md:text-4xl font-mono font-black text-white tracking-[0.15em] leading-none">{successCode}</p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(successCode);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className={`p-4 rounded-xl transition-all duration-500 ${copied ? 'bg-green-500 text-white translate-y-[-2px]' : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-4"
                        >
                            <Link href={`/rezervasyonum?code=${successCode}`}>
                                <Button className="w-full h-16 text-base text-luxury shadow-xl shadow-primary-500/15 rounded-xl group relative overflow-hidden">
                                    <span className="relative z-10 font-black">REZERVASYONU GÖRÜNTÜLE</span>
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                </Button>
                            </Link>
                            <Link href="/">
                                <Button variant="outline" className="w-full h-16 text-base text-luxury border-2 border-gray-100 hover:border-gray-900 text-[#777777] hover:text-white hover:bg-[#111111] bg-transparent rounded-xl transition-all duration-500">
                                    ANA SAYFAYA DÖN
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mesh relative font-sans selection:bg-primary-500/30 overflow-x-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 sm:pt-28 md:pt-36 pb-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">

                    {/* Left: Car Details Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit"
                    >
                        <div className="glass-card rounded-[2rem] p-4 relative overflow-hidden group shadow-xl">
                            <div className="p-1 rounded-[1.5rem] overflow-hidden">
                                <ImageCarousel images={car.images} alt={car.model} category={car.category} />
                            </div>

                            <div className="px-5 py-8">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mb-8"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-[2px] bg-primary-500 rounded-full" />
                                        <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">{car.category} SERİSİ</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-1">
                                        {car.brandLogo && (
                                            <img
                                                src={car.brandLogo}
                                                alt={`${car.brand} logo`}
                                                className="w-9 h-9 object-contain flex-shrink-0"
                                            />
                                        )}
                                        <h2 className="text-3xl font-black text-[#111111] tracking-tighter uppercase leading-none break-words">{car.brand}</h2>
                                    </div>
                                    <p className="text-lg text-[#777777] font-medium tracking-tight">{car.model}</p>
                                </motion.div>

                                <div className="grid grid-cols-2 gap-4 mb-10">
                                    {[
                                        { icon: <Cog className="w-5 h-5" />, label: car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel' },
                                        { icon: <Fuel className="w-5 h-5" />, label: translateFuel(car.fuel) },
                                        { icon: <Users className="w-5 h-5" />, label: `${car.seats} Kişilik` },
                                        { icon: <Gauge className="w-5 h-5" />, label: '2023 Model' }
                                    ].map((spec, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + (i * 0.1) }}
                                            className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 flex flex-col items-center justify-center text-center gap-2 group/spec hover:bg-[#111111] hover:text-white transition-all duration-500 hover:shadow-lg"
                                        >
                                            <div className="text-primary-500 group-hover/spec:scale-110 transition-transform duration-500">{spec.icon}</div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">{spec.label}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em]">Haftalık Paket</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-[#111111]">{Number(car.dailyPrice).toLocaleString()}</span>
                                            <span className="text-xs font-bold text-[#777777]">₺ / Gün</span>
                                        </div>
                                    </div>

                                    {totalDays > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between px-2 pb-4 border-b border-gray-100"
                                        >
                                            <span className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em]">Kiralama Süresi</span>
                                            <span className="text-lg font-black text-primary-500">{totalDays} GÜN</span>
                                        </motion.div>
                                    )}

                                    {totalPrice > 0 && (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="glass-dark rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden"
                                        >
                                            <motion.div
                                                animate={{
                                                    rotate: [0, 90, 180, 270, 360],
                                                    scale: [1, 1.2, 1]
                                                }}
                                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[40px] -mr-16 -mt-16"
                                            />
                                            <div className="relative z-10">
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">TOPLAM TUTAR</span>
                                                <div className="flex items-baseline gap-1 mt-1">
                                                    <span className="text-4xl font-black text-white tracking-tighter">
                                                        <AnimatedNumber value={totalPrice} />
                                                    </span>
                                                    <span className="text-xl font-black text-primary-500">₺</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="glass-card rounded-[2rem] p-6 border border-white/40 shadow-lg flex items-start gap-4 group hover:border-primary-500/30 transition-all duration-700"
                        >
                            <div className="p-4 bg-[#111111] rounded-2xl text-white transform group-hover:rotate-12 group-hover:bg-primary-500 transition-all duration-700 shadow-xl">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-[#111111] uppercase tracking-[0.2em] mb-1.5">TESLİMAT NOKTASI</h4>
                                <p className="text-xs text-[#777777] leading-relaxed font-bold">Aracınızı <span className="text-[#111111] font-black underline decoration-primary-500 decoration-2 underline-offset-4">Manisa Merkez</span> şubemizden güvenle teslim alabilirsiniz.</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right: Booking Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-8 overflow-visible"
                    >
                        <div className="glass-card rounded-[2.5rem] p-5 sm:p-8 md:p-14 relative group shadow-xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary-500/10 transition-colors duration-[2000ms]" />

                            <div className="relative z-10">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-12"
                                >
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111] text-white text-[9px] font-black uppercase tracking-[0.3em] mb-6 shadow-xl">
                                        <Shield className="w-4 h-4 text-primary-500" /> GÜVENLİ İŞLEM MERKEZİ
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl text-luxury text-[#111111] mb-4 leading-tight">REZERVE <br /> <span className="text-gray-200">EDİN</span></h1>
                                    <p className="text-[#777777] text-lg font-medium tracking-tight">Yaman Filo kalitesiyle premium kiralama deneyimi.</p>
                                </motion.div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl mb-10 flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-lg border border-red-50 shrink-0">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <p className="text-red-900 font-extrabold text-lg tracking-tight uppercase">{error}</p>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-10">
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <span className="w-12 h-[2px] bg-primary-500 rounded-full" />
                                            <h3 className="text-[10px] font-black text-[#111111] uppercase tracking-[0.3em]">Kiralama Tarihleri</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 rounded-[2rem] overflow-hidden border-2 border-gray-100 shadow-inner">
                                            <div className="bg-white p-8 space-y-3 focus-within:bg-gray-50 transition-all duration-500 group/input">
                                                <label className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em] group-focus-within/input:text-primary-500 transition-colors">ALIŞ TARİHİ</label>
                                                <DatePicker
                                                    selected={startDate}
                                                    onChange={(date: Date | null) => setStartDate(date)}
                                                    selectsStart
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    minDate={new Date()}
                                                    dateFormat="dd/MM/yyyy"
                                                    locale="tr"
                                                    placeholderText="Tarih Seçin"
                                                    className="w-full bg-transparent border-none text-[#111111] font-black text-xl md:text-2xl focus:ring-0 p-0 placeholder-gray-400 cursor-pointer"
                                                    popperPlacement="bottom-start"
                                                    excludeDates={bookedDates}
                                                    required
                                                />
                                            </div>
                                            <div className="bg-white p-8 space-y-3 focus-within:bg-gray-50 transition-all duration-500 group/input">
                                                <label className="text-[10px] font-black text-[#777777] uppercase tracking-[0.2em] group-focus-within/input:text-primary-500 transition-colors">TESLİM TARİHİ</label>
                                                <DatePicker
                                                    selected={endDate}
                                                    onChange={(date: Date | null) => setEndDate(date)}
                                                    selectsEnd
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    minDate={startDate || new Date()}
                                                    dateFormat="dd/MM/yyyy"
                                                    locale="tr"
                                                    placeholderText="Tarih Seçin"
                                                    className="w-full bg-transparent border-none text-[#111111] font-black text-xl md:text-2xl focus:ring-0 p-0 placeholder-gray-400 cursor-pointer"
                                                    popperPlacement="bottom-start"
                                                    excludeDates={bookedDates}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <span className="w-12 h-[2px] bg-primary-500 rounded-full" />
                                            <h3 className="text-[10px] font-black text-[#111111] uppercase tracking-[0.3em]">Müşteri Bilgileri</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                            <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
                                                <Input id="customerName" label="ADINIZ" name="customerName" placeholder="Adınız" value={formData.customerName} onChange={handleChange} required className="bg-gray-50/30 border-gray-100 h-16 rounded-2xl focus:bg-white text-lg font-bold transition-all border-2" />
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
                                                <Input id="customerSurname" label="SOYADINIZ" name="customerSurname" placeholder="Soyadınız" value={formData.customerSurname} onChange={handleChange} required className="bg-gray-50/30 border-gray-100 h-16 rounded-2xl focus:bg-white text-lg font-bold transition-all border-2" />
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
                                                <Input id="customerPhone" label="TELEFON" type="tel" name="customerPhone" placeholder="5XX XXX XX XX" value={formData.customerPhone} onChange={handleChange} required className="bg-gray-50/30 border-gray-100 h-16 rounded-2xl focus:bg-white text-lg font-bold transition-all border-2" />
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
                                                <Input id="customerEmail" label="E-POSTA" type="email" name="customerEmail" placeholder="ornek@alanadi.com" value={formData.customerEmail} onChange={handleChange} required className="bg-gray-50/30 border-gray-100 h-16 rounded-2xl focus:bg-white text-lg font-bold transition-all border-2" />
                                            </motion.div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="block text-[10px] font-black text-[#777777] uppercase tracking-[0.2em] ml-2">EK NOTLAR (OPSİYONEL)</label>
                                            <textarea
                                                name="notes"
                                                className="w-full px-6 py-5 bg-gray-50/30 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500/20 focus:bg-white transition-all text-[#111111] text-lg font-bold placeholder-gray-400 min-h-[150px] resize-none"
                                                placeholder="Varsa iletmek istediğiniz özel bir notunuz..."
                                                value={formData.notes ?? ''}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="glass-dark p-5 sm:p-8 md:p-10 rounded-[2rem] border border-white/10 flex gap-4 sm:gap-6 items-start relative overflow-hidden shadow-xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[60px]" />
                                        <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary-500/30 transform -rotate-12">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <p className="text-white/60 text-sm leading-relaxed font-medium">
                                            <span className="text-white font-black uppercase tracking-[0.3em] block mb-2 text-[10px]">Kurumsal Bilgilendirme</span>
                                            Rezervasyonu tamamlayarak kiralama koşullarını kabul etmiş olursunuz.
                                            Aracınızı teslim alırken <span className="text-white font-black underline decoration-primary-500">ehliyetinizi ve kimliğinizi</span> yanınızda bulundurmayı unutmayınız.
                                        </p>
                                    </div>

                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full h-18 text-lg text-luxury rounded-2xl bg-primary-500 hover:bg-primary-600 shadow-xl shadow-primary-500/20 transform transition-all duration-700 flex items-center justify-center gap-4 relative overflow-hidden group"
                                            disabled={submitting}
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-shimmer pointer-events-none" />
                                            {submitting ? <Loader2 className="animate-spin w-8 h-8" /> : <div className="p-3 bg-white/20 rounded-xl"><CheckCircle className="w-6 h-6" /></div>}
                                            <span className="relative z-10 font-black tracking-[0.1em]">{submitting ? 'İŞLENİYOR...' : 'REZERVASYONU ONAYLA'}</span>
                                        </Button>
                                    </motion.div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
