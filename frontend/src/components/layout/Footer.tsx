import { Link } from 'react-router-dom';
import { Phone, MapPin, Instagram, Facebook } from 'lucide-react';
import logo from '../../assets/logo/logo.jpg';
import { useAppSelector } from '../../store/hooks';

export const Footer = () => {
    const { data: settingsData } = useAppSelector((state) => state.settings);
    const franchiseEnabled = settingsData.franchiseEnabled !== 'false';

    return (
        <footer className="bg-[#222222] border-t border-[#333333] text-gray-500 py-20 relative overflow-hidden font-sans">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 relative z-10">

                {/* Brand Identity Section */}
                <div className="col-span-1 lg:col-span-4 space-y-8">
                    <Link to="/" className="flex items-center gap-4 text-white font-black text-3xl group w-fit tracking-tighter">
                        <img src={logo} alt="Yaman Filo" className="w-12 h-12 rounded-2xl object-cover ring-1 ring-white/10 group-hover:ring-primary-500 transition-all shadow-2xl" />
                        <span>YAMAN<span className="text-primary-500"> FİLO</span></span>
                    </Link>
                    <p className="text-[#AAAAAA] leading-relaxed font-medium text-base max-w-sm">
                        Seçkinliğin ve güvenin buluştuğu nokta. Yaman Filo, premium kiralama standartlarını üstün asset güvenliği ve şeffaf hizmet anlayışıyla birleştirir.
                    </p>

                    <div className="flex gap-4">
                        {[
                            { icon: Instagram, href: "https://www.instagram.com/kiralamakguzeldir" },
                            { icon: Facebook, href: "https://www.facebook.com/yamanfilotr/" },
                        ].map((social, idx) => (
                            <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/[0.08] rounded-xl hover:bg-primary-500 text-gray-400 hover:text-white transition-all border border-white/10 group">
                                <social.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Navigation Sections */}
                <div className="col-span-1 lg:col-span-2 lg:pl-10">
                    <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                        <span className="w-4 h-px bg-primary-500" /> KURUMSAL
                    </h4>
                    <ul className="space-y-4">
                        {[
                            { label: 'Araç Filosu', to: '/#fleet' },
                            ...(franchiseEnabled ? [{ label: 'Franchise', to: '/franchise' }] : []),
                            { label: 'Hakkımızda', to: '/about' },
                        ].map((link, idx) => (
                            <li key={idx}>
                                <Link to={link.to} className="text-[#AAAAAA] hover:text-white transition-all text-sm font-bold flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500/0 group-hover:bg-primary-500 transition-all" />
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Legal & Trust Info */}
                <div className="col-span-1 lg:col-span-3">
                    <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                        <span className="w-4 h-px bg-primary-500" /> İLETİŞİM
                    </h4>
                    <ul className="space-y-6">
                        <li className="flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/10">
                                <MapPin className="w-4 h-4 text-primary-500" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Genel Merkez</span>
                                <span className="text-gray-300 text-sm font-medium leading-relaxed">Arda Mah. 3202 Sk. 7/C<br />Şehzadeler, Manisa</span>
                            </div>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/10">
                                <Phone className="w-4 h-4 text-primary-500" />
                            </div>
                            <div>
                                <span className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Destek Hattı</span>
                                <a href="tel:05462392626" className="text-white hover:text-primary-400 transition-colors text-lg font-black tracking-tight">0546 239 26 26</a>
                            </div>
                        </li>
                    </ul>
                </div>

                {/* Cinematic Google Map integration */}
                <div className="col-span-1 lg:col-span-3">
                    <h4 className="text-white font-black uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                        <span className="w-4 h-px bg-primary-500" /> KONUM
                    </h4>
                    <div className="aspect-video lg:aspect-square rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative group bg-[#222222]">
                        <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src="https://maps.google.com/maps?q=Arda+Mahallesi+3202+Sokak+7%2FC+Şehzadeler%2C+Manisa&t=&z=15&ie=UTF8&iwloc=&output=embed"
                            className="w-full h-full opacity-40 grayscale contrast-[1.1] brightness-[0.8] transition-all duration-1000 group-hover:opacity-80 group-hover:grayscale-0"
                            style={{ filter: 'invert(100%) hue-rotate(180deg) brightness(0.8) contrast(1.1)' }}
                        ></iframe>
                    </div>
                </div>
            </div>

            {/* Compliance Strip */}
            <div className="container mx-auto px-6 mt-20 pt-10 border-t border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        <span>MERSİS: 0123-4567-8901-2345</span>
                        <span>Vergi No: 9876543210</span>
                        <span>Yönetmelik Uyumluluğu: KVKK 6698</span>
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 tracking-tight group">
                        &copy; {new Date().getFullYear()} Yaman Filo. Seçkin yaşam tarzları için tasarlandı.
                        <Link to="/admin/login" className="ml-4 opacity-5 group-hover:opacity-50 transition-opacity hover:text-white">Admin</Link>
                    </p>
                </div>
            </div>
        </footer>
    );
};
