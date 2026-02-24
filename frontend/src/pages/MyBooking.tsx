import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';
import type { Booking as BookingType } from '../services/types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Search, AlertCircle, Loader2, Users, CheckCircle, Car as CarIcon } from 'lucide-react';
import { BrandLogo } from '../components/ui/BrandLogo';
import { ImageCarousel } from '../components/ui/ImageCarousel';

export const MyBooking = () => {
    const [searchCode, setSearchCode] = useState('');
    const [booking, setBooking] = useState<BookingType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            setSearchCode(code);
            fetchBooking(code);
        }
    }, []);

    const fetchBooking = async (code: string) => {
        setLoading(true);
        setError(null);
        setBooking(null);
        try {
            const data = await bookingService.getByCode(code);
            setBooking(data.booking);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Rezervasyon bulunamadı');
        } finally {
            setLoading(false);
        }
    };

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchCode) return;
        fetchBooking(searchCode);
    };

    const handlePay = async () => {
        if (!booking) return;
        setPaying(true);
        try {
            await bookingService.pay(booking.bookingCode, { cardNumber: '1234567890123456' });
            const data = await bookingService.getByCode(booking.bookingCode);
            setBooking(data.booking);
            alert('Ödeme başarıyla alındı!');
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Ödeme hatası');
        } finally {
            setPaying(false);
        }
    };

    const copyToClipboard = () => {
        if (!booking) return;
        navigator.clipboard.writeText(booking.bookingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!booking || booking.status !== 'RESERVED' || booking.paymentStatus === 'PAID') {
            setTimeLeft(0);
            return;
        }

        const checkTimer = () => {
            if (!booking.expiresAt) return;
            const expireTime = new Date(booking.expiresAt).getTime();
            const now = new Date().getTime();
            const diff = expireTime - now;

            if (diff <= 0) {
                setTimeLeft(0);
                // Optionally reload to get updated status if just expired
                if (booking.status === 'RESERVED') {
                    // Trigger a reload or just let the UI show expired
                    // We can't automatically reload here easily without causing loops, 
                    // so we just rely on the diff <= 0 state to block the UI.
                }
            } else {
                setTimeLeft(diff);
            }
        };

        checkTimer();
        const interval = setInterval(checkTimer, 1000);
        return () => clearInterval(interval);
    }, [booking]);

    const formatTimeLeft = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getRentalDays = () => {
        if (!booking) return null;
        const pickup = new Date(booking.pickupDate);
        const dropoff = new Date(booking.dropoffDate);
        const diffTime = dropoff.getTime() - pickup.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 1;
    };



    return (
        <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-dark-bg font-sans selection:bg-primary-500/30">
            {/* Dynamic Background Mesh Gradients */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-900/20 rounded-full blur-[128px] animate-pulse pointer-events-none duration-[4000ms]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[128px] animate-pulse pointer-events-none delay-1000 duration-[5000ms]" />

            <div className="container mx-auto px-4 relative z-10">
                {/* Search Section (Hero) */}
                <div className={`transition-all duration-700 ease-out ${booking ? 'scale-95 opacity-100 mb-12' : 'min-h-[60vh] flex flex-col justify-center'}`}>
                    <div className="max-w-xl mx-auto text-center space-y-8">
                        {!booking && (
                            <div className="space-y-4 animate-fade-in-up">
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl">
                                    Rezervasyon <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple">Sorgulama</span>
                                </h1>
                                <p className="text-gray-400 text-base md:text-lg font-light max-w-sm mx-auto">
                                    PNR kodunuzu girerek seyahat detaylarınıza ulaşın.
                                </p>
                            </div>
                        )}

                        <div className="bg-dark-surface-lighter/60 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl animate-fade-in-up delay-100 group focus-within:ring-2 focus-within:ring-primary-500/50 transition-all">
                            <form onSubmit={handleLookup} className="relative flex items-center">
                                <Search className="absolute left-4 md:left-6 text-gray-400 w-5 h-5 md:w-6 md:h-6 group-focus-within:text-primary-500 transition-colors" />
                                <Input
                                    placeholder="Rezervasyon Kodu"
                                    value={searchCode}
                                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                                    className="w-full h-16 pl-12 md:pl-16 pr-32 md:pr-48 bg-transparent border-none text-white text-base md:text-xl font-mono tracking-normal md:tracking-widest uppercase focus:ring-0 placeholder:text-gray-600 rounded-2xl"
                                />
                                <Button
                                    type="submit"
                                    disabled={loading || !searchCode}
                                    className="absolute right-2 h-12 px-3 md:px-8 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 transition-all hover:scale-105 text-sm md:text-base"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'SORGULA'}
                                </Button>
                            </form>
                        </div>
                        {error && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-slide-up">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Result Section: Full Screen Dashboard */}
                {booking && (
                    <div className="w-full max-w-7xl mx-auto animate-slide-up pb-20">
                        {/* Dashboard Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-white/10 pb-6">
                            <div className="w-full md:w-auto">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg border-2 border-white/10 shrink-0">
                                        <BrandLogo name={booking.car?.brand || ''} url={booking.car?.brandLogo} className="w-full h-full" />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                        <h1 className="text-2xl md:text-5xl font-black text-white tracking-tight uppercase">
                                            {booking.car?.brand} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple">{booking.car?.model}</span>
                                        </h1>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${booking.status === 'ACTIVE' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-primary-500/10 border-primary-500/20 text-primary-400'}`}>
                                            {booking.status === 'ACTIVE' ? 'AKTİF SÜRÜŞ' : 'REZERVASYON'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-gray-400 text-xs sm:text-sm font-mono">
                                    <span className="bg-white/5 px-2 py-1 rounded w-fit">PNR: <span className="text-white font-bold tracking-widest">{booking.bookingCode}</span></span>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="text-xs">{new Date(booking.createdAt).toLocaleDateString('tr-TR')} tarihinde oluşturuldu</span>
                                </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-2xl md:text-3xl font-black text-white tracking-tight">{Number(booking.totalPrice).toLocaleString()} <span className="text-primary-500">₺</span></div>
                                <div className="flex items-center gap-2 text-xs font-bold mt-0 sm:mt-1">
                                    {booking.paymentStatus === 'PAID' ?
                                        <span className="text-green-400 flex items-center gap-1"><CheckCircle size={12} /> ÖDENDİ</span> :
                                        <span className="text-yellow-400 flex items-center gap-1"><AlertCircle size={12} /> ÖDEME BEKLENİYOR</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Active Booking Banner */}
                        {booking.status === 'ACTIVE' && (
                            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl flex items-start md:items-center gap-3 md:gap-5 shadow-[0_0_30px_rgba(34,197,94,0.1)] animate-in slide-in-from-top-4 duration-500">
                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 shadow-lg border border-green-500/30">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-green-400 font-bold text-base md:text-xl tracking-tight">Aracı Teslim Aldınız</h3>
                                    <p className="text-gray-400 text-xs md:text-sm mt-1">Keyifli sürüşler dileriz. Sorularınız için 7/24 destek hattımızı arayabilirsiniz.</p>
                                </div>
                            </div>
                        )}

                        {booking.status === 'COMPLETED' && (
                            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start md:items-center gap-3 md:gap-5 shadow-[0_0_30px_rgba(59,130,246,0.1)] animate-in slide-in-from-top-4 duration-500">
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 shadow-lg border border-blue-500/30">
                                    <CheckCircle className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-blue-400 font-bold text-base md:text-xl tracking-tight">Kiralama Tamamlandı</h3>
                                    <p className="text-gray-400 text-xs md:text-sm mt-1">Aracı başarıyla teslim ettiniz. Bizi tercih ettiğiniz için teşekkür ederiz.</p>
                                </div>
                            </div>
                        )}

                        {/* Ready for Pickup Banner */}
                        {booking.status === 'RESERVED' && booking.paymentStatus === 'PAID' && new Date() >= new Date(booking.pickupDate) && (
                            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start md:items-center gap-3 md:gap-5 shadow-[0_0_30px_rgba(59,130,246,0.1)] animate-in slide-in-from-top-4 duration-500">
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 shadow-lg border border-blue-500/30">
                                    <CarIcon className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-blue-400 font-bold text-base md:text-xl tracking-tight">Aracınız Hazır</h3>
                                    <p className="text-gray-400 text-xs md:text-sm mt-1">Teslim alma zamanınız geldi. Aracınızı teslim almak için bayimize gelebilirsiniz.</p>
                                </div>
                            </div>
                        )}

                        {/* Cancelled Booking Banner */}
                        {booking.status === 'CANCELLED' && (
                            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl flex items-start md:items-center gap-3 md:gap-5 shadow-[0_0_30px_rgba(239,68,68,0.1)] animate-in slide-in-from-top-4 duration-500">
                                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 shadow-lg border border-red-500/30">
                                    <AlertCircle className="w-6 h-6 text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-red-400 font-bold text-base md:text-xl tracking-tight">Rezervasyon İptal Edildi</h3>
                                    <p className="text-gray-400 text-xs md:text-sm mt-1">Bu rezervasyon iptal edilmiştir. Detaylı bilgi için bizimle iletişime geçebilirsiniz.</p>
                                </div>
                            </div>
                        )}

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* LEFT: Car Visuals & Driver Info */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Hero Image Container */}
                                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-dark-surface p-2">
                                    {booking.car?.images && booking.car.images.length > 0 && (
                                        <div className="relative w-full h-full rounded-2xl overflow-hidden">
                                            <ImageCarousel images={booking.car.images} alt={booking.car.model} />
                                        </div>
                                    )}
                                </div>

                                {/* Driver Info Row */}
                                <div className="bg-dark-surface-lighter/30 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-xl">
                                    <div className="flex items-center gap-5 w-full xl:w-auto overflow-hidden">
                                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 border border-white/10">
                                            <Users size={28} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" /> SÜRÜCÜ BİLGİLERİ
                                            </div>
                                            <div className="text-xl md:text-2xl font-black text-white tracking-wide truncate">
                                                {booking.customerName} {booking.customerSurname}
                                            </div>
                                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                                {booking.customerTC && (
                                                    <div className="text-sm text-gray-400 font-mono flex items-center gap-2">
                                                        <span className="text-gray-500 font-bold">TC:</span>
                                                        {booking.customerTC.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2')}
                                                    </div>
                                                )}
                                                <div className="text-sm text-gray-400 font-mono flex items-center gap-2">
                                                    <span className="text-gray-500 font-bold">TEL:</span>
                                                    {booking.customerPhone}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.paymentStatus !== 'PAID' && booking.status !== 'CANCELLED' && (
                                        <div className="w-full xl:w-auto shrink-0 flex flex-col items-center xl:items-end gap-3 p-5 bg-[#1e1b4b]/40 rounded-2xl border border-primary-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)]">
                                            {timeLeft > 0 ? (
                                                <div className="flex flex-col items-center xl:items-end">
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 opacity-80">ÖDEME İÇİN KALAN SÜRE</div>
                                                    <div className="font-mono text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 tabular-nums animate-pulse tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                                        {formatTimeLeft(timeLeft)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center xl:items-end">
                                                    <div className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest mb-1">ÖDEME SÜRESİ</div>
                                                    <div className="font-black text-2xl md:text-3xl text-red-500 tracking-tight drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">SÜRE DOLDU</div>
                                                </div>
                                            )}

                                            <Button
                                                onClick={handlePay}
                                                disabled={paying || timeLeft <= 0}
                                                className={`w-full xl:w-auto min-w-[200px] h-14 bg-gradient-to-r ${timeLeft > 0 ? 'from-primary-600 via-primary-500 to-primary-600 hover:from-primary-500 hover:to-primary-400' : 'from-gray-700 to-gray-800 cursor-not-allowed opacity-50'} text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all transform border border-white/10`}
                                            >
                                                {paying ? <Loader2 className="animate-spin w-6 h-6" /> : <span className="flex items-center justify-center gap-2">HEMEN ÖDE <CheckCircle size={18} className="text-white fill-white/20" /></span>}
                                            </Button>

                                            <div className="flex items-start gap-3 w-full max-w-sm">
                                                <AlertCircle className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-primary-200/70 leading-relaxed text-left">
                                                    Onay için <strong className="text-primary-100 font-bold">10 dakika</strong> içinde ödeme işlemini tamamlamanız gerekmektedir.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: Specs & Timeline */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Timeline Card */}
                                <div className="bg-dark-surface-lighter/30 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col sticky top-24 shadow-2xl">
                                    {/* Specs Stacked Inside Timeline Card Top */}
                                    <div className="grid grid-cols-2 gap-3 mb-8 pb-8 border-b border-white/5">
                                        <div className="bg-white/5 border border-white/10 px-3 py-3 rounded-2xl text-white text-sm font-bold flex flex-col items-center justify-center gap-1.5 shadow-sm group hover:bg-white/10 transition-colors">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">MODEL YILI</span>
                                            <span className="flex items-center gap-2 text-base">
                                                <span className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                                                {booking.car?.year}
                                            </span>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 px-3 py-3 rounded-2xl text-white text-sm font-bold capitalize flex flex-col items-center justify-center gap-1.5 shadow-sm group hover:bg-white/10 transition-colors text-center text-base">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">YAKIT</span>
                                            {booking.car?.fuel}
                                        </div>
                                        <div className="bg-white/5 border border-white/10 px-3 py-3 rounded-2xl text-white text-sm font-bold capitalize flex flex-col items-center justify-center gap-1.5 shadow-sm group hover:bg-white/10 transition-colors text-center text-base">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">VİTES</span>
                                            {booking.car?.transmission === 'AUTO' ? 'Oto.' : 'Manuel'}
                                        </div>
                                        <div className="bg-white/5 border border-white/10 px-3 py-3 rounded-2xl text-white text-sm font-bold capitalize flex flex-col items-center justify-center gap-1.5 shadow-sm group hover:bg-white/10 transition-colors text-center text-base">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">RENK</span>
                                            {booking.car?.color}
                                        </div>
                                    </div>

                                    {booking.car?.plateNumber && (
                                        <div className="mb-6 px-5 py-4 bg-dark-bg/50 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-primary-500/30 transition-colors">
                                            <div className="text-xs font-black text-gray-500 uppercase tracking-widest">ARAÇ PLAKASI</div>
                                            <div className="bg-white text-dark-bg px-3 md:px-4 py-1.5 rounded-lg text-base md:text-lg font-black tracking-widest uppercase shadow-[0_0_15px_rgba(255,255,255,0.2)] border-2 border-gray-300">
                                                TR <span className="ml-1">{booking.car.plateNumber}</span>
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                        SÜRÜŞ PLANI
                                    </h3>

                                    <div className="relative pl-4 space-y-10 flex-grow">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-500 via-white/10 to-primary-500/50" />

                                        {/* Pickup */}
                                        <div className="relative pl-16 md:pl-20">
                                            <div className="absolute left-0 top-1 w-12 h-12 bg-dark-bg border-2 border-primary-500 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] z-10">
                                                <span className="text-[10px] font-black text-primary-500">ALIŞ</span>
                                            </div>
                                            <div>
                                                <div className="text-xl md:text-2xl font-black text-white tracking-tight">
                                                    {new Date(booking.pickupDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                                </div>
                                                <div className="text-gray-400 font-mono text-base md:text-lg mb-1.5 font-bold">
                                                    {new Date(booking.pickupDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white/5 py-1 px-2.5 rounded-md inline-block border border-white/5">
                                                    BAŞLANGIÇ
                                                </div>
                                            </div>
                                        </div>

                                        {/* Duration Center */}
                                        <div className="relative pl-16 md:pl-20">
                                            <div className="inline-flex items-center gap-2 md:gap-3 px-4 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-300 font-bold backdrop-blur-md text-xs md:text-sm shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:bg-primary-500/20 transition-colors">
                                                <CarIcon size={18} />
                                                <span className="tracking-widest">{getRentalDays()} GÜN KİRALAMA</span>
                                            </div>
                                        </div>

                                        {/* Dropoff */}
                                        <div className="relative pl-16 md:pl-20">
                                            <div className="absolute left-1 top-2 w-10 h-10 bg-dark-bg border-2 border-gray-600 rounded-xl flex items-center justify-center z-10">
                                                <div className="w-3 h-3 bg-white/50 rounded-full" />
                                            </div>
                                            <div>
                                                <div className="text-xl md:text-2xl font-black text-white tracking-tight">
                                                    {new Date(booking.dropoffDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                                </div>
                                                <div className="text-gray-400 font-mono text-base md:text-lg mb-1.5 font-bold">
                                                    {new Date(booking.dropoffDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 py-1 px-2.5 rounded-md inline-block border border-white/5">
                                                    BİTİŞ
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-white/5">
                                        <button
                                            onClick={copyToClipboard}
                                            className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 text-gray-400 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-sm font-bold flex items-center justify-center gap-2 group shadow-sm bg-dark-bg/30"
                                        >
                                            {copied ? <CheckCircle size={18} className="text-green-500" /> : <span className="group-hover:text-primary-400 font-black uppercase tracking-widest">PNR KOPYALA</span>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
