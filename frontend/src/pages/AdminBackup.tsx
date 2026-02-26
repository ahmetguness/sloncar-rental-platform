import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { Loader2, ArrowLeft, RefreshCw, Database, CheckCircle2, XCircle, Clock, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';

interface BackupHistory {
    timestamp: number;
    date: string;
    status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
    type: 'AUTO' | 'MANUAL';
    message?: string;
    files?: string[];
}

export const AdminBackup = () => {
    const { addToast } = useToast();
    const [history, setHistory] = useState<BackupHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await adminService.getBackupHistory();
            setHistory(res.data);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRunBackup = async () => {
        setShowConfirmModal(false);
        setRunning(true);
        try {
            const result = await adminService.triggerBackup();
            addToast(result.message, 'success');
            fetchHistory();
        } catch (err: any) {
            console.error(err);
            addToast(err.response?.data?.message || 'Yedekleme başlatılırken bir hata oluştu', 'error');
            fetchHistory();
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'SKIPPED': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-xs font-medium border border-green-500/20">Başarılı</span>;
            case 'SKIPPED': return <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-medium border border-yellow-500/20">Atlandı (Değişiklik Yok)</span>;
            case 'FAILED': return <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-medium border border-red-500/20">Hata</span>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg px-3 sm:px-6 text-white pt-24 pb-12">
            <div className="container mx-auto max-w-5xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-3">
                                <Database className="w-8 h-8 text-primary-500" />
                                Sistem Yedekleme
                            </h1>
                            <p className="text-gray-400">Veritabanı ve dosya yedeklerini yönetin</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Status Card */}
                    <div className="bg-dark-surface p-4 sm:p-6 rounded-2xl border border-white/10 lg:col-span-2">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Save className="w-5 h-5 text-primary-400" />
                            Yedekleme Durumu
                        </h2>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Son Başarılı Yedekleme</p>
                                    <p className="font-mono text-lg text-primary-500">
                                        {history.find(h => h.status === 'SUCCESS')?.date ? formatDate(history.find(h => h.status === 'SUCCESS')!.date) : 'Henüz yok'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Kayıtlı Yedek Sayısı</p>
                                    <p className="text-lg font-bold">3 (Maksimum)</p>
                                </div>
                            </div>

                            <div className="p-4 bg-primary-500/5 rounded-xl border border-primary-500/20">
                                <h3 className="font-bold mb-2">Nasıl Çalışır?</h3>
                                <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                                    <li>Sistem her gece 00:00'da otomatik yedek alır.</li>
                                    <li>Eğer son yedekten beri veri değişmemişse kota tasarrufu için yedekleme atlanır.</li>
                                    <li>Google Drive'da her zaman en güncel 3 yedek tutulur.</li>
                                    <li>Manuel yedeklemeler değişiklik kontrolünü pas geçer ve anında yedek alır.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Card */}
                    <div className="bg-dark-surface p-4 sm:p-6 rounded-2xl border border-white/10 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4">
                            <Database className="w-8 h-8 text-primary-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Manuel Yedekleme</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            Sistemi şu anki haliyle anında yedeklemek için aşağıdaki butonu kullanın.
                        </p>
                        <Button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={running}
                            className="w-full bg-primary-600 hover:bg-primary-700 h-12 gap-2"
                        >
                            {running ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Yedekleniyor...
                                </>
                            ) : (
                                <>
                                    <Database className="w-5 h-5" />
                                    Şimdi Yedekle
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* History Table */}
                <div className="bg-dark-surface rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            İşlem Geçmişi
                        </h2>
                        <Button onClick={fetchHistory} variant="secondary" className="p-2 h-auto text-gray-400 hover:text-white">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 font-medium">Tarih</th>
                                    <th className="p-4 font-medium">Tür</th>
                                    <th className="p-4 font-medium">Durum</th>
                                    <th className="p-4 font-medium">Mesaj</th>
                                    <th className="p-4 font-medium">Dosyalar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading && history.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
                                            <p className="text-gray-500">Yedekleme geçmişi yükleniyor...</p>
                                        </td>
                                    </tr>
                                ) : history.map((entry, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-gray-300">
                                            {formatDate(entry.date)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-0.5 rounded border ${entry.type === 'MANUAL'
                                                ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                }`}>
                                                {entry.type === 'MANUAL' ? 'Manuel' : 'Otomatik'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(entry.status)}
                                                {getStatusBadge(entry.status)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400 max-w-xs truncate" title={entry.message}>
                                            {entry.message || '-'}
                                        </td>
                                        <td className="p-4">
                                            {entry.files && entry.files.length > 0 ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">
                                                        {entry.files.length} Dosya
                                                    </span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {!loading && history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-500">
                                            Henüz yedekleme kaydı bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="Yedekleme Onayı"
            >
                <div className="p-6">
                    <div className="flex items-center justify-center w-16 h-16 bg-primary-500/10 rounded-full mx-auto mb-4">
                        <Database className="w-8 h-8 text-primary-500" />
                    </div>
                    <p className="text-center text-gray-300 mb-8">
                        Şu anki sistem durumunu yedeklemek istediğinize emin misiniz?
                        Bu işlem veritabanı yedeği alacak ve Google Drive'a yükleyecektir.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setShowConfirmModal(false)}
                        >
                            İptal
                        </Button>
                        <Button
                            className="flex-1 bg-primary-600 hover:bg-primary-700"
                            onClick={handleRunBackup}
                        >
                            Yedeklemeyi Başlat
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

