"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // keep if needed
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUser } from '../features/auth/authSlice';
import { adminService } from '../services/api';
import { Button } from '../components/ui/Button';
import {
    User as UserIcon, Mail, Phone, FileText, Building2, MapPin,
    Save, Loader2, Bell, Shield, ArrowLeft
} from 'lucide-react';
import { formatPhoneNumber, cleanPhoneNumber } from '../utils/formatters';
import type { User } from '../services/types';
import logo from '../assets/logo/logo.jpg';

interface FormErrors {
    [key: string]: string;
}

export const Profile = () => {
    const navigate = useRouter();
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [membershipType, setMembershipType] = useState<'INDIVIDUAL' | 'CORPORATE'>('INDIVIDUAL');

    // Individual fields
    const [tcNo, setTcNo] = useState('');

    // Corporate fields
    const [companyName, setCompanyName] = useState('');
    const [taxNumber, setTaxNumber] = useState('');
    const [taxOffice, setTaxOffice] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');

    // Notification preferences
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [emailBookingEnabled, setEmailBookingEnabled] = useState(false);
    const [emailInsuranceEnabled, setEmailInsuranceEnabled] = useState(false);
    const [emailCampaignEnabled, setEmailCampaignEnabled] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate.replace('/admin/login');
            return;
        }
        const fetchProfile = async () => {
            try {
                setIsLoading(true);
                const profile = await adminService.getProfile();
                populateForm(profile);
            } catch {
                setGeneralError('Profil bilgileri yüklenirken bir hata oluştu');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [isAuthenticated, navigate]);

    const populateForm = (profile: User) => {
        setName(profile.name || '');
        setEmail(profile.email || '');
        setPhone(profile.phone || '');
        setMembershipType(profile.membershipType || 'INDIVIDUAL');
        setTcNo(profile.tcNo || '');
        setCompanyName(profile.companyName || '');
        setTaxNumber(profile.taxNumber || '');
        setTaxOffice(profile.taxOffice || '');
        setCompanyAddress(profile.companyAddress || '');
        setWhatsappEnabled(profile.whatsappEnabled ?? false);
        setEmailEnabled(profile.emailEnabled ?? false);
        setEmailBookingEnabled(profile.emailBookingEnabled ?? false);
        setEmailInsuranceEnabled(profile.emailInsuranceEnabled ?? false);
        setEmailCampaignEnabled(profile.emailCampaignEnabled ?? true);
    };

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

        if (membershipType === 'INDIVIDUAL') {
            if (tcNo && !/^\d{11}$/.test(tcNo)) {
                newErrors.tcNo = 'TC kimlik numarası 11 haneli olmalıdır';
            }
        } else {
            if (companyName !== undefined && !companyName.trim()) {
                newErrors.companyName = 'Şirket adı zorunludur';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneralError(null);
        setSuccessMessage(null);

        if (!validate()) return;

        setIsSaving(true);
        try {
            const cleanedPhone = phone.replace(/\D/g, '');
            const updateData: Record<string, unknown> = {
                name: name.trim(),
                phone: cleanedPhone || undefined,
                whatsappEnabled,
                emailEnabled,
                emailBookingEnabled,
                emailInsuranceEnabled,
                emailCampaignEnabled,
            };

            if (membershipType === 'INDIVIDUAL') {
                updateData.tcNo = tcNo || undefined;
            } else {
                updateData.companyName = companyName.trim();
                updateData.taxOffice = taxOffice.trim() || undefined;
                updateData.companyAddress = companyAddress.trim() || undefined;
            }

            const result = await adminService.updateProfile(updateData as Parameters<typeof adminService.updateProfile>[0]);
            if (result.data?.user) {
                dispatch(setUser(result.data.user));
            }
            setSuccessMessage('Profil başarıyla güncellendi');
            setTimeout(() => setSuccessMessage(null), 3000);
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
                setGeneralError(axiosErr.response?.data?.message || 'Profil güncellenirken bir hata oluştu');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const renderInput = (
        field: string,
        label: string,
        value: string,
        onChange: (val: string) => void,
        icon: React.ReactNode,
        options?: { placeholder?: string; required?: boolean; maxLength?: number; readOnly?: boolean }
    ) => {
        const { placeholder = '', required = false, maxLength, readOnly = false } = options || {};
        return (
            <div>
                <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                    {label}{required && <span className="text-red-400 ml-0.5">*</span>}
                    {readOnly && <span className="text-[#AAAAAA] ml-1 normal-case tracking-normal font-medium">(değiştirilemez)</span>}
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">{icon}</span>
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                            if (!readOnly) {
                                onChange(e.target.value);
                                clearFieldError(field);
                            }
                        }}
                        readOnly={readOnly}
                        maxLength={maxLength}
                        className={`w-full border rounded-xl px-4 py-3.5 pl-12 text-[#111111] placeholder-[#AAAAAA] focus:outline-none transition-all ${readOnly
                                ? 'bg-[#EEEEEE] border-[#E5E5E5] cursor-not-allowed text-[#888888]'
                                : `bg-[#F5F5F5] focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${errors[field] ? 'border-red-400' : 'border-[#E5E5E5]'}`
                            }`}
                        placeholder={placeholder}
                    />
                </div>
                {errors[field] && (
                    <p className="text-red-500 text-xs mt-1.5 ml-1">{errors[field]}</p>
                )}
            </div>
        );
    };

    const renderToggle = (
        label: string,
        description: string,
        checked: boolean,
        onChange: (val: boolean) => void
    ) => (
        <label className="flex items-center justify-between py-3 cursor-pointer group">
            <div>
                <p className="text-sm font-semibold text-[#333333]">{label}</p>
                <p className="text-xs text-[#999999]">{description}</p>
            </div>
            <div
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary-500' : 'bg-[#E5E5E5]'
                    }`}
                onClick={() => onChange(!checked)}
                role="switch"
                aria-checked={checked}
            >
                <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </div>
        </label>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] relative overflow-hidden py-10">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
            </div>

            {/* Profile Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl shadow-black/5 border border-[#E5E5E5]">
                    {/* Header */}
                    <div className="text-center mb-8">
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
                            <UserIcon className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-2xl md:text-3xl font-black text-[#111111] mb-2 tracking-tight">Profilim</h1>
                        <p className="text-[#999999] text-sm font-medium">Hesap bilgilerinizi görüntüleyin ve düzenleyin</p>

                        {/* Membership Type Badge */}
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5]">
                            <Shield className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-bold text-[#333333]">
                                {membershipType === 'INDIVIDUAL' ? 'Bireysel' : 'Kurumsal'} Üyelik
                            </span>
                        </div>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Save className="w-4 h-4" />
                            </div>
                            {successMessage}
                        </div>
                    )}

                    {/* General Error */}
                    {generalError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4" />
                            </div>
                            {generalError}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Common Fields */}
                        {renderInput('name', 'Ad Soyad', name, setName, <UserIcon className="w-5 h-5" />, { placeholder: 'Adınız Soyadınız', required: true })}
                        {renderInput('email', 'E-posta', email, () => { }, <Mail className="w-5 h-5" />, { placeholder: 'E-posta adresiniz', readOnly: true })}
                        {renderInput('phone', 'Telefon', formatPhoneNumber(phone), (v) => setPhone(cleanPhoneNumber(v)), <Phone className="w-5 h-5" />, { placeholder: '(5XX) XXX XX XX' })}

                        {/* Individual Fields */}
                        {membershipType === 'INDIVIDUAL' && (
                            renderInput('tcNo', 'TC Kimlik No', tcNo, (v) => setTcNo(v.replace(/\D/g, '').slice(0, 11)), <FileText className="w-5 h-5" />, { placeholder: '11 haneli TC kimlik numarası', maxLength: 11 })
                        )}

                        {/* Corporate Fields */}
                        {membershipType === 'CORPORATE' && (
                            <>
                                {renderInput('companyName', 'Şirket Adı', companyName, setCompanyName, <Building2 className="w-5 h-5" />, { placeholder: 'Şirket adını girin', required: true })}
                                {renderInput('taxNumber', 'Vergi Numarası', taxNumber, () => { }, <FileText className="w-5 h-5" />, { placeholder: 'Vergi numarası', readOnly: true })}
                                {renderInput('taxOffice', 'Vergi Dairesi', taxOffice, setTaxOffice, <Building2 className="w-5 h-5" />, { placeholder: 'Vergi dairesi' })}
                                {renderInput('companyAddress', 'Şirket Adresi', companyAddress, setCompanyAddress, <MapPin className="w-5 h-5" />, { placeholder: 'Şirket adresi' })}
                            </>
                        )}

                        {/* Notification Preferences */}
                        <div className="pt-4 border-t border-[#E5E5E5]">
                            <div className="flex items-center gap-2 mb-3">
                                <Bell className="w-4 h-4 text-primary-500" />
                                <h2 className="text-sm font-black text-[#333333] uppercase tracking-wider">Bildirim Tercihleri</h2>
                            </div>
                            <div className="space-y-1">
                                {renderToggle('Kampanya E-postaları', 'Kampanya ve duyuru e-postaları', emailCampaignEnabled, setEmailCampaignEnabled)}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-base font-black mt-6 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all rounded-2xl tracking-widest"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    KAYDEDİLİYOR...
                                </span>
                            ) : 'KAYDET'}
                        </Button>
                    </form>

                    {/* Back Link */}
                    <button
                        type="button"
                        onClick={() => navigate.back()}
                        className="flex items-center gap-2 mx-auto mt-6 text-[#999999] text-sm font-medium hover:text-primary-500 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri Dön
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-[#AAAAAA] text-xs mt-6 font-medium">
                    © {new Date().getFullYear()} Yaman Filo. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    );
};
