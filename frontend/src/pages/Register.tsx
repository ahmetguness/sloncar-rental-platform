import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
    Mail, Lock, Eye, EyeOff, User, Phone, Building2, FileText,
    MapPin, UserPlus, Loader2
} from 'lucide-react';
import { normalizeEmail, formatPhoneNumber, cleanPhoneNumber } from '../utils/formatters';
import { authService } from '../services/api';
import type { MembershipType } from '../services/types';
import logo from '../assets/logo/logo.jpg';

interface FormErrors {
    [key: string]: string;
}

export const Register = () => {
    const navigate = useNavigate();

    const [membershipType, setMembershipType] = useState<MembershipType>('INDIVIDUAL');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    // Common fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');

    // Individual fields
    const [tcNo, setTcNo] = useState('');

    // Corporate fields
    const [companyName, setCompanyName] = useState('');
    const [taxNumber, setTaxNumber] = useState('');
    const [taxOffice, setTaxOffice] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');

    const clearFieldError = (field: string) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!name.trim()) newErrors.name = 'Ad soyad zorunludur';
        if (!email.trim()) newErrors.email = 'E-posta zorunludur';
        if (!password) newErrors.password = 'Şifre zorunludur';
        else if (password.length < 8) newErrors.password = 'Şifre en az 8 karakter olmalıdır';

        if (membershipType === 'INDIVIDUAL') {
            if (tcNo && !/^\d{11}$/.test(tcNo)) {
                newErrors.tcNo = 'TC kimlik numarası 11 haneli olmalıdır';
            }
        } else {
            if (!companyName.trim()) newErrors.companyName = 'Şirket adı zorunludur';
            if (!taxNumber.trim()) newErrors.taxNumber = 'Vergi numarası zorunludur';
            else if (!/^\d{10}$/.test(taxNumber)) {
                newErrors.taxNumber = 'Vergi numarası 10 haneli olmalıdır';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);

        if (!validate()) return;

        setIsLoading(true);
        try {
            const cleanedPhone = phone.replace(/\D/g, '');
            if (membershipType === 'INDIVIDUAL') {
                await authService.register({
                    membershipType: 'INDIVIDUAL',
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    phone: cleanedPhone || undefined,
                    tcNo: tcNo || undefined,
                });
            } else {
                await authService.register({
                    membershipType: 'CORPORATE',
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    phone: cleanedPhone || undefined,
                    companyName: companyName.trim(),
                    taxNumber: taxNumber.trim(),
                    taxOffice: taxOffice.trim() || undefined,
                    companyAddress: companyAddress.trim() || undefined,
                });
            }
            navigate('/', { replace: true });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string; error?: { details?: { field: string; message: string }[] } } } };
            const details = axiosErr.response?.data?.error?.details;
            if (details && Array.isArray(details)) {
                const fieldErrors: FormErrors = {};
                for (const d of details) {
                    fieldErrors[d.field] = d.message;
                }
                setErrors(fieldErrors);
            } else {
                setGeneralError(axiosErr.response?.data?.message || 'Kayıt sırasında bir hata oluştu');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderInput = (
        field: string,
        label: string,
        value: string,
        onChange: (val: string) => void,
        icon: React.ReactNode,
        options?: { type?: string; placeholder?: string; required?: boolean; maxLength?: number }
    ) => {
        const { type = 'text', placeholder = '', required = false, maxLength } = options || {};
        const isPasswordField = field === 'password';
        return (
            <div>
                <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">{icon}</span>
                    <input
                        type={isPasswordField ? (showPassword ? 'text' : 'password') : type}
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            clearFieldError(field);
                        }}
                        maxLength={maxLength}
                        className={`w-full bg-[#F5F5F5] border rounded-xl px-4 py-3.5 pl-12 ${isPasswordField ? 'pr-12' : ''} text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${errors[field] ? 'border-red-400' : 'border-[#E5E5E5]'}`}
                        placeholder={placeholder}
                    />
                    {isPasswordField && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#777777] transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    )}
                </div>
                {errors[field] && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1">{errors[field]}</p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] relative overflow-hidden py-10">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
            </div>

            {/* Register Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl shadow-black/5 border border-[#E5E5E5]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="relative">
                                <img src={logo} alt="Yaman Filo" className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary-500/20" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-md flex items-center justify-center shadow-sm">
                                    <span className="text-white text-[6px] font-black">YF</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-xl font-black text-[#111111] tracking-tight uppercase leading-none">
                                    YAMAN<span className="text-primary-500"> FİLO</span>
                                </span>
                                <span className="text-[9px] font-bold text-[#999999] tracking-[0.25em] uppercase leading-none mt-0.5">OTOMOTİV</span>
                            </div>
                        </div>

                        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-2xl md:text-3xl font-black text-[#111111] mb-2 tracking-tight">Üye Ol</h1>
                        <p className="text-[#999999] text-sm font-medium">Hizmetlerimizden faydalanmak için kayıt olun</p>
                    </div>

                    {/* Membership Type Selector */}
                    <div className="flex bg-[#F5F5F5] rounded-xl p-1 mb-6 border border-[#E5E5E5]">
                        <button
                            type="button"
                            onClick={() => setMembershipType('INDIVIDUAL')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                membershipType === 'INDIVIDUAL'
                                    ? 'bg-white text-primary-500 shadow-sm'
                                    : 'text-[#999999] hover:text-[#777777]'
                            }`}
                        >
                            Bireysel
                        </button>
                        <button
                            type="button"
                            onClick={() => setMembershipType('CORPORATE')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                                membershipType === 'CORPORATE'
                                    ? 'bg-white text-primary-500 shadow-sm'
                                    : 'text-[#999999] hover:text-[#777777]'
                            }`}
                        >
                            Kurumsal
                        </button>
                    </div>

                    {/* General Error */}
                    {generalError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                <Lock className="w-4 h-4" />
                            </div>
                            {generalError}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Common Fields */}
                        {renderInput('name', 'Ad Soyad', name, setName, <User className="w-5 h-5" />, { placeholder: 'Adınız Soyadınız', required: true })}
                        {renderInput('email', 'E-posta', email, (v) => setEmail(normalizeEmail(v)), <Mail className="w-5 h-5" />, { type: 'email', placeholder: 'ornek@email.com', required: true })}
                        {renderInput('password', 'Şifre', password, setPassword, <Lock className="w-5 h-5" />, { type: 'password', placeholder: '••••••••', required: true })}
                        {renderInput('phone', 'Telefon', formatPhoneNumber(phone), (v) => setPhone(cleanPhoneNumber(v)), <Phone className="w-5 h-5" />, { placeholder: '(5XX) XXX XX XX' })}

                        {/* Individual Fields */}
                        {membershipType === 'INDIVIDUAL' && (
                            renderInput('tcNo', 'TC Kimlik No', tcNo, (v) => setTcNo(v.replace(/\D/g, '').slice(0, 11)), <FileText className="w-5 h-5" />, { placeholder: '11 haneli TC kimlik numarası', maxLength: 11 })
                        )}

                        {/* Corporate Fields */}
                        {membershipType === 'CORPORATE' && (
                            <>
                                {renderInput('companyName', 'Şirket Adı', companyName, setCompanyName, <Building2 className="w-5 h-5" />, { placeholder: 'Şirket adını girin', required: true })}
                                {renderInput('taxNumber', 'Vergi Numarası', taxNumber, (v) => setTaxNumber(v.replace(/\D/g, '').slice(0, 10)), <FileText className="w-5 h-5" />, { placeholder: '10 haneli vergi numarası', required: true, maxLength: 10 })}
                                {renderInput('taxOffice', 'Vergi Dairesi', taxOffice, setTaxOffice, <Building2 className="w-5 h-5" />, { placeholder: 'Vergi dairesi (opsiyonel)' })}
                                {renderInput('companyAddress', 'Şirket Adresi', companyAddress, setCompanyAddress, <MapPin className="w-5 h-5" />, { placeholder: 'Şirket adresi (opsiyonel)' })}
                            </>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-14 text-base font-black mt-6 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all rounded-2xl tracking-widest"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    KAYIT YAPILIYOR...
                                </span>
                            ) : 'KAYIT OL'}
                        </Button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-[#999999] text-sm mt-6">
                        Zaten hesabınız var mı?{' '}
                        <Link to="/login" className="text-primary-500 font-bold hover:underline">
                            Giriş Yap
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-[#AAAAAA] text-xs mt-6 font-medium">
                    © {new Date().getFullYear()} Yaman Filo. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    );
};
