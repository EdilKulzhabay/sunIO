import { useEffect, useState, useMemo, useCallback } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface ParsedAction {
    action: string;
    objectType: string;
    category: string;
    objectName: string;
    raw: string;
}

const ACTION_VERBS: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /^Создал\(а\)/,           label: 'Создание' },
    { pattern: /^Обновил\(а\)/,          label: 'Обновление' },
    { pattern: /^Удалил\(а\)/,           label: 'Удаление' },
    { pattern: /^Заблокировал\(а\)/,     label: 'Блокировка' },
    { pattern: /^Разблокировал\(а\)/,    label: 'Разблокировка' },
    { pattern: /^Активировал\(а\)/,      label: 'Активация' },
    { pattern: /^Деактивировал\(а\)/,    label: 'Деактивация' },
    { pattern: /^Отправил\(а\)/,         label: 'Отправил' },
    { pattern: /^Запланировал\(а\)/,     label: 'Планирование' },
    { pattern: /^Запустил\(а\)/,         label: 'Отправка' },
    { pattern: /^Отменил\(а\)/,          label: 'Отмена' },
    { pattern: /^Сохранил\(а\)/,         label: 'Сохранение' },
    { pattern: /^Массовое удаление/,     label: 'Удаление' },
    { pattern: /^Удаление по фильтру/,   label: 'Удаление' },
    { pattern: /^Рассылка отправлена/,    label: 'Отправка' },
    { pattern: /^Рассылка завершена/,     label: 'Отправка' },
];

const CATEGORY_RULES: Array<{ pattern: RegExp; objectType: string; category: string }> = [
    { pattern: /подписку для пользователя/i,           objectType: 'Пользователь',  category: 'Пользователи' },
    { pattern: /пользовател/i,                         objectType: 'Пользователь',  category: 'Пользователи' },
    { pattern: /администратор/i,                       objectType: 'Администратор', category: 'Администраторы' },
    { pattern: /запланированную рассылку/i,            objectType: 'Рассылка',      category: 'Рассылки' },
    { pattern: /рассылк[уаиое]/i,                      objectType: 'Рассылка',      category: 'Рассылки' },
    { pattern: /событие/i,                             objectType: 'Событие',       category: 'Календарь событий' },
    { pattern: /запись эфира/i,                        objectType: 'Контент',       category: 'Записи эфиров' },
    { pattern: /Каталог[еа]? продуктов/i,             objectType: 'Контент',       category: 'Каталог продуктов' },
    { pattern: /Библиотек[еи] сознания/i,             objectType: 'Контент',       category: 'Библиотека сознания' },
    { pattern: /Беседк[еи] женственности/i,           objectType: 'Контент',       category: 'Беседка женственности' },
    { pattern: /Башн[еи] мастеров/i,                  objectType: 'Контент',       category: 'Башня мастеров' },
    { pattern: /Кузниц[еы] Духа/i,                    objectType: 'Контент',       category: 'Кузница Духа' },
    { pattern: /Мастерской отношений/i,                objectType: 'Контент',       category: 'Мастерская отношений' },
    { pattern: /Лаборатори[ию] здоровья/i,            objectType: 'Контент',       category: 'Лаборатория здоровья' },
    { pattern: /Разборы - Реализация/i,               objectType: 'Контент',       category: 'Разборы - Реализация' },
    { pattern: /Разборы - Отношения/i,                objectType: 'Контент',       category: 'Разборы - Отношения' },
    { pattern: /Разборы - Здоровье/i,                 objectType: 'Контент',       category: 'Разборы - Здоровье' },
    { pattern: /Психодиагностик/i,                    objectType: 'Контент',       category: 'Психодиагностика' },
    { pattern: /научное открытие/i,                   objectType: 'Контент',       category: 'Научные открытия' },
    { pattern: /притчу/i,                             objectType: 'Контент',       category: 'Притчи жизни' },
    { pattern: /практику/i,                           objectType: 'Контент',       category: 'Практики' },
    { pattern: /документ/i,                           objectType: 'Контент',       category: 'Документы' },
    { pattern: /FAQ/i,                                objectType: 'Контент',       category: 'FAQ' },
    { pattern: /уровень/i,                            objectType: 'Контент',       category: 'Уровни' },
    { pattern: /задание/i,                            objectType: 'Контент',       category: 'Задания' },
    { pattern: /шаблон модального уведомления/i,      objectType: 'Уведомление',   category: 'Модальные уведомления' },
    { pattern: /модальное уведомление/i,              objectType: 'Уведомление',   category: 'Модальные уведомления' },
    { pattern: /ссылку активации/i,                   objectType: 'Контент',       category: 'Ссылки активации' },
    { pattern: /описание навигатора/i,                objectType: 'Контент',       category: 'Навигатор' },
    { pattern: /о начале путешествия/i,               objectType: 'Контент',       category: 'Начало путешествия' },
    { pattern: /контент приветствия/i,                objectType: 'Контент',       category: 'Приветствие' },
    { pattern: /о клубе/i,                            objectType: 'Контент',       category: 'О клубе' },
    { pattern: /динамический контент/i,               objectType: 'Контент',       category: 'Динамический контент' },
    { pattern: /источник трафика бота/i,              objectType: 'Настройки',     category: 'Источники трафика' },
    { pattern: /политику начисления баллов/i,         objectType: 'Настройки',     category: 'Политика начисления' },
];

function parseAction(raw: string): ParsedAction {
    let action = '—';
    for (const v of ACTION_VERBS) {
        if (v.pattern.test(raw)) {
            action = v.label;
            break;
        }
    }

    let objectType = '—';
    let category = '—';
    for (const r of CATEGORY_RULES) {
        if (r.pattern.test(raw)) {
            objectType = r.objectType;
            category = r.category;
            break;
        }
    }

    let objectName = '—';
    const nameMatch = raw.match(/"([^"]+)"/);
    if (nameMatch) {
        objectName = nameMatch[1]
            .replace(/<[^>]*>/g, '')
            .replace(/\.{3}$/, '…')
            .trim();
    }

    return { action, objectType, category, objectName, raw };
}

function collectUnique(items: ParsedAction[], key: keyof ParsedAction): string[] {
    const set = new Set<string>();
    for (const i of items) {
        const v = i[key];
        if (v && v !== '—') set.add(v);
    }
    return Array.from(set).sort();
}

const CLIENT_PAGE_SIZE = 50;

export const AdminActionLogs = () => {
    const [logs, setLogs] = useState<AdminActionLog[]>([]);
    const [serverPagination, setServerPagination] = useState<PaginationInfo | null>(null);
    const [serverPage, setServerPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const serverLimit = 500;

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [objectTypeFilter, setObjectTypeFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [clientPage, setClientPage] = useState(1);

    const fetchLogs = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(serverLimit));
            if (dateFrom) params.set('dateFrom', dateFrom);
            if (dateTo) params.set('dateTo', dateTo);

            const response = await api.get(`/api/admin-action-logs?${params.toString()}`);
            setLogs(response.data.data || []);
            setServerPagination(response.data.pagination || null);
        } catch {
            toast.error('Ошибка загрузки журнала действий');
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        setServerPage(1);
        setClientPage(1);
    }, [dateFrom, dateTo]);

    useEffect(() => {
        fetchLogs(serverPage);
    }, [serverPage, fetchLogs]);

    useEffect(() => {
        setClientPage(1);
    }, [searchQuery, actionFilter, objectTypeFilter, categoryFilter]);

    const parsed = useMemo(() => logs.map((log) => ({
        ...log,
        parsed: parseAction(log.action),
    })), [logs]);

    const allActions = useMemo(() => collectUnique(parsed.map(p => p.parsed), 'action'), [parsed]);
    const allObjectTypes = useMemo(() => collectUnique(parsed.map(p => p.parsed), 'objectType'), [parsed]);
    const allCategories = useMemo(() => collectUnique(parsed.map(p => p.parsed), 'category'), [parsed]);

    const filtered = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return parsed.filter((log) => {
            if (actionFilter !== 'all' && log.parsed.action !== actionFilter) return false;
            if (objectTypeFilter !== 'all' && log.parsed.objectType !== objectTypeFilter) return false;
            if (categoryFilter !== 'all' && log.parsed.category !== categoryFilter) return false;
            if (q) {
                const nameMatch = log.parsed.objectName.toLowerCase().includes(q);
                const adminMatch = (log.admin?.fullName || '').toLowerCase().includes(q)
                    || (log.admin?.mail || '').toLowerCase().includes(q);
                if (!nameMatch && !adminMatch) return false;
            }
            return true;
        });
    }, [parsed, actionFilter, objectTypeFilter, categoryFilter, searchQuery]);

    const totalFiltered = filtered.length;
    const totalClientPages = Math.max(1, Math.ceil(totalFiltered / CLIENT_PAGE_SIZE));
    const pagedLogs = filtered.slice((clientPage - 1) * CLIENT_PAGE_SIZE, clientPage * CLIENT_PAGE_SIZE);

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
                        <p className="text-gray-600 mt-1">
                            История действий администраторов
                            {serverPagination && ` (всего: ${serverPagination.totalLogs})`}
                        </p>
                    </div>
                </div>

                {/* Фильтры */}
                <div className="bg-white p-4 rounded-lg shadow space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Поиск по названию объекта или администратору..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Дата от</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Дата до</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Действие</label>
                            <select
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Все</option>
                                {allActions.map((a) => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Тип объекта</label>
                            <select
                                value={objectTypeFilter}
                                onChange={(e) => setObjectTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Все</option>
                                {allObjectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Все</option>
                                {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {(dateFrom || dateTo || actionFilter !== 'all' || objectTypeFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim()) && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                                Найдено: {totalFiltered}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setDateFrom('');
                                    setDateTo('');
                                    setSearchQuery('');
                                    setActionFilter('all');
                                    setObjectTypeFilter('all');
                                    setCategoryFilter('all');
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                Сбросить фильтры
                            </button>
                        </div>
                    )}
                </div>

                {/* Таблица */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap">Дата</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap">Администратор</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap">Действие</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap">Тип объекта</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap">Категория</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 whitespace-nowrap">Объект</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                            Загрузка...
                                        </td>
                                    </tr>
                                ) : pagedLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                            Действий не найдено
                                        </td>
                                    </tr>
                                ) : (
                                    pagedLogs.map((log) => (
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
                                            <td className="px-4 py-3 text-sm">
                                                <ActionBadge action={log.parsed.action} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{log.parsed.objectType}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{log.parsed.category}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xl min-w-[10rem] break-words" title={log.parsed.objectName}>
                                                {log.parsed.objectName}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Пагинация */}
                    {totalClientPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                            <div className="text-sm text-gray-600">
                                Страница {clientPage} из {totalClientPages}
                                {serverPagination && serverPagination.totalPages > 1 && (
                                    <span className="ml-2 text-gray-400">
                                        (серверная страница {serverPagination.currentPage} из {serverPagination.totalPages})
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => clientPage > 1 && setClientPage(clientPage - 1)}
                                    disabled={clientPage <= 1 || loading}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                                >
                                    <ChevronLeft size={16} />
                                    Назад
                                </button>
                                <button
                                    type="button"
                                    onClick={() => clientPage < totalClientPages && setClientPage(clientPage + 1)}
                                    disabled={clientPage >= totalClientPages || loading}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Вперед
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {serverPagination && serverPagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 px-4 py-2 border-t bg-gray-100">
                            <span className="text-xs text-gray-500">Загрузить данные:</span>
                            <button
                                type="button"
                                onClick={() => { setServerPage(serverPage - 1); setClientPage(1); }}
                                disabled={!serverPagination.hasPrevPage || loading}
                                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                                ← Предыдущие {serverLimit}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setServerPage(serverPage + 1); setClientPage(1); }}
                                disabled={!serverPagination.hasNextPage || loading}
                                className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                                Следующие {serverLimit} →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

const ACTION_BADGE_COLORS: Record<string, string> = {
    'Создание':       'bg-green-100 text-green-700',
    'Обновление':     'bg-blue-100 text-blue-700',
    'Удаление':       'bg-red-100 text-red-700',
    'Блокировка':     'bg-red-100 text-red-700',
    'Разблокировка':  'bg-green-100 text-green-700',
    'Активация':      'bg-purple-100 text-purple-700',
    'Деактивация':    'bg-orange-100 text-orange-700',
    'Отправил':       'bg-indigo-100 text-indigo-700',
    'Отправка':       'bg-indigo-100 text-indigo-700',
    'Планирование':   'bg-yellow-100 text-yellow-700',
    'Отмена':         'bg-gray-100 text-gray-700',
    'Сохранение':     'bg-teal-100 text-teal-700',
};

function ActionBadge({ action }: { action: string }) {
    const color = ACTION_BADGE_COLORS[action] || 'bg-gray-100 text-gray-700';
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
            {action}
        </span>
    );
}
