import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';
import type { UserInsurance } from '../../services/types';

interface CreateInsuranceModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateInsuranceModal: React.FC<CreateInsuranceModalProps> = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<{ id: string; name: string; email: string; phone: string }[]>([]);

    const [formData, setFormData] = useState<Partial<UserInsurance>>({
        month: new Date().toLocaleString('tr-TR', { month: 'long' }).toUpperCase(),
        startDate: new Date().toISOString().split('T')[0],
        branch: 'TRAFIK',
        amount: 0,
        company: '',
        policyNo: '',
        tcNo: '',
        fullName: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await adminService.getUsers();
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSubmit = {
                ...formData,
                startDate: new Date(formData.startDate as string).toISOString(),
                amount: Number(formData.amount)
            };
            await adminService.createInsurance(dataToSubmit);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'phone' && typeof finalValue === 'string') {
            finalValue = formatPhoneNumber(cleanPhoneNumber(finalValue));
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    // Auto-fill User data when selected
    const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const userId = e.target.value;
        const selectedUser = users.find(u => u.id === userId);

        if (selectedUser) {
            setFormData(prev => ({
                ...prev,
                userId: userId,
                fullName: selectedUser.name,
                phone: selectedUser.phone || prev.phone
            }));
        } else {
            setFormData(prev => ({ ...prev, userId: undefined }));
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Sigorta Ekle" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Selection (Optional Link) */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Müşteri Bağla (İsteğe Bağlı)</label>
                        <select
                            name="userId"
                            className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500"
                            onChange={handleUserSelect}
                            value={formData.userId || ''}
                        >
                            <option value="">Seçiniz... (Sistem dışı müşteri için boş bırakın)</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>

                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">İsim Soyisim</label>
                        <input type="text" name="fullName" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.fullName || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">TC Kimlik No</label>
                        <input type="text" name="tcNo" required maxLength={11} className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.tcNo || ''} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Sigorta Şirketi</label>
                        <input type="text" name="company" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.company || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Poliçe No</label>
                        <input type="text" name="policyNo" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.policyNo || ''} />
                    </div>

                    {/* Dates & Financials */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Poliçe Ayı (Örn: OCAK)</label>
                        <input type="text" name="month" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white uppercase" onChange={handleChange} value={formData.month || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Başlangıç Tarihi</label>
                        <input type="date" name="startDate" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.startDate?.toString().split('T')[0]} />
                    </div>

                    {/* Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Branş</label>
                        <select name="branch" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.branch}>
                            <option value="TRAFIK">Trafik</option>
                            <option value="KASKO">Kasko</option>
                            <option value="DASK">DASK</option>
                            <option value="KONUT">Konut</option>
                            <option value="SAGLIK">Sağlık</option>
                            <option value="DIGER">Diğer</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tutar (TL)</label>
                        <input type="number" name="amount" required step="0.01" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.amount} />
                    </div>

                    {/* Extra Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Plaka</label>
                        <input type="text" name="plate" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white uppercase" onChange={handleChange} value={formData.plate || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Seri No / Sıra No</label>
                        <input type="text" name="serialOrOrderNo" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.serialOrOrderNo || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Telefon</label>
                        <input type="text" name="phone" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.phone || ''} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Meslek</label>
                        <input type="text" name="profession" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.profession || ''} />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Açıklama / Notlar</label>
                        <textarea name="description" rows={3} className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.description || ''} />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10 gap-3">
                    <Button type="button" onClick={onClose} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                        İptal
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateInsuranceModal;
