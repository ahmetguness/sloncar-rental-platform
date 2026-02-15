import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminService, carService } from '../../services/api';
import logo from '../../assets/logo/logo.jpg';
import { Footer } from './Footer';

export const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [hasSaleCars, setHasSaleCars] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const isAdmin = location.pathname.startsWith('/admin');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Check for sale cars
        const checkSaleCars = async () => {
            try {
                const result = await carService.getAll({ type: 'SALE', limit: 1 });
                // Check if we have data and verify total > 0 or data length > 0
                // @ts-ignore - pagination might be optional in type but exists in response
                const total = result.pagination?.total ?? result.data?.length ?? 0;
                setHasSaleCars(total > 0);
            } catch (error) {
                console.error('Failed to check sale cars', error);
                setHasSaleCars(false);
            }
        };
        checkSaleCars();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    const handleLogout = () => {
        adminService.logout();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-dark-bg flex flex-col font-sans overflow-x-hidden">
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
                                {hasSaleCars && (
                                    <Link to="/second-hand" className={`font-medium transition-colors hover:text-primary-600 ${scrolled ? 'text-gray-600' : 'text-white/90'
                                        }`}>2. El Satış</Link>
                                )}
                                <Link to="/franchise" className={`font-medium transition-colors hover:text-primary-600 ${scrolled ? 'text-gray-600' : 'text-white/90'
                                    }`}>Franchise</Link>
                            </>
                        ) : (
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-primary-800 bg-primary-100 px-3 py-1.5 rounded-full tracking-wide">Yönetici Paneli</span>
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
                    <div className="md:hidden fixed top-[60px] left-0 w-full h-[calc(100vh-60px)] bg-dark-bg/95 backdrop-blur-xl border-t border-white/10 px-6 py-8 flex flex-col gap-6 shadow-2xl z-40 overflow-y-auto">
                        {!isAdmin ? (
                            <>
                                <Link to="/#fleet" className="block py-3 text-lg font-medium text-gray-200 border-b border-white/5 hover:text-primary-400" onClick={() => setIsMenuOpen(false)}>Araç Filosu</Link>
                                <Link to="/my-booking" className="block py-3 text-lg font-medium text-gray-200 border-b border-white/5 hover:text-primary-400" onClick={() => setIsMenuOpen(false)}>Rezervasyon Sorgula</Link>
                                {hasSaleCars && (
                                    <Link to="/second-hand" className="block py-3 text-lg font-medium text-gray-200 border-b border-white/5 hover:text-primary-400" onClick={() => setIsMenuOpen(false)}>2. El Satış</Link>
                                )}
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
            {/* Footer */}
            {!isAdmin && <Footer />}
        </div>
    );
};
