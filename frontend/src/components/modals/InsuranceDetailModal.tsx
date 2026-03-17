import React, { useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Calendar, Users, Shield, AlertCircle, Trash2 } from 'lucide-react';
import type { UserInsurance } from '../../services/types';
import DatePicker, { registerLocale } from 'react-datepicker';
import { tr } from 'date-fns/locale/tr';
import "react-datepicker/dist/react-datepicker.css";

// Register Turkish locale
registerLocale('tr', tr);

interface InsuranceDetailModalProps {
    insurance: UserInsurance;
    onClose: () => void;
    onUpdate?: () => void;
    currentUser: any;
}

const inputClass = "w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[#111111] focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const InsuranceDetailModal: React.FC<InsuranceDetailModalProps> = ({ insurance, onClose, onUpdate, currentUser }) => {
    const { addToast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingConfirmed, setIsDeletingConfirmed] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<UserInsurance>>({
        fullName: insurance.fullName,
        tcNo: insurance.tcNo,
        phone: insurance.phone,
        profession: insurance.profession,
        company: insurance.company,
        branch: insurance.branch,
        amount: insurance.amount,
        plate: insurance.plate,
        serialOrOrderNo: insurance.serialOrOrderNo,
        description: insurance.description,
        startDate: insurance.startDate,
        month: insurance.month,
        policyNo: insurance.policyNo
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const dataToUpdate = {
                ...formData,
                amount: Number(formData.amount),
                startDate: new Date(formData.startDate as string).toISOString()
            };
            await adminService.updateInsurance(insurance.id, dataToUpdate);
            addToast('Sigorta kaydı başarıyla güncellendi', 'success');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Sigorta güncellenirken bir hata oluştu', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeletingConfirmed(true);
        try {
            await adminService.deleteInsurance(insurance.id);
            addToast('Sigorta kaydı başarıyla silindi', 'success');
            if (onUpdate) onUpdate();
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Sigorta silinirken bir hata oluştu', 'error');
            setIsDeletingConfirmed(false);
        }
    };

    const endDate = new Date(insurance.startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    return (
        <Modal isOpen={!!insurance} onClose={onClose} title="Sigorta Detayı" size="lg">
            <div className="space-y-8">
                {/* Header Info */}
                <div className="-mt-2 mb-6 flex flex-wrap gap-4 items-center justify-between pb-4 border-b border-[#E5E7EB] text-sm">
                    {isEditing ? (
                        <>
                            <div className="flex-1 flex gap-2 items-center">
                                <span className="text-[#6B7280] shrink-0">Poliçe No:</span>
                                <input type="text" name="policyNo" value={formData.policyNo} onChange={handleChange} className={inputClass + " font-mono font-bold"} />
                            </div>
                            <div className="flex-1 flex gap-2 items-center">
                                <span className="text-[#6B7280] shrink-0">Poliçe Ayı:</span>
                                <input type="text" name="month" value={formData.month} onChange={handleChange} className={inputClass + " uppercase"} />
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-[#6B7280]">Poliçe No: <span className="text-blue-600 font-mono font-bold">{insurance.policyNo}</span></span>
                            <span className="text-[#6B7280]">Poliçe Ayı: <span className="text-[#111111] font-bold">{insurance.month}</span></span>
                        </>
                    )}
                </div>

                <div className="-mt-4 mb-6 text-xs text-[#6B7280] text-right">
                    {insurance.createdAt && (
                        <>
                            Oluşturulma: <span className="text-[#374151] font-medium">{new Date(insurance.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                    )}
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-widest">Müşteri Bilgileri</h3>
                        </div>
                        <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] space-y-3">
                            <div>
                                <label className="text-xs text-[#9CA3AF] block mb-1">Ad Soyad</label>
                                {isEditing ? <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} /> : <p className="text-[#111111] font-medium">{insurance.fullName}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-[#9CA3AF] block mb-1">TC Kimlik / VKN</label>
                                {isEditing ? <input type="text" name="tcNo" value={formData.tcNo} onChange={handleChange} className={inputClass} /> : <p className="text-[#111111]">{insurance.tcNo}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-[#9CA3AF] block mb-1">Telefon</label>
                                {isEditing ? <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} /> : <p className="text-[#111111]">{insurance.phone || '-'}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-[#9CA3AF] block mb-1">Meslek</label>
                                {isEditing ? <input type="text" name="profession" value={formData.profession || ''} onChange={handleChange} className={inputClass} /> : <p className="text-[#111111]">{insurance.profession || '-'}</p>}
                            </div>
                            {insurance.user?.email && (
                                <div>
                                    <label className="text-xs text-[#9CA3AF] block mb-1">Kayıtlı E-posta (Sistem)</label>
                                    <p className="text-[#6B7280]">{insurance.user.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Policy Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-blue-500" />
                            <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-widest">Poliçe Bilgileri</h3>
                        </div>
                        <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] space-y-3">
                            <div>
                                <label className="text-xs text-[#9CA3AF] block mb-1">Sigorta Şirketi</label>
                                {isEditing ? <input type="text" name="company" value={formData.company} onChange={handleChange} className={inputClass + " text-lg font-bold"} /> : <p className="text-[#111111] font-bold text-lg">{insurance.company}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#9CA3AF] block mb-1">Branş</label>
                                    {isEditing ? (
                                        <select name="branch" value={formData.branch} onChange={handleChange} className={inputClass + " text-xs"}>
                                            <option value="TRAFIK">Trafik</option>
                                            <option value="KASKO">Kasko</option>
                                            <option value="DASK">DASK</option>
                                            <option value="KONUT">Konut</option>
                                            <option value="SAGLIK">Sağlık</option>
                                            <option value="DIGER">Diğer</option>
                                        </select>
                                    ) : (
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">{insurance.branch}</span>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-[#9CA3AF] block mb-1">Tutar</label>
                                    {isEditing ? <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className={inputClass + " font-bold text-sm"} /> : <span className="text-sm font-bold text-blue-600">{Number(insurance.amount).toLocaleString()} ₺</span>}
                                </div>
                            </div>
                            <div className="pt-2 border-t border-[#E5E7EB] mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[#9CA3AF] block mb-1">Plaka</label>
                                    {isEditing ? <input type="text" name="plate" value={formData.plate || ''} onChange={handleChange} className={inputClass + " font-mono"} /> : <p className="text-[#111111] font-mono">{insurance.plate || '-'}</p>}
                                </div>
                                <div>
                                    <label className="text-xs text-[#9CA3AF] block mb-1">Seri No / Sıra No</label>
                                    {isEditing ? <input type="text" name="serialOrOrderNo" value={formData.serialOrOrderNo || ''} onChange={handleChange} className={inputClass} /> : <p className="text-[#111111]">{insurance.serialOrOrderNo || '-'}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-widest">Geçerlilik süresi (1 Yıl)</h3>
                    </div>
                    <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] flex justify-between items-center text-center">
                        <div>
                            <label className="text-xs text-[#9CA3AF] block mb-1">Başlangıç</label>
                            {isEditing ? (
                                <DatePicker
                                    selected={formData.startDate ? new Date(formData.startDate as string) : null}
                                    onChange={(date: Date | null) => {
                                        if (date) setFormData(prev => ({ ...prev, startDate: date.toISOString() }));
                                    }}
                                    locale="tr"
                                    dateFormat="dd.MM.yyyy"
                                    className={inputClass}
                                />
                            ) : (
                                <p className="text-[#111111] font-medium">{new Date(insurance.startDate).toLocaleDateString('tr-TR')}</p>
                            )}
                        </div>
                        <div className="text-[#9CA3AF]">➝</div>
                        <div>
                            <label className="text-xs text-[#9CA3AF] block mb-1">Bitiş</label>
                            <p className="text-[#111111] font-medium">
                                {isEditing && formData.startDate
                                    ? new Date(new Date(formData.startDate).setFullYear(new Date(formData.startDate).getFullYear() + 1)).toLocaleDateString('tr-TR')
                                    : endDate.toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Description/Notes */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-widest">Açıklama / Kapsam Detayı</h3>
                    {isEditing ? (
                        <textarea
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            rows={3}
                            className={inputClass}
                        />
                    ) : insurance.description ? (
                        <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] text-sm text-[#374151]">
                            {insurance.description}
                        </div>
                    ) : (
                        <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] text-sm text-[#9CA3AF] italic">
                            Açıklama bulunmuyor.
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-[#E5E7EB]">
                    {currentUser?.role === 'ADMIN' ? (
                        isDeleting ? (
                            <div className="flex items-center gap-4 w-full justify-between bg-red-50 p-3 rounded-lg border border-red-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-full">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#111111]">Bu sigorta kaydını silmek istediğinize emin misiniz?</p>
                                        <p className="text-xs text-red-500">Bu işlem geri alınamaz.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setIsDeleting(false)} className="h-8 text-xs border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]">
                                        İptal
                                    </Button>
                                    <Button size="sm" onClick={handleDelete} className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-none">
                                        {isDeletingConfirmed ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Evet, Sil'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    <Button onClick={() => setIsDeleting(true)} variant="outline" className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100 flex items-center gap-2">
                                        <Trash2 className="w-4 h-4" />
                                        Sil
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button onClick={() => setIsEditing(false)} variant="outline" className="border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]">
                                                İptal
                                            </Button>
                                            <Button onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700" disabled={isSaving}>
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                Kaydet
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button onClick={() => setIsEditing(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                                                Düzenle
                                            </Button>
                                            <Button onClick={onClose} variant="outline" className="border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]">
                                                Kapat
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </>
                        )
                    ) : (
                        <div className="flex justify-end w-full">
                            <Button onClick={onClose} variant="outline" className="border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6]">
                                Kapat
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default InsuranceDetailModal;
