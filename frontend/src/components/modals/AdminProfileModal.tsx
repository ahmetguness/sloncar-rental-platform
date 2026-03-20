"use client";
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import type { User } from '../../services/types';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, User as UserIcon, Mail, Phone } from 'lucide-react';
import { formatPhoneNumber, cleanPhoneNumber } from '../../utils/formatters';

interface AdminProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onUpdate: (user: User) => void;
}

const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) {
            addToast('Ad soyad zorunludur', 'error');
            return;
        }
        setLoading(true);
        try {
            const cleanedPhone = phone.replace(/\D/g, '');
            const res = await adminService.updateProfile({ name: name.trim(), phone: cleanedPhone || undefined });
            addToast('Profil güncellendi', 'success');
            onUpdate(res.data.user);
            onClose();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: { message?: string } } } };
            addToast(err.response?.data?.error?.message || 'Profil güncellenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Profilim" size="sm">
            <div className="space-y-5">
                {/* Ad Soyad */}
                <div>
                    <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                        Ad Soyad <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">
                            <UserIcon className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl px-4 py-3.5 pl-12 text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            placeholder="Adınız Soyadınız"
                        />
                    </div>
                </div>

                {/* E-posta (read-only) */}
                <div>
                    <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                        E-posta <span className="text-[#AAAAAA] ml-1 normal-case tracking-normal font-medium">(değiştirilemez)</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">
                            <Mail className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            value={user?.email || ''}
                            readOnly
                            className="w-full bg-[#EEEEEE] border border-[#E5E5E5] rounded-xl px-4 py-3.5 pl-12 text-[#888888] cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Telefon */}
                <div>
                    <label className="text-[10px] font-black text-[#777777] uppercase tracking-widest mb-2 block">
                        Telefon
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAAAAA]">
                            <Phone className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            value={formatPhoneNumber(phone)}
                            onChange={(e) => setPhone(cleanPhoneNumber(e.target.value))}
                            className="w-full bg-[#F5F5F5] border border-[#E5E5E5] rounded-xl px-4 py-3.5 pl-12 text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            placeholder="(5XX) XXX XX XX"
                        />
                    </div>
                </div>

                {/* Rol Bilgisi */}
                <div className="p-3 bg-[#F5F5F5] rounded-xl border border-[#E5E5E5]">
                    <p className="text-xs text-[#999999]">Rol</p>
                    <p className="text-sm font-bold text-[#333333]">
                        {user?.role === 'ADMIN' ? 'Yönetici' : 'Personel'}
                    </p>
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

export default AdminProfileModal;
