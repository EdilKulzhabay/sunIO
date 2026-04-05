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
    BarChart3,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
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

type SentSortKey = 'sentAt' | 'recipients' | 'closed' | 'clicked';

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

    const [sentSortKey, setSentSortKey] = useState<SentSortKey>('sentAt');
    const [sentSortDir, setSentSortDir] = useState<'asc' | 'desc'>('desc');

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
                { params: { limit: 40 } }
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

    const toggleSentSort = (key: SentSortKey) => {
        if (sentSortKey === key) {
            setSentSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSentSortKey(key);
            setSentSortDir('desc');
        }
    };

    const sortedCampaigns = useMemo(() => {
        const list = [...campaigns];
        const mult = sentSortDir === 'asc' ? 1 : -1;

        switch (sentSortKey) {
            case 'sentAt':
                list.sort((a, b) => {
                    const da = a.sentAt ? new Date(a.sentAt).getTime() : 0;
                    const db = b.sentAt ? new Date(b.sentAt).getTime() : 0;
                    return mult * (da - db);
                });
                break;
            case 'recipients':
                list.sort((a, b) => mult * (a.recipientCount - b.recipientCount));
                break;
            case 'closed':
                list.sort((a, b) => mult * (a.stats.closedModal - b.stats.closedModal));
                break;
            case 'clicked':
                list.sort((a, b) => mult * (a.stats.clickedButton - b.stats.clickedButton));
                break;
        }
        return list;
    }, [campaigns, sentSortKey, sentSortDir]);

    const SortIcon = ({ column }: { column: SentSortKey }) => {
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
                                    <div className="font-semibold text-gray-900 mb-1">{t.title}</div>
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

                {/* Отправленные */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Send size={18} />
                        <h2 className="text-xl font-semibold text-gray-900">
                            Отправленные модальные уведомления
                        </h2>
                    </div>
                    {loadingSentRows && (
                        <p className="text-gray-500 text-center py-4">Загрузка…</p>
                    )}
                    {!loadingSentRows && sentModalRows.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sentModalRows.map((item) => (
                                <div
                                    key={item._id}
                                    className="border border-green-200 rounded-lg p-4 bg-green-50/30 hover:bg-green-50/50 transition-colors"
                                >
                                    {item.payload?.modalTitle && (
                                        <div className="font-semibold text-gray-900 mb-1">
                                            {item.payload.modalTitle}
                                        </div>
                                    )}
                                    <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                                        {getDescriptionPreview(item.payload?.modalDescription)}
                                    </div>
                                    <div className="text-xs text-green-700 font-medium mb-1">
                                        Показано пользователям:{' '}
                                        {item.sentAt
                                            ? new Date(item.sentAt).toLocaleString('ru-RU')
                                            : '—'}
                                    </div>
                                    {item.result != null && (
                                        <div className="text-xs text-gray-600 mb-1">
                                            Получили запись в приложении:{' '}
                                            {item.result.count ?? '—'}
                                        </div>
                                    )}
                                    {item.scheduledBy?.fullName && (
                                        <div className="text-xs text-gray-500">
                                            Инициатор: {item.scheduledBy.fullName}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {!loadingSentRows && sentModalRows.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                            Пока нет записей об отправках
                        </p>
                    )}
                </div>

                {/* Статистика */}
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold border-b pb-2">
                        <BarChart3 size={20} />
                        Статистика по кампаниям
                    </div>
                    {campaignsLoading ? (
                        <p className="text-sm text-gray-500">Загрузка…</p>
                    ) : campaigns.length === 0 ? (
                        <p className="text-sm text-gray-500">Пока нет кампаний.</p>
                    ) : (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                                            Заголовок
                                        </th>
                                        <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                                            Статус
                                        </th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentSort('sentAt')}
                                            >
                                                Отправлено (МСК)
                                                <SortIcon column="sentAt" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentSort('recipients')}
                                            >
                                                Получателей
                                                <SortIcon column="recipients" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentSort('closed')}
                                            >
                                                Закрыли (×)
                                                <SortIcon column="closed" />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-end gap-1 w-full font-medium text-gray-700 hover:text-gray-900"
                                                onClick={() => toggleSentSort('clicked')}
                                            >
                                                Нажали кнопку
                                                <SortIcon column="clicked" />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedCampaigns.map((c) => (
                                        <tr
                                            key={c._id}
                                            className="border-b border-gray-100 hover:bg-gray-50"
                                        >
                                            <td
                                                className="px-4 py-3 max-w-[200px] truncate"
                                                title={c.modalTitle}
                                            >
                                                {c.modalTitle}
                                            </td>
                                            <td className="px-4 py-3">
                                                {c.status === 'scheduled' && (
                                                    <span className="text-amber-700">ожидает</span>
                                                )}
                                                {c.status === 'sent' && (
                                                    <span className="text-green-700">
                                                        отправлено
                                                    </span>
                                                )}
                                                {c.status === 'failed' && (
                                                    <span
                                                        className="text-red-700"
                                                        title={c.error}
                                                    >
                                                        ошибка
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {formatMsk(c.sentAt)}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {c.recipientCount}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-800">
                                                {c.stats.closedModal}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-800">
                                                {c.stats.clickedButton}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={fetchAll}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Обновить статистику и списки
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
};
