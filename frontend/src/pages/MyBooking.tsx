import { useState, useEffect } from 'react';
import { bookingService } from '../services/api';
import type { Booking as BookingType } from '../services/types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Search, CreditCard, AlertCircle, Loader2, Users } from 'lucide-react';

export const MyBooking = () => {
    const [searchCode, setSearchCode] = useState('');
    const [booking, setBooking] = useState<BookingType | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Action loading states
    const [paying, setPaying] = useState(false);

    // Auto-search if code is present in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            setSearchCode(code);
            // Trigger lookup
            const fetchBooking = async () => {
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
            fetchBooking();
        }
    }, []);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchCode) return;

        setLoading(true);
        setError(null);
        setBooking(null);

        try {
            const data = await bookingService.getByCode(searchCode);
            setBooking(data.booking);


        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Rezervasyon bulunamadı');
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async () => {
        if (!booking) return;
        setPaying(true);
        try {
            await bookingService.pay(booking.bookingCode, { cardNumber: '1234567890123456' }); // Dummy
            // Refresh
            const data = await bookingService.getByCode(booking.bookingCode);
            setBooking(data.booking);
            alert('Ödeme başarıyla alındı!');
        } catch (err: any) {
            alert(err.response?.data?.error?.message || 'Ödeme hatası');
        } finally {
            setPaying(false);
        }
    };



    return (
        <div className="max-w-7xl mx-auto pb-20 pt-24 px-6">
            <div className={`grid gap-8 items-start ${booking ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'}`}>
                {/* Left Side - Search Section */}
                <div className={`bg-dark-surface p-8 rounded-3xl shadow-lg border border-white/5 text-center relative overflow-hidden ${booking ? 'lg:sticky lg:top-28' : ''}`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[80px] pointer-events-none" />

                    <h1 className="text-3xl font-bold mb-3 text-white">Rezervasyon Sorgula</h1>
                    <p className="text-gray-400 mb-8 max-w-lg mx-auto">Rezervasyon kodunuzu girerek güncel durumunu kontrol edebilir, ödeme yapabilir veya kiralama süresini uzatabilirsiniz.</p>

                    <form onSubmit={handleLookup} className="flex gap-4 max-w-md mx-auto relative z-10">
                        <Input
                            placeholder="Örn: RNT-ABC123"
                            value={searchCode}
                            onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                            className="text-center font-mono uppercase text-lg h-14 bg-dark-bg border-white/10"
                        />
                        <Button type="submit" disabled={loading || !searchCode} className="h-14 w-16 !p-0">
                            {loading ? <Loader2 className="animate-spin" /> : <Search />}
                        </Button>
                    </form>
                    {error && <p className="text-red-400 mt-4 bg-red-500/10 py-2 px-4 rounded-lg inline-block border border-red-500/20">{error}</p>}
                </div>

                {/* Right Side - Result Section */}
                {booking && (
                    <div className="bg-dark-surface rounded-3xl shadow-2xl border border-white/5 overflow-hidden animate-fade-in-up">
                        {/* Header with Booking Code */}
                        <div className="bg-gradient-to-r from-primary-500/10 to-primary-500/5 p-6 border-b border-white/5">
                            <div className="flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <span className="text-xs text-primary-400 block uppercase tracking-widest mb-1 font-bold">Rezervasyon Kodu</span>
                                    <span className="text-2xl font-mono font-bold text-white tracking-wider">{booking.bookingCode}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${booking.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                                        booking.status === 'RESERVED' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-gray-700 text-gray-400'
                                        }`}>
                                        {booking.status === 'RESERVED' ? 'REZERVE' : booking.status === 'ACTIVE' ? 'AKTİF' : booking.status}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${booking.paymentStatus === 'PAID' ? 'bg-green-500/20 text-green-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {booking.paymentStatus === 'PAID' ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="p-6 space-y-6">
                            {/* Car Info Card */}
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-400 text-sm font-medium">Araç</span>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-white">{booking.car?.brand} <span className="text-primary-400">{booking.car?.model}</span></div>
                                        <div className="text-sm text-gray-400 mt-0.5">
                                            {booking.car?.year} • {booking.car?.color}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-dark-bg rounded-xl p-4 text-center">
                                        <span className="text-gray-500 text-xs block mb-1">Alış Tarihi</span>
                                        <span className="font-bold text-white">{new Date(booking.pickupDate).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                    <div className="bg-dark-bg rounded-xl p-4 text-center">
                                        <span className="text-gray-500 text-xs block mb-1">Teslim Tarihi</span>
                                        <span className="font-bold text-white">{new Date(booking.dropoffDate).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Price & Customer Info Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Total Price */}
                                <div className="bg-gradient-to-br from-primary-500/10 to-primary-500/5 rounded-2xl p-5 border border-primary-500/20">
                                    <span className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Toplam Tutar</span>
                                    <span className="text-3xl font-black text-primary-400">{booking.totalPrice} ₺</span>
                                </div>

                                {/* Customer Info */}
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Users size={16} className="text-primary-500" />
                                        <span className="text-white font-bold text-sm">Müşteri</span>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Ad Soyad</span>
                                            <span className="text-white font-medium">{booking.customerName} {booking.customerSurname}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Telefon</span>
                                            <span className="text-gray-300 font-mono text-xs">*** *** ** {booking.customerPhone.slice(-2)}</span>
                                        </div>
                                        {booking.customerEmail && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">E-posta</span>
                                                <span className="text-gray-300 text-xs">{booking.customerEmail.split('@')[0].substring(0, 3)}***@{booking.customerEmail.split('@')[1]}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Action */}
                            {booking.paymentStatus !== 'PAID' && booking.status !== 'CANCELLED' && (
                                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-5 rounded-2xl border border-yellow-500/20">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                            <AlertCircle size={20} className="text-yellow-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-yellow-400 mb-1">Ödeme Bekleniyor</h4>
                                            <p className="text-sm text-yellow-200/60 mb-3">Rezervasyonunuzu kesinleştirmek için ödeme yapın.</p>
                                            <Button onClick={handlePay} disabled={paying} className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold border-none">
                                                {paying ? 'İşleniyor...' : <><CreditCard className="w-4 h-4 mr-2 inline" /> Hemen Öde</>}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {booking.status === 'CANCELLED' && (
                                <div className="bg-red-500/10 p-4 rounded-xl text-red-400 text-center border border-red-500/20 font-bold">
                                    Bu rezervasyon iptal edilmiştir.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
