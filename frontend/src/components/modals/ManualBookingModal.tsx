import React, { useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/formatters';
import { Loader2, Banknote, CreditCard } from 'lucide-react';
import DatePicker from 'react-datepicker';

interface ManualBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ManualBookingModal: React.FC<ManualBookingModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { addToast } = useToast();
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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomer({ ...customer, phone: formatPhoneNumber(cleanPhoneNumber(e.target.value)) });
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
        } catch {
            toast('Araçlar yüklenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (!dates.pickup || !dates.dropoff) return;

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
            setStep(1);
            setDates({ pickup: null, dropoff: null });
            setSelectedCar(null);
            setCustomer({ name: '', surname: '', phone: '', email: '', tc: '', license: '', notes: '' });
        } catch (err: any) {
            const errorData = err.response?.data?.error;
            let errorMessage = errorData?.message || 'Rezervasyon oluşturulamadı';

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
        <Modal isOpen={isOpen} onClose={onClose} title="Yeni Manuel Rezervasyon" size="xl">
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
                    <div className="max-w-2xl mx-auto py-8">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-8 shadow-xl">
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-white">Lütfen Tarih Aralığını Belirleyin</h3>
                                <p className="text-gray-400">Rezervasyon için alış ve teslim tarihlerini seçiniz.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-400">Alış Tarihi</label>
                                    <DatePicker
                                        selected={dates.pickup}
                                        onChange={(date: Date | null) => setDates({ ...dates, pickup: date })}
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 transition-colors"
                                        placeholderText="Alış Tarihi"
                                        dateFormat="dd/MM/yyyy"
                                        locale="tr"
                                        minDate={new Date()}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-400">Teslim Tarihi</label>
                                    <DatePicker
                                        selected={dates.dropoff}
                                        onChange={(date: Date | null) => setDates({ ...dates, dropoff: date })}
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 transition-colors"
                                        placeholderText="Teslim Tarihi"
                                        dateFormat="dd/MM/yyyy"
                                        locale="tr"
                                        minDate={dates.pickup ? new Date(dates.pickup.getTime() + 24 * 60 * 60 * 1000) : new Date()}
                                    />
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-14 text-lg font-bold shadow-lg shadow-primary-500/20"
                                onClick={handleSearchCars}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Müsait Araçları Ara'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Araç Seçimi</h3>
                            <span className="text-sm text-gray-400">{availableCars.length} araç bulundu</span>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableCars.map(car => (
                                    <div
                                        key={car.id}
                                        onClick={() => setSelectedCar(car)}
                                        className={`p-4 rounded-xl border-2 cursor-pointer flex gap-4 transition-all duration-300 ${selectedCar?.id === car.id
                                            ? 'bg-primary-500/10 border-primary-500 shadow-lg shadow-primary-500/10 transform scale-[1.02]'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
                                    >
                                        <div className="relative w-32 h-20 bg-black/40 rounded-lg overflow-hidden shrink-0">
                                            <img
                                                src={car.images?.[0] || '/placeholder-car.png'}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                            {selectedCar?.id === car.id && (
                                                <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                                                    <div className="bg-primary-500 text-white rounded-full p-1 ring-2 ring-white">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="text-white font-bold text-lg leading-tight">{car.brand} {car.model}</div>
                                                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{car.plateNumber}</div>
                                            </div>
                                            <div className="flex items-baseline gap-1 mt-2">
                                                <span className="text-primary-400 font-bold text-xl">{car.dailyPrice} ₺</span>
                                                <span className="text-xs text-gray-500">/ gün</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {availableCars.length === 0 && (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <div className="text-gray-400">Müsait araç bulunamadı.</div>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setStep(1)}>Tarihleri Değiştir</Button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-white/10">
                            <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1">Geri Dön</Button>
                            <Button size="lg" onClick={() => setStep(3)} disabled={!selectedCar} className="flex-1">Müşteri Bilgilerine Geç</Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Müşteri Bilgileri</h3>
                            <div className="flex items-center gap-2 bg-primary-500/10 px-3 py-1 rounded-full text-xs font-medium text-primary-400 border border-primary-500/20">
                                <span>{selectedCar?.brand} {selectedCar?.model}</span>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Ad</label>
                                    <input placeholder="Müşterinin Adı" className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Soyad</label>
                                    <input placeholder="Müşterinin Soyadı" className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors" value={customer.surname} onChange={e => setCustomer({ ...customer, surname: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Telefon</label>
                                    <input
                                        placeholder="(5XX) XXX XX XX"
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors"
                                        value={customer.phone}
                                        onChange={handlePhoneChange}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">E-posta</label>
                                    <input placeholder="email@örnek.com" className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">TC Kimlik No (Opsiyonel)</label>
                                    <input placeholder="11 haneli TC no" className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors" value={customer.tc} onChange={e => setCustomer({ ...customer, tc: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Ehliyet No</label>
                                    <input placeholder="Ehliyet numarasını giriniz" className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors" value={customer.license} onChange={e => setCustomer({ ...customer, license: e.target.value })} />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Notlar</label>
                                    <textarea rows={3} placeholder="Rezervasyonla ilgili ek notlar..." className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-primary-500 outline-none transition-colors resize-none" value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button variant="outline" size="lg" onClick={() => setStep(2)} className="flex-1">Geri Dön</Button>
                            <Button size="lg" onClick={() => setStep(4)} disabled={!customer.name || !customer.phone} className="flex-1">Ödeme Adımına Geç</Button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white">Ödeme ve Onay</h3>
                            <p className="text-gray-400 mt-1">Lütfen ödeme yöntemini seçin ve detayları kontrol edin.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider ml-1">Ödeme Yöntemi</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPaymentMethod('CASH')}
                                        className={`p-8 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${paymentMethod === 'CASH'
                                            ? 'bg-primary-500/10 border-primary-500 text-primary-400 shadow-lg shadow-primary-500/10'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                                    >
                                        <div className={`p-4 rounded-full ${paymentMethod === 'CASH' ? 'bg-primary-500 text-white' : 'bg-white/5'}`}>
                                            <Banknote className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-lg">Nakit</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('POS')}
                                        className={`p-8 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${paymentMethod === 'POS'
                                            ? 'bg-primary-500/10 border-primary-500 text-primary-400 shadow-lg shadow-primary-500/10'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}
                                    >
                                        <div className={`p-4 rounded-full ${paymentMethod === 'POS' ? 'bg-primary-500 text-white' : 'bg-white/5'}`}>
                                            <CreditCard className="w-8 h-8" />
                                        </div>
                                        <span className="font-bold text-lg">POS / Kart</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-400 uppercase tracking-wider ml-1">Özet ve Toplam</label>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl -z-10" />

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Araç</span>
                                            <span className="text-white font-medium">{selectedCar?.brand} {selectedCar?.model}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Süre</span>
                                            <span className="text-white font-medium">
                                                {dates.pickup && dates.dropoff ? Math.ceil((dates.dropoff.getTime() - dates.pickup.getTime()) / (1000 * 60 * 60 * 24)) : 0} Gün
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Müşteri</span>
                                            <span className="text-white font-medium">{customer.name} {customer.surname}</span>
                                        </div>

                                        <div className="h-px bg-white/10 my-4" />

                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <span className="text-xs text-gray-500 uppercase tracking-widest">Ödenecek Tutar</span>
                                                <div className="text-3xl font-black text-white">
                                                    {dates.pickup && dates.dropoff && selectedCar
                                                        ? (selectedCar.dailyPrice * Math.ceil((dates.dropoff.getTime() - dates.pickup.getTime()) / (1000 * 60 * 60 * 24))).toLocaleString()
                                                        : 0} <span className="text-lg text-primary-400">₺</span>
                                                </div>
                                            </div>
                                            <div className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 font-bold uppercase">
                                                Onaya Hazır
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="outline" size="lg" onClick={() => setStep(3)} className="flex-1 h-14">Geri Dön</Button>
                            <Button
                                size="lg"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-[2] h-14 bg-green-500 hover:bg-green-600 text-white border-none text-lg font-bold shadow-lg shadow-green-500/20"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : 'Rezervasyonu Kesinleştir'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ManualBookingModal;
