"use client";
import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Check } from 'lucide-react';

interface KVKKModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    customerName?: string;
}

export const KVKKModal: React.FC<KVKKModalProps> = ({
    isOpen,
    onClose,
    onAccept,
    customerName = ''
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Aydınlatma ve Açık Rıza Beyanı" size="lg">
            <div className="space-y-6">
                {/* Lawyer's Text in scrollable context */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 sm:p-6 text-gray-700 text-xs sm:text-sm leading-relaxed max-h-[50vh] overflow-y-auto space-y-4 custom-scrollbar">
                    <div className="text-center font-bold text-gray-900 border-b border-gray-200 pb-3 mb-4 uppercase">
                        KİŞİSEL VERİLERİN KORUNMASI VE AYDINLATMA / AÇIK RIZA METNİ<br />
                        <span className="text-[10px] text-gray-500 font-semibold">(6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında)</span>
                    </div>

                    <div>
                        <strong className="text-gray-950 block">Veri Sorumlusu:</strong>
                        <p className="font-semibold text-gray-800">Yaman Filo Otomotiv İnşaat Turizm İthalat ve İhracat San. Tic. Ltd. Şti. (“Şirket”)</p>
                    </div>

                    <p>
                        İşbu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, tarafınızdan paylaşılmış olan kişisel verilerin işlenmesine ilişkin bilgilendirme ve gerekli hallerde açık rızanızın alınması amacıyla hazırlanmıştır.
                    </p>

                    <div>
                        <strong className="text-gray-950 block mb-1">1. İşlenen Kişisel Veriler:</strong>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Kimlik bilgileri (ad, soyad, T.C. kimlik no, doğum tarihi vb.)</li>
                            <li>İletişim bilgileri (telefon, e-posta, adres vb.)</li>
                            <li>Araç kiralama / satış / hizmet işlem bilgileri</li>
                            <li>Finansal bilgiler (ödeme, IBAN, fatura bilgileri vb.)</li>
                            <li>Lokasyon bilgileri (gerekli hallerde araç takip sistemleri kapsamında)</li>
                            <li>Görsel ve işitsel kayıtlar</li>
                            <li>Talep, şikâyet ve müşteri işlem kayıtları</li>
                            <li>Hukuki işlem ve uyuşmazlık bilgileri</li>
                        </ul>
                    </div>

                    <div>
                        <strong className="text-gray-950 block mb-1">2. Kişisel Verilerin İşlenme Amaçları:</strong>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Araç kiralama, satış, sigorta ve ilgili hizmetlerin sunulması</li>
                            <li>Rezervasyon, teklif, sözleşme ve operasyon süreçlerinin yürütülmesi</li>
                            <li>Ödeme, tahsilat, muhasebe ve finans süreçlerinin yürütülmesi</li>
                            <li>Müşteri ilişkileri yönetimi ve destek hizmetleri</li>
                            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                            <li>Resmi kurum taleplerinin karşılanması</li>
                            <li>Hukuki uyuşmazlıkların çözümü, dava ve icra süreçlerinin yürütülmesi</li>
                            <li>Şirket güvenliği, denetim ve risk yönetimi</li>
                            <li>Kampanya, bilgilendirme ve pazarlama faaliyetleri (açık rıza halinde)</li>
                        </ul>
                    </div>

                    <div>
                        <strong className="text-gray-950 block mb-1">3. Kişisel Verilerin Aktarılması:</strong>
                        <p className="mb-1">Kişisel verileriniz, KVKK’nın 8. ve 9. maddeleri kapsamında, aşağıdaki kişi ve kurumlarla paylaşılabilecektir:</p>
                        <ul className="list-disc list-inside space-y-1 pl-2">
                            <li>Yetkili kamu kurum ve kuruluşları, mahkemeler ve icra müdürlükleri</li>
                            <li>Avukatlar, mali müşavirler, denetçiler ve danışmanlar</li>
                            <li>Bankalar, ödeme kuruluşları ve finans kuruluşları</li>
                            <li>Sigorta şirketleri ve aracılık hizmet sağlayıcıları</li>
                            <li>İş ortakları, tedarikçiler ve hizmet sağlayıcı firmalar</li>
                            <li>Bilgi teknolojileri, yazılım, sunucu ve veri barındırma hizmeti veren üçüncü kişiler</li>
                        </ul>
                    </div>

                    <div>
                        <strong className="text-gray-950 block mb-1">4. Hukuki Sebep ve Toplama Yöntemi:</strong>
                        <p>
                            Kişisel verileriniz; sözleşmenin kurulması veya ifası, yasal yükümlülüklerin yerine getirilmesi, meşru menfaat, açık rıza ve ilgili mevzuatta öngörülen diğer hukuki sebeplere dayanılarak; sözlü, yazılı, elektronik ortam, internet sitesi, çağrı merkezi, e-posta ve fiziki formlar aracılığıyla toplanabilir.
                        </p>
                    </div>

                    <div>
                        <strong className="text-gray-950 block mb-1">5. Veri Sahibinin Hakları:</strong>
                        <p className="mb-1">KVKK’nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, eksik/yanlış verilerin düzeltilmesini isteme, silinmesini veya yok edilmesini isteme ve zarara uğramanız halinde tazminat talep etme haklarına sahipsiniz.</p>
                    </div>

                    <div>
                        <strong className="text-gray-950 block mb-1">6. Açık Rıza Beyanı:</strong>
                        <p>
                            Tarafıma sunulan işbu metni okuduğumu, anladığımı; kişisel verilerimin yukarıda belirtilen amaçlarla işlenmesine, saklanmasına ve gerekli olduğu ölçüde üçüncü kişilerle paylaşılmasına özgür irademle açık rıza verdiğimi kabul ederim.
                        </p>
                    </div>

                    {/* Signature block inside the scroll area */}
                    <div className="border-t border-gray-200 pt-4 mt-6">
                        <div className="bg-white border border-gray-200/80 rounded-xl p-4 space-y-3">
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                                Onay Beyanı Bilgileri
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                <div className="space-y-1">
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ad Soyad</span>
                                    <span className="font-bold text-gray-800 break-words">{customerName || '—'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tarih</span>
                                    <span className="font-bold text-gray-800">{new Date().toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">İmza Durumu</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200/60">
                                        Onay Bekliyor
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500 text-center sm:text-left">
                        Butona tıkladığınızda bu metindeki şartları kabul etmiş olursunuz.
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
                            Kapat
                        </Button>
                        <Button onClick={onAccept} className="flex-1 sm:flex-initial gap-1 bg-[#111111] hover:bg-black text-white">
                            <Check size={16} /> Okudum, Onaylıyorum
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
