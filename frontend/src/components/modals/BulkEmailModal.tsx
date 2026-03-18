import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Mail, Send, Loader2, Users, Shield, Building2, User, Check } from 'lucide-react';
import { adminService } from '../../services/api';
import { useToast } from '../ui/Toast';

interface BulkEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TARGET_OPTIONS = [
    { key: 'ADMIN', label: 'Adminler', icon: <Shield className="w-4 h-4" />, color: 'text-red-500 bg-red-500/10 border-red-500/20' },
    { key: 'STAFF', label: 'Personel', icon: <Users className="w-4 h-4" />, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { key: 'INDIVIDUAL', label: 'Bireysel Üyeler', icon: <User className="w-4 h-4" />, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'CORPORATE', label: 'Kurumsal Üyeler', icon: <Building2 className="w-4 h-4" />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
];

export const BulkEmailModal = ({ isOpen, onClose }: BulkEmailModalProps) => {
    const { addToast: toast } = useToast();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [targets, setTargets] = useState<string[]>([]);
    const [sending, setSending] = useState(false);

    const toggleTarget = (key: string) => {
        setTargets(prev => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);
    };

    const selectAll = () => {
        if (targets.length === TARGET_OPTIONS.length) setTargets([]);
        else setTargets(TARGET_OPTIONS.map(t => t.key));
    };

    const handleSend = async () => {
        if (!subject.trim() || !body.trim() || targets.length === 0) return;
        setSending(true);
        try {
            const result = await adminService.sendBulkEmail({ subject: subject.trim(), body: body.trim(), targets });
            toast(`${result.data.sent} kişiye mail gönderildi`, 'success');
            setSubject('');
            setBody('');
            setTargets([]);
            onClose();
        } catch (err: any) {
            toast(err.response?.data?.message || 'Mail gönderilemedi', 'error');
        } finally {
            setSending(false);
        }
    };

    const isValid = subject.trim() && body.trim() && targets.length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Toplu Mail Gönder" size="lg">
            <div className="space-y-5">
                {/* Target Selection */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hedef Kitle</label>
                        <button type="button" onClick={selectAll}
                            className="text-xs font-medium text-primary-500 hover:underline">
                            {targets.length === TARGET_OPTIONS.length ? 'Hiçbirini Seçme' : 'Tümünü Seç'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {TARGET_OPTIONS.map(opt => {
                            const selected = targets.includes(opt.key);
                            return (
                                <button key={opt.key} type="button" onClick={() => toggleTarget(opt.key)}
                                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                                        selected
                                            ? `${opt.color} border-current`
                                            : 'text-gray-500 bg-black/[0.02] border-black/10 hover:border-black/20'
                                    }`}>
                                    {opt.icon}
                                    <span className="flex-1 text-left">{opt.label}</span>
                                    {selected && <Check className="w-4 h-4" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Subject */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Konu</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Mail konusu..."
                            className="w-full bg-black/[0.02] border border-black/10 rounded-xl pl-12 pr-4 py-3 text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                    </div>
                </div>

                {/* Body */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">İçerik</label>
                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        placeholder="Mail içeriğini yazın..."
                        rows={6}
                        className="w-full bg-black/[0.02] border border-black/10 rounded-xl px-4 py-3 text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={sending}
                        className="border-black/10 text-gray-600 hover:bg-black/5">
                        Vazgeç
                    </Button>
                    <Button onClick={handleSend} disabled={!isValid || sending}
                        className="bg-primary-500 hover:bg-primary-600 text-white border-none shadow-lg shadow-primary-500/20 font-bold gap-2">
                        {sending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                        ) : (
                            <><Send className="w-4 h-4" /> Gönder</>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
