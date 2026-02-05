import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { carService, bookingService } from '../services/api';
import type { Car, CreateBookingRequest } from '../services/types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2, CheckCircle, MapPin, Users, Fuel, Cog, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import { translateCategory, translateFuel } from '../utils/translate';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { tr } from 'date-fns/locale/tr';
registerLocale('tr', tr);

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

    useEffect(() => {
        if (!carId) return;

        const loadCar = async () => {
            try {
                const carData = await carService.getById(carId);
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

                const schedule = await carService.getAvailability(carId, fromStr, toStr);

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
        if (startDate) {
            // Adjust to local time string to avoid UTC shift if needed, or stick to ISO
            // Using a simple local format "YYYY-MM-DD" might be safer for backend if it expects date only
            // But types say ISO string. Let's use ISO for now.
            const offset = startDate.getTimezoneOffset();
            const localDate = new Date(startDate.getTime() - (offset * 60 * 1000));
            setFormData(prev => ({ ...prev, pickupDate: localDate.toISOString().split('T')[0] }));
        }
        if (endDate) {
            const offset = endDate.getTimezoneOffset();
            const localDate = new Date(endDate.getTime() - (offset * 60 * 1000));
            setFormData(prev => ({ ...prev, dropoffDate: localDate.toISOString().split('T')[0] }));
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

    const formatPhoneNumber = (value: string) => {
        // Remove all non-digit characters
        const phoneNumber = value.replace(/\D/g, '');
        const phoneNumberLength = phoneNumber.length;

        if (phoneNumberLength < 4) return phoneNumber;
        if (phoneNumberLength < 7) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        }
        if (phoneNumberLength < 9) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
        }
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6, 8)} ${phoneNumber.slice(8, 10)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let value = e.target.value;
        if (e.target.name === 'customerPhone') {
            // Handle backspace or direct valid input, but for simple masking we format the raw digits
            // However, to allow deleting, we usually need to be careful. 
            // Simple approach: unformat, slice if needed, reformat.
            // But for a simple "formatter on typing", re-formatting the cleaned numeric string works well enough for valid inputs.
            // Limit to 10 digits (plus format chars)
            const raw = value.replace(/\D/g, '').slice(0, 10);
            value = formatPhoneNumber(raw);
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
            if (!payload.notes) delete payload.notes;

            const res = await bookingService.create(payload as CreateBookingRequest);
            setSuccessCode(res.data.bookingCode);
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
            <p className="text-gray-400 font-medium">Araç bilgileri yükleniyor...</p>
        </div>
    );
    if (!car) return <div className="text-center p-20 text-white">Araç bulunamadı.</div>;

    if (successCode) {
        return (
            <div className="max-w-md mx-auto mt-10 bg-dark-surface p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-green-500/20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400" />
                <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Rezervasyon Başarılı!</h2>
                <p className="text-gray-400 mb-8 px-4">Ödemenizi tamamlamak için lütfen rezervasyonum sayfasına giderek ödeme yapın.</p>

                <div className="bg-dark-bg p-6 rounded-2xl border border-white/5 mb-8 relative group">
                    <div className="absolute inset-0 bg-primary-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Rezervasyon Kodunuz</p>
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <p className="text-3xl font-mono font-bold text-primary-400 tracking-wider text-glow">{successCode}</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(successCode);
                                // Optional toast or feedback could go here
                            }}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            title="Kodu Kopyala"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                        </button>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 bg-white/5 py-2 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Bu kodu saklayın, sorgulama için gereklidir.
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Link to={`/my-booking?code=${successCode}`}>
                        <Button className="w-full h-12 text-base shadow-[0_0_20px_rgba(99,102,241,0.4)]">Rezervasyonumu Görüntüle</Button>
                    </Link>
                    <Link to="/">
                        <Button variant="outline" className="w-full h-12 text-base border-white/10 text-gray-400 hover:text-white hover:border-white/30">Ana Sayfaya Dön</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Car Summary Sidebar */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-dark-surface rounded-3xl p-1 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-transparent opacity-50" />

                    {/* Image Container */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-dark-bg">
                        {car.images && car.images[0] ? (
                            <img
                                src={car.images[0]}
                                alt={car.model}
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700">Görsel Yok</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-surface via-transparent to-transparent opacity-60" />
                        <div className="absolute top-3 left-3">
                            <span className="bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white uppercase tracking-wider">
                                {translateCategory(car.category)}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white leading-tight mb-1">{car.brand}</h2>
                            <p className="text-lg text-gray-400 font-medium">{car.model}</p>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center gap-2 group/spec hovered:bg-white/10 transition-colors">
                                <Cog className="w-5 h-5 text-gray-400 group-hover/spec:text-primary-500 transition-colors" />
                                <span className="text-xs font-medium text-gray-300">{car.transmission === 'AUTO' ? 'Otomatik' : 'Manuel'}</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center gap-2 group/spec hovered:bg-white/10 transition-colors">
                                <Fuel className="w-5 h-5 text-gray-400 group-hover/spec:text-primary-500 transition-colors" />
                                <span className="text-xs font-medium text-gray-300 capitalize">{translateFuel(car.fuel)}</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center gap-2 group/spec hovered:bg-white/10 transition-colors">
                                <Users className="w-5 h-5 text-gray-400 group-hover/spec:text-primary-500 transition-colors" />
                                <span className="text-xs font-medium text-gray-300">{car.seats} Kişilik</span>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center text-center gap-2 group/spec hovered:bg-white/10 transition-colors">
                                <Gauge className="w-5 h-5 text-gray-400 group-hover/spec:text-primary-500 transition-colors" />
                                <span className="text-xs font-medium text-gray-300">2023 Model</span>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-3">
                            {totalDays > 0 && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kiralama Süresi</span>
                                    <span className="text-white font-bold">{totalDays} Gün</span>
                                </div>
                            )}

                            <div className={`rounded-2xl p-4 border flex items-center justify-between transition-colors ${totalPrice > 0 ? 'bg-primary-500/20 border-primary-500/30' : 'bg-white/5 border-white/5'}`}>
                                <span className={`text-xs font-bold uppercase tracking-widest ${totalPrice > 0 ? 'text-primary-200' : 'text-gray-400'}`}>
                                    {totalPrice > 0 ? 'Toplam Tutar' : 'Günlük Fiyat'}
                                </span>
                                <div className="text-right">
                                    <span className={`text-2xl font-bold tracking-tight ${totalPrice > 0 ? 'text-white text-glow' : 'text-gray-300'}`}>
                                        {totalPrice > 0 ? Number(totalPrice).toLocaleString() : Number(car.dailyPrice).toLocaleString()}
                                    </span>
                                    <span className={`text-sm font-semibold ml-1 ${totalPrice > 0 ? 'text-primary-400' : 'text-gray-500'}`}>₺</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-dark-surface/50 rounded-2xl p-5 border border-white/5 flex items-start gap-4">
                    <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white mb-1">Teslimat Noktası</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">Aracınızı <span className="text-white font-medium">Manisa Merkez</span> şubemizden teslim alabilirsiniz.</p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2">
                <div className="bg-dark-surface rounded-[2rem] border border-white/5 p-8 md:p-10 relative shadow-2xl">
                    <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-[128px]" />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-10">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Güvenli Rezervasyon</h1>
                            <p className="text-gray-400">Ödemenizi araç tesliminde güvenle yapabilirsiniz.</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-8 border border-red-500/20 flex items-center gap-3">
                                <div className="w-1.5 h-10 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Branch Selection Hidden for Single Branch Mode */}
                            {/* 
                                Since there is only one branch (Manisa), we hide the selection UI.
                                The backend still requires pickupBranchId and dropoffBranchId, 
                                which are auto-filled in handleSubmit using car.branchId.
                            */}

                            {/* Date Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-8 h-1 rounded-full bg-primary-500" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Kiralama Süresi</h3>
                                </div>
                                <div className="bg-dark-bg/50 p-1 rounded-2xl border border-white/5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 rounded-xl">
                                        <div className="bg-dark-bg p-6 space-y-2 group focus-within:bg-dark-surface transition-colors">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide group-focus-within:text-primary-500 transition-colors">Alış Tarihi</label>
                                            <div className="relative">
                                                <DatePicker
                                                    selected={startDate}
                                                    onChange={(date: Date | null) => setStartDate(date)}
                                                    selectsStart
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    dateFormat="dd/MM/yyyy"
                                                    locale="tr"
                                                    placeholderText="Seçiniz"
                                                    className="w-full bg-transparent border-none text-white font-medium focus:ring-0 p-0 text-lg placeholder-gray-600 cursor-pointer"
                                                    popperPlacement="bottom-start"
                                                    excludeDates={bookedDates}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-dark-bg p-6 space-y-2 group focus-within:bg-dark-surface transition-colors">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide group-focus-within:text-primary-500 transition-colors">Teslim Tarihi</label>
                                            <div className="relative">
                                                <DatePicker
                                                    selected={endDate}
                                                    onChange={(date: Date | null) => setEndDate(date)}
                                                    selectsEnd
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    minDate={startDate || new Date()}
                                                    dateFormat="dd/MM/yyyy"
                                                    locale="tr"
                                                    placeholderText="Seçiniz"
                                                    className="w-full bg-transparent border-none text-white font-medium focus:ring-0 p-0 text-lg placeholder-gray-600 cursor-pointer"
                                                    popperPlacement="bottom-start"
                                                    excludeDates={bookedDates}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Driver Info Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-8 h-1 rounded-full bg-primary-500" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Sürücü Bilgileri</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Ad" name="customerName" value={formData.customerName} onChange={handleChange} required className="bg-dark-bg border-transparent focus:border-primary-500/50" />
                                    <Input label="Soyad" name="customerSurname" value={formData.customerSurname} onChange={handleChange} required className="bg-dark-bg border-transparent focus:border-primary-500/50" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Telefon" type="tel" name="customerPhone" placeholder="+90 5XX..." value={formData.customerPhone} onChange={handleChange} required className="bg-dark-bg border-transparent focus:border-primary-500/50" />
                                    <Input label="E-posta" type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange} required className="bg-dark-bg border-transparent focus:border-primary-500/50" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Ehliyet No" name="customerDriverLicense" value={formData.customerDriverLicense} onChange={handleChange} required className="bg-dark-bg border-transparent focus:border-primary-500/50" />
                                    <Input label="TC Kimlik (Opsiyonel)" name="customerTC" value={formData.customerTC} onChange={handleChange} className="bg-dark-bg border-transparent focus:border-primary-500/50" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide ml-1">Notlar (Opsiyonel)</label>
                                    <textarea
                                        name="notes"
                                        className="w-full px-5 py-4 bg-dark-bg border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 transition-all text-white placeholder-gray-600 min-h-[120px] resize-none"
                                        placeholder="Eklemek istediğiniz notlar..."
                                        value={formData.notes}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex gap-5 items-start">
                                <div className="mt-0.5 w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 shrink-0 border border-primary-500/30 font-bold text-xs">i</div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    <span className="text-white font-medium">Bilgilendirme:</span> Rezervasyonu tamamlayarak kiralama koşullarını kabul etmiş olursunuz.
                                    Aracınızı teslim alırken ehliyetinizi ve kimliğinizi yanınızda bulundurmayı unutmayınız.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full h-16 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(79,70,229,0.6)] transform hover:-translate-y-1 transition-all duration-300"
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="animate-spin inline mr-2" /> : null}
                                {submitting ? 'İşleniyor...' : 'REZERVASYONU ONAYLA'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
