"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { normalizeEmail } from '../utils/formatters';
import logo from '../assets/logo/logo.jpg';

export const ForgotPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        if (!email.trim()) {
            setErrorMessage('Lütfen e-posta adresinizi giriniz.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await authService.forgotPassword(email);
            setSuccessMessage(result.message);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Şifre sıfırlama talebi gönderilirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] relative overflow-hidden py-10">
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

                        <h1 className="text-2xl md:text-3xl font-black text-[#111111] mb-2 tracking-tight">
                            Şifremi Unuttum
                        </h1>
                        <p className="text-[#999999] text-sm font-medium">
                            Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
                        </p>
                    </div>

                    {/* Flash Messages */}
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            {successMessage}
                        </div>
                    )}

                    {/* Form */}
                    {!successMessage && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                                    E-posta <span className="text-red-400 ml-0.5">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">
                                        <Mail className="w-5 h-5" />
                                    </span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(normalizeEmail(e.target.value))}
                                        className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl px-4 py-3.5 pl-12 text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        placeholder="ornek@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit"
                                className="w-full h-14 text-base font-black mt-4 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all rounded-2xl tracking-widest"
                                disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        GÖNDERİLİYOR...
                                    </span>
                                ) : 'BAĞLANTI GÖNDER'}
                            </Button>
                        </form>
                    )}

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-[#777777] hover:text-[#111111] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Geri Dön
                        </button>
                    </div>
                </div>

                <p className="text-center text-[#AAAAAA] text-xs mt-6 font-medium">
                    © {new Date().getFullYear()} Yaman Filo. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    );
};
