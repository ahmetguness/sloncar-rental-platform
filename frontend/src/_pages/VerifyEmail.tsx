"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { authService } from '../services/api';
import logo from '../assets/logo/logo.jpg';

type Status = 'loading' | 'success' | 'error';

export const VerifyEmail = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<Status>('loading');
    const [message, setMessage] = useState('');
    const [resendEmail, setResendEmail] = useState('');
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Geçersiz doğrulama bağlantısı. Token bulunamadı.');
            return;
        }

        authService.verifyEmail(token)
            .then((result) => {
                setStatus('success');
                setMessage(result.message);
            })
            .catch((err) => {
                setStatus('error');
                const msg = err?.response?.data?.message || 'Doğrulama işlemi başarısız oldu.';
                setMessage(msg);
            });
    }, [token]);

    const handleResend = async () => {
        if (!resendEmail.trim()) return;
        setResendStatus('sending');
        try {
            await authService.resendVerification(resendEmail.trim());
            setResendStatus('sent');
        } catch {
            setResendStatus('error');
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
                    </div>

                    {/* Status Content */}
                    {status === 'loading' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <h1 className="text-2xl font-black text-[#111111] mb-2">E-posta Doğrulanıyor</h1>
                            <p className="text-[#999999] text-sm">Lütfen bekleyin...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                <CheckCircle2 className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-[#111111] mb-2">Doğrulama Başarılı</h1>
                            <p className="text-[#666666] text-sm leading-relaxed mb-6">{message}</p>
                            <Link
                                href="/giris"
                                className="inline-block px-8 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all text-sm tracking-wide"
                            >
                                Giriş Yap
                            </Link>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                                <XCircle className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-[#111111] mb-2">Doğrulama Başarısız</h1>
                            <p className="text-[#666666] text-sm leading-relaxed mb-6">{message}</p>

                            {/* Resend verification */}
                            <div className="bg-[#F5F5F5] rounded-xl p-4 mb-6">
                                <p className="text-[#777777] text-xs mb-3">Yeni doğrulama bağlantısı almak için e-posta adresinizi girin:</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                                        <input
                                            type="email"
                                            value={resendEmail}
                                            onChange={(e) => setResendEmail(e.target.value)}
                                            placeholder="E-posta adresiniz"
                                            className="w-full bg-white border border-[#E5E5E5] rounded-lg px-3 py-2.5 pl-9 text-sm text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendStatus === 'sending' || !resendEmail.trim()}
                                        className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-all"
                                    >
                                        {resendStatus === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gönder'}
                                    </button>
                                </div>
                                {resendStatus === 'sent' && (
                                    <p className="text-green-600 text-xs mt-2">Doğrulama bağlantısı gönderildi.</p>
                                )}
                                {resendStatus === 'error' && (
                                    <p className="text-red-500 text-xs mt-2">Gönderilemedi. Lütfen tekrar deneyin.</p>
                                )}
                            </div>

                            <Link href="/giris" className="text-primary-500 font-bold hover:underline text-sm">
                                Giriş Sayfasına Dön
                            </Link>
                        </div>
                    )}
                </div>

                <p className="text-center text-[#AAAAAA] text-xs mt-6 font-medium">
                    © {new Date().getFullYear()} Yaman Filo. Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    );
};
