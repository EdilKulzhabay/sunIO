import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';

interface AdminActionLog {
    _id: string;
    admin?: {
        _id: string;
        fullName?: string;
        mail?: string;
        role?: string;
    };
    action: string;
    createdAt: string;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalLogs: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export const AdminActionLogs = () => {
    const [logs, setLogs] = useState<AdminActionLog[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const limit = 50;

    useEffect(() => {
        fetchLogs(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const fetchLogs = async (page: number) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/admin-action-logs?page=${page}&limit=${limit}`);
            setLogs(response.data.data || []);
            setPagination(response.data.pagination || null);
        } catch (error: any) {
            toast.error('Ошибка загрузки журнала действий');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (value: string) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('ru-RU');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Журнал действий</h1>
                        <p className="text-gray-600 mt-1">История действий администраторов</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Дата</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Администратор</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Действие</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                            Загрузка...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                            Действий пока нет
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                {formatDateTime(log.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.admin?.fullName || '—'}</span>
                                                    <span className="text-xs text-gray-500">{log.admin?.mail || ''}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{log.action}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                            <div className="text-sm text-gray-600">
                                Страница {pagination.currentPage} из {pagination.totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => pagination.hasPrevPage && setCurrentPage(currentPage - 1)}
                                    disabled={!pagination.hasPrevPage || loading}
                                    className="px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Назад
                                </button>
                                <button
                                    type="button"
                                    onClick={() => pagination.hasNextPage && setCurrentPage(currentPage + 1)}
                                    disabled={!pagination.hasNextPage || loading}
                                    className="px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Вперед
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};
