import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '../../assets/logo/logo.jpg';
import { Footer } from './Footer';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../features/auth/authSlice';

export const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = location.pathname.startsWith('/admin');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);  // Run only once on mount — sale car availability rarely changes mid-session

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col font-sans overflow-x-hidden">
            {/* Header: Pure Luxury Dark Navigation */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || isMenuOpen ? 'bg-[#111111]/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl' : 'bg-transparent'}`}>
                <div className="container mx-auto px-6 py-5 flex items-center justify-between transition-all duration-300">
                    <Link to="/" className="flex items-center gap-4 group">
                        <img
                            src={logo}
                            alt="Yaman Filo"
                            className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-primary-500 transition-all shadow-2xl"
                        />
                        <span className="font-black text-2xl tracking-tighter text-white uppercase">
                            YAMAN<span className="text-primary-500"> FİLO</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation: Upper-Right */}
                    <nav className="hidden md:flex items-center gap-10">
                        {!isAdmin ? (
                            <>
                                {[
                                    { label: 'Araçlar', to: '/#fleet' },
                                    { label: '2. El Satış', to: '/second-hand' },
                                    { label: 'Rezervasyonum', to: '/my-booking' },
                                    { label: 'Franchise', to: '/franchise' },
                                ].map((link, idx) => (
                                    <Link
                                        key={idx}
                                        to={link.to}
                                        className="text-gray-400 hover:text-white text-sm font-black uppercase tracking-widest transition-all hover:translate-y-[-2px] active:scale-95"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className="text-white text-xs font-black uppercase tracking-widest">{user?.name || 'Admin'}</span>
                                    <span className="text-primary-500 text-[9px] font-black uppercase tracking-[0.2em]">Yönetici Hesabı</span>
                                </div>
                                <button onClick={handleLogout} className="p-2.5 bg-white/5 rounded-xl text-gray-400 hover:text-white hover:bg-red-500/20 transition-all border border-white/10">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-3 rounded-2xl bg-white/5 border border-white/10 text-white transition-all active:scale-90"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu: Luxury Dark Overlay */}
                {isMenuOpen && (
                    <div className="md:hidden fixed top-0 left-0 w-full h-screen bg-[#111111]/98 backdrop-blur-3xl px-8 py-24 flex flex-col gap-8 z-[-1] animate-fade-in">
                        {!isAdmin ? (
                            <>
                                {[
                                    { label: 'Araç Filosu', to: '/#fleet' },
                                    { label: '2. El Satış', to: '/second-hand' },
                                    { label: 'Rezervasyon Sorgula', to: '/my-booking' },
                                    { label: 'Franchise', to: '/franchise' },
                                ].map((link, idx) => (
                                    <Link
                                        key={idx}
                                        to={link.to}
                                        className="text-3xl font-black text-white uppercase tracking-tighter border-b border-white/5 pb-4"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <button onClick={handleLogout} className="flex items-center gap-4 text-primary-500 text-3xl font-black uppercase tracking-tighter">
                                <LogOut className="w-8 h-8" /> Çıkış Yap
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow pt-0">
                <Outlet />
            </main>

            {/* Footer */}
            {/* Footer */}
            {!isAdmin && <Footer />}
        </div>
    );
};
