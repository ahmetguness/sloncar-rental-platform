import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Megaphone } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onUpdate: (user: any) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [whatsappEnabled, setWhatsappEnabled] = useState(user?.whatsappEnabled ?? true);

    useEffect(() => {
        if (user) {
            setWhatsappEnabled(user.whatsappEnabled ?? true);
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await adminService.updateProfile({ whatsappEnabled });
            addToast('Ayarlar güncellendi', 'success');
            onUpdate(res.data.user);
            onClose();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            addToast(error.response?.data?.error?.message || 'Ayarlar güncellenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Profil Ayarları" size="sm">
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-dark-bg rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">WhatsApp Bildirimleri</h3>
                            <p className="text-xs text-gray-400">Yeni rezervasyonlarda bildirim al</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={whatsappEnabled}
                            onChange={(e) => setWhatsappEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>İptal</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'Kaydet'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
