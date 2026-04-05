import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { RefreshCw, Search } from 'lucide-react';
import {
    getClientPageTitle,
    getClientPageSection,
    getAllSections,
    isExcludedPath,
    extractContentId,
} from '../../utils/clientPathLabels';
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

    const [sectionFilter, setSectionFilter] = useState('');
    const [userSectionFilter, setUserSectionFilter] = useState('');

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

    const [titleMap, setTitleMap] = useState<Map<string, string>>(new Map());

    const sections = useMemo(() => getAllSections(), []);

    useEffect(() => {
        const load = async () => {
            const map = new Map<string, string>();
            await Promise.all(
                CONTENT_CATEGORY_OPTIONS.map(async (opt) => {
                    try {
                        const res = await api.get(opt.apiPath);
                        const items: { _id: string; title?: string }[] = Array.isArray(res.data?.data)
                            ? res.data.data
                            : [];
                        items.forEach((item) => {
                            if (item.title) map.set(item._id, item.title);
                        });
                    } catch {
                        /* ignore */
                    }
                })
            );
            setTitleMap(map);
        };
        load();
    }, []);

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
        }
    }, []);

    useEffect(() => {
        fetchSummaryAndTop();
    }, [fetchSummaryAndTop]);

    const filteredSummaryPaths = useMemo(() => {
        if (!summary) return [];
        return summary.byPath
            .filter((row) => !isExcludedPath(row.path))
            .filter((row) => !sectionFilter || getClientPageSection(row.path) === sectionFilter);
    }, [summary, sectionFilter]);

    const filteredTotalViews = useMemo(
        () => filteredSummaryPaths.reduce((acc, r) => acc + r.totalViews, 0),
        [filteredSummaryPaths]
    );

    const filteredUserPaths = useMemo(() => {
        if (!userDetail) return [];
        return userDetail.byPath
            .filter((row) => !isExcludedPath(row.path))
            .filter((row) => !userSectionFilter || getClientPageSection(row.path) === userSectionFilter);
    }, [userDetail, userSectionFilter]);

    const filteredUserTotalViews = useMemo(
        () => filteredUserPaths.reduce((acc, r) => acc + r.views, 0),
        [filteredUserPaths]
    );

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

    const renderTitle = (path: string) => {
        const contentId = extractContentId(path);
        const title = getClientPageTitle(path, titleMap);
        if (contentId && !titleMap.has(contentId)) {
            return <span className="text-gray-400 italic">{title}</span>;
        }
        return title;
    };

    const sectionFilterSelect = (value: string, onChange: (v: string) => void) => (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="p-2 rounded-lg border border-gray-300 text-sm bg-white min-w-[200px]"
        >
            <option value="">Все разделы</option>
            {sections.map((s) => (
                <option key={s} value={s}>
                    {s}
                </option>
            ))}
        </select>
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Рейтинг страниц</h2>
                        {sectionFilterSelect(sectionFilter, setSectionFilter)}
                    </div>
                    {loading && !summary ? (
                        <p className="text-gray-500">Загрузка…</p>
                    ) : summary ? (
                        <>
                            <p className="text-sm text-gray-600 mb-4">
                                Всего событий просмотра:{' '}
                                <span className="font-semibold text-gray-900">{filteredTotalViews}</span>
                            </p>
                            <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-medium text-gray-700">Раздел</th>
                                            <th className="text-left px-4 py-2 font-medium text-gray-700">Страница</th>
                                            <th className="text-right px-4 py-2 font-medium text-gray-700 w-32">
                                                Просмотры
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSummaryPaths.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                                    Нет данных
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredSummaryPaths.map((row) => (
                                                <tr key={row.path} className="border-t border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                                                        {getClientPageSection(row.path)}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-900 max-w-md" title={row.path}>
                                                        {renderTitle(row.path)}
                                                    </td>
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
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <p className="text-sm text-gray-600">
                                    {userDetailHint ? (
                                        <>
                                            <span className="font-medium text-gray-800">{userDetailHint}</span>
                                            <span className="text-gray-400 mx-1">·</span>
                                        </>
                                    ) : null}
                                    Всего просмотров:{' '}
                                    <span className="font-semibold">{filteredUserTotalViews}</span>
                                </p>
                                {sectionFilterSelect(userSectionFilter, setUserSectionFilter)}
                            </div>
                            <div className="overflow-x-auto max-h-[360px] overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-medium text-gray-700">Раздел</th>
                                            <th className="text-left px-4 py-2 font-medium text-gray-700">Страница</th>
                                            <th className="text-right px-4 py-2 font-medium text-gray-700 w-32">
                                                Просмотры
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUserPaths.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                                                    Нет записей
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUserPaths.map((row) => (
                                                <tr
                                                    key={row.path}
                                                    className="border-t border-gray-100 hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                                                        {getClientPageSection(row.path)}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-900 max-w-md" title={row.path}>
                                                        {renderTitle(row.path)}
                                                    </td>
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
