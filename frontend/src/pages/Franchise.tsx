import { useState } from 'react';
import { franchiseService } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatPhoneNumber, cleanPhoneNumber } from '../utils/formatters';
import { Building2, User, Mail, Phone, MapPin, Wallet, Briefcase, CheckCircle, Send, ChevronRight, ChevronLeft, Globe } from 'lucide-react';
import { normalizeEmail } from '../utils/formatters';

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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(cleanPhoneNumber(e.target.value));
        updateField('contactPhone', formatted);
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
            <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-dark-bg font-sans flex items-center justify-center">
                {/* Success Background */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[128px] animate-pulse pointer-events-none" />

                <div className="max-w-lg w-full text-center relative z-10 px-6">
                    <div className="bg-dark-surface/60 backdrop-blur-xl p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(34,197,94,0.1)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <div className="w-24 h-24 mx-auto mb-8 relative">
                            <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 animate-pulse" />
                            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                                <CheckCircle size={48} className="text-white drop-shadow-md" />
                            </div>
                        </div>

                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Başvurunuz Alındı!</h1>
                        <div className="text-sm font-mono text-green-400 mb-6 bg-green-500/10 inline-block px-3 py-1 rounded-lg border border-green-500/20">
                            #APP-{success.applicationNumber.slice(0, 8).toUpperCase()}
                        </div>

                        <p className="text-gray-300 mb-8 leading-relaxed">
                            Franchise başvurunuz başarıyla iletildi. Ekibimiz başvurunuzu dikkatle inceleyecek ve
                            <span className="text-white font-bold mx-1 bg-white/10 px-2 py-0.5 rounded">48 saat</span>
                            içinde sizinle iletişime geçecektir.
                        </p>

                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 mb-8 text-left space-y-3 shadow-inner">
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <Mail size={16} className="text-primary-400" />
                                </div>
                                <div className='flex flex-col'>
                                    <span className="text-xs text-gray-500 uppercase font-bold">Onay E-postası</span>
                                    <span className="text-white font-medium">{formData.contactEmail}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                    <Phone size={16} className="text-primary-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 uppercase font-bold">İletişim Numarası</span>
                                    <span className="text-white font-medium">{formData.contactPhone}</span>
                                </div>
                            </div>
                        </div>

                        <Button onClick={() => window.location.href = '/'} className="w-full bg-white text-black hover:bg-gray-200 font-bold h-12 rounded-xl">
                            Ana Sayfaya Dön
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 relative overflow-hidden bg-dark-bg font-sans selection:bg-primary-500/30">
            {/* Background Mesh Gradients */}
            <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary-900/10 rounded-full blur-[128px] animate-pulse pointer-events-none duration-[4000ms]" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[128px] animate-pulse pointer-events-none delay-1000 duration-[5000ms]" />

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-primary-400 text-sm font-bold mb-6 backdrop-blur-sm">
                        <Globe size={16} /> BÜYÜYEN AİLEMİZE KATILIN
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
                        Slon<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple">Car</span> Franchise
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        Türkiye'nin en hızlı büyüyen premium araç kiralama ağına katılın.
                        Yüksek karlılık ve güçlü marka desteği ile geleceğinize yatırım yapın.
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-dark-surface/60 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative group/form animate-fade-in-up delay-100">
                    {/* Top Decorative Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-neon-purple to-primary-500 opacity-50" />

                    <div className="flex flex-col md:flex-row min-h-[auto] md:min-h-[600px]">
                        {/* LEFT SIDE: Progress Tracker */}
                        <div className="md:w-1/3 bg-black/20 border-b md:border-b-0 md:border-r border-white/5 p-6 md:p-8 relative overflow-hidden">
                            {/* Floating Elements */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary-500/5 to-transparent pointer-events-none" />

                            <h3 className="text-white font-bold text-lg mb-8 relative z-10">Başvuru Adımları</h3>
                            <div className="space-y-8 relative z-10">
                                {[
                                    { num: 1, title: 'İletişim Bilgileri', icon: User, desc: 'Sizi tanıyalım' },
                                    { num: 2, title: 'Lokasyon & Yatırım', icon: MapPin, desc: 'Bölge ve bütçe planı' },
                                    { num: 3, title: 'Deneyim & Mesaj', icon: Briefcase, desc: 'Vizyonunuzu paylaşın' }
                                ].map((s) => (
                                    <div key={s.num} className={`group flex gap-4 transition-all duration-300 ${step === s.num ? 'opacity-100' : step > s.num ? 'opacity-100' : 'opacity-40'}`}>
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-500 shadow-lg ${step === s.num ? 'bg-primary-500 text-white scale-110 shadow-primary-500/30' :
                                                step > s.num ? 'bg-green-500 text-white shadow-green-500/30' :
                                                    'bg-white/10 text-gray-400 border border-white/5'
                                                }`}>
                                                {step > s.num ? <CheckCircle size={18} /> : s.num}
                                            </div>
                                            {s.num < 3 && <div className={`w-0.5 mt-2 h-12 rounded-full transition-all duration-500 ${step > s.num ? 'bg-green-500/50' : 'bg-white/10'}`} />}
                                        </div>
                                        <div className={`pt-1 transition-all duration-300 ${step === s.num ? 'translate-x-2' : ''}`}>
                                            <h4 className={`font-bold text-sm ${step === s.num ? 'text-white' : 'text-gray-300'}`}>{s.title}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT SIDE: Form Content */}
                        <div className="md:w-2/3 flex flex-col min-h-[500px]">
                            <div className="flex-1 p-6 md:p-12">
                                {/* Step 1: Contact Info */}
                                {step === 1 && (
                                    <div className="space-y-8 animate-fade-in pb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-2">İletişim Bilgileri</h2>
                                            <p className="text-gray-400 text-sm">Size ulaşabilmemiz için iletişim bilgilerinizi giriniz.</p>
                                        </div>

                                        <div className="space-y-5">
                                            <div className="group/input">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block group-focus-within/input:text-primary-400 transition-colors">Ad Soyad *</label>
                                                <Input
                                                    value={formData.contactName}
                                                    onChange={e => updateField('contactName', e.target.value)}
                                                    placeholder="Adınız ve Soyadınız"
                                                    className="bg-black/20 border-white/10 focus:bg-black/40 h-12 text-lg"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-5">
                                                <div className="group/input">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block group-focus-within/input:text-primary-400 transition-colors">E-posta Adresi *</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-primary-500 transition-colors" size={18} />
                                                        <Input
                                                            type="email"
                                                            value={formData.contactEmail}
                                                            onChange={e => updateField('contactEmail', normalizeEmail(e.target.value))}
                                                            placeholder="ornek@email.com"
                                                            className="bg-black/20 border-white/10 focus:bg-black/40 h-12 pl-12"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="group/input">
                                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block group-focus-within/input:text-primary-400 transition-colors">Telefon Numarası *</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-primary-500 transition-colors" size={18} />
                                                        <Input
                                                            type="tel"
                                                            value={formData.contactPhone}
                                                            onChange={handlePhoneChange}
                                                            placeholder="(5XX) XXX XX XX"
                                                            className="bg-black/20 border-white/10 focus:bg-black/40 h-12 pl-12"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group/input pt-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block group-focus-within/input:text-primary-400 transition-colors">Şirket Adı (Opsiyonel)</label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-primary-500 transition-colors" size={18} />
                                                    <Input
                                                        value={formData.companyName}
                                                        onChange={e => updateField('companyName', e.target.value)}
                                                        placeholder="Varsa mevcut şirketinizin adı"
                                                        className="bg-black/20 border-white/10 focus:bg-black/40 h-12 pl-12"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Location & Investment */}
                                {step === 2 && (
                                    <div className="space-y-8 animate-fade-in pb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Lokasyon ve Yatırım</h2>
                                            <p className="text-gray-400 text-sm">Hedeflediğiniz bölge ve yatırım planınız.</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group/input">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block group-focus-within/input:text-primary-400 transition-colors">Hedef Şehir *</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within/input:text-primary-500 transition-colors pointer-events-none" size={18} />
                                                    <select
                                                        value={formData.city}
                                                        onChange={e => updateField('city', e.target.value)}
                                                        className="w-full h-12 px-4 pl-12 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-black/40 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="" className="bg-dark-bg text-gray-400">Şehir Seçin</option>
                                                        {CITIES.map(city => (
                                                            <option key={city} value={city} className="bg-dark-bg">{city}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 rotate-90 pointer-events-none" size={16} />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                                    <Wallet size={14} /> Yatırım Bütçesi Planı
                                                </label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {INVESTMENT_OPTIONS.map(option => (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => updateField('investmentBudget', option)}
                                                            className={`p-4 rounded-xl text-left text-sm font-bold transition-all border relative overflow-hidden group ${formData.investmentBudget === option
                                                                ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                                                                : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20 hover:bg-white/5'
                                                                }`}
                                                        >
                                                            {formData.investmentBudget === option && (
                                                                <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                                                            )}
                                                            <span className="relative z-10">{option}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Experience & Message */}
                                {step === 3 && (
                                    <div className="space-y-8 animate-fade-in pb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Deneyim ve Vizyon</h2>
                                            <p className="text-gray-400 text-sm">Sizi iş ortağımız olarak daha yakından tanımak isteriz.</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group/input">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block group-focus-within/input:text-primary-400 transition-colors">İş Deneyimi & Sektör Geçmişi</label>
                                                <textarea
                                                    value={formData.experience}
                                                    onChange={e => updateField('experience', e.target.value)}
                                                    placeholder="Sektördeki tecrübelerinizden ve varsa mevcut işletmelerinizden kısaca bahsedin..."
                                                    rows={4}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-black/40 resize-none transition-all placeholder:text-gray-600"
                                                />
                                            </div>
                                            <div className="group/input">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block group-focus-within/input:text-primary-400 transition-colors">Eklemek İstedikleriniz</label>
                                                <textarea
                                                    value={formData.message}
                                                    onChange={e => updateField('message', e.target.value)}
                                                    placeholder="Bize iletmek istediğiniz soru, görüş veya özel notlarınız..."
                                                    rows={4}
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-black/40 resize-none transition-all placeholder:text-gray-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Actions */}
                            <div className="p-6 md:p-8 bg-dark-surface/95 backdrop-blur-md border-t border-white/5 flex justify-between items-center z-20 rounded-br-[2rem] rounded-bl-[2rem] md:rounded-bl-none">
                                <button
                                    onClick={() => setStep(s => s - 1)}
                                    disabled={step === 1}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <ChevronLeft size={16} /> Geri Dön
                                </button>

                                {step < 3 ? (
                                    <Button
                                        className="rounded-xl px-8 shadow-lg shadow-primary-500/20"
                                        onClick={() => {
                                            if (validateStep(step)) {
                                                setStep(s => s + 1);
                                                setError(null);
                                            } else {
                                                setError('Lütfen zorunlu alanları doldurun.');
                                            }
                                        }}
                                    >
                                        Devam Et <ChevronRight size={18} />
                                    </Button>
                                ) : (
                                    <Button onClick={handleSubmit} disabled={loading} className="rounded-xl px-8 shadow-lg shadow-primary-500/20 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 border-none">
                                        {loading ? 'Gönderiliyor...' : <><Send size={18} /> Başvuruyu Tamamla</>}
                                    </Button>
                                )}
                            </div>

                            {/* Error Toast */}
                            {error && (
                                <div className="px-8 pb-4 animate-slide-up">
                                    <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md p-4 rounded-xl text-red-200 text-sm flex items-center gap-3 shadow-xl">
                                        <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                        {error}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
