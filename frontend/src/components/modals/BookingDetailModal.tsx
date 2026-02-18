import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Calendar, Users, Car as CarIcon, AlertCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { translateCategory } from '../../utils/translate';
import type { Booking } from '../../services/types';

interface BookingDetailModalProps {
    booking: Booking;
    onClose: () => void;
    onUpdate?: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose, onUpdate }) => {
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
            const res = await adminService.getBookings({
                carId: booking.carId,
                limit: 100
            });

            if (res.data) {
                const intervals = res.data
                    .filter((b: any) =>
                        b.id !== booking.id &&
                        (b.status === 'ACTIVE' || b.status === 'RESERVED') &&
                        !(
                            b.status === 'RESERVED' &&
                            b.paymentStatus === 'UNPAID' &&
                            b.expiresAt &&
                            new Date() > new Date(b.expiresAt)
                        )
                    )
                    .map((b: any) => ({
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

export default BookingDetailModal;
