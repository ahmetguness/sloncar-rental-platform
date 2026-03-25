"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, User, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '../../assets/logo/logo.jpg';
import { Footer } from './Footer';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../features/auth/authSlice';
import { carService } from '../../services/api';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { data: settingsData } = useAppSelector((state) => state.settings);
    const [hasSaleCars, setHasSaleCars] = useState(true);
    const pathname = usePathname() || '';
    const router = useRouter();
    const isAdmin = pathname.startsWith('/admin');

    const franchiseEnabled = settingsData.franchiseEnabled !== 'false';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Fetch sale car availability once on mount
        const checkSaleCars = async () => {
            try {
                const response = await carService.getAll({ limit: 1, page: 1, type: 'SALE' });
                setHasSaleCars(response.data.length > 0);
            } catch (error) {
                console.error('Failed to check sale cars', error);
                setHasSaleCars(false);
            }
        };
        checkSaleCars();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        const wasAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';
        await dispatch(logoutUser());
        if (wasAdmin) router.replace('/admin/login');
        else router.replace('/');
        setShowLogoutConfirm(false);
    };

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col font-sans overflow-x-hidden">
            {/* Header: Pure Luxury Dark Navigation */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || isMenuOpen ? 'bg-[#222222]/90 backdrop-blur-xl border-b border-[#E5E5E5] shadow-2xl' : (isAdmin ? 'bg-white/90 backdrop-blur-md border-b border-[#E5E5E5]' : 'bg-transparent')}`}>
                <div className="container mx-auto px-4 sm:px-6 py-5 flex items-center justify-between transition-all duration-300">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <img
                                src={logo.src}
                                alt="Yaman Filo"
                                className="w-11 h-11 rounded-xl object-cover ring-2 ring-primary-500/20 group-hover:ring-primary-500/60 transition-all duration-300 shadow-lg"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-md flex items-center justify-center shadow-sm">
                                <span className="text-white text-[6px] font-black">YF</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className={`font-black text-xl tracking-tight uppercase leading-none transition-colors duration-300 ${scrolled ? 'text-white' : 'text-[#111111]'}`}>
                                YAMAN<span className="text-primary-500"> FİLO</span>
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation: Upper-Right */}
                    <nav className="hidden md:flex items-center gap-10">
                        {!isAdmin ? (
                            <>
                                {[
                                    { label: 'Araçlar', to: '/#fleet' },
                                    ...(hasSaleCars ? [{ label: '2. El Satış', to: '/ikinci-el' }] : []),
                                    { label: 'Rezervasyonum', to: '/rezervasyonum' },
                                    ...(franchiseEnabled ? [{ label: 'Bayilik', to: '/bayilik' }] : []),
                                    { label: 'Hakkımızda', to: '/hakkimizda' },
                                ].map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.to}
                                        className={`text-sm font-black uppercase tracking-widest transition-all hover:translate-y-[-2px] active:scale-95 ${scrolled ? 'text-gray-400 hover:text-white' : 'text-[#777777] hover:text-[#111111]'}`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}

                                {/* Auth: Giriş / Üye Ol */}
                                {user ? (
                                    <div className="flex items-center gap-3 ml-2">
                                        <Link
                                            href="/profil"
                                            className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all hover:translate-y-[-2px] ${scrolled ? 'text-gray-400 hover:text-white' : 'text-[#777777] hover:text-[#111111]'}`}
                                        >
                                            <User className="w-4 h-4" />
                                            {user.name?.split(' ')[0]}
                                        </Link>
                                        <button
                                            onClick={() => setShowLogoutConfirm(true)}
                                            className={`p-2 rounded-lg transition-all hover:bg-red-500/10 ${scrolled ? 'text-gray-400 hover:text-red-400' : 'text-[#999999] hover:text-red-500'}`}
                                            title="Çıkış Yap"
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 ml-2">
                                        <Link
                                            href="/giris?tip=bireysel"
                                            className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border transition-all hover:translate-y-[-2px] active:scale-95 ${scrolled ? 'border-white/20 text-gray-300 hover:bg-white/10 hover:text-white' : 'border-[#E5E5E5] text-[#777777] hover:border-primary-500 hover:text-primary-500'}`}
                                        >
                                            <User className="w-4 h-4" />
                                            Bireysel
                                        </Link>
                                        <Link
                                            href="/giris?tip=kurumsal"
                                            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-primary-500 text-white px-4 py-2.5 rounded-xl hover:bg-primary-600 transition-all hover:translate-y-[-2px] active:scale-95 shadow-lg shadow-primary-500/20"
                                        >
                                            <Building2 className="w-4 h-4" />
                                            Kurumsal
                                        </Link>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${scrolled ? 'text-white' : 'text-[#111111]'}`}>{user?.name || 'Admin'}</span>
                                    <span className="text-primary-500 text-[9px] font-black uppercase tracking-[0.2em]">Yönetici Hesabı</span>
                                </div>
                                <button onClick={() => setShowLogoutConfirm(true)} className="p-2.5 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/20 transition-all border border-white/10">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className={`md:hidden p-3 rounded-2xl border transition-all active:scale-90 ${scrolled || isMenuOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-[#F5F5F5] border-[#E5E5E5] text-[#111111]'}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu: Luxury Dark Overlay */}
                {isMenuOpen && (
                    <div className="md:hidden fixed top-0 left-0 w-full h-screen bg-[#222222]/98 backdrop-blur-xl px-8 py-24 flex flex-col gap-8 z-[-1] animate-fade-in">
                        {!isAdmin ? (
                            <>
                                {[
                                    { label: 'Araç Filosu', to: '/#fleet' },
                                    ...(hasSaleCars ? [{ label: '2. El Satış', to: '/ikinci-el' }] : []),
                                    { label: 'Rezervasyon Sorgula', to: '/rezervasyonum' },
                                    ...(franchiseEnabled ? [{ label: 'Bayilik', to: '/bayilik' }] : []),
                                    { label: 'Hakkımızda', to: '/hakkimizda' },
                                ].map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.to}
                                        className="text-3xl font-black text-white uppercase tracking-tighter border-b border-white/10 pb-4"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}

                                {/* Mobile Auth Links */}
                                <div className="border-t border-white/10 pt-6 mt-2 flex flex-col gap-6">
                                    {user ? (
                                        <>
                                            <Link
                                                href="/profil"
                                                className="flex items-center gap-4 text-2xl font-black text-primary-500 uppercase tracking-tighter"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <User className="w-7 h-7" /> Profilim
                                            </Link>
                                            <button
                                                onClick={() => { setShowLogoutConfirm(true); setIsMenuOpen(false); }}
                                                className="flex items-center gap-4 text-2xl font-black text-red-400 uppercase tracking-tighter"
                                            >
                                                <LogOut className="w-7 h-7" /> Çıkış Yap
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/giris?tip=bireysel"
                                                className="flex items-center gap-4 text-2xl font-black text-white uppercase tracking-tighter"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <User className="w-7 h-7" /> Bireysel
                                            </Link>
                                            <Link
                                                href="/giris?tip=kurumsal"
                                                className="flex items-center gap-4 text-2xl font-black text-primary-500 uppercase tracking-tighter"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <Building2 className="w-7 h-7" /> Kurumsal
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-4 text-primary-500 text-3xl font-black uppercase tracking-tighter">
                                <LogOut className="w-8 h-8" /> Çıkış Yap
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-black/10" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                                <LogOut className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-[#111111] mb-2">Çıkış Yap</h3>
                            <p className="text-sm text-gray-500 mb-6">Oturumunuzu kapatmak istediğinize emin misiniz?</p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 py-3 rounded-xl border border-black/10 text-sm font-bold text-gray-600 hover:bg-black/5 transition-all"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                >
                                    Çıkış Yap
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-grow pt-0">
                {children}
            </main>

            {/* Footer */}
            {/* Footer */}
            {!isAdmin && <Footer />}
        </div>
    );
};
