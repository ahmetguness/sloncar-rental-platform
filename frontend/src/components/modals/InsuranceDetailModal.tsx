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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
                <div className="-mt-2 mb-6 flex flex-wrap gap-4 items-center justify-between pb-4 border-b border-white/10 text-sm">
                    {isEditing ? (
                        <>
                            <div className="flex-1 flex gap-2 items-center">
                                <span className="text-gray-400 shrink-0">Poliçe No:</span>
                                <input type="text" name="policyNo" value={formData.policyNo} onChange={handleChange} className="w-full bg-dark-bg border border-white/10 rounded px-2 py-1 text-blue-400 font-mono font-bold focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div className="flex-1 flex gap-2 items-center">
                                <span className="text-gray-400 shrink-0">Poliçe Ayı:</span>
                                <input type="text" name="month" value={formData.month} onChange={handleChange} className="w-full bg-dark-bg border border-white/10 rounded px-2 py-1 text-white uppercase focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-gray-400">Poliçe No: <span className="text-blue-400 font-mono font-bold">{insurance.policyNo}</span></span>
                            <span className="text-gray-400">Poliçe Ayı: <span className="text-white font-bold">{insurance.month}</span></span>
                        </>
                    )}
                </div>

                <div className="-mt-4 mb-6 text-xs text-gray-500 text-right">
                    {insurance.createdAt && (
                        <>
                            Oluşturulma: <span className="text-gray-300 font-medium">{new Date(insurance.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                    )}
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Müşteri Bilgileri</h3>
                        </div>
                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Ad Soyad</label>
                                {isEditing ? <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:ring-1 focus:ring-blue-500" /> : <p className="text-white font-medium">{insurance.fullName}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">TC Kimlik / VKN</label>
                                {isEditing ? <input type="text" name="tcNo" value={formData.tcNo} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:ring-1 focus:ring-blue-500" /> : <p className="text-white">{insurance.tcNo}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Telefon</label>
                                {isEditing ? <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:ring-1 focus:ring-blue-500" /> : <p className="text-white">{insurance.phone || '-'}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Meslek</label>
                                {isEditing ? <input type="text" name="profession" value={formData.profession || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:ring-1 focus:ring-blue-500" /> : <p className="text-white">{insurance.profession || '-'}</p>}
                            </div>
                            {insurance.user?.email && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Kayıtlı E-posta (Sistem)</label>
                                    <p className="text-gray-400">{insurance.user.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Policy Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-5 h-5 text-blue-500" />
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Poliçe Bilgileri</h3>
                        </div>
                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Sigorta Şirketi</label>
                                {isEditing ? <input type="text" name="company" value={formData.company} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-lg font-bold focus:ring-1 focus:ring-blue-500" /> : <p className="text-white font-bold text-lg">{insurance.company}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Branş</label>
                                    {isEditing ? (
                                        <select name="branch" value={formData.branch} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:ring-1 focus:ring-blue-500">
                                            <option value="TRAFIK">Trafik</option>
                                            <option value="KASKO">Kasko</option>
                                            <option value="DASK">DASK</option>
                                            <option value="KONUT">Konut</option>
                                            <option value="SAGLIK">Sağlık</option>
                                            <option value="DIGER">Diğer</option>
                                        </select>
                                    ) : (
                                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-white">{insurance.branch}</span>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Tutar</label>
                                    {isEditing ? <input type="number" step="0.01" name="amount" value={formData.amount} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-blue-400 font-bold text-sm focus:ring-1 focus:ring-blue-500" /> : <span className="text-sm font-bold text-blue-400">{Number(insurance.amount).toLocaleString()} ₺</span>}
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/5 mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Plaka</label>
                                    {isEditing ? <input type="text" name="plate" value={formData.plate || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white font-mono focus:ring-1 focus:ring-blue-500" /> : <p className="text-white font-mono">{insurance.plate || '-'}</p>}
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Seri No / Sıra No</label>
                                    {isEditing ? <input type="text" name="serialOrOrderNo" value={formData.serialOrOrderNo || ''} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:ring-1 focus:ring-blue-500" /> : <p className="text-white">{insurance.serialOrOrderNo || '-'}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Geçerlilik süresi (1 Yıl)</h3>
                    </div>

                    <div className="bg-dark-bg p-4 rounded-xl border border-white/5 flex justify-between items-center text-center">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Başlangıç</label>
                            {isEditing ? (
                                <DatePicker
                                    selected={formData.startDate ? new Date(formData.startDate as string) : null}
                                    onChange={(date: Date | null) => {
                                        if (date) {
                                            setFormData(prev => ({ ...prev, startDate: date.toISOString() }));
                                        }
                                    }}
                                    locale="tr"
                                    dateFormat="dd.MM.yyyy"
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-white focus:ring-1 focus:ring-blue-500"
                                />
                            ) : (
                                <p className="text-white font-medium">{new Date(insurance.startDate).toLocaleDateString('tr-TR')}</p>
                            )}
                        </div>
                        <div className="text-gray-600">➝</div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Bitiş</label>
                            <p className="text-white font-medium">
                                {isEditing && formData.startDate
                                    ? new Date(new Date(formData.startDate).setFullYear(new Date(formData.startDate).getFullYear() + 1)).toLocaleDateString('tr-TR')
                                    : endDate.toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Description/Notes */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Açıklama / Kapsam Detayı</h3>
                    {isEditing ? (
                        <textarea
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-dark-bg p-4 rounded-xl border border-white/10 text-sm text-white focus:ring-2 focus:ring-blue-500"
                        />
                    ) : insurance.description ? (
                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 text-sm text-gray-300">
                            {insurance.description}
                        </div>
                    ) : (
                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 text-sm text-gray-500 italic">
                            Açıklama bulunmuyor.
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    {currentUser?.role === 'ADMIN' ? (
                        isDeleting ? (
                            <div className="flex items-center gap-4 w-full justify-between bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-full">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Bu sigorta kaydını silmek istediğinize emin misiniz?</p>
                                        <p className="text-xs text-red-300">Bu işlem geri alınamaz.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setIsDeleting(false)}
                                        className="h-8 text-xs border-white/10 text-white hover:bg-white/10"
                                    >
                                        İptal
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleDelete}
                                        className="h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-none"
                                    >
                                        {isDeletingConfirmed ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Evet, Sil'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    {currentUser?.role === 'ADMIN' && (
                                        <Button
                                            onClick={() => setIsDeleting(true)}
                                            variant="outline"
                                            className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Sil
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button onClick={() => setIsEditing(false)} variant="outline" className="border-white/10 text-white hover:bg-white/10">
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
                                            <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                                                Kapat
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </>
                        )
                    ) : (
                        <div className="flex justify-end w-full">
                            <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
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
