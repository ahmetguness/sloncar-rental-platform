import { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '../../components/layout/Layout';
import { Clock, Shield, Award, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Günlük Araç Kiralama | Yaman Filo Rent A Car',
  description:
    'Yaman Filo ile günlük araç kiralama hizmeti. Manisa\'da uygun fiyatlı, güvenilir ve hızlı günlük rent a car çözümleri.',
  alternates: {
    canonical: '/gunluk-arac-kiralama',
  },
  openGraph: {
    title: 'Günlük Araç Kiralama | Yaman Filo Rent A Car',
    description:
      'Yaman Filo ile günlük araç kiralama hizmeti. Manisa\'da uygun fiyatlı, güvenilir ve hızlı günlük rent a car çözümleri.',
    url: 'https://yamanfilo.com/gunluk-arac-kiralama',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function GunlukAracKiralamaPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative py-20 sm:py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 -left-1/4 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-500 text-sm font-bold mb-8">
              <Clock className="w-4 h-4" /> GÜNLÜK KİRALAMA
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#111111] tracking-tighter leading-[0.9] mb-8">
              Günlük Araç Kiralama
              <span className="block text-primary-500 mt-2">Yaman Filo ile Hızlı ve Kolay</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#777777] max-w-2xl mx-auto leading-relaxed font-medium mb-10">
              Yaman Filo&apos;nun günlük araç kiralama hizmetiyle ihtiyacınız olan aracı hızlıca kiralayın. Uygun fiyatlar, bakımlı araçlar ve profesyonel hizmet anlayışı.
            </p>
            <Link
              href="/#fleet"
              className="inline-flex items-center gap-2 bg-primary-500 text-white px-10 py-5 rounded-2xl font-black text-base shadow-lg shadow-primary-500/20 hover:bg-primary-600 hover:shadow-xl transition-all duration-500 tracking-widest"
            >
              ARAÇLARI İNCELE <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-4xl font-black text-[#111111] tracking-tight">
                Günlük Rent A Car Hizmeti
              </h2>
              <p className="text-[#555555] text-base md:text-lg leading-relaxed font-medium">
                Yaman Filo, Manisa'da günlük araç kiralama ihtiyaçlarınız için en uygun çözümleri sunar. İster iş toplantısı, ister kısa süreli seyahat olsun, geniş araç filomuzdan size en uygun aracı seçebilirsiniz. Tüm araçlarımız düzenli bakımdan geçirilmiş ve tam sigortalıdır.
              </p>
              <p className="text-[#555555] text-base md:text-lg leading-relaxed font-medium">
                Günlük araç kiralama hizmetimizde ekonomik, orta ve premium segment araçlar bulunmaktadır. Yaman Filo olarak rekabetçi fiyat politikamızla bütçenize uygun seçenekler sunuyoruz. Online rezervasyon sistemiyle hızlıca aracınızı ayırtabilirsiniz.
              </p>
              <p className="text-[#555555] text-base md:text-lg leading-relaxed font-medium">
                Günlük kiralama işlemlerinizde ekstra ücret veya gizli masraf bulunmamaktadır. Yaman Filo&apos;nun şeffaf fiyatlandırma politikasıyla güvenle kiralama yapabilirsiniz. 7/24 müşteri desteğimizle her zaman yanınızdayız.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Clock className="w-6 h-6" />, title: 'Hızlı Teslimat', desc: 'Dakikalar içinde aracınızı teslim alın, zaman kaybetmeyin.' },
                { icon: <Shield className="w-6 h-6" />, title: 'Tam Güvence', desc: 'Kapsamlı sigorta ve yol yardım hizmeti ile güvende olun.' },
                { icon: <Award className="w-6 h-6" />, title: 'Uygun Fiyat', desc: 'Günlük kiralama fiyatlarımızla bütçenizi koruyun.' },
              ].map((item, i) => (
                <div key={i} className="bg-[#F5F5F5] border border-[#E5E5E5] rounded-3xl p-8 hover:border-primary-500/30 hover:-translate-y-1 transition-all duration-500 group">
                  <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all duration-500 mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-black text-[#111111] mb-3">{item.title}</h3>
                  <p className="text-[#777777] text-sm font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Internal Links */}
            <div className="bg-[#F5F5F5] rounded-3xl border border-[#E5E5E5] p-8 md:p-12 space-y-4">
              <h3 className="text-xl font-black text-[#111111]">Diğer Hizmetlerimiz</h3>
              <div className="flex flex-wrap gap-4">
                <Link href="/manisa-arac-kiralama" className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-bold text-sm transition-colors">
                  Manisa Araç Kiralama →
                </Link>

                <Link href="/" className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-bold text-sm transition-colors">
                  Ana Sayfaya Dön →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
