import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignService } from '../services/campaign.service';
import { uploadService } from '../services/api';
import type { Campaign } from '../services/campaign.service';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Loader2, Plus, Edit2, Trash2, ArrowLeft, Save, Eye, EyeOff, Upload, X } from 'lucide-react';
import { Input } from '../components/ui/Input';

export const AdminCampaigns = () => {
    const { addToast } = useToast();
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [formData, setFormData] = useState<Partial<Campaign>>({
        title: '',
        description: '',
        imageUrl: '',
        isActive: true
    });
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const data = await campaignService.getAll();
            setCampaigns(data);
        } catch (error) {
            addToast('Kampanyalar yüklenirken hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setFormData({
            title: campaign.title,
            description: campaign.description,
            imageUrl: campaign.imageUrl,
            isActive: campaign.isActive
        });
        setPreviewUrl(campaign.imageUrl);
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingCampaign(null);
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
            isActive: true
        });
        setPreviewUrl(null);
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
        try {
            await campaignService.delete(id);
            addToast('Kampanya silindi', 'success');
            loadCampaigns();
        } catch (error) {
            addToast('Silme işlemi başarısız', 'error');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let finalImageUrl = formData.imageUrl;

            if (imageFile) {
                try {
                    finalImageUrl = await uploadService.uploadImage(imageFile);
                } catch (error) {
                    addToast('Görsel yüklenemedi', 'error');
                    setSaving(false);
                    return;
                }
            }

            const dataToSubmit = { ...formData, imageUrl: finalImageUrl };

            if (!dataToSubmit.imageUrl) {
                addToast('Lütfen bir görsel seçin', 'error');
                setSaving(false);
                return;
            }

            if (editingCampaign) {
                await campaignService.update(editingCampaign.id, dataToSubmit);
                addToast('Kampanya güncellendi', 'success');
            } else {
                await campaignService.create(dataToSubmit as any);
                addToast('Kampanya oluşturuldu', 'success');
            }
            setIsModalOpen(false);
            loadCampaigns();
        } catch (error) {
            addToast('İşlem başarısız', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (campaign: Campaign) => {
        try {
            await campaignService.update(campaign.id, { isActive: !campaign.isActive });
            addToast('Durum güncellendi', 'success');
            loadCampaigns();
        } catch (error) {
            addToast('Durum güncellenemedi', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg p-6 pt-24 pb-20">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <Link to="/admin/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Dashboard'a Dön
                        </Link>
                        <h1 className="text-3xl font-bold text-white">Kampanya Yönetimi</h1>
                        <p className="text-gray-400 mt-1">Anasayfa banner alanını yönetin</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Yeni Kampanya
                    </Button>
                </div>

                {/* Content */}
                <div className="bg-dark-surface border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider text-left">
                                    <tr>
                                        <th className="p-4">Görsel</th>
                                        <th className="p-4">Başlık / Açıklama</th>
                                        <th className="p-4">Durum</th>
                                        <th className="p-4 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {campaigns.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                Henüz kampanya eklenmemiş.
                                            </td>
                                        </tr>
                                    ) : (
                                        campaigns.map((campaign) => (
                                            <tr key={campaign.id} className="hover:bg-white/5 transition-colors">
                                                <td className="p-4">
                                                    <img src={campaign.imageUrl} alt={campaign.title} className="w-24 h-16 object-cover rounded-lg border border-white/10" />
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{campaign.title}</div>
                                                    <div className="text-sm text-gray-400 truncate max-w-xs">{campaign.description}</div>
                                                </td>
                                                <td className="p-4">
                                                    <button onClick={() => toggleStatus(campaign)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${campaign.isActive
                                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                                                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20 hover:bg-gray-500/20'
                                                        }`}>
                                                        {campaign.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                        {campaign.isActive ? 'Aktif' : 'Pasif'}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right space-x-2">
                                                    <button onClick={() => handleEdit(campaign)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Düzenle">
                                                        <Edit2 className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(campaign.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Sil">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCampaign ? 'Kampanyayı Düzenle' : 'Yeni Kampanya'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Başlık"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="bg-dark-bg border-white/10 text-white"
                    />
                    <div className="space-y-1">
                        <label className="text-sm text-gray-400">Açıklama</label>
                        <textarea
                            className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 h-24"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Kampanya Görseli</label>
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary-500/50 transition-colors bg-dark-bg/50">
                            {previewUrl ? (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPreviewUrl(null);
                                            setImageFile(null);
                                            setFormData({ ...formData, imageUrl: '' });
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center cursor-pointer">
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-300">Görsel seçmek için tıklayın</span>
                                    <span className="text-xs text-gray-500 mt-1">PNG, JPG, BMP, WEBP</span>
                                    <span className="text-xs text-primary-400 mt-2 font-medium">Önerilen Boyut: 1920x600px (veya 16:9)</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-600 bg-dark-bg text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="isActive" className="text-white cursor-pointer select-none">Aktif</label>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save className="w-4 h-4 mr-2" /> Kaydet</>}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
