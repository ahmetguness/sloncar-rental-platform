import { Link } from 'react-router-dom';
import { Phone, MapPin, Instagram, Facebook } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import logo from '../../assets/logo/logo.jpg';

export const Footer = () => {
    const { isAuthenticated } = useAppSelector((state) => state.auth);

    return (
        <footer className="bg-dark-surface border-t border-white/5 text-gray-400 py-16 relative overflow-hidden font-sans">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-900/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 relative z-10 w-full text-sm">

                {/* Brand Section - Takes 4 cols on large */}
                <div className="col-span-1 lg:col-span-4 space-y-6">
                    <Link to="/" className="flex items-center gap-3 text-white font-bold text-2xl group w-fit">
                        <img src={logo} alt="SlonCar" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-primary-500/50 transition-all" />
                        <span className="group-hover:text-glow transition-all">Slon<span className="text-primary-500">Car</span></span>
                    </Link>
                    <p className="text-gray-500 leading-relaxed font-light pr-4">
                        Premium araç kiralama deneyimini yeniden tanımlıyoruz.
                        Yüksek performans, maksimum konfor ve fütüristik tasarım anlayışıyla yolculuğunuzu sanata dönüştürüyoruz.
                    </p>

                    {/* Socials - Moved here for better balance */}
                    <div className="flex gap-3 pt-2">
                        {[
                            { icon: Instagram, href: "https://www.instagram.com/kiralamakguzeldir" },
                            { icon: Facebook, href: "https://www.facebook.com/sloncartr/" },
                        ].map((social, idx) => (
                            <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 rounded-xl hover:bg-primary-500 hover:text-white transition-all hover:-translate-y-1 border border-white/5 group">
                                <social.icon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                            </a>
                        ))}
                    </div>


                </div>

                {/* Quick Links - Takes 2 cols on large */}
                <div className="col-span-1 lg:col-span-2 lg:pl-8">
                    <h4 className="text-white font-bold mb-6 text-sm">Hızlı Menü</h4>
                    <ul className="space-y-3">
                        {[
                            { label: 'Araç Filosu', to: '/#fleet' },
                            { label: 'Rezervasyon Sorgula', to: '/my-booking' },
                            { label: 'Franchise', to: '/franchise' },
                        ].map((link, idx) => (
                            <li key={idx}>
                                <Link to={link.to} className="text-gray-500 hover:text-white hover:translate-x-1 transition-all duration-300 flex items-center gap-2 group w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500/50 group-hover:bg-primary-400 transition-colors"></span>
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact - Takes 3 cols on large */}
                <div className="col-span-1 lg:col-span-3">
                    <h4 className="text-white font-bold mb-6 text-sm">İletişim Bilgileri</h4>
                    <ul className="space-y-5">
                        <li className="flex items-start gap-4 group">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 group-hover:border-primary-500/30 transition-colors shrink-0">
                                <Phone className="w-4 h-4 text-primary-400" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Telefon</span>
                                <a href="tel:05462392626" className="text-gray-300 group-hover:text-white transition-colors font-medium">0546 239 26 26</a>
                            </div>
                        </li>
                        <li className="flex items-start gap-4 group">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 group-hover:border-primary-500/30 transition-colors shrink-0">
                                <MapPin className="w-4 h-4 text-primary-400" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-gray-400 mb-0.5 uppercase tracking-wider">Adres</span>
                                <span className="text-gray-300 group-hover:text-white transition-colors block font-medium leading-snug">Arda Mah. 3202 Sk. 7/C<br />Şehzadeler, Manisa</span>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Map - Takes 3 cols on large */}
                <div className="col-span-1 lg:col-span-3">
                    <h4 className="text-white font-bold mb-6 text-sm">Konum</h4>
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg relative group h-[220px] w-full isolate transform transition-transform hover:shadow-primary-900/20">
                        <a
                            href="https://maps.google.com/maps?q=Arda+Mahallesi+3202+Sokak+7%2FC+Şehzadeler%2C+Manisa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-dark-surface/40 group-hover:bg-transparent transition-all duration-500 z-20 flex items-center justify-center cursor-pointer"
                        >
                            <div className="bg-dark/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-full flex items-center gap-2 group-hover:opacity-0 transition-all duration-300 transform group-hover:translate-y-4 shadow-xl">
                                <MapPin className="w-3.5 h-3.5 text-primary-500" />
                                <span className="text-white text-[10px] font-bold tracking-wider">HARİTADA AÇ</span>
                            </div>
                        </a>
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src="https://maps.google.com/maps?q=Arda+Mahallesi+3202+Sokak+7%2FC+Şehzadeler%2C+Manisa&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            className="w-full h-full transition-all duration-700 ease-in-out opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100"
                            style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%)' }}
                        ></iframe>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
                <p>&copy; {new Date().getFullYear()} SlonCar. Tüm hakları saklıdır.</p>
                <div className="flex gap-6">
                    <Link to="#" className="hover:text-white transition-colors">Gizlilik Politikası</Link>
                    <Link to="#" className="hover:text-white transition-colors">Kullanım Şartları</Link>
                    {isAuthenticated ? (
                        <Link to="/admin/dashboard" className="hover:text-primary-500 transition-colors">Yönetici Paneli</Link>
                    ) : (
                        <Link to="/admin/login" className="hover:text-primary-500 transition-colors">Yönetici Girişi</Link>
                    )}
                </div>
            </div>
        </footer>
    );
};
