import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { RefreshCw, Search } from 'lucide-react';
import { getClientPageTitle } from '../../utils/clientPathLabels';
import { CONTENT_CATEGORY_OPTIONS } from '../../constants/contentCategoryOptions';

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

export const ClientPageAnalytics = () => {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<SummaryData | null>(null);

    const [searchQuery, setSearchQuery] = useState('');

    const [userSearchResults, setUserSearchResults] = useState<UserListRow[]>([]);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [userDetailLoading, setUserDetailLoading] = useState(false);
    const [userDetailHint, setUserDetailHint] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<{
        userId: string;
        totalViews: number;
        byPath: UserPathRow[];
    } | null>(null);

    /** Селекторы как в RedirectToPageSelector: раздел + конкретный материал */
    const [contentCategoryApiPath, setContentCategoryApiPath] = useState('');
    const [contentItemId, setContentItemId] = useState('');
    const [contentItems, setContentItems] = useState<{ _id: string; title: string }[]>([]);
    const [loadingContentItems, setLoadingContentItems] = useState(false);
    const [contentPathStats, setContentPathStats] = useState<{ path: string; totalViews: number } | null>(
        null
    );
    const [contentPathLoading, setContentPathLoading] = useState(false);
    /** Синхронизация с кнопкой «Обновить» в шапке */
    const [analyticsRefreshTick, setAnalyticsRefreshTick] = useState(0);

    const fetchSummaryAndTop = useCallback(async () => {
        setLoading(true);
        try {
            const sumRes = await api.get('/api/client-analytics/admin/summary');

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
            setAnalyticsRefreshTick((t) => t + 1);
        }
    }, []);

    useEffect(() => {
        fetchSummaryAndTop();
    }, [fetchSummaryAndTop]);

    useEffect(() => {
        if (!contentCategoryApiPath) {
            setContentItems([]);
            return;
        }
        const load = async () => {
            setLoadingContentItems(true);
            try {
                const response = await api.get(contentCategoryApiPath);
                const data = response.data?.data;
                setContentItems(Array.isArray(data) ? data : []);
            } catch {
                setContentItems([]);
            } finally {
                setLoadingContentItems(false);
            }
        };
        load();
    }, [contentCategoryApiPath]);

    useEffect(() => {
        const opt = CONTENT_CATEGORY_OPTIONS.find((o) => o.apiPath === contentCategoryApiPath);
        if (!opt || !contentItemId) {
            setContentPathStats(null);
            return;
        }
        const path = `${opt.clientPath}/${contentItemId}`;
        let cancelled = false;
        const load = async () => {
            setContentPathLoading(true);
            try {
                const res = await api.get('/api/client-analytics/admin/path-stats', {
                    params: { path },
                });
                if (cancelled) return;
                if (res.data.success) {
                    setContentPathStats(res.data.data);
                } else {
                    setContentPathStats(null);
                }
            } catch {
                if (!cancelled) {
                    toast.error('Не удалось загрузить статистику по контенту');
                    setContentPathStats(null);
                }
            } finally {
                if (!cancelled) setContentPathLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [contentCategoryApiPath, contentItemId, analyticsRefreshTick]);

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
                const res = await api.get(`/api/client-analytics/admin/user/${encodeURIComponent(id)}`);
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
        []
    );

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
    }, [searchQuery, loadUserDetail]);

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
                        <h1 className="text-3xl font-bold text-gray-900">Учет посещения страниц приложения пользователями</h1>
                        <p className="text-gray-600 mt-1 text-sm">
                            Популярность URL и активность пользователей в Telegram WebApp (события с авторизацией
                            привязаны к пользователю).
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Рейтинг страниц</h2>
                    {loading && !summary ? (
                        <p className="text-gray-500">Загрузка…</p>
                    ) : summary ? (
                        <>
                            <p className="text-sm text-gray-600 mb-4">
                                Всего событий просмотра:{' '}
                                <span className="font-semibold text-gray-900">{summary.totalEvents}</span>
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
                                                    Нет данных
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Аналитика по контенту</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Выберите раздел и материал — так же, как при настройке ссылки в карточках и
                        уведомлениях. Считаются открытия страницы этого материала в приложении.
                    </p>

                    <div className="flex flex-col gap-3 max-w-xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                            <select
                                value={contentCategoryApiPath}
                                onChange={(e) => {
                                    setContentCategoryApiPath(e.target.value);
                                    setContentItemId('');
                                    setContentPathStats(null);
                                }}
                                className="w-full p-2 rounded-lg border border-gray-300 text-sm bg-white"
                            >
                                <option value="">Выберите категорию</option>
                                {CONTENT_CATEGORY_OPTIONS.map((opt) => (
                                    <option key={opt.apiPath} value={opt.apiPath}>
                                        {opt.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {contentCategoryApiPath ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Контент</label>
                                <select
                                    value={contentItemId}
                                    onChange={(e) => setContentItemId(e.target.value)}
                                    disabled={loadingContentItems}
                                    className="w-full p-2 rounded-lg border border-gray-300 text-sm bg-white disabled:opacity-60"
                                >
                                    <option value="">
                                        {loadingContentItems ? 'Загрузка…' : 'Выберите контент'}
                                    </option>
                                    {contentItems.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.title || item._id}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}
                    </div>

                    {contentPathLoading && (
                        <p className="text-sm text-gray-500 mt-4">Загрузка статистики…</p>
                    )}

                    {contentPathStats && !contentPathLoading ? (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                            <p className="text-sm text-gray-700">
                                Просмотров страницы:{' '}
                                <span className="font-semibold text-gray-900 tabular-nums">
                                    {contentPathStats.totalViews}
                                </span>
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-1 break-all" title={contentPathStats.path}>
                                {contentPathStats.path}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {getClientPageTitle(contentPathStats.path)}
                            </p>
                        </div>
                    ) : null}
                </section>

                <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Просмотры в разрезе пользователя
                    </h2>

                    <div className="relative mb-6">
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Поиск по имени, TG имени, телефону, email или вставьте ID пользователя…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
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
                                Всего просмотров:{' '}
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
