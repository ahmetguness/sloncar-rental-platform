"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, clearError } from '../features/auth/authSlice';
import { Button } from '../components/ui/Button';
import { Lock, Mail, Eye, EyeOff, Shield, Check, Loader2 } from 'lucide-react';
import { normalizeEmail } from '../utils/formatters';
import logo from '../assets/logo/logo.jpg';

export const AdminLogin = () => {
    const navigate = useRouter();
    const dispatch = useAppDispatch();
    const { isAuthenticated, user, status, error } = useAppSelector((state) => state.auth);

    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

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
        return () => { dispatch(clearError()); }
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(loginUser({ ...credentials, rememberMe }));
    };

    const isLoading = status === 'loading';

    if (isAuthenticated) {
        return (
            <div className="min-h-screen bg-white pt-24 flex justify-center items-center">
                <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white p-6 md:p-10 rounded-3xl shadow-2xl shadow-black/5 border border-[#E5E5E5]">
                    {/* Header */}
                    <div className="text-center mb-8 md:mb-10">
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
                            <Shield className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-2xl md:text-3xl font-black text-[#111111] mb-2 tracking-tight">Yönetici Paneli</h1>
                        <p className="text-[#999999] text-sm font-medium">Devam etmek için giriş yapın</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                <Lock className="w-4 h-4" />
                            </div>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">E-posta</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] w-5 h-5" />
                                <input
                                    type="email"
                                    value={credentials.email}
                                    onChange={(e) => setCredentials({ ...credentials, email: normalizeEmail(e.target.value) })}
                                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl px-4 py-3.5 pl-12 text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] w-5 h-5" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={credentials.password}
                                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                    className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl px-4 py-3.5 pl-12 pr-12 text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#777777] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-primary-500 border-primary-500' : 'border-[#E5E5E5] bg-[#F5F5F5] group-hover:border-primary-500/50'}`}>
                                    {rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className={rememberMe ? 'text-[#111111] font-medium' : 'text-[#777777] group-hover:text-[#555555]'}>Oturumu açık tut</span>
                            </label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 text-base font-black mt-6 bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all rounded-2xl tracking-widest"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    GİRİŞ YAPILIYOR...
                                </span>
                            ) : 'GİRİŞ YAP'}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-[#AAAAAA] text-xs mt-6 font-medium">
                    © {new Date().getFullYear()} Yaman Filo. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    );
};
