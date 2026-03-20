"use client";
import { Info, Target, Rocket, Shield, Users, Award, TrendingUp, Briefcase } from 'lucide-react';

export const About = () => {
    return (
        <div className="min-h-screen pt-24 pb-20 relative overflow-hidden font-sans selection:bg-primary-500/30">
            {/* Background Mesh Gradients */}
            <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[128px] animate-pulse pointer-events-none duration-[4000ms]" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[128px] animate-pulse pointer-events-none delay-1000 duration-[5000ms]" />

            <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-16 md:mb-24 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-primary-500 text-sm font-bold mb-6">
                        <Info size={16} /> BİZİ TANIYIN
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black text-[#111111] mb-6 tracking-tight drop-shadow-2xl">
                        Yaman<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-neon-purple">Filo</span> Hikayesi
                    </h1>
                    <p className="text-[#777777] text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-medium">
                        Otomotiv ve araç kiralama sektöründe güvenin ve kalitenin adresi.
                    </p>
                </div>

                {/* Main Content: Hakkımızda */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24 items-center">
                    <div className="lg:col-span-12 space-y-8 animate-fade-in-up delay-100">
                        <div className="bg-[#F5F5F5] rounded-[2.5rem] border border-[#E5E5E5] p-8 md:p-12 shadow-2xl relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-primary-500/10" />
                            
                            <h2 className="text-3xl md:text-4xl font-black text-[#111111] mb-8 flex items-center gap-4">
                                <span className="w-12 h-1 px-1 bg-primary-500 rounded-full" /> Hakkımızda
                            </h2>
                            
                            <div className="space-y-6 text-[#555555] text-lg leading-relaxed font-medium">
                                <p>
                                    Yaman Filo, 2013 yılında otomotiv ve araç kiralama sektöründe güvenilir hizmet sunma hedefiyle kurulmuştur. Kurulduğu günden bu yana müşteri memnuniyetini ve kaliteli hizmet anlayışını ön planda tutan Yaman Filo, 2017 yılında kurumsallaşma sürecini tamamlayarak Yaman Filo Otomotiv İnşaat Turizm İthalat ve İhracat Sanayi Ticaret Limited Şirketi çatısı altında faaliyetlerini sürdürmeye başlamıştır.
                                </p>
                                <p>
                                    2018 yılında Yaman Filo marka lisansının alınmasıyla birlikte, araç kiralama ve filo kiralama alanında kurumsal hizmetlerini daha da güçlendiren şirketimiz, bugün Manisa araç kiralama ve İzmir araç kiralama hizmetleri başta olmak üzere bireysel ve kurumsal müşterilerine profesyonel çözümler sunmaktadır.
                                </p>
                                <p>
                                    Şirketimiz bünyesinde faaliyet gösteren Yaman Filo, Sloncar ve ETC markaları ile otomotiv, araç kiralama ve mobilite hizmetleri alanında geniş bir hizmet ağı oluşturulmuştur. Tüm bu hizmetler Yaman Filo Otomotiv İnşaat Turizm İth. ve İhr. San. Tic. Ltd. Şti. tarafından yürütülmektedir.
                                </p>
                                <p>
                                    Manisa ‘da bulunan 2 şubemiz ile müşterilerimize günlük araç kiralama, uzun dönem araç kiralama, filo kiralama ve assistans (yol yardım) hizmetleri sunmaktayız. Modern araç filomuz ve deneyimli ekibimiz ile müşterilerimize güvenli, konforlu ve ekonomik çözümler sağlamayı hedefliyoruz.
                                </p>
                                <p>
                                    Yaman Filo, sektördeki tecrübesi, güçlü marka yapısı ve müşteri odaklı hizmet anlayışı ile otomotiv ve araç kiralama sektöründe güvenilir bir marka olarak büyümeye ve değer üretmeye devam etmektedir.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vision & Mission Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                    {/* Vision */}
                    <div className="bg-[#111111] rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden group shadow-2xl hover:-translate-y-2 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Target size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center mb-8 shadow-lg shadow-primary-500/20">
                                <Target size={28} />
                            </div>
                            <h3 className="text-3xl font-black mb-6 tracking-tight">Vizyonumuz</h3>
                            <p className="text-gray-400 text-lg leading-relaxed font-medium">
                                Otomotiv ve araç kiralama sektöründe güvenilirliği, kaliteli hizmet anlayışı ve güçlü marka yapısı ile tercih edilen; yenilikçi çözümleri ve sürdürülebilir büyüme yaklaşımıyla Manisa, İzmir ve Türkiye genelinde sektörün öncü markalarından biri olmak.
                            </p>
                        </div>
                    </div>

                    {/* Mission */}
                    <div className="bg-white rounded-[2rem] border border-[#E5E5E5] p-8 md:p-12 text-[#111111] relative overflow-hidden group shadow-2xl hover:-translate-y-2 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <Rocket size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-[#EEEEEE] flex items-center justify-center mb-8 border border-[#E5E5E5]">
                                <Rocket size={28} className="text-primary-500" />
                            </div>
                            <h3 className="text-3xl font-black mb-6 tracking-tight">Misyonumuz</h3>
                            <p className="text-[#777777] text-lg leading-relaxed font-medium">
                                Müşteri memnuniyetini her zaman ön planda tutarak; güvenilir, konforlu ve ekonomik araç kiralama ve filo çözümleri sunmak, modern araç filomuz ve profesyonel hizmet anlayışımız ile bireysel ve kurumsal müşterilerinin ihtiyaçlarına hızlı ve kaliteli çözümler üretmek.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Values Section */}
                <div className="mb-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black text-[#111111] tracking-tight mb-4 uppercase">DEĞERLERİMİZ</h2>
                        <p className="text-[#777777] font-bold tracking-widest uppercase text-xs">Yaman Filo'yu Biz Yapan İlkeler</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Shield size={24} />,
                                title: "Güvenilirlik",
                                desc: "Tüm hizmetlerimizde şeffaflık, dürüstlük ve güvenilirliği temel ilke olarak benimseriz. Müşterilerimizle uzun vadeli ve sağlam ilişkiler kurmayı hedefleriz."
                            },
                            {
                                icon: <Users size={24} />,
                                title: "Müşteri Memnuniyeti",
                                desc: "Müşterilerimizin ihtiyaçlarını doğru analiz ederek hızlı, kaliteli ve çözüm odaklı hizmet sunarız. Her zaman müşteri memnuniyetini ön planda tutarız."
                            },
                            {
                                icon: <Award size={24} />,
                                title: "Kaliteli Hizmet",
                                desc: "Modern ve bakımlı araç filomuz, deneyimli ekibimiz ve güçlü hizmet altyapımız ile kaliteli ve güvenli araç kiralama deneyimi sunarız."
                            },
                            {
                                icon: <TrendingUp size={24} />,
                                title: "Sürdürülebilir Büyüme",
                                desc: "Otomotiv ve araç kiralama sektöründeki gelişmeleri yakından takip ederek yenilikçi çözümler üretir ve markamızı sürdürülebilir şekilde büyütmeyi hedefleriz."
                            },
                            {
                                icon: <Briefcase size={24} />,
                                title: "Kurumsallık ve Profesyonellik",
                                desc: "Tüm faaliyetlerimizi kurumsal yönetim anlayışıyla yürütür, iş süreçlerimizde profesyonellik ve disiplin prensiplerine bağlı kalırız."
                            }
                        ].map((value, idx) => (
                            <div key={idx} className="bg-[#F5F5F5] border border-[#E5E5E5] p-10 rounded-[2.5rem] hover:bg-white hover:border-primary-500/30 transition-all duration-500 group shadow-sm hover:shadow-xl">
                                <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5E5] flex items-center justify-center mb-8 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500 shadow-sm">
                                    {value.icon}
                                </div>
                                <h4 className="text-xl font-black text-[#111111] mb-4 tracking-tight uppercase">{value.title}</h4>
                                <p className="text-[#777777] text-sm leading-relaxed font-medium">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
