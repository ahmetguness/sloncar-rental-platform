import React, { useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Calendar, Users, Shield, AlertCircle, Trash2 } from 'lucide-react';
import type { UserInsurance } from '../../services/types';

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
                <div className="-mt-2 mb-6 flex items-center justify-between pb-4 border-b border-white/10 text-sm">
                    <span className="text-gray-400">Poliçe No: <span className="text-blue-400 font-mono font-bold">{insurance.policyNo}</span></span>
                    <span className="text-gray-400">Poliçe Ayı: <span className="text-white font-bold">{insurance.month}</span></span>
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
                                <p className="text-white font-medium">{insurance.fullName}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">TC Kimlik No</label>
                                <p className="text-white">{insurance.tcNo}</p>
                            </div>
                            {insurance.phone && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Telefon</label>
                                    <p className="text-white">{insurance.phone}</p>
                                </div>
                            )}
                            {insurance.profession && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Meslek</label>
                                    <p className="text-white">{insurance.profession}</p>
                                </div>
                            )}
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
                                <p className="text-white font-bold text-lg">{insurance.company}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Branş</label>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white">{insurance.branch}</span>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Tutar</label>
                                    <span className="text-sm font-bold text-blue-400">{Number(insurance.amount).toLocaleString()} ₺</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-white/5 mt-2 grid grid-cols-2 gap-4">
                                {insurance.plate && (
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Plaka</label>
                                        <p className="text-white font-mono">{insurance.plate}</p>
                                    </div>
                                )}
                                {insurance.serialOrOrderNo && (
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Seri No / Sıra No</label>
                                        <p className="text-white">{insurance.serialOrOrderNo}</p>
                                    </div>
                                )}
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
                            <p className="text-white font-medium">{new Date(insurance.startDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="text-gray-600">➝</div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Bitiş</label>
                            <p className="text-white font-medium">{endDate.toLocaleDateString('tr-TR')}</p>
                        </div>
                    </div>
                </div>

                {/* Description/Notes */}
                {insurance.description && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Açıklama / Kapsam Detayı</h3>
                        <div className="bg-dark-bg p-4 rounded-xl border border-white/5 text-sm text-gray-300">
                            {insurance.description}
                        </div>
                    </div>
                )}

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
                                <div className="flex gap-2">
                                    <Button onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                                        Kapat
                                    </Button>
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
