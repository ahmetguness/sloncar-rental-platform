import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '../../assets/logo/logo.jpg';
import { Footer } from './Footer';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser } from '../../features/auth/authSlice';
import { carService } from '../../services/api';

export const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { data: settingsData } = useAppSelector((state) => state.settings);
    const [hasSaleCars, setHasSaleCars] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = location.pathname.startsWith('/admin');

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

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col font-sans overflow-x-hidden">
            {/* Header: Pure Luxury Dark Navigation */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || isMenuOpen ? 'bg-[#222222]/90 backdrop-blur-xl border-b border-[#E5E5E5] shadow-2xl' : 'bg-transparent'}`}>
                <div className="container mx-auto px-4 sm:px-6 py-5 flex items-center justify-between transition-all duration-300">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <img
                                src={logo}
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
                            <span className={`text-[9px] font-bold tracking-[0.25em] uppercase leading-none mt-0.5 transition-colors duration-300 ${scrolled ? 'text-white/40' : 'text-[#999999]'}`}>OTOMOTİV</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation: Upper-Right */}
                    <nav className="hidden md:flex items-center gap-10">
                        {!isAdmin ? (
                            <>
                                {[
                                    { label: 'Araçlar', to: '/#fleet' },
                                    ...(hasSaleCars ? [{ label: '2. El Satış', to: '/second-hand' }] : []),
                                    { label: 'Rezervasyonum', to: '/my-booking' },
                                    ...(franchiseEnabled ? [{ label: 'Franchise', to: '/franchise' }] : []),
                                    { label: 'Hakkımızda', to: '/about' },
                                ].map((link, idx) => (
                                    <Link
                                        key={idx}
                                        to={link.to}
                                        className={`text-sm font-black uppercase tracking-widest transition-all hover:translate-y-[-2px] active:scale-95 ${scrolled ? 'text-gray-400 hover:text-white' : 'text-[#777777] hover:text-[#111111]'}`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </>
                        ) : (
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col items-end">
                                    <span className={`text-xs font-black uppercase tracking-widest transition-colors duration-300 ${scrolled ? 'text-white' : 'text-[#111111]'}`}>{user?.name || 'Admin'}</span>
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
                                    ...(hasSaleCars ? [{ label: '2. El Satış', to: '/second-hand' }] : []),
                                    { label: 'Rezervasyon Sorgula', to: '/my-booking' },
                                    ...(franchiseEnabled ? [{ label: 'Franchise', to: '/franchise' }] : []),
                                    { label: 'Hakkımızda', to: '/about' },
                                ].map((link, idx) => (
                                    <Link
                                        key={idx}
                                        to={link.to}
                                        className="text-3xl font-black text-white uppercase tracking-tighter border-b border-white/10 pb-4"
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
