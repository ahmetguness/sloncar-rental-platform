import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
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
        isActive: true,
        paymentStatus: 'PAID',

        policyType: 'Trafik',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
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
            // Convert strings to numbers for financial fields
            const dataToSubmit = {
                ...formData,
                startDate: new Date(formData.startDate as string).toISOString(),
                endDate: new Date(formData.endDate as string).toISOString(),
                premiumAmount: Number(formData.premiumAmount),
                coverageLimit: Number(formData.coverageLimit),
                deductibleAmount: Number(formData.deductibleAmount),
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
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Sigorta Ekle" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* User Selection */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Kullanıcı</label>
                        <select
                            name="userId"
                            required
                            className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500"
                            onChange={handleChange}
                            value={formData.userId || ''}
                        >
                            <option value="">Seçiniz...</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                    </div>

                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Sigorta Şirketi</label>
                        <input type="text" name="companyName" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Poliçe No</label>
                        <input type="text" name="policyNumber" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>

                    {/* Dates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Başlangıç Tarihi</label>
                        <input type="date" name="startDate" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.startDate?.toString().split('T')[0]} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Bitiş Tarihi</label>
                        <input type="date" name="endDate" required className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.endDate?.toString().split('T')[0]} />
                    </div>

                    {/* Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Poliçe Türü</label>
                        <select name="policyType" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.policyType}>
                            <option value="Trafik">Trafik</option>
                            <option value="Kasko">Kasko</option>
                            <option value="Ferdi Kaza">Ferdi Kaza</option>
                            <option value="Konut">Konut</option>
                            <option value="DASK">DASK</option>
                            <option value="Sağlık">Sağlık</option>
                            <option value="Seyahat">Seyahat</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Ödeme Durumu</label>
                        <select name="paymentStatus" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} value={formData.paymentStatus}>
                            <option value="PAID">Ödendi</option>
                            <option value="UNPAID">Ödenmedi</option>
                            <option value="CANCELLED">İptal</option>
                        </select>
                    </div>

                    {/* Financials */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Prim Tutarı (₺)</label>
                        <input type="number" name="premiumAmount" step="0.01" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Teminat Limiti (₺)</label>
                        <input type="number" name="coverageLimit" step="0.01" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>

                    {/* Agent */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Acente Adı</label>
                        <input type="text" name="agentName" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Acente Tel</label>
                        <input type="text" name="agentPhone" className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
                    </div>

                    {/* Description */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Açıklama / Notlar</label>
                        <textarea name="description" rows={3} className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white" onChange={handleChange} />
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
