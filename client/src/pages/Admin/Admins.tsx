import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { Search, Plus, Edit, Lock, Unlock } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface Admin {
    _id: string;
    fullName?: string;
    mail?: string;
    phone?: string;
    role: string;
    status: string;
    isBlocked?: boolean;
    createdAt: string;
    isSuperAdmin?: boolean;
}

export const AdminsAdmin = () => {
    const navigate = useNavigate();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/all');
            setAdmins(response.data.data || []);
        } catch (error: any) {
            toast.error('Ошибка загрузки администраторов');
        } finally {
            setLoading(false);
        }
    };

    // Фильтрация и поиск
    const filteredAdmins = useMemo(() => {
        let result = [...admins];

        // Поиск по fullName, mail, phone
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(admin => 
                (admin.fullName?.toLowerCase().includes(query)) ||
                (admin.phone?.toLowerCase().includes(query)) ||
                (admin.mail?.toLowerCase().includes(query))
            );
        }

        // Фильтр по статусу
        if (statusFilter !== 'all') {
            if (statusFilter === 'blocked') {
                result = result.filter(admin => admin.isBlocked === true);
            } else if (statusFilter === 'active') {
                result = result.filter(admin => !admin.isBlocked && admin.status === 'active');
            } else {
                result = result.filter(admin => !admin.isBlocked && admin.status === statusFilter);
            }
        }

        return result.sort((a, b) => {
            // Защищенный администратор всегда первый
            if (a.isSuperAdmin) return -1;
            if (b.isSuperAdmin) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [admins, searchQuery, statusFilter]);

    const handleCreate = () => {
        navigate('/admin/admins/create');
    };

    const handleEdit = (admin: Admin) => {
        if (admin?.isSuperAdmin) {
            toast.warning('Этот администратор защищен от изменений');
            return;
        }
        navigate(`/admin/admins/edit/${admin._id}`);
    };

    const handleBlock = async (admin: Admin) => {
        if (admin?.isSuperAdmin) {
            toast.warning('Этот администратор защищен от блокировки');
            return;
        }

        if (!confirm(`Вы уверены, что хотите заблокировать администратора ${admin.fullName}?`)) return;

        try {
            await api.put(`/api/admin/${admin._id}/block`);
            toast.success('Администратор заблокирован');
            fetchAdmins();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Ошибка блокировки';
            toast.error(errorMessage);
        }
    };

    const handleUnblock = async (admin: Admin) => {
        if (admin?.isSuperAdmin) {
            toast.warning('Этот администратор защищен от изменений');
            return;
        }

        if (!confirm(`Вы уверены, что хотите разблокировать администратора ${admin.fullName}?`)) return;

        try {
            await api.put(`/api/admin/${admin._id}/unblock`);
            toast.success('Администратор разблокирован');
            fetchAdmins();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Ошибка разблокировки';
            toast.error(errorMessage);
        }
    };

    const getStatusLabel = (status: string, isBlocked?: boolean) => {
        if (isBlocked) return 'Заблокирован';
        if (status === 'active') return 'Активен';
        return status || 'Не указан';
    };

    const getStatusColor = (status: string, isBlocked?: boolean) => {
        if (isBlocked) return 'bg-red-100 text-red-700';
        if (status === 'active') return 'bg-green-100 text-green-700';
        return 'bg-gray-100 text-gray-700';
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Администратор';
            case 'content_manager':
                return 'Контент-менеджер';
            case 'client_manager':
                return 'Клиент-менеджер';
            default:
                return role || 'Не указано';
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Администраторы</h1>
                        <p className="text-gray-600 mt-1">Управление администраторами системы</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Создать администратора
                    </button>
                </div>

                {/* Поиск и фильтры */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Поиск */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Поиск
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Поиск по имени, email, телефону..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Фильтр по статусу */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Статус
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Все</option>
                                <option value="active">Активен</option>
                                <option value="blocked">Заблокирован</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Таблица администраторов */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Загрузка...</div>
                    ) : filteredAdmins.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">Администраторы не найдены</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Полное имя
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Телефон
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Роль
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Статус
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Дата создания
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Действия
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredAdmins.map((admin) => {
                                        const isProtected = admin?.isSuperAdmin || false;
                                        return (
                                            <tr key={admin._id} className={isProtected ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {admin.fullName || 'Не указано'}
                                                        </div>
                                                        {isProtected && (
                                                            <span className="ml-2 px-2 py-1 text-xs bg-yellow-200 text-yellow-800 rounded">
                                                                Защищен
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{admin.mail || 'Не указано'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{admin.phone || 'Не указано'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{getRoleLabel(admin.role)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(admin.status, admin.isBlocked)}`}>
                                                        {getStatusLabel(admin.status, admin.isBlocked)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(admin.createdAt).toLocaleDateString('ru-RU')}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!isProtected && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(admin)}
                                                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                                                    title="Редактировать"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                                {admin.isBlocked ? (
                                                                    <button
                                                                        onClick={() => handleUnblock(admin)}
                                                                        className="text-green-600 hover:text-green-900 transition-colors"
                                                                        title="Разблокировать"
                                                                    >
                                                                        <Unlock size={18} />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleBlock(admin)}
                                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                                        title="Заблокировать"
                                                                    >
                                                                        <Lock size={18} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        {isProtected && (
                                                            <span className="text-xs text-gray-400">Защищен</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Информация о защищенном администраторе */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Примечание:</strong> Администратор с желтым фоном защищен от изменений и блокировки.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
};

