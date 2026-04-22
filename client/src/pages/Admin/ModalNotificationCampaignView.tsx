import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import {
    ArrowLeft,
    BarChart3,
    Trash2,
    ListFilter,
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

const RECIPIENT_PAGE_SIZE = 50;

interface RecipientUser {
    _id: string;
    fullName: string;
    userName?: string;
    telegramUserName?: string;
    phone?: string;
    mail?: string;
    status: string;
    isBlocked?: boolean;
}

interface CampaignDetail {
    _id: string;
    modalTitle: string;
    scheduledAt?: string | null;
    sentAt?: string | null;
    recipientCount: number;
    status: 'scheduled' | 'sent' | 'failed';
    error?: string;
    createdAt: string;
    createdBy?: { fullName?: string; telegramUserName?: string };
    stats: { closedModal: number; clickedButton: number };
    payload?: {
        campaignId?: string;
        modalTitle?: string;
        modalDescription?: string;
        modalButtonText?: string;
        modalButtonLink?: string;
        status?: string;
        /** Явно выбранные получатели при создании рассылки */
        userIds?: string[];
    };
    result?: { count?: number };
}

const statusLabel = (status?: string) => {
    switch (status) {
        case 'guest': return 'Гости';
        case 'registered': return 'Зарегистрированные';
        case 'client': return 'Клиенты';
        case 'anonym': return 'Анонимы';
        default: return 'Все пользователи';
    }
};

export const ModalNotificationCampaignView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CampaignDetail | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [recipients, setRecipients] = useState<RecipientUser[]>([]);
    const [recipientsLoading, setRecipientsLoading] = useState(false);
    const [recipientsMeta, setRecipientsMeta] = useState<{
        modalTitle?: string;
        total: number;
        currentPage: number;
        totalPages: number;
        source: 'payloadUserIds' | 'inferred';
    } | null>(null);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [recipientSearchDraft, setRecipientSearchDraft] = useState('');
    const [recipientStatus, setRecipientStatus] = useState('all');
    const [recipientPage, setRecipientPage] = useState(1);

    useEffect(() => {
        if (!id) return;
        setRecipientPage(1);
        setRecipientSearch('');
        setRecipientSearchDraft('');
    }, [id]);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        (async () => {
            setRecipientsLoading(true);
            try {
                const params: Record<string, string | number> = {
                    page: recipientPage,
                    limit: RECIPIENT_PAGE_SIZE,
                    status: recipientStatus,
                };
                if (recipientSearch.trim()) {
                    params.search = recipientSearch.trim();
                }
                const response = await api.get<{
                    success: boolean;
                    campaign?: { modalTitle?: string };
                    recipientsSource?: 'payloadUserIds' | 'inferred';
                    data: RecipientUser[];
                    pagination?: {
                        total: number;
                        currentPage: number;
                        totalPages: number;
                    };
                }>(`/api/modal-notification/campaigns/${encodeURIComponent(id)}/recipients`, { params });
                if (cancelled) return;
                if (response.data.success) {
                    setRecipients(response.data.data || []);
                    const p = response.data.pagination;
                    const src = response.data.recipientsSource;
                    setRecipientsMeta({
                        modalTitle: response.data.campaign?.modalTitle,
                        total: p?.total ?? 0,
                        currentPage: p?.currentPage ?? 1,
                        totalPages: p?.totalPages ?? 1,
                        source: src === 'payloadUserIds' ? 'payloadUserIds' : 'inferred',
                    });
                } else {
                    setRecipients([]);
                    setRecipientsMeta(null);
                }
            } catch {
                if (!cancelled) {
                    toast.error('Не удалось загрузить список получателей');
                    setRecipients([]);
                    setRecipientsMeta(null);
                }
            } finally {
                if (!cancelled) setRecipientsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [id, recipientPage, recipientStatus, recipientSearch]);

    const applyRecipientSearch = () => {
        setRecipientSearch(recipientSearchDraft);
        setRecipientPage(1);
    };

    const getStatusLabel = (statusValue: string, isBlocked?: boolean) => {
        if (isBlocked) return 'Заблокирован';
        switch (statusValue) {
            case 'client': return 'Клиент';
            case 'guest': return 'Гость';
            case 'registered': return 'Зарегистрирован';
            case 'active': return 'Активен';
            case 'anonym': return 'Аноним';
            default: return 'Все';
        }
    };

    const getStatusColor = (statusValue: string, isBlocked?: boolean) => {
        if (isBlocked) return 'bg-red-100 text-red-700';
        switch (statusValue) {
            case 'anonym': return 'bg-red-100 text-red-700';
            case 'guest': return 'bg-gray-100 text-gray-700';
            case 'registered': return 'bg-blue-100 text-blue-700';
            case 'active': return 'bg-green-100 text-green-700';
            case 'client': return 'bg-purple-100 text-purple-700';
            default: return 'bg-purple-100 text-purple-700';
        }
    };

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get<{ success: boolean; data: CampaignDetail }>(
                    `/api/modal-notification/campaigns/${encodeURIComponent(id)}`
                );
                if (res.data.success && res.data.data) {
                    setData(res.data.data);
                } else {
                    setData(null);
                    toast.error('Кампания не найдена');
                }
            } catch {
                toast.error('Не удалось загрузить кампанию');
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleDelete = async () => {
        if (!id) return;
        if (!window.confirm('Удалить эту кампанию? Действие необратимо.')) return;
        setDeleting(true);
        try {
            await api.delete(`/api/modal-notification/campaigns/${encodeURIComponent(id)}`);
            toast.success('Кампания удалена');
            navigate('/admin/modal-notifications');
        } catch {
            toast.error('Не удалось удалить кампанию');
        } finally {
            setDeleting(false);
        }
    };

    const p = data?.payload;
    const s = data?.stats;

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl">
                <button
                    type="button"
                    onClick={() => navigate('/admin/modal-notifications')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={20} />
                    К списку уведомлений
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 size={28} className="text-green-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Кампания уведомления</h1>
                    </div>
                    {data && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                            <Trash2 size={16} />
                            {deleting ? 'Удаление…' : 'Удалить'}
                        </button>
                    )}
                </div>

                {loading && <p className="text-gray-500">Загрузка…</p>}

                {!loading && data && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500">Заголовок</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.modalTitle || '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Статус</dt>
                                <dd className="font-medium mt-0.5">
                                    {data.status === 'sent' && <span className="text-green-700">Отправлено</span>}
                                    {data.status === 'scheduled' && <span className="text-amber-700">Ожидает</span>}
                                    {data.status === 'failed' && <span className="text-red-700">Ошибка</span>}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Время отправки</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.sentAt
                                        ? new Date(data.sentAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
                                        : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Запланировано на</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.scheduledAt
                                        ? new Date(data.scheduledAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
                                        : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Инициатор</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.createdBy?.fullName || '—'}
                                    {data.createdBy?.telegramUserName
                                        ? ` (@${data.createdBy.telegramUserName})`
                                        : ''}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Получатели (по статусу)</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {statusLabel(p?.status)}
                                </dd>
                            </div>
                        </dl>

                        <div className="border-t pt-4">
                            <h2 className="text-sm font-semibold text-gray-700 mb-2">Статистика</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                    <div className="text-xs text-blue-800">Получателей</div>
                                    <div className="text-xl font-semibold text-blue-900 tabular-nums">
                                        {data.recipientCount}
                                    </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="text-xs text-gray-600">Закрыли (×)</div>
                                    <div className="text-xl font-semibold text-gray-900 tabular-nums">
                                        {s?.closedModal ?? '—'}
                                    </div>
                                </div>
                                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                    <div className="text-xs text-green-800">Нажали кнопку</div>
                                    <div className="text-xl font-semibold text-green-900 tabular-nums">
                                        {s?.clickedButton ?? '—'}
                                    </div>
                                </div>
                                {data.error && (
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                        <div className="text-xs text-red-800">Ошибка</div>
                                        <div className="text-sm font-medium text-red-900">
                                            {data.error}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                                    <ListFilter size={18} className="text-indigo-600 shrink-0" />
                                    Кому отправлено
                                </h2>
                                {recipientsMeta?.modalTitle && (
                                    <p className="text-xs text-gray-600 break-words">
                                        «{recipientsMeta.modalTitle}»
                                    </p>
                                )}
                                {recipientsMeta && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {recipientsMeta.source === 'payloadUserIds' ? (
                                            <>
                                                Те же id, что в{' '}
                                                <code className="text-[11px] bg-gray-100 px-1 rounded">data.payload.userIds</code>{' '}
                                                в ответе кампании. Поиск и фильтр по статусу — только среди
                                                этих пользователей.
                                            </>
                                        ) : (
                                            <>
                                                Массовая рассылка без явного списка id: кто получил
                                                уведомление в приложении или отметился реакцией.
                                            </>
                                        )}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Статус
                                    </label>
                                    <select
                                        value={recipientStatus}
                                        onChange={(e) => {
                                            setRecipientStatus(e.target.value);
                                            setRecipientPage(1);
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="all">Все</option>
                                        <option value="client">Клиент</option>
                                        <option value="guest">Гость</option>
                                        <option value="registered">Зарегистрирован</option>
                                        <option value="active">Активен</option>
                                        <option value="anonym">Аноним</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Поиск
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={recipientSearchDraft}
                                                onChange={(e) => setRecipientSearchDraft(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        applyRecipientSearch();
                                                    }
                                                }}
                                                placeholder="Имя, TG, телефон, email…"
                                                className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                            <Search
                                                className="absolute left-2 top-2.5 text-gray-400"
                                                size={14}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={applyRecipientSearch}
                                            className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                        >
                                            Найти
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {recipientsLoading && (
                                <p className="text-sm text-gray-500 py-2">Загрузка списка…</p>
                            )}
                            {!recipientsLoading && recipientsMeta !== null && (
                                <p className="text-sm text-gray-600">
                                    Всего, кому отправлено:{' '}
                                    <span className="font-semibold tabular-nums">
                                        {recipientsMeta.total}
                                    </span>
                                </p>
                            )}

                            {!recipientsLoading && recipients.length > 0 && (
                                <ul className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-[min(420px,50vh)] overflow-y-auto bg-gray-50/50">
                                    {recipients.map((u) => (
                                        <li
                                            key={u._id}
                                            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-gray-900 break-words">
                                                    {u.fullName || 'Без имени'}
                                                </div>
                                                <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                                                    {u.telegramUserName && (
                                                        <span>@{u.telegramUserName}</span>
                                                    )}
                                                    {u.phone && <span>{u.phone}</span>}
                                                    {u.mail && <span className="break-all">{u.mail}</span>}
                                                </div>
                                            </div>
                                            <span
                                                className={`shrink-0 self-start text-xs px-2 py-0.5 rounded ${getStatusColor(
                                                    u.status,
                                                    u.isBlocked
                                                )}`}
                                            >
                                                {getStatusLabel(u.status, u.isBlocked)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {!recipientsLoading &&
                                recipientsMeta &&
                                recipientsMeta.total === 0 &&
                                recipientSearch && (
                                    <p className="text-sm text-amber-700">
                                        Никого не найдено по поиску.
                                    </p>
                                )}

                            {recipientsMeta && recipientsMeta.totalPages > 1 && (
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-gray-500">
                                        Страница {recipientsMeta.currentPage} из{' '}
                                        {recipientsMeta.totalPages}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setRecipientPage((p) => Math.max(1, p - 1))
                                            }
                                            disabled={recipientsMeta.currentPage <= 1}
                                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs border rounded border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            <ChevronLeft size={14} />
                                            Назад
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setRecipientPage((p) =>
                                                    Math.min(recipientsMeta.totalPages, p + 1)
                                                )
                                            }
                                            disabled={
                                                recipientsMeta.currentPage >= recipientsMeta.totalPages
                                            }
                                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs border rounded border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            Вперёд
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {p && (
                            <>
                                <div className="border-t pt-4">
                                    <h2 className="text-sm font-semibold text-gray-700 mb-2">Содержимое уведомления</h2>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-xs text-gray-500">Заголовок модального окна</span>
                                            <p className="font-medium text-gray-900 mt-0.5">{p.modalTitle || '—'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500">Описание</span>
                                            {p.modalDescription ? (
                                                <div
                                                    className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-4 bg-gray-50 mt-0.5"
                                                    dangerouslySetInnerHTML={{ __html: p.modalDescription }}
                                                />
                                            ) : (
                                                <p className="text-gray-900 mt-0.5">—</p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Текст кнопки</span>
                                                <p className="font-medium text-gray-900 mt-0.5">{p.modalButtonText || '—'}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Ссылка кнопки</span>
                                                <p className="font-medium text-gray-900 mt-0.5 break-all">
                                                    {p.modalButtonLink || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="text-xs text-gray-400 border-t pt-3">
                            Создано: {new Date(data.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                        </div>
                    </div>
                )}

                {!loading && !data && (
                    <p className="text-gray-500">Кампания не найдена или недоступна.</p>
                )}
            </div>
        </AdminLayout>
    );
};
