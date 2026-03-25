"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import logo from '../assets/logo/logo.jpg';

const ResetPasswordContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setErrorMessage('Geçersiz veya eksik şifre sıfırlama bağlantısı. Lütfen e-postanızdaki bağlantıya tekrar tıklayın.');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        if (!token) {
            setErrorMessage('Geçersiz token.');
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage('Şifre en az 8 karakter olmalıdır.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Şifreler eşleşmiyor.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await authService.resetPassword({ token, newPassword });
            setSuccessMessage(result.message);
            // After 3 seconds, redirect to appropriate login
            setTimeout(() => {
                if (result.user.role === 'ADMIN' || result.user.role === 'STAFF') {
                    router.push('/admin/login');
                } else if (result.user.membershipType === 'CORPORATE') {
                    router.push('/giris?tip=kurumsal');
                } else {
                    router.push('/giris'); // Bireysel is default
                }
            }, 3000);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Şifre sıfırlanırken bir hata oluştu.');
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
                            Yeni Şifre Belirle
                        </h1>
                        <p className="text-[#999999] text-sm font-medium">
                            Hesabınız için yeni bir şifre belirleyin. Şifrenizin en az 8 karakter uzunluğunda olmasına dikkat edin.
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
                            <div>
                                <p>{successMessage}</p>
                                <p className="text-xs mt-1 opacity-80">Giriş sayfasına yönlendiriliyorsunuz...</p>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    {!successMessage && token && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                                    Yeni Şifre <span className="text-red-400 ml-0.5">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">
                                        <Lock className="w-5 h-5" />
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl px-4 py-3.5 pl-12 pr-12 text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#777777] transition-colors">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                                    Yeni Şifre (Tekrar) <span className="text-red-400 ml-0.5">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">
                                        <Lock className="w-5 h-5" />
                                    </span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl px-4 py-3.5 pl-12 pr-12 text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            <Button type="submit"
                                className="w-full h-14 text-base font-black mt-4 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all rounded-2xl tracking-widest"
                                disabled={isLoading}>
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        SIFIRLANIYOR...
                                    </span>
                                ) : 'ŞİFREYİ SIFIRLA'}
                            </Button>
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

export const ResetPassword = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
};
