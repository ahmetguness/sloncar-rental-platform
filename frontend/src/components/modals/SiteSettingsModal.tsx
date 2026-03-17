import React, { useEffect, useState } from 'react';
import { settingsService } from '../../services/api';
import { useToast } from '../ui/Toast';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Loader2, Globe, Building2 } from 'lucide-react';
import { useAppDispatch } from '../../store/hooks';
import { setSettings as setReduxSettings } from '../../features/settings/settingsSlice';

interface SiteSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SiteSettingsModal: React.FC<SiteSettingsModalProps> = ({ isOpen, onClose }) => {
    const { addToast } = useToast();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [settings, setSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            const loadSettings = async () => {
                setFetching(true);
                try {
                    const data = await settingsService.getAll();
                    setSettings(data);
                } catch (error) {
                    console.error('Settings load error:', error);
                    addToast('Ayarlar yüklenemedi', 'error');
                } finally {
                    setFetching(false);
                }
            };
            loadSettings();
        }
    }, [isOpen, addToast]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatedSettings = await settingsService.update(settings);
            dispatch(setReduxSettings(updatedSettings));
            addToast('Site ayarları güncellendi', 'success');
            onClose();
        } catch (error) {
            addToast('Ayarlar kaydedilemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSetting = (key: string) => {
        setSettings(prev => ({
            ...prev,
            [key]: prev[key] === 'true' ? 'false' : 'true'
        }));
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Site Ayarları" size="sm">
            <div className="space-y-6">
                {fetching ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-primary-500 w-8 h-8" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-black/[0.02] rounded-xl border border-black/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-[#111111] font-bold text-sm">Franchise Menüsü</h3>
                                    <p className="text-xs text-gray-600">Navbarda Franchise linkini göster</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings['franchiseEnabled'] !== 'false'} // Default to true if not set
                                    onChange={() => toggleSetting('franchiseEnabled')}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        
                        <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] text-amber-700 font-medium">Bu ayarlar tüm ziyaretçiler için geçerlidir ve anında aktif olur.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                    <Button variant="outline" onClick={onClose}>İptal</Button>
                    <Button onClick={handleSave} disabled={loading || fetching} className="min-w-[100px]">
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Kaydet'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default SiteSettingsModal;
