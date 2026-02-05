import { useState } from 'react';
import { franchiseService } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Building2, User, Mail, Phone, MapPin, Wallet, Briefcase, MessageSquare, CheckCircle, Send, ChevronRight, ChevronLeft } from 'lucide-react';

const CITIES = [
    'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
    'Mersin', 'Kayseri', 'Eskişehir', 'Trabzon', 'Samsun', 'Denizli', 'Malatya', 'Diyarbakır'
];

const INVESTMENT_OPTIONS = [
    '100.000 - 250.000 ₺',
    '250.000 - 500.000 ₺',
    '500.000 - 1.000.000 ₺',
    '1.000.000 ₺ ve üzeri'
];

interface FormData {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    companyName: string;
    city: string;
    investmentBudget: string;
    experience: string;
    message: string;
}

export const Franchise = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<{ applicationNumber: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        companyName: '',
        city: '',
        investmentBudget: '',
        experience: '',
        message: ''
    });

    const updateField = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = (stepNum: number): boolean => {
        switch (stepNum) {
            case 1:
                return !!(formData.contactName && formData.contactEmail && formData.contactPhone);
            case 2:
                return !!formData.city;
            case 3:
                return true;
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(1) || !validateStep(2)) {
            setError('Lütfen tüm zorunlu alanları doldurun.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await franchiseService.submitApplication({
                contactName: formData.contactName,
                contactEmail: formData.contactEmail,
                contactPhone: formData.contactPhone,
                companyName: formData.companyName || undefined,
                city: formData.city,
                investmentBudget: formData.investmentBudget || undefined,
                experience: formData.experience || undefined,
                message: formData.message || undefined,
            });
            setSuccess({ applicationNumber: result.applicationNumber });
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Başvuru gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 pt-20">
                <div className="max-w-lg w-full text-center">
                    <div className="bg-dark-surface p-10 rounded-3xl border border-white/5 shadow-2xl">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle size={40} className="text-green-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4">Başvurunuz Alındı!</h1>
                        <p className="text-gray-400 mb-6 leading-relaxed">
                            Franchise başvurunuz başarıyla iletildi. Ekibimiz başvurunuzu inceleyecek ve
                            <span className="text-primary-400 font-medium"> 48 saat içinde </span>
                            sizinle iletişime geçecektir.
                        </p>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6 text-left space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail size={16} className="text-gray-500" />
                                <span className="text-gray-400">Onay e-postası gönderildi:</span>
                                <span className="text-white">{formData.contactEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone size={16} className="text-gray-500" />
                                <span className="text-gray-400">Aranacak numara:</span>
                                <span className="text-white">{formData.contactPhone}</span>
                            </div>
                        </div>
                        <Button onClick={() => window.location.href = '/'} className="w-full">
                            Ana Sayfaya Dön
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20 px-6">
            <div className="max-w-3xl mx-auto pt-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Slon<span className="text-primary-400">Car</span> Franchise Başvurusu
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Türkiye'nin en hızlı büyüyen araç kiralama ağına katılın.
                        Formu doldurarak franchise başvurunuzu tamamlayın.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-10">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s ? 'bg-primary-500 text-black' :
                                step > s ? 'bg-green-500 text-white' :
                                    'bg-white/10 text-gray-400'
                                }`}>
                                {step > s ? <CheckCircle size={20} /> : s}
                            </div>
                            {s < 3 && <ChevronRight size={20} className="text-gray-600" />}
                        </div>
                    ))}
                </div>

                {/* Form Container */}
                <div className="bg-dark-surface rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                    <div className="p-8">
                        {/* Step 1: Contact Info */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                    <User className="text-primary-500" /> İletişim Bilgileri
                                </h2>
                                <div className="grid gap-5">
                                    <div>
                                        <label className="text-gray-400 text-sm mb-2 block">Ad Soyad *</label>
                                        <Input
                                            value={formData.contactName}
                                            onChange={e => updateField('contactName', e.target.value)}
                                            placeholder="Adınız ve soyadınız"
                                            className="bg-dark-bg border-white/10"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-gray-400 text-sm mb-2 block">E-posta *</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                <Input
                                                    type="email"
                                                    value={formData.contactEmail}
                                                    onChange={e => updateField('contactEmail', e.target.value)}
                                                    placeholder="ornek@email.com"
                                                    className="bg-dark-bg border-white/10 pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-gray-400 text-sm mb-2 block">Telefon *</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                <Input
                                                    type="tel"
                                                    value={formData.contactPhone}
                                                    onChange={e => updateField('contactPhone', e.target.value)}
                                                    placeholder="05XX XXX XX XX"
                                                    className="bg-dark-bg border-white/10 pl-10"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-2 block">Şirket Adı (Varsa)</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <Input
                                                value={formData.companyName}
                                                onChange={e => updateField('companyName', e.target.value)}
                                                placeholder="Şirketinizin adı"
                                                className="bg-dark-bg border-white/10 pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Location & Investment */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                    <MapPin className="text-primary-500" /> Lokasyon ve Yatırım
                                </h2>
                                <div className="grid gap-5">
                                    <div>
                                        <label className="text-gray-400 text-sm mb-2 block">Franchise Açmak İstediğiniz Şehir *</label>
                                        <select
                                            value={formData.city}
                                            onChange={e => updateField('city', e.target.value)}
                                            className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Şehir seçin</option>
                                            {CITIES.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-2 block flex items-center gap-2">
                                            <Wallet size={16} /> Yatırım Bütçesi
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {INVESTMENT_OPTIONS.map(option => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => updateField('investmentBudget', option)}
                                                    className={`p-3 rounded-xl text-sm font-medium transition-all border ${formData.investmentBudget === option
                                                        ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                                                        : 'bg-dark-bg border-white/10 text-gray-400 hover:border-white/20'
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Experience & Message */}
                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                    <Briefcase className="text-primary-500" /> Deneyim ve Mesajınız
                                </h2>
                                <div className="grid gap-5">
                                    <div>
                                        <label className="text-gray-400 text-sm mb-2 block">İş Deneyiminiz</label>
                                        <textarea
                                            value={formData.experience}
                                            onChange={e => updateField('experience', e.target.value)}
                                            placeholder="Sektör deneyiminiz, daha önce işlettiğiniz işletmeler..."
                                            rows={3}
                                            className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm mb-2 block flex items-center gap-2">
                                            <MessageSquare size={16} /> Eklemek İstediğiniz Mesaj
                                        </label>
                                        <textarea
                                            value={formData.message}
                                            onChange={e => updateField('message', e.target.value)}
                                            placeholder="Bize iletmek istediğiniz sorular veya notlar..."
                                            rows={4}
                                            className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white/5 px-8 py-5 flex justify-between items-center border-t border-white/5">
                        <button
                            onClick={() => setStep(s => s - 1)}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${step === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <ChevronLeft size={18} /> Geri
                        </button>

                        {step < 3 ? (
                            <Button
                                onClick={() => {
                                    if (validateStep(step)) {
                                        setStep(s => s + 1);
                                        setError(null);
                                    } else {
                                        setError('Lütfen zorunlu alanları doldurun.');
                                    }
                                }}
                            >
                                Devam <ChevronRight size={18} />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Gönderiliyor...' : <><Send size={18} /> Başvuruyu Gönder</>}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
