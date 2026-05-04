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
    X,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Search,
} from 'lucide-react';

interface CampaignStats {
    closedModal: number;
    clickedButton: number;
}

interface ModalCampaignRow {
    _id: string;
    modalTitle: string;
    scheduledAt?: string | null;
    sentAt?: string | null;
    recipientCount: number;
    status: 'scheduled' | 'sent' | 'failed';
    error?: string;
    createdAt: string;
    stats: CampaignStats;
}

interface SavedModalTemplate {
    _id: string;
    title: string;
    modalTitle: string;
    modalDescription: string;
    modalButtonText: string;
    modalButtonLink?: string;
    updatedAt: string;
}

interface ModalScheduleRow {
    _id: string;
    scheduledAt: string;
    sentAt?: string | null;
    status: string;
    payload?: {
        modalTitle?: string;
        modalDescription?: string;
        campaignId?: string;
    };
    result?: { count?: number };
    scheduledBy?: { fullName?: string };
}

type EnrichedSentRow = ModalScheduleRow & { campaign: ModalCampaignRow | null };

type SentRowsSortKey = 'sentAt' | 'count' | 'closed' | 'clicked';

function formatMsk(iso?: string | null) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    } catch {
        return '—';
    }
}

function stripHtml(html: string) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return tmp.textContent || tmp.innerText || '';
}

function getDescriptionPreview(html?: string, maxLen = 120) {
    if (!html) return '—';
    const text = stripHtml(html);
    return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
}

export const ModalNotificationsAdmin = () => {
    const navigate = useNavigate();

    const [savedTemplates, setSavedTemplates] = useState<SavedModalTemplate[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [scheduledModalRows, setScheduledModalRows] = useState<ModalScheduleRow[]>([]);
    const [loadingScheduledRows, setLoadingScheduledRows] = useState(false);
    const [sentModalRows, setSentModalRows] = useState<ModalScheduleRow[]>([]);
    const [loadingSentRows, setLoadingSentRows] = useState(false);
    const [campaigns, setCampaigns] = useState<ModalCampaignRow[]>([]);
    const [campaignsLoading, setCampaignsLoading] = useState(false);

    const [sentRowsSortKey, setSentRowsSortKey] = useState<SentRowsSortKey>('sentAt');
    const [sentRowsSortDir, setSentRowsSortDir] = useState<'asc' | 'desc'>('desc');
    const [sentRowsSearch, setSentRowsSearch] = useState('');

    const fetchSavedTemplates = async () => {
        setLoadingSaved(true);
        try {
            const response = await api.get<{ success: boolean; data: SavedModalTemplate[] }>(
                '/api/modal-notification/templates'
            );
            if (response.data.success && response.data.data) {
                setSavedTemplates(response.data.data);
            }
        } catch {
            toast.error('Ошибка загрузки сохранённых шаблонов');
        } finally {
            setLoadingSaved(false);
        }
    };

    const fetchScheduledModalRows = async () => {
        setLoadingScheduledRows(true);
        try {
            const response = await api.get<{ success: boolean; data: ModalScheduleRow[] }>(
                '/api/modal-notification/scheduled'
            );
            if (response.data.success && response.data.data) {
                setScheduledModalRows(response.data.data);
            }
        } catch {
            toast.error('Ошибка загрузки запланированных');
        } finally {
            setLoadingScheduledRows(false);
        }
    };

    const fetchSentModalRows = async () => {
        setLoadingSentRows(true);
        try {
            const response = await api.get<{ success: boolean; data: ModalScheduleRow[] }>(
                '/api/modal-notification/sent'
            );
            if (response.data.success && response.data.data) {
                setSentModalRows(response.data.data);
            }
        } catch {
            toast.error('Ошибка загрузки отправленных');
        } finally {
            setLoadingSentRows(false);
        }
    };

    const fetchCampaigns = async () => {
        setCampaignsLoading(true);
        try {
            const response = await api.get<{ success: boolean; data: ModalCampaignRow[] }>(
                '/api/modal-notification/campaigns',
                { params: { limit: 100 } }
            );
            if (response.data.success && response.data.data) {
                setCampaigns(response.data.data);
            }
        } catch {
            toast.error('Ошибка загрузки статистики кампаний');
        } finally {
            setCampaignsLoading(false);
        }
    };

    const fetchAll = () => {
        fetchSavedTemplates();
        fetchScheduledModalRows();
        fetchSentModalRows();
        fetchCampaigns();
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const handleDeleteTemplate = async (id: string, name: string) => {
        if (!confirm(`Удалить шаблон «${name}»?`)) return;
        try {
            const response = await api.delete(`/api/modal-notification/templates/${id}`);
            if (response.data.success) {
                toast.success('Шаблон удалён');
                fetchSavedTemplates();
            } else {
                toast.error(response.data.message || 'Ошибка удаления');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка удаления');
        }
    };

    const handleCancelScheduledModal = async (id: string) => {
        if (!confirm('Отменить запланированное модальное уведомление?')) return;
        try {
            const response = await api.delete(`/api/modal-notification/scheduled/${id}`);
            if (response.data.success) {
                toast.success('Планирование отменено');
                fetchScheduledModalRows();
                fetchCampaigns();
            } else {
                toast.error(response.data.message || 'Ошибка отмены');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка отмены');
        }
    };

    const toggleSentRowsSort = (key: SentRowsSortKey) => {
        if (sentRowsSortKey === key) {
            setSentRowsSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSentRowsSortKey(key);
            setSentRowsSortDir('desc');
        }
    };

    const enrichedSentRows: EnrichedSentRow[] = useMemo(() => {
        const byId = new Map(campaigns.map((c) => [String(c._id), c]));
        return sentModalRows.map((row) => ({
            ...row,
            campaign: row.payload?.campaignId
                ? byId.get(String(row.payload.campaignId)) ?? null
                : null,
        }));
    }, [sentModalRows, campaigns]);

    const sortedSentModalRows = useMemo(() => {
        let list = [...enrichedSentRows];

        if (sentRowsSearch.trim()) {
            const q = sentRowsSearch.trim().toLowerCase();
            list = list.filter((item) => {
                const title = (item.payload?.modalTitle || '').toLowerCase();
                const cTitle = (item.campaign?.modalTitle || '').toLowerCase();
                const desc = stripHtml(item.payload?.modalDescription || '').toLowerCase();
                return title.includes(q) || cTitle.includes(q) || desc.includes(q);
            });
        }

        const mult = sentRowsSortDir === 'asc' ? 1 : -1;
        if (sentRowsSortKey === 'sentAt') {
            list.sort((a, b) => {
                const da = a.sentAt ? new Date(a.sentAt).getTime() : 0;
                const db = b.sentAt ? new Date(b.sentAt).getTime() : 0;
                return mult * (da - db);
            });
        } else if (sentRowsSortKey === 'count') {
            list.sort((a, b) => {
                const av = a.result?.count ?? a.campaign?.recipientCount ?? 0;
                const bv = b.result?.count ?? b.campaign?.recipientCount ?? 0;
                return mult * (av - bv);
            });
        } else if (sentRowsSortKey === 'closed') {
            list.sort((a, b) => {
                const av = a.campaign?.stats?.closedModal ?? -1;
                const bv = b.campaign?.stats?.closedModal ?? -1;
                return mult * (av - bv);
            });
        } else {
            list.sort((a, b) => {
                const av = a.campaign?.stats?.clickedButton ?? -1;
                const bv = b.campaign?.stats?.clickedButton ?? -1;
                return mult * (av - bv);
            });
        }
        return list;
    }, [enrichedSentRows, sentRowsSortKey, sentRowsSortDir, sentRowsSearch]);

    const SentRowsSortIcon = ({ column }: { column: SentRowsSortKey }) => {
        if (sentRowsSortKey !== column) {
            return <ArrowUpDown size={14} className="opacity-40 shrink-0" aria-hidden />;
        }
        return sentRowsSortDir === 'desc' ? (
            <ArrowDown size={14} className="shrink-0" aria-hidden />
        ) : (
            <ArrowUp size={14} className="shrink-0" aria-hidden />
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Модальные уведомления</h1>
                    <p className="text-gray-600 mt-1">
                        Создание модальных уведомлений для пользователей (в режиме «Все» анонимы не
                        включаются)
                    </p>
                </div>

                <div className="flex justify-end -mt-3">
                    <button
                        onClick={() => navigate('/admin/modal-notifications/create')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus size={18} />
                        Создать уведомление
                    </button>
                </div>

                {/* Запланированные */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarClock size={18} />
                        <h2 className="text-xl font-semibold text-gray-900">
                            Запланированные модальные уведомления
                        </h2>
                    </div>
                    {loadingScheduledRows && (
                        <p className="text-gray-500 text-center py-4">Загрузка…</p>
                    )}
                    {!loadingScheduledRows && scheduledModalRows.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {scheduledModalRows.map((item) => (
                                <div
                                    key={item._id}
                                    className="border border-amber-200 rounded-lg p-4 bg-amber-50/50 hover:bg-amber-50 transition-colors"
                                >
                                    {item.payload?.modalTitle && (
                                        <div className="font-semibold text-gray-900 mb-1">
                                            {item.payload.modalTitle}
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                                        {getDescriptionPreview(item.payload?.modalDescription)}
                                    </div>
                                    <div className="text-xs text-amber-700 font-medium mb-1">
                                        {formatMsk(item.scheduledAt)}
                                    </div>
                                    {item.scheduledBy?.fullName && (
                                        <div className="text-xs text-gray-500 mb-2">
                                            Запланировал: {item.scheduledBy.fullName}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleCancelScheduledModal(item._id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                    >
                                        <X size={16} />
                                        Отменить
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loadingScheduledRows && scheduledModalRows.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                            Нет запланированных уведомлений
                        </p>
                    )}
                </div>

                {/* Сохранённые шаблоны */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen size={18} />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Сохранённые модальные окна
                            </h2>
                        </div>
                    </div>
                    {loadingSaved && (
                        <p className="text-gray-500 text-center py-4">Загрузка…</p>
                    )}
                    {!loadingSaved && savedTemplates.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {savedTemplates.map((t) => (
                                <div
                                    key={t._id}
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="font-semibold text-gray-900 mb-1">{t.modalTitle}</div>
                                    <div className="text-sm text-gray-700 font-medium line-clamp-1">
                                        {t.modalTitle}
                                    </div>
                                    <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                                        {getDescriptionPreview(t.modalDescription)}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Обновлено:{' '}
                                        {new Date(t.updatedAt).toLocaleDateString('ru-RU')}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/admin/modal-notifications/edit/${t._id}`
                                                )
                                            }
                                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <Edit size={16} />
                                            Редактировать
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(t._id, t.title)}
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
                    {!loadingSaved && savedTemplates.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                            Нет сохранённых шаблонов
                        </p>
                    )}
                </div>

                {/* Отправленные + статистика кампаний (одна таблица) */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <Send size={18} />
                            <h2 className="text-xl font-semibold text-gray-900">
                                Отправленные модальные уведомления
                            </h2>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <input
                                type="text"
                                value={sentRowsSearch}
                                onChange={(e) => setSentRowsSearch(e.target.value)}
                                placeholder="Поиск по заголовку…"
                                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
                            {sentRowsSearch && (
                                <button
                                    type="button"
                                    onClick={() => setSentRowsSearch('')}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    {loadingSentRows || campaignsLoading ? (
                        <p className="text-gray-500 text-center py-4">Загрузка…</p>
                    ) : null}
                    {!loadingSentRows && !campaignsLoading && sentModalRows.length > 0 && (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-700 min-w-[300px]">
                                            Заголовок
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-700 min-w-[150px]">
                                            Описание
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                                            Статус отправки
                                        </th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentRowsSort('sentAt')}
                                                title="Сортировать по дате отправки"
                                            >
                                                Отправлено (МСК)
                                                <SentRowsSortIcon column="sentAt" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right tabular-nums">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentRowsSort('count')}
                                                title="Сортировать по количеству получателей"
                                            >
                                                Получателей
                                                <SentRowsSortIcon column="count" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right tabular-nums">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentRowsSort('closed')}
                                                title="Закрыли модалку"
                                            >
                                                Закрыли (×)
                                                <SentRowsSortIcon column="closed" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right tabular-nums">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentRowsSort('clicked')}
                                                title="Нажали кнопку в модалке"
                                            >
                                                Нажали кнопку
                                                <SentRowsSortIcon column="clicked" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                                            Инициатор
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedSentModalRows.map((item) => {
                                        const cid = item.payload?.campaignId;
                                        const goCampaign = () => {
                                            if (cid) navigate(`/admin/modal-notifications/campaign/${cid}`);
                                        };
                                        return (
                                            <tr
                                                key={item._id}
                                                role={cid ? 'button' : undefined}
                                                tabIndex={cid ? 0 : undefined}
                                                onClick={cid ? goCampaign : undefined}
                                                onKeyDown={
                                                    cid
                                                        ? (e) => {
                                                              if (e.key === 'Enter' || e.key === ' ') {
                                                                  e.preventDefault();
                                                                  goCampaign();
                                                              }
                                                          }
                                                        : undefined
                                                }
                                                className={`border-b border-gray-100 hover:bg-green-50/60 transition-colors ${cid ? 'cursor-pointer' : ''}`}
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-900 max-w-[220px]">
                                                    <span className="line-clamp-2" title={item.payload?.modalTitle || ''}>
                                                        {item.payload?.modalTitle || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700 max-w-md">
                                                    <span
                                                        className="line-clamp-2"
                                                        title={stripHtml(item.payload?.modalDescription || '')}
                                                    >
                                                        {getDescriptionPreview(item.payload?.modalDescription, 200)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {!item.campaign && <span className="text-gray-400">—</span>}
                                                    {item.campaign?.status === 'scheduled' && (
                                                        <span className="text-amber-700">ожидает</span>
                                                    )}
                                                    {item.campaign?.status === 'sent' && (
                                                        <span className="text-green-700">отправлено</span>
                                                    )}
                                                    {item.campaign?.status === 'failed' && (
                                                        <span className="text-red-700" title={item.campaign.error}>
                                                            ошибка
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                    {formatMsk(item.sentAt)}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                                                    {item.result?.count ??
                                                        item.campaign?.recipientCount ??
                                                        '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-800">
                                                    {item.campaign?.stats != null
                                                        ? item.campaign.stats.closedModal
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-gray-800">
                                                    {item.campaign?.stats != null
                                                        ? item.campaign.stats.clickedButton
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 max-w-[160px]">
                                                    <span className="line-clamp-2" title={item.scheduledBy?.fullName || ''}>
                                                        {item.scheduledBy?.fullName || '—'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loadingSentRows && !campaignsLoading && sentModalRows.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                            Пока нет записей об отправках
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={fetchAll}
                        className="mt-3 text-sm text-blue-600 hover:underline"
                    >
                        Обновить статистику и списки
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
};
