import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/api';
import type { Booking as BookingType } from '../services/types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Search, AlertCircle, Loader2, Users, QrCode, CheckCircle, Car as CarIcon } from 'lucide-react';
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
                <div className={`transition-all duration-700 ease-out ${booking ? 'scale-90 opacity-80 hover:opacity-100 hover:scale-95 mb-8' : 'min-h-[60vh] flex flex-col justify-center'}`}>
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

                {/* Result Section: Boarding Pass Style */}
                {booking && (
                    <div className="max-w-5xl mx-auto animate-slide-up pb-10">

                        {/* The Pass Container with Hover Shine Effect */}
                        <div className="group/card relative rounded-3xl transition-transform duration-500 hover:scale-[1.01]">
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-200%] group-hover/card:translate-x-[200%] transition-transform duration-1000 ease-in-out z-30 pointer-events-none rounded-3xl" />

                            <div className="flex flex-col md:flex-row bg-dark-surface border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">

                                {/* Decorative Top Line */}
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-neon-purple to-primary-500 z-20" />

                                {/* LEFT SIDE: Car Visual & Primary Info */}
                                <div className="md:w-[60%] p-8 md:p-10 bg-gradient-to-br from-dark-surface-lighter to-[#0a0a0f] relative overflow-hidden">

                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-6">
                                            <button
                                                onClick={copyToClipboard}
                                                className="bg-white/5 backdrop-blur-md pl-4 pr-3 py-2 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all flex items-center gap-3 active:scale-95 shadow-sm"
                                            >
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block leading-tight">PNR KODU</span>
                                                    <div className="text-xl font-mono font-bold text-white tracking-widest leading-none">{booking.bookingCode}</div>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center text-gray-400 group-hover:text-primary-400 transition-colors">
                                                    {copied ? <CheckCircle size={16} className="text-green-500" /> : null}
                                                </div>
                                            </button>

                                            {getBrandLogo(booking.car?.brand || '') && (
                                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/5 shadow-inner">
                                                    <img src={getBrandLogo(booking.car?.brand || '')} alt={booking.car?.brand} className="h-8 w-auto object-contain opacity-90 brightness-200 contrast-0 grayscale transition-all duration-300 hover:filter-none hover:opacity-100" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Main Content Area: Split Text and Image */}
                                        <div className="flex flex-row items-center justify-between mb-8 flex-1">
                                            {/* Text Info */}
                                            <div className="flex-1 space-y-4 z-10">
                                                <div className='drop-shadow-lg'>
                                                    <h2 className="text-4xl xs:text-5xl font-black text-white leading-none tracking-tight">
                                                        {booking.car?.brand}
                                                    </h2>
                                                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple text-3xl font-bold tracking-wide">{booking.car?.model}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2 text-gray-300 text-[10px] xs:text-xs font-bold uppercase tracking-wider max-w-[200px]">
                                                    <span className="bg-white/5 border border-white/5 px-2 py-1 rounded-md backdrop-blur-sm">{booking.car?.year}</span>
                                                    <span className="bg-white/5 border border-white/5 px-2 py-1 rounded-md backdrop-blur-sm">{booking.car?.color}</span>
                                                    <span className="bg-white/5 border border-white/5 px-2 py-1 rounded-md backdrop-blur-sm capitalize">{booking.car?.fuel}</span>
                                                    <span className="bg-white/5 border border-white/5 px-2 py-1 rounded-md backdrop-blur-sm capitalize">{booking.car?.transmission === 'AUTO' ? 'Oto' : 'Man'}</span>
                                                </div>
                                            </div>

                                            {/* Car Image - Dedicated Right Area */}
                                            {booking.car?.images?.[0] && (
                                                <div className="w-[50%] h-[180px] relative flex flex-col justify-center items-end -mr-6">
                                                    {/* Smooth Fade Mask Container */}
                                                    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 30%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%)' }}>
                                                        <img
                                                            src={booking.car.images[0]}
                                                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover/card:scale-110"
                                                            alt={booking.car?.model}
                                                        />
                                                        {/* Color Overlay for blending */}
                                                        <div className="absolute inset-0 bg-primary-900/10 mix-blend-overlay" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Route / Dates Footer */}
                                        <div className="flex items-center justify-between bg-black/30 backdrop-blur-xl p-4 rounded-2xl border border-white/5 shadow-lg relative z-20">
                                            <div>
                                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">ALIŞ TARİHİ</span>
                                                <div className="text-white text-lg font-bold">{new Date(booking.pickupDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
                                                <div className="text-gray-500 text-xs font-mono">{new Date(booking.pickupDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>

                                            <div className="flex-1 px-4 xs:px-6 flex flex-col items-center gap-1 group/track">
                                                <div className="w-full h-[2px] bg-white/10 relative rounded-full overflow-hidden">
                                                    <div className="absolute left-0 top-0 h-full bg-primary-500 w-1/2 group-hover/track:w-full transition-all duration-1000" />
                                                </div>
                                                <div className="bg-dark-bg p-1.5 rounded-full border border-white/10 text-gray-500 group-hover/track:text-white group-hover/track:border-primary-500/50 transition-colors -mt-4 z-10 shadow-sm">
                                                    <CarIcon size={14} />
                                                </div>
                                                <span className="text-[10px] text-gray-600 font-mono -mt-1">{getDaysLeft() || 0} GÜN</span>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">TESLİM TARİHİ</span>
                                                <div className="text-white text-lg font-bold">{new Date(booking.dropoffDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</div>
                                                <div className="text-gray-500 text-xs font-mono">{new Date(booking.dropoffDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PERFORATOR LINE with Realistic Notches */}
                                <div className="hidden md:flex flex-col justify-between w-6 relative z-20 bg-dark-bg -ml-3 -mr-3">
                                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-white/20 h-full w-[2px]"></div>
                                    {/* Top Notch - Using masking logic via simple colored divs for now as exact css mask needs more setups */}
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-dark-bg rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)] z-20" />
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-dark-bg rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] z-20" />
                                </div>

                                {/* RIGHT SIDE: Stub Details */}
                                <div className="md:w-[40%] bg-white/[0.03] p-8 flex flex-col justify-between relative backdrop-blur-sm">
                                    <div className="space-y-8">
                                        {/* Status Badge */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] -rotate-90 origin-left translate-y-8 translate-x-[-12px] whitespace-nowrap">SLONCAR PASS</span>
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ml-auto ${booking.status === 'ACTIVE' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                booking.status === 'RESERVED' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                    'bg-red-500/10 border-red-500/20 text-red-500'
                                                } shadow-lg`}>
                                                {booking.status === 'ACTIVE' ? 'SÜRÜŞTE' : booking.status === 'RESERVED' ? 'ONAYLANDI' : 'İPTAL'}
                                            </span>
                                        </div>

                                        {/* Customer / Driver */}
                                        <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gradient-to-br from-white/10 to-transparent p-3 rounded-xl border border-white/10">
                                                    <Users size={20} className="text-white" />
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-0.5">SÜRÜCÜ</span>
                                                    <div className="text-white font-bold text-lg">{booking.customerName} {booking.customerSurname}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price & Payment */}
                                        <div>
                                            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-2">TOPLAM TUTAR</span>
                                            <div className="text-5xl font-black text-white tracking-tighter">{Number(booking.totalPrice).toLocaleString()} <span className="text-primary-500 text-3xl">₺</span></div>
                                            <div className="mt-3 text-xs font-bold flex items-center gap-2 bg-white/5 py-2 px-3 rounded-lg w-fit border border-white/5">
                                                {booking.paymentStatus === 'PAID' ?
                                                    <span className="text-green-400 flex items-center gap-2"><CheckCircle size={14} className="fill-green-500/20" /> ÖDEME ALINDI</span> :
                                                    <span className="text-yellow-400 flex items-center gap-2"><AlertCircle size={14} className="fill-yellow-500/20" /> ÖDEME BEKLENİYOR</span>
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR Placeholder & Action */}
                                    <div className="mt-auto pt-8 border-t border-dashed border-white/10 flex items-center justify-between gap-4">
                                        <div className="bg-white p-2.5 rounded-xl shadow-lg shrink-0">
                                            <QrCode className="w-14 h-14 text-black" />
                                        </div>

                                        {booking.paymentStatus !== 'PAID' && booking.status !== 'CANCELLED' ? (
                                            <Button
                                                onClick={handlePay}
                                                disabled={paying}
                                                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold h-full min-h-[64px] rounded-xl shadow-lg shadow-primary-500/20 transition-all hover:translate-y-[-2px]"
                                            >
                                                {paying ? '...' : 'ÖDEME YAP'}
                                            </Button>
                                        ) : (
                                            // <Button variant="outline" className="flex-1 border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 h-full min-h-[64px] rounded-xl group/btn">
                                            //     <ArrowDown size={20} className="group-hover/btn:scale-110 transition-transform" />
                                            // </Button>
                                            <div />
                                        )}
                                    </div>
                                </div>
                            </div >
                        </div >
                    </div >
                )}
            </div >
        </div >
    );
};
