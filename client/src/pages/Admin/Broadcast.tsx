import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import {
    Plus,
    Edit,
    Trash2,
    BookOpen,
    CalendarClock,
    Send,
    XCircle,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Search,
    X,
} from 'lucide-react';

interface SavedBroadcast {
    _id: string;
    title: string;
    imgUrl?: string;
    content: string;
    buttonText?: string;
    createdAt: string;
    updatedAt: string;
}

interface ScheduledBroadcast {
    _id: string;
    scheduledAt: string;
    status: string;
    payload: { title?: string; message?: string; imageUrl?: string; buttonText?: string };
    scheduledBy?: { fullName?: string };
}

interface SentBroadcast {
    _id: string;
    scheduledAt: string;
    sentAt: string;
    status: string;
    payload: { title?: string; message?: string; imageUrl?: string; buttonText?: string };
    result?: { sent?: number; failed?: number; total?: number };
    scheduledBy?: { fullName?: string };
}

type SentSortKey = 'sentAt' | 'sent' | 'failed' | 'total';

const getTitleScriptRank = (title: string) => {
    const firstLetter = title.trim().match(/\p{L}/u)?.[0] || '';
    if (/[\p{Script=Cyrillic}]/u.test(firstLetter)) return 0;
    if (/[\p{Script=Latin}]/u.test(firstLetter)) return 1;
    return 2;
};

const compareTitleCyrillicFirst = (a: string, b: string) => {
    const rankDiff = getTitleScriptRank(a) - getTitleScriptRank(b);
    if (rankDiff !== 0) return rankDiff;

    return a.localeCompare(b, ['ru', 'en'], {
        numeric: true,
        sensitivity: 'base',
    });
};

export const BroadcastAdmin = () => {
    const [savedBroadcasts, setSavedBroadcasts] = useState<SavedBroadcast[]>([]);
    const [scheduledBroadcasts, setScheduledBroadcasts] = useState<ScheduledBroadcast[]>([]);
    const [sentBroadcasts, setSentBroadcasts] = useState<SentBroadcast[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingScheduled, setLoadingScheduled] = useState(false);
    const [loadingSent, setLoadingSent] = useState(false);
    const [sentSortKey, setSentSortKey] = useState<SentSortKey>('sentAt');
    const [sentSortDir, setSentSortDir] = useState<'asc' | 'desc'>('desc');
    const [sentSearch, setSentSearch] = useState('');
    const navigate = useNavigate();

    const fetchAll = () => {
        fetchSavedBroadcasts();
        fetchScheduledBroadcasts();
        fetchSentBroadcasts();
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchSavedBroadcasts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/broadcast');
            if (response.data.success) {
                setSavedBroadcasts(response.data.data || []);
            }
        } catch (error: any) {
            console.error('Ошибка загрузки сохраненных рассылок:', error);
            toast.error('Ошибка загрузки сохраненных рассылок');
        } finally {
            setLoading(false);
        }
    };

    const fetchScheduledBroadcasts = async () => {
        try {
            setLoadingScheduled(true);
            const response = await api.get('/api/broadcast/scheduled');
            if (response.data.success) {
                setScheduledBroadcasts(response.data.data || []);
            }
        } catch (error: any) {
            console.error('Ошибка загрузки запланированных рассылок:', error);
            toast.error('Ошибка загрузки запланированных рассылок');
        } finally {
            setLoadingScheduled(false);
        }
    };

    const fetchSentBroadcasts = async () => {
        try {
            setLoadingSent(true);
            const response = await api.get('/api/broadcast/sent');
            if (response.data.success) {
                setSentBroadcasts(response.data.data || []);
            }
        } catch (error: any) {
            console.error('Ошибка загрузки отправленных рассылок:', error);
            toast.error('Ошибка загрузки отправленных рассылок');
        } finally {
            setLoadingSent(false);
        }
    };

    const handleDeleteBroadcast = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту рассылку?')) return;

        try {
            const response = await api.delete(`/api/broadcast/${id}`);
            if (response.data.success) {
                toast.success('Рассылка успешно удалена');
                fetchSavedBroadcasts();
            } else {
                toast.error(response.data.message || 'Ошибка удаления рассылки');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Ошибка удаления рассылки';
            toast.error(errorMessage);
        }
    };

    const handleCancelScheduled = async (id: string) => {
        if (!confirm('Вы уверены, что хотите отменить эту рассылку?')) return;

        try {
            const response = await api.delete(`/api/broadcast/scheduled/${id}`);
            if (response.data.success) {
                toast.success('Рассылка отменена');
                fetchScheduledBroadcasts();
            } else {
                toast.error(response.data.message || 'Ошибка отмены рассылки');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Ошибка отмены рассылки';
            toast.error(errorMessage);
        }
    };

    const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html || '';
        return tmp.textContent || tmp.innerText || '';
    };

    const getMessagePreview = (msg?: string, maxLen = 120) => {
        if (!msg) return '—';
        const text = stripHtml(msg);
        return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
    };

    const toggleSentSort = (key: SentSortKey) => {
        if (sentSortKey === key) {
            setSentSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSentSortKey(key);
            setSentSortDir('desc');
        }
    };

    const sortedScheduledBroadcasts = useMemo(
        () => [...scheduledBroadcasts].sort((a, b) => compareTitleCyrillicFirst(
            a.payload?.title || '',
            b.payload?.title || ''
        )),
        [scheduledBroadcasts]
    );

    const sortedSavedBroadcasts = useMemo(
        () => [...savedBroadcasts].sort((a, b) => compareTitleCyrillicFirst(a.title || '', b.title || '')),
        [savedBroadcasts]
    );

    const sortedSentBroadcasts = useMemo(() => {
        let list = [...sentBroadcasts];

        if (sentSearch.trim()) {
            const q = sentSearch.trim().toLowerCase();
            list = list.filter((item) => {
                const title = (item.payload?.title || '').toLowerCase();
                const message = stripHtml(item.payload?.message || '').toLowerCase();
                return title.includes(q) || message.includes(q);
            });
        }

        const mult = sentSortDir === 'asc' ? 1 : -1;

        if (sentSortKey === 'sentAt') {
            list.sort((a, b) => {
                const da = a.sentAt ? new Date(a.sentAt).getTime() : 0;
                const db = b.sentAt ? new Date(b.sentAt).getTime() : 0;
                return mult * (da - db);
            });
            return list;
        }

        const pick = (item: SentBroadcast): number | undefined => {
            switch (sentSortKey) {
                case 'sent':
                    return item.result?.sent;
                case 'failed':
                    return item.result?.failed;
                case 'total':
                    return item.result?.total;
                default:
                    return undefined;
            }
        };
        list.sort((a, b) => {
            const av = pick(a);
            const bv = pick(b);
            if (av === undefined && bv === undefined) return 0;
            if (av === undefined) return 1;
            if (bv === undefined) return -1;
            return mult * (av - bv);
        });
        return list;
    }, [sentBroadcasts, sentSortKey, sentSortDir, sentSearch]);

    const SentSortIcon = ({ column }: { column: SentSortKey }) => {
        if (sentSortKey !== column) {
            return <ArrowUpDown size={14} className="opacity-40 shrink-0" aria-hidden />;
        }
        return sentSortDir === 'desc' ? (
            <ArrowDown size={14} className="shrink-0" aria-hidden />
        ) : (
            <ArrowUp size={14} className="shrink-0" aria-hidden />
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Рассылки</h1>
                    <p className="text-gray-600 mt-1">Отправка сообщений пользователям через Telegram бота</p>
                </div>

                <div className='flex justify-end -mt-3'>
                    <button
                        onClick={() => navigate('/admin/broadcast/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus size={18} />
                        Создать рассылку
                    </button>
                </div>

                {/* Запланированные рассылки */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarClock size={18} />
                        <h2 className="text-xl font-semibold text-gray-900">Запланированные рассылки</h2>
                    </div>
                    {loadingScheduled && <p className="text-gray-500 text-center py-4">Загрузка...</p>}
                    {!loadingScheduled && sortedScheduledBroadcasts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sortedScheduledBroadcasts.map((item) => (
                                <div
                                    key={item._id}
                                    className="border border-amber-200 rounded-lg p-4 bg-amber-50/50 hover:bg-amber-50 transition-colors"
                                >
                                    {item.payload?.title && (
                                        <div className="font-semibold text-gray-900 mb-1">{item.payload.title}</div>
                                    )}
                                    <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                                        {getMessagePreview(item.payload?.message)}
                                    </div>
                                    <div className="text-xs text-amber-700 font-medium mb-1">
                                        {new Date(item.scheduledAt).toLocaleString('ru-RU')}
                                    </div>
                                    {item.scheduledBy?.fullName && (
                                        <div className="text-xs text-gray-500 mb-2">
                                            Запланировал: {item.scheduledBy.fullName}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleCancelScheduled(item._id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                    >
                                        <XCircle size={16} />
                                        Отменить
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loadingScheduled && sortedScheduledBroadcasts.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Нет запланированных рассылок</p>
                    )}
                </div>

                {/* Сохраненные рассылки */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen size={18} />
                            <h2 className="text-xl font-semibold text-gray-900">Сохраненные рассылки</h2>
                        </div>
                        
                    </div>
                    {loading && <p className="text-gray-500 text-center py-4">Загрузка...</p>}
                    {!loading && sortedSavedBroadcasts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sortedSavedBroadcasts.map((broadcast) => (
                                <div
                                    key={broadcast._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="font-semibold text-gray-900 mb-1">{broadcast.title}</div>
                                    <div
                                        className="text-sm text-gray-600 line-clamp-2"
                                        dangerouslySetInnerHTML={{ __html: broadcast.content.substring(0, 120) }}
                                    />
                                    <div className="mt-2 text-xs text-gray-500">
                                        Обновлено: {new Date(broadcast.updatedAt).toLocaleDateString('ru-RU')}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/broadcast/edit/${broadcast._id}`)}
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <Edit size={16} />
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={() => handleDeleteBroadcast(broadcast._id)}
                                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                        >
                                            <Trash2 size={16} />
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && sortedSavedBroadcasts.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Нет сохраненных рассылок</p>
                    )}
                </div>

                {/* Отправленные рассылки */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Send size={18} />
                            <h2 className="text-xl font-semibold text-gray-900">Отправленные рассылки</h2>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                value={sentSearch}
                                onChange={(e) => setSentSearch(e.target.value)}
                                placeholder="Поиск по названию…"
                                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                            {sentSearch && (
                                <button
                                    type="button"
                                    onClick={() => setSentSearch('')}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    {loadingSent && <p className="text-gray-500 text-center py-4">Загрузка...</p>}
                    {!loadingSent && sentBroadcasts.length > 0 && (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                                            Название
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-700 min-w-[200px]">
                                            Описание (текст)
                                        </th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentSort('sentAt')}
                                                title="Сортировать по дате отправки"
                                            >
                                                Отправлено
                                                <SentSortIcon column="sentAt" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right tabular-nums">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentSort('sent')}
                                                title="Сортировать по доставленным"
                                            >
                                                Доставлено
                                                <SentSortIcon column="sent" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right tabular-nums">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentSort('failed')}
                                                title="Сортировать по ошибкам"
                                            >
                                                Ошибок
                                                <SentSortIcon column="failed" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right tabular-nums">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentSort('total')}
                                                title="Сортировать по всего"
                                            >
                                                Всего
                                                <SentSortIcon column="total" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                                            Инициатор
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedSentBroadcasts.map((item) => (
                                        <tr
                                            key={item._id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => navigate(`/admin/broadcast/sent/${item._id}`)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    navigate(`/admin/broadcast/sent/${item._id}`);
                                                }
                                            }}
                                            className="border-b border-gray-100 hover:bg-green-50/60 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px]">
                                                <span className="line-clamp-2" title={item.payload?.title || ''}>
                                                    {item.payload?.title || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 max-w-md">
                                                <span className="line-clamp-2" title={stripHtml(item.payload?.message || '')}>
                                                    {getMessagePreview(item.payload?.message, 200)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                {item.sentAt
                                                    ? new Date(item.sentAt).toLocaleString('ru-RU')
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                                                {item.result?.sent ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                                                {item.result?.failed ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                                {item.result?.total ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 max-w-[160px]">
                                                <span className="line-clamp-2" title={item.scheduledBy?.fullName || ''}>
                                                    {item.scheduledBy?.fullName || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loadingSent && sentBroadcasts.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Нет отправленных рассылок</p>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};
