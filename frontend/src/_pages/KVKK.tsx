"use client";
import React from 'react';

export const KVKK = () => {
    return (
        <div className="bg-white min-h-screen py-12 md:py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header Section */}
                <div className="text-center mb-12 border-b border-gray-100 pb-8">
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                        KİŞİSEL VERİLERİN KORUNMASI VE AYDINLATMA / AÇIK RIZA METNİ
                    </h1>
                    <p className="text-sm font-black text-primary-500 uppercase tracking-widest">
                        6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında
                    </p>
                </div>

                {/* Content Section */}
                <div className="space-y-8 text-gray-700 leading-relaxed text-sm md:text-base">
                    {/* Veri Sorumlusu */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h2 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-wider">Veri Sorumlusu:</h2>
                        <p className="font-bold text-gray-800">
                            Yaman Filo Otomotiv İnşaat Turizm İthalat ve İhracat San. Tic. Ltd. Şti.
                        </p>
                        <p className="text-sm text-gray-500 italic mt-1">(“Şirket” olarak anılacaktır.)</p>
                    </div>

                    <p className="font-medium text-gray-600">
                        İşbu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, tarafınızdan paylaşılmış olan kişisel verilerin işlenmesine ilişkin bilgilendirme ve gerekli hallerde açık rızanızın alınması amacıyla hazırlanmıştır.
                    </p>

                    {/* Section 1 */}
                    <section className="space-y-3">
                        <h3 className="text-base md:text-lg font-black text-gray-900 border-l-4 border-primary-500 pl-3">
                            1. İşlenen Kişisel Veriler
                        </h3>
                        <p>Şirketimiz tarafından aşağıdaki veriler işlenebilecektir:</p>
                        <ul className="list-disc list-inside space-y-2 pl-4 text-gray-600">
                            <li><strong>Kimlik bilgileri:</strong> Ad, soyad, T.C. kimlik no, doğum tarihi vb.</li>
                            <li><strong>İletişim bilgileri:</strong> Telefon, e-posta, adres vb.</li>
                            <li><strong>İşlem Bilgileri:</strong> Araç kiralama / satış / hizmet işlem bilgileri</li>
                            <li><strong>Finansal bilgiler:</strong> Ödeme, IBAN, fatura bilgileri vb.</li>
                            <li><strong>Lokasyon bilgileri:</strong> Gerekli hallerde araç takip sistemleri kapsamında</li>
                            <li>Görsel ve işitsel kayıtlar</li>
                            <li>Talep, şikâyet ve müşteri işlem kayıtları</li>
                            <li>Hukuki işlem ve uyuşmazlık bilgileri</li>
                        </ul>
                    </section>

                    {/* Section 2 */}
                    <section className="space-y-3">
                        <h3 className="text-base md:text-lg font-black text-gray-900 border-l-4 border-primary-500 pl-3">
                            2. Kişisel Verilerin İşlenme Amaçları
                        </h3>
                        <p>Kişisel verileriniz aşağıdaki amaçlarla işlenebilecektir:</p>
                        <ul className="list-disc list-inside space-y-2 pl-4 text-gray-600">
                            <li>Araç kiralama, satış, sigorta ve ilgili hizmetlerin sunulması</li>
                            <li>Rezervasyon, teklif, sözleşme ve operasyon süreçlerinin yürütülmesi</li>
                            <li>Ödeme, tahsilat, muamele ve finans süreçlerinin yürütülmesi</li>
                            <li>Müşteri ilişkileri yönetimi ve destek hizmetleri</li>
                            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                            <li>Resmi kurum taleplerinin karşılanması</li>
                            <li>Hukuki uyuşmazlıkların çözümü, dava ve icra süreçlerinin yürütülmesi</li>
                            <li>Şirket güvenliği, denetim ve risk yönetimi</li>
                            <li>Kampanya, bilgilendirme ve pazarlama faaliyetleri (açık rıza halinde)</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="space-y-3">
                        <h3 className="text-base md:text-lg font-black text-gray-900 border-l-4 border-primary-500 pl-3">
                            3. Kişisel Verilerin Aktarılması
                        </h3>
                        <p>Kişisel verileriniz, KVKK’nın 8. ve 9. maddeleri kapsamında, aşağıdaki kişi ve kurumlarla paylaşılabilecektir:</p>
                        <ul className="list-disc list-inside space-y-2 pl-4 text-gray-600">
                            <li>Yetkili kamu kurum ve kuruluşları</li>
                            <li>Mahkemeler, icra müdürlükleri, noterler ve resmi merciler</li>
                            <li>Avukatlar, mali müşavirler, denetçiler ve danışmanlar</li>
                            <li>Bankalar, ödeme kuruluşları ve finans kuruluşları</li>
                            <li>Sigorta şirketleri ve aracılık hizmet sağlayıcıları</li>
                            <li>İş ortakları, tedarikçiler ve hizmet sağlayıcı firmalar</li>
                            <li>Bilgi teknolojileri, yazılım, sunucu ve veri barındırma hizmeti veren üçüncü kişiler</li>
                            <li>Gerektiğinde grup şirketleri, iştirakler ve çözüm ortakları</li>
                            <li>Hukuki hakların tesisi, kullanılması veya korunması amacıyla ilgili üçüncü kişiler</li>
                        </ul>
                    </section>

                    {/* Section 4 */}
                    <section className="space-y-3">
                        <h3 className="text-base md:text-lg font-black text-gray-900 border-l-4 border-primary-500 pl-3">
                            4. Hukuki Sebep ve Toplama Yöntemi
                        </h3>
                        <p className="text-gray-600">
                            Kişisel verileriniz; sözleşmenin kurulması veya ifası, yasal yükümlülüklerin yerine getirilmesi, meşru menfaat, açık rıza ve ilgili mevzuatta öngörülen diğer hukuki sebeplere dayanılarak; sözlü, yazılı, elektronik ortam, internet sitesi, çağrı merkezi, e-posta, kamera kayıt sistemi ve fiziki formlar aracılığıyla toplanabilir.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="space-y-3">
                        <h3 className="text-base md:text-lg font-black text-gray-900 border-l-4 border-primary-500 pl-3">
                            5. Veri Sahibinin Hakları
                        </h3>
                        <p>KVKK’nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
                        <ul className="list-disc list-inside space-y-2 pl-4 text-gray-600">
                            <li>Kişisel verinizin işlenip işlenmediğini öğrenme</li>
                            <li>İşlenmişse bilgi talep etme</li>
                            <li>İşlenme amacını öğrenme</li>
                            <li>Yurt içinde / yurt dışında aktarıldığı kişileri öğrenme</li>
                            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
                            <li>Silinmesini veya yok edilmesini isteme</li>
                            <li>İşlemlerin aktarılan üçüncü kişilere bildirilmesini isteme</li>
                            <li>Otomatik sistemlerle analiz sonucu aleyhinize çıkan sonuca itiraz etme</li>
                            <li>Zarara uğramanız halinde tazminat talep etme</li>
                        </ul>
                    </section>

                    {/* Section 6 */}
                    <section className="space-y-3">
                        <h3 className="text-base md:text-lg font-black text-gray-900 border-l-4 border-primary-500 pl-3">
                            6. Açık Rıza Beyanı
                        </h3>
                        <p className="text-gray-600">
                            Tarafıma sunulan işbu metni okuduğumu, anladığımı; kişisel verilerimin yukarıda belirtilen amaçlarla işlenmesine, saklanmasına ve gerekli olduğu ölçüde üçüncü kişilerle paylaşılmasına özgür irademle açık rıza verdiğimi kabul ederim.
                        </p>
                    </section>

                    {/* Digital Signature Block */}
                    <div className="mt-12 bg-gray-50 rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-inner space-y-4">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-3">
                            Onay Beyanı Bilgileri
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                            <div className="space-y-1">
                                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider">Ad Soyad</span>
                                <span className="font-bold text-gray-800">—</span>
                            </div>
                            <div className="space-y-1">
                                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider">Tarih</span>
                                <span className="font-bold text-gray-800">{new Date().toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider">İmza Durumu</span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                                    Dijital Olarak Onaylanmıştır
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
