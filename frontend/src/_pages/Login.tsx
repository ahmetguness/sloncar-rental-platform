"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // keep if needed
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, registerUser, clearError } from '../features/auth/authSlice';
import { Button } from '../components/ui/Button';
import {
    Lock, Mail, Eye, EyeOff, User, Phone, Building2, FileText,
    MapPin, Check, Loader2
} from 'lucide-react';
import { normalizeEmail, formatPhoneNumber, cleanPhoneNumber } from '../utils/formatters';
import type { MembershipType } from '../services/types';
import logo from '../assets/logo/logo.jpg';

type Tab = 'login' | 'register';

interface FormErrors { [key: string]: string; }

export const Login = () => {
    const navigate = useRouter();
    const dispatch = useAppDispatch();
    const searchParams = useSearchParams();
    const { isAuthenticated, user, status, error } = useAppSelector((state) => state.auth);

    const tipParam = searchParams.get('tip');
    const membershipFromUrl: MembershipType = tipParam === 'kurumsal' ? 'CORPORATE' : 'INDIVIDUAL';

    const [tab, setTab] = useState<Tab>('login');
    const [membershipType, setMembershipType] = useState<MembershipType>(membershipFromUrl);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    // Login fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [tcNo, setTcNo] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [taxNumber, setTaxNumber] = useState('');
    const [taxOffice, setTaxOffice] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [emailCampaignEnabled, setEmailCampaignEnabled] = useState(true);

    useEffect(() => {
        setMembershipType(membershipFromUrl);
    }, [membershipFromUrl]);

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'ADMIN' || user.role === 'STAFF') {
                navigate.replace('/admin/dashboard');
            } else {
                navigate.replace('/');
            }
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        return () => { dispatch(clearError()); };
    }, [dispatch]);

    // Clear errors on tab switch
    useEffect(() => {
        setGeneralError(null);
        setErrors({});
        dispatch(clearError());
    }, [tab, dispatch]);

    const isCorporate = membershipType === 'CORPORATE';
    const isLoading = status === 'loading' || isSubmitting;

    const clearFieldError = (field: string) => {
        setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    };

    const validateRegister = (): boolean => {
        const e: FormErrors = {};
        if (!name.trim()) e.name = 'Ad soyad zorunludur';
        if (!email.trim()) e.email = 'E-posta zorunludur';
        if (!password) e.password = 'Şifre zorunludur';
        else if (password.length < 8) e.password = 'Şifre en az 8 karakter olmalıdır';
        if (membershipType === 'INDIVIDUAL') {
            if (tcNo && !/^\d{11}$/.test(tcNo)) e.tcNo = 'TC kimlik numarası 11 haneli olmalıdır';
        } else {
            if (!companyName.trim()) e.companyName = 'Şirket adı zorunludur';
            if (!taxNumber.trim()) e.taxNumber = 'Vergi numarası zorunludur';
            else if (!/^\d{10}$/.test(taxNumber)) e.taxNumber = 'Vergi numarası 10 haneli olmalıdır';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);
        dispatch(loginUser({ email: loginEmail, password: loginPassword, rememberMe }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);
        if (!validateRegister()) return;
        setIsSubmitting(true);
        try {
            const cleanedPhone = phone.replace(/\D/g, '');
            const base = { name: name.trim(), email: email.trim(), password, phone: cleanedPhone || undefined, emailCampaignEnabled };
            let registerData;
            if (membershipType === 'INDIVIDUAL') {
                registerData = { ...base, membershipType: 'INDIVIDUAL' as const, tcNo: tcNo || undefined };
            } else {
                registerData = {
                    ...base, membershipType: 'CORPORATE' as const,
                    companyName: companyName.trim(), taxNumber: taxNumber.trim(),
                    taxOffice: taxOffice.trim() || undefined, companyAddress: companyAddress.trim() || undefined,
                };
            }
            const result = await dispatch(registerUser(registerData)).unwrap();
            if (result) {
                navigate.replace('/');
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string; error?: { details?: { field: string; message: string }[] } } } };
            const details = axiosErr.response?.data?.error?.details;
            if (details && Array.isArray(details)) {
                const fe: FormErrors = {};
                for (const d of details) fe[d.field] = d.message;
                setErrors(fe);
            } else {
                const msg = typeof err === 'string' ? err : (axiosErr.response?.data?.message || 'Kayıt sırasında bir hata oluştu');
                setGeneralError(msg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderInput = (
        field: string, label: string, value: string, onChange: (v: string) => void,
        icon: React.ReactNode, opts?: { type?: string; placeholder?: string; required?: boolean; maxLength?: number }
    ) => {
        const { type = 'text', placeholder = '', required = false, maxLength } = opts || {};
        const isPw = field === 'password' || field === 'loginPassword';
        return (
            <div>
                <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">{icon}</span>
                    <input
                        type={isPw ? (showPassword ? 'text' : 'password') : type}
                        value={value}
                        onChange={(e) => { onChange(e.target.value); clearFieldError(field); }}
                        maxLength={maxLength}
                        className={`w-full bg-[#F5F5F5] border rounded-xl px-4 py-3.5 pl-12 ${isPw ? 'pr-12' : ''} text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${errors[field] ? 'border-red-400' : 'border-[#E5E5E5]'}`}
                        placeholder={placeholder}
                    />
                    {isPw && (
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#777777] transition-colors">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    )}
                </div>
                {errors[field] && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors[field]}</p>}
            </div>
        );
    };

    if (isAuthenticated) {
        return (
            <div className="min-h-screen bg-white pt-24 flex justify-center items-center">
                <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] relative overflow-hidden pt-32 pb-10">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl shadow-black/5 border border-[#E5E5E5]">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="relative">
                                <img src={logo.src} alt="Yaman Filo" className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary-500/20" />
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
                            {isCorporate ? <Building2 className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
                        </div>

                        <h1 className="text-2xl md:text-3xl font-black text-[#111111] mb-1 tracking-tight">
                            {isCorporate ? 'Kurumsal' : 'Bireysel'} Üyelik
                        </h1>
                        <p className="text-[#999999] text-sm font-medium">
                            {isCorporate ? 'Kurumsal hesabınızla giriş yapın veya kayıt olun' : 'Bireysel hesabınızla giriş yapın veya kayıt olun'}
                        </p>
                    </div>

                    {/* Login / Register Tabs */}
                    <div className="flex bg-[#F5F5F5] rounded-xl p-1 mb-6 border border-[#E5E5E5]">
                        <button type="button" onClick={() => setTab('login')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'login' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#999999] hover:text-[#777777]'}`}>
                            Giriş Yap
                        </button>
                        <button type="button" onClick={() => setTab('register')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'register' ? 'bg-white text-[#111111] shadow-sm' : 'text-[#999999] hover:text-[#777777]'}`}>
                            Kayıt Ol
                        </button>
                    </div>

                    {/* Error */}
                    {(error || generalError) && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                <Lock className="w-4 h-4" />
                            </div>
                            {error || generalError}
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {tab === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            {renderInput('loginEmail', 'E-posta', loginEmail, (v) => setLoginEmail(normalizeEmail(v)), <Mail className="w-5 h-5" />, { type: 'email', placeholder: 'ornek@email.com', required: true })}
                            {renderInput('loginPassword', 'Şifre', loginPassword, setLoginPassword, <Lock className="w-5 h-5" />, { type: 'password', placeholder: '••••••••', required: true })}

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-primary-500 border-primary-500' : 'border-[#E5E5E5] bg-[#F5F5F5] group-hover:border-primary-500/50'}`}>
                                        {rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input type="checkbox" className="sr-only" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                    <span className={rememberMe ? 'text-[#111111] font-medium' : 'text-[#777777] group-hover:text-[#555555]'}>Oturumu açık tut</span>
                                </label>
                                <Link href="/sifremi-unuttum" className="text-primary-500 font-bold hover:underline text-xs">Şifremi Unuttum</Link>
                            </div>

                            <Button type="submit"
                                className="w-full h-14 text-base font-black mt-4 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all rounded-2xl tracking-widest"
                                disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        GİRİŞ YAPILIYOR...
                                    </span>
                                ) : 'GİRİŞ YAP'}
                            </Button>

                            <p className="text-center text-[#999999] text-sm mt-4">
                                Hesabınız yok mu?{' '}
                                <button type="button" onClick={() => setTab('register')} className="text-primary-500 font-bold hover:underline">Kayıt Ol</button>
                            </p>
                        </form>
                    )}

                    {/* REGISTER FORM */}
                    {tab === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-4">
                            {renderInput('name', 'Ad Soyad', name, setName, <User className="w-5 h-5" />, { placeholder: 'Adınız Soyadınız', required: true })}
                            {renderInput('email', 'E-posta', email, (v) => setEmail(normalizeEmail(v)), <Mail className="w-5 h-5" />, { type: 'email', placeholder: 'ornek@email.com', required: true })}
                            {renderInput('password', 'Şifre', password, setPassword, <Lock className="w-5 h-5" />, { type: 'password', placeholder: '••••••••', required: true })}
                            {renderInput('phone', 'Telefon', formatPhoneNumber(phone), (v) => setPhone(cleanPhoneNumber(v)), <Phone className="w-5 h-5" />, { placeholder: '(5XX) XXX XX XX' })}

                            {!isCorporate && renderInput('tcNo', 'TC Kimlik No', tcNo, (v) => setTcNo(v.replace(/\D/g, '').slice(0, 11)), <FileText className="w-5 h-5" />, { placeholder: '11 haneli TC kimlik numarası', maxLength: 11 })}

                            {isCorporate && (
                                <>
                                    {renderInput('companyName', 'Şirket Adı', companyName, setCompanyName, <Building2 className="w-5 h-5" />, { placeholder: 'Şirket adını girin', required: true })}
                                    {renderInput('taxNumber', 'Vergi Numarası', taxNumber, (v) => setTaxNumber(v.replace(/\D/g, '').slice(0, 10)), <FileText className="w-5 h-5" />, { placeholder: '10 haneli vergi numarası', required: true, maxLength: 10 })}
                                    {renderInput('taxOffice', 'Vergi Dairesi', taxOffice, setTaxOffice, <Building2 className="w-5 h-5" />, { placeholder: 'Vergi dairesi (opsiyonel)' })}
                                    {renderInput('companyAddress', 'Şirket Adresi', companyAddress, setCompanyAddress, <MapPin className="w-5 h-5" />, { placeholder: 'Şirket adresi (opsiyonel)' })}
                                </>
                            )}

                            {/* Kampanya E-posta Tercihi */}
                            <div className="flex items-center text-sm">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${emailCampaignEnabled ? 'bg-primary-500 border-primary-500' : 'border-[#E5E5E5] bg-[#F5F5F5] group-hover:border-primary-500/50'}`}>
                                        {emailCampaignEnabled && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input type="checkbox" className="sr-only" checked={emailCampaignEnabled} onChange={(e) => setEmailCampaignEnabled(e.target.checked)} />
                                    <span className={emailCampaignEnabled ? 'text-[#111111] font-medium' : 'text-[#777777] group-hover:text-[#555555]'}>Kampanya ve duyuru e-postalarını almak istiyorum</span>
                                </label>
                            </div>

                            <Button type="submit"
                                className="w-full h-14 text-base font-black mt-4 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all rounded-2xl tracking-widest"
                                disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        KAYIT YAPILIYOR...
                                    </span>
                                ) : 'KAYIT OL'}
                            </Button>

                            <p className="text-center text-[#999999] text-sm mt-4">
                                Zaten hesabınız var mı?{' '}
                                <button type="button" onClick={() => setTab('login')} className="text-primary-500 font-bold hover:underline">Giriş Yap</button>
                            </p>
                        </form>
                    )}
                </div>

                <p className="text-center text-[#AAAAAA] text-xs mt-6 font-medium">
                    © {new Date().getFullYear()} Yaman Filo. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    );
};
