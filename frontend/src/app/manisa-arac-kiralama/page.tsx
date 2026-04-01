import { Metadata } from 'next';
import Link from 'next/link';
import { Layout } from '../../components/layout/Layout';
import { MapPin, Shield, Award, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Manisa Araç Kiralama | Yaman Filo Rent A Car',
  description:
    'Yaman Filo ile Manisa araç kiralama hizmetinden yararlanın. Günlük, haftalık ve uzun dönem rent a car seçenekleri ile uygun fiyatlı ve güvenilir araç kiralama.',
  alternates: {
    canonical: '/manisa-arac-kiralama',
  },
  openGraph: {
    title: 'Manisa Araç Kiralama | Yaman Filo Rent A Car',
    description:
      'Yaman Filo ile Manisa araç kiralama hizmetinden yararlanın. Günlük, haftalık ve uzun dönem rent a car seçenekleri.',
    url: 'https://yamanfilo.com/manisa-arac-kiralama',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};

export default function ManisaAracKiralamaPage() {
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
              <MapPin className="w-4 h-4" /> MANİSA
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#111111] tracking-tighter leading-[0.9] mb-8">
              Manisa Araç Kiralama
              <span className="block text-primary-500 mt-2">Yaman Filo Rent A Car</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#777777] max-w-2xl mx-auto leading-relaxed font-medium mb-10">
              Yaman Filo, Manisa&apos;da güvenilir ve ekonomik araç kiralama hizmeti sunan öncü bir firmadır. Geniş araç filomuzla ihtiyacınıza en uygun aracı kolayca kiralayabilirsiniz.
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
                Manisa&apos;da Güvenilir Araç Kiralama Hizmeti
              </h2>
              <p className="text-[#555555] text-base md:text-lg leading-relaxed font-medium">
                Yaman Filo olarak Manisa bölgesinde bireysel ve kurumsal müşterilerimize geniş araç filomuzla hizmet vermekteyiz. Ekonomik sınıftan premium segmente kadar her bütçeye uygun araç kiralama seçenekleri sunuyoruz. 2013 yılından bu yana sektördeki tecrübemizle, güvenilir ve şeffaf bir hizmet anlayışını benimsiyoruz.
              </p>
              <p className="text-[#555555] text-base md:text-lg leading-relaxed font-medium">
                Manisa araç kiralama hizmetimiz kapsamında günlük, haftalık ve aylık kiralama seçenekleri mevcuttur. Yaman Filo müşterilerine 7/24 yol yardım desteği, kapsamlı sigorta ve bakımlı araçlar sunarak seyahatlerinizi sorunsuz hale getirir.
              </p>
              <p className="text-[#555555] text-base md:text-lg leading-relaxed font-medium">
                Şehzadeler ve Yunusemre başta olmak üzere Manisa&apos;nın tüm ilçelerine hizmet veren Yaman Filo, kolay rezervasyon süreci ve rekabetçi fiyatlarıyla araç kiralama deneyiminizi kolaylaştırır.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: <Shield className="w-6 h-6" />, title: 'Kapsamlı Sigorta', desc: 'Tüm araçlarımız kasko ve zorunlu trafik sigortası ile korunmaktadır.' },
                { icon: <Award className="w-6 h-6" />, title: '10+ Yıl Tecrübe', desc: '2013 yılından bu yana Manisa araç kiralama sektöründe güvenilir hizmet.' },
                { icon: <MapPin className="w-6 h-6" />, title: 'Kolay Teslimat', desc: 'Manisa merkez ve çevresinde araç teslim ve iade kolaylığı.' },
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

                <Link href="/gunluk-arac-kiralama" className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-bold text-sm transition-colors">
                  Günlük Araç Kiralama →
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
