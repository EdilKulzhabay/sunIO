import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { RefreshCw, Search } from 'lucide-react';
import { getClientPageTitle } from '../../utils/clientPathLabels';

interface PathRow {
    path: string;
    totalViews: number;
}

interface SummaryData {
    totalEvents: number;
    byPath: PathRow[];
}

interface UserPathRow {
    path: string;
    views: number;
}

interface UserListRow {
    _id: string;
    fullName?: string;
    telegramUserName?: string;
    phone?: string;
    mail?: string;
}

const OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;
const USER_FETCH_DEBOUNCE_MS = 400;

function sinceQueryParam(dateStr: string): string | undefined {
    if (!dateStr.trim()) return undefined;
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

export const ClientPageAnalytics = () => {
    const [sinceDate, setSinceDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<SummaryData | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [lastActiveFilter, setLastActiveFilter] = useState('all');
    const [botSourceFilter, setBotSourceFilter] = useState('all');
    const [botTrafficSources, setBotTrafficSources] = useState<
        Array<{ _id: string; title: string; botParameter: string }>
    >([]);

    const [userSearchResults, setUserSearchResults] = useState<UserListRow[]>([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [userDetailLoading, setUserDetailLoading] = useState(false);
    const [userDetailHint, setUserDetailHint] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<{
        userId: string;
        totalViews: number;
        byPath: UserPathRow[];
    } | null>(null);

    const analyticsUserIdRef = useRef<string | null>(null);
    useEffect(() => {
        analyticsUserIdRef.current = userDetail?.userId ?? null;
    }, [userDetail]);

    const since = sinceQueryParam(sinceDate);

    const fetchSummaryAndTop = useCallback(async () => {
        setLoading(true);
        try {
            const q = since ? `?since=${encodeURIComponent(since)}` : '';
            const sumRes = await api.get(`/api/client-analytics/admin/summary${q}`);

            if (sumRes.data.success) {
                setSummary(sumRes.data.data);
            } else {
                setSummary(null);
            }
        } catch {
            toast.error('Не удалось загрузить аналитику');
            setSummary(null);
        } finally {
            setLoading(false);
        }
    }, [since]);

    useEffect(() => {
        fetchSummaryAndTop();
    }, [fetchSummaryAndTop]);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await api.get('/api/bot-traffic-sources');
                const data = response.data?.data || [];
                setBotTrafficSources(
                    data.map((item: { _id: string; title: string; botParameter: string }) => ({
                        _id: item._id,
                        title: item.title,
                        botParameter: item.botParameter,
                    }))
                );
            } catch {
                /* без источников селектор всё равно работает */
            }
        };
        load();
    }, []);

    const formatUserListHint = (u: UserListRow) => {
        const parts = [
            u.fullName?.trim(),
            u.phone?.trim(),
            u.mail?.trim(),
            u.telegramUserName ? `@${u.telegramUserName}` : '',
        ].filter(Boolean);
        return parts.length ? parts.join(' · ') : u._id;
    };

    const loadUserDetail = useCallback(
        async (userId: string, hint?: string | null) => {
            const id = userId.trim();
            if (!id) {
                toast.error('Укажите пользователя');
                return;
            }
            setUserDetailLoading(true);
            if (hint !== undefined) setUserDetailHint(hint);
            try {
                const params = new URLSearchParams();
                if (since) params.set('since', since);
                const res = await api.get(
                    `/api/client-analytics/admin/user/${encodeURIComponent(id)}?${params.toString()}`
                );
                if (res.data.success) {
                    setUserDetail(res.data.data);
                } else {
                    setUserDetail(null);
                    toast.error(res.data.message || 'Ошибка загрузки');
                }
            } catch (e: any) {
                setUserDetail(null);
                toast.error(e.response?.data?.message || 'Пользователь не найден или неверный ID');
            } finally {
                setUserDetailLoading(false);
            }
        },
        [since]
    );

    useEffect(() => {
        const id = analyticsUserIdRef.current;
        if (!id) return;
        loadUserDetail(id, undefined);
    }, [since, loadUserDetail]);

    useEffect(() => {
        const timer = window.setTimeout(async () => {
            const q = searchQuery.trim();

            if (OBJECT_ID_RE.test(q)) {
                setUserSearchResults([]);
                await loadUserDetail(q, null);
                return;
            }

            setUserSearchLoading(true);
            try {
                const params: Record<string, string | number> = { page: 1, limit: 100 };
                if (statusFilter !== 'all') params.statusFilter = statusFilter;
                if (lastActiveFilter !== 'all') params.lastActiveFilter = lastActiveFilter;
                if (botSourceFilter !== 'all') params.botStartSourceId = botSourceFilter;

                const textForApi = q.startsWith('@') ? q.slice(1).trim() : q;
                if (textForApi) params.searchQuery = textForApi;

                const res = await api.get('/api/user/all', { params });
                const list: UserListRow[] = res.data?.data || [];
                setUserSearchResults(list);

                if (textForApi && list.length === 1) {
                    const u = list[0];
                    const hint = [
                        u.fullName?.trim(),
                        u.phone?.trim(),
                        u.mail?.trim(),
                        u.telegramUserName ? `@${u.telegramUserName}` : '',
                    ]
                        .filter(Boolean)
                        .join(' · ');
                    await loadUserDetail(u._id, hint || u._id);
                }
            } catch {
                toast.error('Ошибка загрузки пользователей');
                setUserSearchResults([]);
            } finally {
                setUserSearchLoading(false);
            }
        }, USER_FETCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [searchQuery, statusFilter, lastActiveFilter, botSourceFilter, loadUserDetail]);

    const pathCell = (path: string) => (
        <td className="px-4 py-2 text-gray-900 max-w-md" title={path}>
            {getClientPageTitle(path)}
        </td>
    );

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Просмотры клиентских страниц</h1>
                        <p className="text-gray-600 mt-1 text-sm">
                            Популярность URL и активность пользователей в Telegram WebApp (события с авторизацией
                            привязаны к пользователю).
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Учитывать с даты
                            </label>
                            <input
                                type="date"
                                value={sinceDate}
                                onChange={(e) => setSinceDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchSummaryAndTop()}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            Обновить
                        </button>
                    </div>
                </div>

                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Популярные страницы</h2>
                    {loading && !summary ? (
                        <p className="text-gray-500">Загрузка…</p>
                    ) : summary ? (
                        <>
                            <p className="text-sm text-gray-600 mb-4">
                                Всего событий просмотра:{' '}
                                <span className="font-semibold text-gray-900">{summary.totalEvents}</span>
                                {sinceDate ? ` (с ${sinceDate})` : ''}
                            </p>
                            <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-medium text-gray-700">Страница</th>
                                            <th className="text-right px-4 py-2 font-medium text-gray-700 w-32">
                                                Просмотров
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {summary.byPath.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                                                    Нет данных за выбранный период
                                                </td>
                                            </tr>
                                        ) : (
                                            summary.byPath.map((row) => (
                                                <tr key={row.path} className="border-t border-gray-100 hover:bg-gray-50">
                                                    {pathCell(row.path)}
                                                    <td className="px-4 py-2 text-right tabular-nums">
                                                        {row.totalViews}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500">Нет данных</p>
                    )}
                </section>

                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Просмотры по страницам для пользователя
                    </h2>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 mb-6">
                        <div className="relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                placeholder="Поиск по имени, TG имени, телефону, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="all">Все статусы</option>
                                    <option value="anonym">Аноним</option>
                                    <option value="guest">Гость</option>
                                    <option value="registered">Зарегистрирован</option>
                                    <option value="client">Клиент</option>
                                    <option value="blocked">Заблокирован</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Активность</label>
                                <select
                                    value={lastActiveFilter}
                                    onChange={(e) => setLastActiveFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="all">Все</option>
                                    <option value="active">Активные (в течение 15 дней)</option>
                                    <option value="inactive">Неактивные (больше 15 дней)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Источник трафика
                                </label>
                                <select
                                    value={botSourceFilter}
                                    onChange={(e) => setBotSourceFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="all">Все источники</option>
                                    {botTrafficSources.map((source) => (
                                        <option key={source._id} value={source._id}>
                                            {source.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {userSearchLoading && (
                        <p className="text-sm text-gray-500 mb-4">Загрузка списка пользователей…</p>
                    )}

                    {userSearchResults.length > 0 && !OBJECT_ID_RE.test(searchQuery.trim()) ? (
                        <div className="mb-6 overflow-x-auto border border-gray-200 rounded-lg max-h-[320px] overflow-y-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="text-left px-4 py-2 font-medium text-gray-700">Имя</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-700">Телефон</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-700">Почта</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-700">Telegram</th>
                                        <th className="text-right px-4 py-2 font-medium text-gray-700 w-40" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {userSearchResults.map((u) => (
                                        <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-2">{u.fullName || '—'}</td>
                                            <td className="px-4 py-2 whitespace-nowrap">{u.phone || '—'}</td>
                                            <td className="px-4 py-2 break-all max-w-[180px]">{u.mail || '—'}</td>
                                            <td className="px-4 py-2">
                                                {u.telegramUserName ? `@${u.telegramUserName}` : '—'}
                                            </td>
                                            <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => loadUserDetail(u._id, formatUserListHint(u))}
                                                    disabled={userDetailLoading}
                                                    className="text-blue-600 hover:underline text-xs disabled:opacity-50"
                                                >
                                                    Статистика
                                                </button>
                                                <Link
                                                    to={`/admin/users/edit/${u._id}`}
                                                    className="text-blue-600 hover:underline text-xs"
                                                >
                                                    Карточка
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}

                    {userDetailLoading && (
                        <p className="text-sm text-gray-500 mb-2">Загрузка статистики…</p>
                    )}

                    {userDetail ? (
                        <>
                            <p className="text-sm text-gray-600 mb-4">
                                {userDetailHint ? (
                                    <>
                                        <span className="font-medium text-gray-800">{userDetailHint}</span>
                                        <span className="text-gray-400 mx-1">·</span>
                                    </>
                                ) : null}
                                Всего просмотров (с учётом фильтра даты):{' '}
                                <span className="font-semibold">{userDetail.totalViews}</span>
                            </p>
                            <div className="overflow-x-auto max-h-[360px] overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-medium text-gray-700">Страница</th>
                                            <th className="text-right px-4 py-2 font-medium text-gray-700 w-32">
                                                Раз открывал
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userDetail.byPath.length === 0 ? (
                                            <tr>
                                                <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                                                    Нет записей
                                                </td>
                                            </tr>
                                        ) : (
                                            userDetail.byPath.map((row) => (
                                                <tr
                                                    key={row.path}
                                                    className="border-t border-gray-100 hover:bg-gray-50"
                                                >
                                                    {pathCell(row.path)}
                                                    <td className="px-4 py-2 text-right tabular-nums">{row.views}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : null}
                </section>
            </div>
        </AdminLayout>
    );
};
