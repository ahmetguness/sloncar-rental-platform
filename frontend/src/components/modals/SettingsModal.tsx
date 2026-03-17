import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Megaphone, AtSign } from 'lucide-react';

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
    const [emailEnabled, setEmailEnabled] = useState(user?.emailEnabled ?? false);

    useEffect(() => {
        if (user) {
            setWhatsappEnabled(user.whatsappEnabled ?? true);
            setEmailEnabled(user.emailEnabled ?? false);
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
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-black/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[#111111] font-bold text-sm">WhatsApp Bildirimleri</h3>
                            <p className="text-xs text-gray-600">Yeni rezervasyonlarda bildirim al</p>
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

                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-black/10 relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <AtSign className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[#111111] font-bold text-sm">E-posta Bildirimleri</h3>
                            <p className="text-xs text-gray-600">Yeni rezervasyon ve sigorta bildirimlerini e-posta ile al</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Yakında</span>
                        <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={emailEnabled}
                                disabled
                                onChange={(e) => setEmailEnabled(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
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
