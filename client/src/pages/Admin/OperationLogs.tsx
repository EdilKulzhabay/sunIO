import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';

type Tab = 'purchases' | 'deposits';

interface PurchaseEntry {
    _id: string;
    userId: string;
    userFullName: string;
    productId: string;
    productTitle: string;
    amount: number;
    paymentType?: 'stars' | 'balance';
    createdAt: string;
}

interface DepositEntry {
    _id: string;
    userId: string;
    userFullName: string;
    invId: string;
    amount: number;
    createdAt: string;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    total: number;
    limit: number;
}

const SECTION_TO_ADMIN_PATH: Record<string, string> = {
    'Практики': '/admin/practice/edit',
    'Притчи о жизни': '/admin/parables-of-life/edit',
    'Научные открытия': '/admin/scientific-discoveries/edit',
    'Лаборатория здоровья': '/admin/health-lab/edit',
    'Мастерская отношений': '/admin/relationship-workshop/edit',
    'Кузница Духа': '/admin/spirit-forge/edit',
    'Башня мастеров': '/admin/masters-tower/edit',
    'Беседка женственности': '/admin/femininity-gazebo/edit',
    'Библиотека сознания': '/admin/consciousness-library/edit',
    'Каталог платных продуктов': '/admin/product-catalog/edit',
    'Анализ здоровья': '/admin/analysis-health/edit',
    'Анализ отношений': '/admin/analysis-relationships/edit',
    'Анализ реализации': '/admin/analysis-realization/edit',
    'Психодиагностика': '/admin/psychodiagnostics/edit',
};

function getProductEditLink(productTitle: string, productId: string): string | null {
    const colonIdx = productTitle.indexOf(':');
    if (colonIdx === -1) return null;
    const section = productTitle.substring(0, colonIdx).trim();
    const basePath = SECTION_TO_ADMIN_PATH[section];
    if (!basePath || !productId) return null;
    return `${basePath}/${productId}`;
}

export const OperationLogs = () => {
    const [tab, setTab] = useState<Tab>('purchases');
    const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
    const [deposits, setDeposits] = useState<DepositEntry[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const limit = 50;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(currentPage));
            params.set('limit', String(limit));
            if (search) params.set('search', search);
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);

            const endpoint = tab === 'purchases'
                ? '/api/operation-logs/purchases'
                : '/api/operation-logs/deposits';

            const response = await api.get(`${endpoint}?${params.toString()}`);
            if (tab === 'purchases') {
                setPurchases(response.data.data || []);
            } else {
                setDeposits(response.data.data || []);
            }
            setPagination(response.data.pagination || null);
        } catch {
            toast.error('Ошибка загрузки журнала');
        } finally {
            setLoading(false);
        }
    }, [tab, currentPage, search, dateFrom, dateTo]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTabChange = (newTab: Tab) => {
        setTab(newTab);
        setCurrentPage(1);
        setSearch('');
        setDateFrom('');
        setDateTo('');
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchData();
    };

    const formatDate = (value: string) => {
        if (!value) return '—';
        return new Date(value).toLocaleString('ru-RU');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Журнал операций</h1>
                    <p className="text-gray-600 mt-1">Покупки и пополнения пользователей</p>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => handleTabChange('purchases')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === 'purchases'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Журнал покупок
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('deposits')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            tab === 'deposits'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Журнал пополнений
                    </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Поиск</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={tab === 'purchases' ? 'Полное имя или контент...' : 'Полное имя или ID...'}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата от</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата до</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Найти
                    </button>
                </form>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        {tab === 'purchases' ? (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Дата</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Полное имя</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Продукт (Раздел: Контент)</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Стоимость</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                                Загрузка...
                                            </td>
                                        </tr>
                                    ) : purchases.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                                Нет покупок
                                            </td>
                                        </tr>
                                    ) : (
                                        purchases.map((p) => {
                                            const editLink = getProductEditLink(p.productTitle, p.productId);
                                            return (
                                                <tr key={p._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                        {formatDate(p.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <Link
                                                            to={`/admin/users/edit/${p.userId}`}
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {p.userFullName || '—'}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {editLink ? (
                                                            <Link
                                                                to={editLink}
                                                                className="text-blue-600 hover:underline"
                                                            >
                                                                {p.productTitle}
                                                            </Link>
                                                        ) : (
                                                            p.productTitle || '—'
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {p.paymentType === 'balance'
                                                            ? `${p.amount.toLocaleString('ru-RU')} руб.`
                                                            : `${p.amount.toLocaleString('ru-RU')} баллов`}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Дата</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Сумма (руб.)</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Полное имя</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                                Загрузка...
                                            </td>
                                        </tr>
                                    ) : deposits.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                                Нет пополнений
                                            </td>
                                        </tr>
                                    ) : (
                                        deposits.map((d) => (
                                            <tr key={d._id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                                    {formatDate(d.createdAt)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                                                    {d.invId}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {d.amount.toLocaleString('ru-RU')}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <Link
                                                        to={`/admin/users/edit/${d.userId}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {d.userFullName || '—'}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                            <div className="text-sm text-gray-600">
                                Страница {pagination.currentPage} из {pagination.totalPages} (всего: {pagination.total})
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                                    disabled={currentPage <= 1 || loading}
                                    className="px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Назад
                                </button>
                                <button
                                    type="button"
                                    onClick={() => currentPage < pagination.totalPages && setCurrentPage(currentPage + 1)}
                                    disabled={currentPage >= pagination.totalPages || loading}
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
