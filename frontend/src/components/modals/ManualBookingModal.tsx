import React, { useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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

export default ManualBookingModal;
