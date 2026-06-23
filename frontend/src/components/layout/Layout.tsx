"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, X, User, Building2, Phone } from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '../../assets/logo/logo.jpg';
import { Footer } from './Footer';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../features/auth/authSlice';
import { carService } from '../../services/api';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);

    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { data: settingsData } = useAppSelector((state) => state.settings);
    const [hasSaleCars, setHasSaleCars] = useState(false);
    const pathname = usePathname() || '';
    const router = useRouter();
    const isAdmin = pathname.startsWith('/admin');

    const franchiseEnabled = settingsData.franchiseEnabled !== 'false';

    useEffect(() => {
        setMounted(true);
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
                    <Link href="/" className="flex items-center gap-3 group" onClick={() => {
                        if (pathname === '/') {
                            window.dispatchEvent(new CustomEvent('reset-filters'));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }}>
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
                                {mounted && user ? (
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
                                ) : mounted ? (
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
                                ) : null}
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
                                    {mounted && user ? (
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

            {/* Floating Action Buttons for Call and WhatsApp */}
            {!isAdmin && (
                <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-3">
                    {/* Telefonla Ara Button */}
                    <a
                        href="tel:05462392626"
                        className="group flex items-center justify-center w-14 h-14 bg-primary-500 text-white rounded-full shadow-[0_8px_30px_rgba(227,6,19,0.3)] hover:shadow-[0_8px_30px_rgba(227,6,19,0.5)] transition-all duration-300 hover:scale-110 relative"
                        aria-label="Telefonla Ara"
                        title="Telefonla Ara"
                    >
                        {/* Tooltip */}
                        <span className="absolute right-16 bg-[#222222] text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-md border border-white/10">
                            Telefonla Ara
                        </span>
                        <Phone className="w-6 h-6 animate-pulse" />
                    </a>

                    {/* WhatsApp Button */}
                    <a
                        href="https://wa.me/905462392626"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.3)] hover:shadow-[0_8px_30px_rgba(37,211,102,0.5)] transition-all duration-300 hover:scale-110 relative"
                        aria-label="WhatsApp Destek"
                        title="WhatsApp Destek"
                    >
                        {/* Tooltip */}
                        <span className="absolute right-16 bg-[#222222] text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-md border border-white/10">
                            WhatsApp Destek
                        </span>
                        {/* WhatsApp Custom SVG Icon */}
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.364a9.92 9.92 0 0 0 4.804 1.233h.004c5.507 0 9.99-4.479 9.992-9.985.002-2.668-1.037-5.176-2.927-7.07C17.186 2.92 14.68 2.001 12.012 2zm5.727 14.043c-.315.89-.927 1.6-1.745 2.033-.426.223-.88.358-1.346.4-1.258.115-2.522-.193-3.666-.867a10.82 10.82 0 0 1-4.22-4.218 8.16 8.16 0 0 1-.958-3.048c-.027-.852.274-1.684.857-2.3.208-.219.46-.388.74-.492.203-.075.418-.112.634-.11h.466c.153.003.303.048.43.13.178.113.313.284.382.484.288.706.672 1.383 1.144 2.014.12.16.173.36.143.559a.86.86 0 0 1-.363.535l-.578.434c-.16.12-.227.332-.162.524.364.717.854 1.372 1.45 1.93.567.534 1.217.962 1.927 1.267.185.08.402.03.535-.12l.537-.537c.137-.137.333-.204.526-.18.66.082 1.312.247 1.938.491.226.087.397.27.467.502.262.868.106 1.796-.425 2.534z" />
                        </svg>
                    </a>
                </div>
            )}

            {/* Footer */}
            {/* Footer */}
            {!isAdmin && <Footer />}
        </div>
    );
};
