import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, ChevronRight, Phone, MapPin, Instagram } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import logo from '../../assets/logo/logo.jpg';

export const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = location.pathname.startsWith('/admin');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        adminService.logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col font-sans">
            {/* Header */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || isMenuOpen ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
                }`}>
                <div className="container mx-auto px-6 h-14 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 group">
                        <img
                            src={logo}
                            alt="SlonCar Logo"
                            className={`w-10 h-10 rounded-xl object-cover transition-opacity ${scrolled || isMenuOpen ? 'opacity-100' : 'opacity-90'}`}
                        />
                        <span className={`font-bold text-2xl tracking-tight transition-colors ${scrolled || isMenuOpen ? 'text-gray-900' : 'text-white'
                            }`}>Slon<span className="text-primary-600">Car</span></span>
                    </Link>

                    {/* Desktop Utility Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {!isAdmin ? (
                            <>
                                <Link to="/#fleet" className={`font-medium transition-colors hover:text-primary-600 ${scrolled ? 'text-gray-600' : 'text-white/90'
                                    }`}>Araçlar</Link>
                                <Link to="/my-booking" className={`font-medium transition-colors hover:text-primary-600 ${scrolled ? 'text-gray-600' : 'text-white/90'
                                    }`}>Rezervasyonum</Link>
                                <Link to="/franchise" className={`font-medium transition-colors hover:text-primary-600 ${scrolled ? 'text-gray-600' : 'text-white/90'
                                    }`}>Franchise</Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-primary-800 bg-primary-100 px-3 py-1.5 rounded-full tracking-wide">ADMIN PANEL</span>
                                <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className={`md:hidden p-2 rounded-lg transition-colors ${scrolled || isMenuOpen ? 'text-gray-900' : 'text-white'
                            }`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-dark-surface/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col gap-4 shadow-2xl absolute w-full left-0">
                        {!isAdmin ? (
                            <>
                                <Link to="/#fleet" className="block py-3 text-lg font-medium text-gray-200 border-b border-white/5 hover:text-primary-400" onClick={() => setIsMenuOpen(false)}>Araç Filosu</Link>
                                <Link to="/my-booking" className="block py-3 text-lg font-medium text-gray-200 border-b border-white/5 hover:text-primary-400" onClick={() => setIsMenuOpen(false)}>Rezervasyon Sorgula</Link>
                                <Link to="/franchise" className="block py-3 text-lg font-medium text-gray-200 border-b border-white/5 hover:text-primary-400" onClick={() => setIsMenuOpen(false)}>Franchise Başvurusu</Link>
                            </>
                        ) : (
                            <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 py-3 font-medium hover:text-red-400">
                                <LogOut className="w-5 h-5" /> Çıkış Yap
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
            {!isAdmin && (
                <footer className="bg-dark-surface border-t border-white/5 text-gray-400 py-16 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-900/20 rounded-full blur-[128px] pointer-events-none" />

                    <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-12 relative z-10 w-full">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <Link to="/" className="flex items-center gap-3 text-white font-bold text-2xl group w-fit">
                                <img src={logo} alt="SlonCar" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-primary-500/50 transition-all" />
                                <span className="group-hover:text-glow transition-all">Slon<span className="text-primary-500">Car</span></span>
                            </Link>
                            <p className="max-w-sm text-gray-500 leading-relaxed text-sm">
                                Premium araç kiralama deneyimini yeniden tanımlıyoruz.
                                <br />Yüksek performans, maksimum konfor ve fütüristik tasarım.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em] text-primary-500">Hızlı Bağlantılar</h4>
                            <ul className="space-y-4 text-sm">
                                <li><Link to="/" className="hover:text-white hover:translate-x-1 transition-all duration-300 inline-block">Araçlar</Link></li>
                                <li><Link to="/my-booking" className="hover:text-white hover:translate-x-1 transition-all duration-300 inline-block">Rezervasyon Yönetimi</Link></li>
                                <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-300 inline-block">Kurumsal Kiralama</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em] text-primary-500">İletişim</h4>
                            <ul className="space-y-4 text-sm">
                                <li className="flex items-center gap-3 group">
                                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary-500/20 transition-colors">
                                        <Phone className="w-4 h-4 text-primary-400" />
                                    </div>
                                    <a href="tel:05462392626" className="group-hover:text-white transition-colors">0546 239 26 26</a>
                                </li>
                                <li className="flex items-center gap-3 group">
                                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary-500/20 transition-colors">
                                        <Instagram className="w-4 h-4 text-primary-400" />
                                    </div>
                                    <a href="https://www.instagram.com/kiralamakguzeldir?igsh=MXM5cnA0MGVyZnd5cQ%3D%3D" target="_blank" rel="noopener noreferrer" className="group-hover:text-white transition-colors">Instagram</a>
                                </li>
                                <li className="flex items-start gap-3 group">
                                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary-500/20 transition-colors mt-1">
                                        <MapPin className="w-4 h-4 text-primary-400" />
                                    </div>
                                    <span className="group-hover:text-white transition-colors max-w-[200px]">Arda Mahallesi 3202 Sokak 7/C Şehzadeler, Manisa</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-[0.2em] text-primary-500">Konum</h4>
                            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group h-[200px] w-full isolate">
                                {/* Overlay with Text */}
                                <a
                                    href="https://maps.google.com/maps?q=Arda+Mahallesi+3202+Sokak+7%2FC+Şehzadeler%2C+Manisa"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-dark-surface/60 group-hover:bg-transparent transition-all duration-500 z-20 flex items-center justify-center cursor-pointer"
                                >
                                    <div className="bg-dark/80 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 group-hover:opacity-0 transition-all duration-300 transform group-hover:scale-90 shadow-xl">
                                        <MapPin className="w-4 h-4 text-primary-500" />
                                        <span className="text-white text-xs font-bold tracking-wider">HARİTADA GÖSTER</span>
                                    </div>
                                </a>

                                {/* Map Iframe with Dark Mode Filter */}
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    src="https://maps.google.com/maps?q=Arda+Mahallesi+3202+Sokak+7%2FC+Şehzadeler%2C+Manisa&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                    className="w-full h-full transition-all duration-700 ease-in-out opacity-80 group-hover:opacity-100"
                                    style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%)' }}
                                ></iframe>
                            </div>
                        </div>
                    </div>
                    <div className="container mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
                        <p>&copy; 2026 SlonCar. Tüm hakları saklıdır.</p>
                        <Link to="/admin/login" className="hover:text-primary-500 transition-colors">Yönetici Girişi</Link>
                    </div>
                </footer>
            )}
        </div>
    );
};
