import { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import type { ActionLog } from '../services/types';
import { translateAction, formatDetails } from '../utils/auditLogger';
import { Loader2, Search, Filter, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const AuditLogs = () => {
    const [logs, setLogs] = useState<ActionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [userId, setUserId] = useState('');
    const [action, setAction] = useState('');
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = { page, limit: 20 };
            if (userId) params.userId = userId;
            if (action) params.action = action;

            const res = await adminService.getAuditLogs(params);
            setLogs(res.data);
            setTotalPages(res.pagination.totalPages);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Loglar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    return (
        <div className="min-h-screen bg-white px-3 sm:px-6 text-[#111111] pt-24 pb-12">
            <div className="container mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/dashboard" className="p-2 hover:bg-[#F3F4F6] rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-3xl font-bold">İşlem Geçmişi</h1>
                            <p className="text-[#6B7280]">Yönetici ve sistem aktivitelerini takip edin</p>
                        </div>
                    </div>
                    <Button onClick={fetchLogs} variant="outline" className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Yenile
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] mb-6">
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm text-[#6B7280] mb-1">Kullanıcı ID</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                                <input
                                    type="text"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="Kullanıcı ID ile ara..."
                                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-[#111111] focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm text-[#6B7280] mb-1">İşlem Türü</label>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                                <input
                                    type="text"
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                    placeholder="İşlem türü (örn. LOGIN, CREATE_CAR)..."
                                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-[#111111] focus:outline-none focus:border-primary-500"
                                />
                            </div>
                        </div>
                        <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white">
                            Filtrele
                        </Button>
                    </form>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-600 mb-2">Hata Oluştu</h3>
                        <p className="text-[#555555]">{error}</p>
                        <Button onClick={fetchLogs} className="mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50">
                            Tekrar Dene
                        </Button>
                    </div>
                ) : (
                    <div className="bg-[#F9FAFB] backdrop-blur-xl rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.3)] w-full">
                        <div className="overflow-x-auto w-full custom-scrollbar pb-4">
                            <table className="w-full text-left min-w-[700px] md:min-w-full">
                                <thead className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                                    <tr>
                                        <th className="p-4 text-sm font-medium text-[#6B7280]">Tarih</th>
                                        <th className="p-4 text-sm font-medium text-[#6B7280]">Kullanıcı</th>
                                        <th className="p-4 text-sm font-medium text-[#6B7280]">İşlem</th>
                                        <th className="p-4 text-sm font-medium text-[#6B7280]">Detaylar</th>
                                        <th className="p-4 text-sm font-medium text-[#6B7280]">IP Adresi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-[#F3F4F6] transition-colors">
                                            <td className="p-4 text-sm text-[#555555] whitespace-nowrap font-mono">{formatDate(log.createdAt)}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[#111111] font-medium">{log.user?.name || log.userId}</span>
                                                    <span className="text-xs text-[#6B7280]">{log.user?.email}</span>
                                                    <span className="text-xs text-primary-500">{log.user?.role}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="bg-[#F3F4F6] px-2 py-1 rounded text-xs font-bold text-[#111111] whitespace-nowrap border border-[#E5E7EB]">
                                                    {translateAction(log.action)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-[#6B7280] max-w-md" title={log.details || ''}>
                                                {formatDetails(log.action, log.details)}
                                            </td>
                                            <td className="p-4 text-sm text-[#6B7280] font-mono">
                                                {log.ipAddress || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-[#6B7280]">
                                                Kayıt bulunamadı.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-[#E5E7EB] flex justify-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="text-[#111111]"
                                >
                                    Önceki
                                </Button>
                                <span className="flex items-center px-4 text-[#6B7280] text-sm">
                                    Sayfa {page} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="text-[#111111]"
                                >
                                    Sonraki
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
