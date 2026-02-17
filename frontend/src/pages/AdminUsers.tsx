import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { storage } from '../utils/storage';
import { Loader2, ArrowLeft, Plus, Search, Pencil, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const EditUserModal = ({ user, onClose, onSuccess }: { user: any; onClose: () => void; onSuccess: () => void }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(user.role);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminService.updateUser(user.id, { role });
            addToast('Kullanıcı rolü güncellendi', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Güncelleme hatası', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Kullanıcı Rolünü Düzenle">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-400">Kullanıcı:</p>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Rol</label>
                    <select
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                    >
                        <option value="STAFF">Personel (Kısıtlı)</option>
                        <option value="ADMIN">Yönetici</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="border-white/10 text-white hover:bg-white/10">İptal</Button>
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600 text-white">
                        {loading ? <Loader2 className="animate-spin" /> : 'Güncelle'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

const CreateUserModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'STAFF'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminService.createUser(formData);
            addToast('Kullanıcı başarıyla oluşturuldu', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            addToast(error.response?.data?.error?.message || error.message || 'Kullanıcı oluşturulurken bir hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Kullanıcı Ekle">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Ad Soyad</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">E-posta</label>
                    <input
                        type="email"
                        required
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Telefon</label>
                    <input
                        type="tel"
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Şifre</label>
                    <input
                        type="password"
                        required
                        minLength={6}
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Rol</label>
                    <select
                        className="w-full bg-dark-bg border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="STAFF">Personel (Kısıtlı)</option>
                        <option value="ADMIN">Yönetici</option>
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="border-white/10 text-white hover:bg-white/10">İptal</Button>
                    <Button type="submit" disabled={loading} className="bg-primary-500 hover:bg-primary-600 text-white">
                        {loading ? <Loader2 className="animate-spin" /> : 'Oluştur'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export const AdminUsers = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [selectedUserToEdit, setSelectedUserToEdit] = useState<any | null>(null);

    const currentUser = useMemo(() => storage.getUser(), []);

    const { data: userData, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-users', currentPage, searchTerm],
        queryFn: () => adminService.getUsers({ page: currentPage, limit: 10, search: searchTerm }),
        staleTime: 60000,
    });

    useEffect(() => {
        if (currentUser && currentUser.role !== 'ADMIN') {
            addToast('Bu sayfaya erişim yetkiniz yok', 'error');
            navigate('/admin/dashboard');
        }
    }, [currentUser, navigate]);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteUser(id),
        onSuccess: () => {
            addToast('Kullanıcı başarıyla silindi', 'success');
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
        onError: (error: any) => {
            addToast(error.response?.data?.error?.message || 'Silme işlemi başarısız', 'error');
        }
    });

    const handleDeleteUser = (id: string) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) {
            deleteMutation.mutate(id);
        }
    };

    if (currentUser?.role !== 'ADMIN') return null;

    return (
        <div className="min-h-screen bg-dark-bg p-6 text-white pt-24">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/dashboard" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Users className="w-8 h-8 text-primary-500" />
                                Kullanıcı Yönetimi
                            </h1>
                            <p className="text-gray-400">Yönetici ve personel hesaplarını yönetin</p>
                        </div>
                    </div>
                    <Button onClick={() => setShowCreateUserModal(true)} className="bg-primary-600 hover:bg-primary-700 text-white gap-2">
                        <Plus className="w-4 h-4" /> Yeni Kullanıcı
                    </Button>
                </div>

                {/* Filters */}
                <div className="bg-dark-surface p-4 rounded-xl border border-white/10 mb-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page on search
                            }}
                            placeholder="İsim, e-posta veya telefon ile ara..."
                            className="w-full bg-dark-bg border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary-500"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="bg-dark-surface rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="p-4 text-sm font-medium text-gray-400">Kullanıcı</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">İletişim</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">Rol</th>
                                    <th className="p-4 text-sm font-medium text-gray-400">Kayıt Tarihi</th>
                                    <th className="p-4 text-sm font-medium text-gray-400 text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <div className="flex justify-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : !userData?.data || userData.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-gray-500">
                                            Kullanıcı bulunamadı
                                        </td>
                                    </tr>
                                ) : (
                                    userData.data.map((user: any) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-medium text-white">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-gray-300 font-mono text-sm">{user.phone || '-'}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {user.role === 'ADMIN' ? 'Yönetici' : 'Personel'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-blue-400 hover:bg-blue-500/10 border-blue-500/30"
                                                        onClick={() => setSelectedUserToEdit(user)}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-400 hover:bg-red-500/10 border-red-500/30"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={user.id === currentUser?.id || deleteMutation.isPending}
                                                    >
                                                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {userData?.pagination && userData.pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/5">
                            <div className="text-sm text-gray-400">
                                Toplam {userData.pagination.total} kullanıcı
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    className="border-white/10 text-gray-400 hover:text-white"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="flex gap-1">
                                    {Array.from({ length: userData.pagination.totalPages }, (_, i) => i + 1).map(page => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? 'primary' : 'outline'}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-8 h-8 p-0 ${currentPage === page ? 'bg-primary-500' : 'border-white/10 text-gray-400'}`}
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === userData.pagination.totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="border-white/10 text-gray-400 hover:text-white"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCreateUserModal && (
                <CreateUserModal
                    onClose={() => setShowCreateUserModal(false)}
                    onSuccess={() => refetch()}
                />
            )}
            {selectedUserToEdit && (
                <EditUserModal
                    user={selectedUserToEdit}
                    onClose={() => setSelectedUserToEdit(null)}
                    onSuccess={() => refetch()}
                />
            )}
        </div>
    );
};
