"use client";
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Megaphone, CalendarCheck, ShieldCheck, UserPlus } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUpdate: (user: any) => void;
}

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; color: string }> = ({ checked, onChange, color }) => {
    const ringClass = color === 'green' ? 'peer-focus:ring-green-200' : 'peer-focus:ring-blue-200';
    const bgClass = color === 'green' ? 'peer-checked:bg-green-600' : 'peer-checked:bg-blue-600';
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <div className={`w-11 h-6 bg-gray-300 rounded-full peer peer-focus:outline-none peer-focus:ring-4 ${ringClass} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${bgClass}`}></div>
        </label>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [whatsappEnabled, setWhatsappEnabled] = useState(user?.whatsappEnabled ?? true);
    const [emailBookingEnabled, setEmailBookingEnabled] = useState(user?.emailBookingEnabled ?? true);
    const [emailInsuranceEnabled, setEmailInsuranceEnabled] = useState(user?.emailInsuranceEnabled ?? true);
    const [emailEnabled, setEmailEnabled] = useState(user?.emailEnabled ?? true);

    useEffect(() => {
        if (user) {
            setWhatsappEnabled(user.whatsappEnabled ?? true);
            setEmailBookingEnabled(user.emailBookingEnabled ?? true);
            setEmailInsuranceEnabled(user.emailInsuranceEnabled ?? true);
            setEmailEnabled(user.emailEnabled ?? true);
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await adminService.updateProfile({ whatsappEnabled, emailBookingEnabled, emailInsuranceEnabled, emailEnabled });
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
        <Modal isOpen={isOpen} onClose={onClose} title="Bildirim Ayarları" size="sm">
            <div className="space-y-5">
                {/* WhatsApp */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-black/10 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-[#111111] font-bold text-sm flex items-center gap-2">
                                WhatsApp Bildirimleri
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Yakında</span>
                            </h3>
                            <p className="text-xs text-gray-500">Yeni rezervasyonlarda WhatsApp bildirimi</p>
                        </div>
                    </div>
                    <Toggle checked={false} onChange={() => {}} color="green" />
                </div>

                {/* E-posta Section */}
                <div className="rounded-xl border border-black/10 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-black/5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">E-posta Bildirimleri</p>
                    </div>

                    {/* Rezervasyon */}
                    <div className="flex items-center justify-between p-4 border-b border-black/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <CalendarCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[#111111] font-bold text-sm">Rezervasyon</h3>
                                <p className="text-xs text-gray-500">Yeni rezervasyon oluşturulduğunda</p>
                            </div>
                        </div>
                        <Toggle checked={emailBookingEnabled} onChange={setEmailBookingEnabled} color="blue" />
                    </div>

                    {/* Sigorta */}
                    <div className="flex items-center justify-between p-4 border-b border-black/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[#111111] font-bold text-sm">Sigorta Hatırlatması</h3>
                                <p className="text-xs text-gray-500">Bitimine 10 gün kala hatırlatma</p>
                            </div>
                        </div>
                        <Toggle checked={emailInsuranceEnabled} onChange={setEmailInsuranceEnabled} color="blue" />
                    </div>

                    {/* Üye Bildirimi */}
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-[#111111] font-bold text-sm">Yeni Üye Bildirimi</h3>
                                <p className="text-xs text-gray-500">Yeni üye kaydolduğunda bildirim</p>
                            </div>
                        </div>
                        <Toggle checked={emailEnabled} onChange={setEmailEnabled} color="blue" />
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
