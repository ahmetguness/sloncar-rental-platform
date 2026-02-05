import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';
import type { Booking as BookingType } from '../services/types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Search, AlertCircle, Loader2, Users, CheckCircle, Car as CarIcon } from 'lucide-react';
import { getBrandLogo } from '../utils/brandLogos';

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

    const getDaysLeft = () => {
        if (!booking) return null;
        const now = new Date();
        const pickup = new Date(booking.pickupDate);
        const diffTime = pickup.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : null;
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
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl">
                                    Rezervasyon <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple">Sorgulama</span>
                                </h1>
                                <p className="text-gray-400 text-lg font-light max-w-sm mx-auto">
                                    PNR kodunuzu girerek seyahat detaylarınıza ulaşın.
                                </p>
                            </div>
                        )}

                        <div className="bg-dark-surface-lighter/60 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl animate-fade-in-up delay-100 group focus-within:ring-2 focus-within:ring-primary-500/50 transition-all">
                            <form onSubmit={handleLookup} className="relative flex items-center">
                                <Search className="absolute left-6 text-gray-400 w-6 h-6 group-focus-within:text-primary-500 transition-colors" />
                                <Input
                                    placeholder="Rezervasyon Kodu"
                                    value={searchCode}
                                    onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                                    className="w-full h-16 pl-16 pr-36 md:pr-48 bg-transparent border-none text-white text-lg md:text-xl font-mono tracking-widest uppercase focus:ring-0 placeholder:text-gray-600 rounded-2xl"
                                />
                                <Button
                                    type="submit"
                                    disabled={loading || !searchCode}
                                    className="absolute right-2 h-12 px-4 md:px-8 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 transition-all hover:scale-105 text-sm md:text-base"
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
                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-white/10 pb-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    {getBrandLogo(booking.car?.brand || '') ? (
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg">
                                            <img src={getBrandLogo(booking.car?.brand || '')} alt={booking.car?.brand} className="w-full h-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center p-2 border border-white/5">
                                            <CarIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                    )}
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
                                        {booking.car?.brand} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple">{booking.car?.model}</span>
                                    </h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${booking.status === 'ACTIVE' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-primary-500/10 border-primary-500/20 text-primary-400'}`}>
                                        {booking.status === 'ACTIVE' ? 'AKTİF SÜRÜŞ' : 'REZERVASYON'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-400 text-sm font-mono">
                                    <span className="bg-white/5 px-2 py-1 rounded">PNR: <span className="text-white font-bold tracking-widest">{booking.bookingCode}</span></span>
                                    <span className="hidden md:inline">•</span>
                                    <span>{new Date(booking.createdAt).toLocaleDateString('tr-TR')} tarihinde oluşturuldu</span>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-3xl font-black text-white tracking-tight">{Number(booking.totalPrice).toLocaleString()} <span className="text-primary-500">₺</span></div>
                                <div className="flex items-center justify-end gap-2 text-xs font-bold mt-1">
                                    {booking.paymentStatus === 'PAID' ?
                                        <span className="text-green-400 flex items-center gap-1"><CheckCircle size={12} /> ÖDENDİ</span> :
                                        <span className="text-yellow-400 flex items-center gap-1"><AlertCircle size={12} /> ÖDEME BEKLENİYOR</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Main Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* LEFT: Car Visuals & Specs */}
                            <div className="lg:col-span-8 space-y-8">
                                {/* Driver Info Row */}
                                <div className="bg-dark-surface-lighter/30 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">SÜRÜCÜ BİLGİLERİ</div>
                                            <div className="text-xl font-bold text-white tracking-wide">
                                                {booking.customerName.substring(0, 2)}**** {booking.customerSurname.substring(0, 2)}****
                                            </div>
                                            <div className="flex flex-col gap-1 mt-2">
                                                {booking.customerTC && (
                                                    <div className="text-sm text-gray-400 font-mono flex items-center gap-2">
                                                        <span className="text-gray-600">TC:</span>
                                                        {booking.customerTC.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2')}
                                                    </div>
                                                )}
                                                <div className="text-sm text-gray-400 font-mono flex items-center gap-2">
                                                    <span className="text-gray-600">TEL:</span>
                                                    ******{booking.customerPhone.slice(-2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {booking.paymentStatus !== 'PAID' && booking.status !== 'CANCELLED' && (
                                        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                                            <div className="flex items-center gap-2 text-yellow-400 text-[10px] font-black uppercase tracking-widest bg-yellow-400/10 px-3 py-1.5 rounded border border-yellow-400/20 animate-pulse">
                                                <AlertCircle size={12} />
                                                Ödeme Bekleniyor
                                            </div>
                                            <Button
                                                onClick={handlePay}
                                                disabled={paying}
                                                className="w-full md:w-auto px-10 h-16 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 hover:from-primary-500 hover:to-primary-400 text-white font-black text-lg rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] transition-all transform hover:scale-[1.02] border border-white/20 relative overflow-hidden group"
                                            >
                                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                                {paying ? <Loader2 className="animate-spin mr-2" /> : <span className="flex items-center gap-3">HEMEN ÖDE <CheckCircle size={20} className="text-white" /></span>}
                                            </Button>
                                            <p className="text-[11px] text-gray-400 text-center md:text-right max-w-[300px] leading-relaxed">
                                                <span className="text-red-400 font-bold">DİKKAT:</span> Rezervasyonunuzun kesinleşmesi ve araç teslimi için ödemenin <strong className="text-white">şimdi yapılması gerekmektedir</strong>.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Hero Image Container */}
                                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-dark-surface">
                                    {booking.car?.images?.[0] && (
                                        <>
                                            <img
                                                src={booking.car.images[0]}
                                                alt={booking.car.model}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-transparent to-transparent" />

                                            {/* Overlay Specs */}
                                            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
                                                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white text-sm font-bold flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                                    {booking.car?.year} Model
                                                </div>
                                                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white text-sm font-bold capitalize">
                                                    {booking.car?.fuel}
                                                </div>
                                                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white text-sm font-bold capitalize">
                                                    {booking.car?.transmission === 'AUTO' ? 'Otomatik' : 'Manuel'}
                                                </div>
                                                <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white text-sm font-bold capitalize">
                                                    {booking.car?.color}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: Timeline & Actions */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Timeline Card */}
                                <div className="bg-dark-surface-lighter/30 border border-white/10 rounded-3xl p-8 h-full">
                                    <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-primary-500 rounded-full" />
                                        Sürüş Planı
                                    </h3>

                                    <div className="relative pl-4 space-y-12">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary-500 via-white/10 to-primary-500/50" />

                                        {/* Pickup */}
                                        <div className="relative pl-20">
                                            <div className="absolute left-0 top-1 w-12 h-12 bg-dark-bg border-2 border-primary-500 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] z-10">
                                                <span className="text-[10px] font-bold text-primary-500">ALIŞ</span>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white tracking-tight">
                                                    {new Date(booking.pickupDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                                </div>
                                                <div className="text-gray-400 font-mono text-lg mb-1">
                                                    {new Date(booking.pickupDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/5 py-1 px-2 rounded inline-block">
                                                    Başlangıç
                                                </div>
                                            </div>
                                        </div>

                                        {/* Duration Center */}
                                        <div className="relative pl-20">
                                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-300 font-bold backdrop-blur-md">
                                                <CarIcon size={16} />
                                                {getDaysLeft() || 1} GÜN KİRALAMA
                                            </div>
                                        </div>

                                        {/* Dropoff */}
                                        <div className="relative pl-20">
                                            <div className="absolute left-1 top-2 w-10 h-10 bg-dark-bg border-2 border-gray-600 rounded-xl flex items-center justify-center z-10">
                                                <div className="w-3 h-3 bg-white rounded-full" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white tracking-tight">
                                                    {new Date(booking.dropoffDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                                </div>
                                                <div className="text-gray-400 font-mono text-lg mb-1">
                                                    {new Date(booking.dropoffDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-white/5 py-1 px-2 rounded inline-block">
                                                    Bitiş
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-white/5">
                                        <button
                                            onClick={copyToClipboard}
                                            className="w-full py-4 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/5 transition-all text-sm font-medium flex items-center justify-center gap-2 group"
                                        >
                                            {copied ? <CheckCircle size={16} className="text-green-500" /> : <span className="group-hover:text-primary-400">PNR KOPYALA</span>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
