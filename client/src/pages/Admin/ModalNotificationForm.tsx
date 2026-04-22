import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import {
    Send,
    Users,
    Search,
    X,
    MessageSquare,
    Clock,
    Save,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    ListFilter,
} from 'lucide-react';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { RedirectToPageSelector } from '../../components/Admin/RedirectToPageSelector';

interface User {
    _id: string;
    fullName: string;
    userName?: string;
    telegramUserName?: string;
    phone?: string;
    mail?: string;
    status: string;
    isBlocked?: boolean;
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

function mskLocalToIso(mskDatetimeLocal: string): string | undefined {
    if (!mskDatetimeLocal?.trim()) return undefined;
    const m = mskDatetimeLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return undefined;
    const y = +m[1];
    const mo = +m[2];
    const d = +m[3];
    const hh = +m[4];
    const min = +m[5];
    const utcMs = Date.UTC(y, mo - 1, d, hh - 3, min, 0, 0);
    return new Date(utcMs).toISOString();
}

const RECIPIENT_PAGE_SIZE = 50;

export const ModalNotificationFormAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const viewCampaignId = searchParams.get('campaign') || '';
    const isEditing = Boolean(id);

    const [modalTitle, setModalTitle] = useState('');
    const [modalDescription, setModalDescription] = useState('');
    const [modalButtonText, setModalButtonText] = useState('');
    const [modalButtonLink, setModalButtonLink] = useState('');
    const [showUpTo, setShowUpTo] = useState('');
    const [scheduledSendAt, setScheduledSendAt] = useState('');
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectedUsersData, setSelectedUsersData] = useState<Map<string, User>>(new Map());
    const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

    const [recipients, setRecipients] = useState<User[]>([]);
    const [recipientsLoading, setRecipientsLoading] = useState(false);
    const [recipientsMeta, setRecipientsMeta] = useState<{
        modalTitle?: string;
        total: number;
        currentPage: number;
        totalPages: number;
    } | null>(null);
    /** Применённый поиск по получателям (обновляется кнопкой «Найти») */
    const [recipientSearch, setRecipientSearch] = useState('');
    const [recipientSearchDraft, setRecipientSearchDraft] = useState('');
    const [recipientStatus, setRecipientStatus] = useState('all');
    const [recipientPage, setRecipientPage] = useState(1);

    const scheduledAtIso = useMemo(() => mskLocalToIso(scheduledSendAt), [scheduledSendAt]);

    useEffect(() => {
        if (!viewCampaignId) {
            setRecipients([]);
            setRecipientsMeta(null);
            return;
        }
        setRecipientPage(1);
        setRecipientSearch('');
        setRecipientSearchDraft('');
    }, [viewCampaignId]);

    useEffect(() => {
        if (!viewCampaignId) return;
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
                    data: User[];
                    pagination?: {
                        total: number;
                        currentPage: number;
                        totalPages: number;
                    };
                }>(`/api/modal-notification/campaigns/${viewCampaignId}/recipients`, { params });
                if (cancelled) return;
                if (response.data.success) {
                    setRecipients(response.data.data || []);
                    const p = response.data.pagination;
                    setRecipientsMeta({
                        modalTitle: response.data.campaign?.modalTitle,
                        total: p?.total ?? 0,
                        currentPage: p?.currentPage ?? 1,
                        totalPages: p?.totalPages ?? 1,
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
    }, [viewCampaignId, recipientPage, recipientStatus, recipientSearch]);

    const applyRecipientSearch = () => {
        setRecipientSearch(recipientSearchDraft);
        setRecipientPage(1);
    };

    const closeRecipientsView = () => {
        setSearchParams((p) => {
            p.delete('campaign');
            return p;
        });
    };

    useEffect(() => {
        fetchUserCount();
        setSearch('');
        setFoundUsers([]);
        setSelectedUsers(new Set());
        setSelectedUsersData(new Map());
    }, [status]);

    useEffect(() => {
        if (!id) return;
        fetchTemplate(id);
    }, [id]);

    const fetchTemplate = async (templateId: string) => {
        try {
            setLoading(true);
            const response = await api.get<{ success: boolean; data: SavedModalTemplate }>(
                `/api/modal-notification/templates/${templateId}`
            );
            if (response.data.success && response.data.data) {
                const t = response.data.data;
                setModalTitle(t.modalTitle);
                setModalDescription(t.modalDescription);
                setModalButtonText(t.modalButtonText);
                setModalButtonLink(t.modalButtonLink?.trim() || '');
                setActiveTemplateId(t._id);
            }
        } catch {
            toast.error('Ошибка загрузки шаблона');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserCount = async () => {
        try {
            const response = await api.post('/api/modal-notification/users', {
                status,
                search: '',
            });
            setUserCount(response.data.count);
        } catch {
            toast.error('Ошибка загрузки пользователей');
        }
    };

    const handleSearch = async () => {
        if (!search.trim()) {
            toast.warning('Введите текст для поиска');
            return;
        }
        setSearchLoading(true);
        try {
            const response = await api.post('/api/modal-notification/users', {
                status,
                search,
            });
            const users = response.data.data || [];
            setFoundUsers(users);
            if (users.length === 0) {
                toast.info('Пользователи не найдены');
            } else {
                toast.success(`Найдено пользователей: ${users.length}`);
            }
        } catch {
            toast.error('Ошибка поиска пользователей');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearch('');
        setFoundUsers([]);
    };

    const toggleUserSelection = (user: User) => {
        const newSelected = new Set(selectedUsers);
        const newSelectedData = new Map(selectedUsersData);
        if (newSelected.has(user._id)) {
            newSelected.delete(user._id);
            newSelectedData.delete(user._id);
        } else {
            newSelected.add(user._id);
            newSelectedData.set(user._id, user);
        }
        setSelectedUsers(newSelected);
        setSelectedUsersData(newSelectedData);
    };

    const removeSelectedUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        const newSelectedData = new Map(selectedUsersData);
        newSelected.delete(userId);
        newSelectedData.delete(userId);
        setSelectedUsers(newSelected);
        setSelectedUsersData(newSelectedData);
    };

    const toggleAllUsers = () => {
        if (selectedUsers.size === foundUsers.length) {
            setSelectedUsers(new Set());
            setSelectedUsersData(new Map());
        } else {
            setSelectedUsers(new Set(foundUsers.map((u) => u._id)));
            setSelectedUsersData(new Map(foundUsers.map((u) => [u._id, u])));
        }
    };

    const buildPayload = () => ({
        modalTitle,
        modalDescription,
        modalButtonText,
        modalButtonLink: modalButtonLink.trim() || undefined,
        showUpTo: showUpTo || undefined,
        scheduledAt: scheduledAtIso,
        ...(activeTemplateId ? { templateId: activeTemplateId } : {}),
    });

    const validateSchedule = () => {
        if (scheduledAtIso) {
            const scheduledDate = new Date(scheduledAtIso);
            if (scheduledDate <= new Date()) {
                toast.warning('Дата и время по МСК должны быть в будущем');
                return false;
            }
        }
        return true;
    };

    const handleSaveTemplate = async () => {
        if (!modalTitle.trim() || !modalDescription.trim() || !modalButtonText.trim()) {
            toast.warning('Заполните заголовок, описание и текст кнопки');
            return;
        }

        try {
            setLoading(true);
            if (isEditing && activeTemplateId) {
                const response = await api.put(
                    `/api/modal-notification/templates/${activeTemplateId}`,
                    {
                        modalTitle: modalTitle.trim(),
                        modalDescription,
                        modalButtonText: modalButtonText.trim(),
                        modalButtonLink: modalButtonLink.trim() || '',
                    }
                );
                if (response.data.success) {
                    toast.success('Шаблон обновлён');
                    navigate('/admin/modal-notifications');
                } else {
                    toast.error(response.data.message || 'Ошибка обновления');
                }
            } else {
                const title = window.prompt('Краткое название шаблона (для списка, уникальное)');
                if (!title?.trim()) { setLoading(false); return; }
                const response = await api.post('/api/modal-notification/templates', {
                    title: title.trim(),
                    modalTitle: modalTitle.trim(),
                    modalDescription,
                    modalButtonText: modalButtonText.trim(),
                    modalButtonLink: modalButtonLink.trim() || '',
                });
                if (response.data.success) {
                    toast.success('Шаблон сохранён');
                    navigate('/admin/modal-notifications');
                } else {
                    toast.error(response.data.message || 'Ошибка сохранения');
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка сохранения шаблона');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNotification = async () => {
        if (!modalTitle.trim() || !modalDescription.trim() || !modalButtonText.trim()) {
            toast.warning('Заполните все обязательные поля');
            return;
        }
        if (!validateSchedule()) return;

        const payloadBase = buildPayload();

        if (selectedUsers.size > 0) {
            const confirmText = scheduledAtIso
                ? `Запланировать модальное уведомление для ${selectedUsers.size} выбранных пользователей?`
                : `Вы уверены, что хотите создать модальное уведомление для ${selectedUsers.size} выбранных пользователей?`;
            if (!confirm(confirmText)) return;

            setLoading(true);
            try {
                const response = await api.post('/api/modal-notification/create', {
                    ...payloadBase,
                    userIds: Array.from(selectedUsers),
                });
                if (response.data.success) {
                    toast.success(
                        response.data.scheduledAt
                            ? response.data.message || 'Уведомление запланировано'
                            : `Модальное уведомление создано для ${response.data.count} пользователей`
                    );
                    const cid = response.data.campaignId;
                    if (cid && !response.data.scheduledAt) {
                        navigate(`/admin/modal-notifications/create?campaign=${String(cid)}`);
                    } else {
                        navigate('/admin/modal-notifications');
                    }
                } else {
                    toast.error(response.data.message || 'Ошибка создания уведомления');
                }
            } catch (error: any) {
                toast.error(
                    error.response?.data?.message || error.message || 'Ошибка создания уведомления'
                );
            } finally {
                setLoading(false);
            }
            return;
        }

        if (userCount === 0) {
            toast.warning('Нет пользователей для создания уведомления');
            return;
        }

        let confirmText = scheduledAtIso
            ? `Запланировать модальное уведомление для ${userCount} пользователей?`
            : `Вы уверены, что хотите создать модальное уведомление для ${userCount} пользователей?`;
        if (status !== 'all') {
            confirmText = scheduledAtIso
                ? `Запланировать для ${userCount} пользователей со статусом «${getStatusLabel(status)}»?`
                : `Создать уведомление для ${userCount} пользователей со статусом «${getStatusLabel(status)}»?`;
        }
        if (!confirm(confirmText)) return;

        setLoading(true);
        try {
            const response = await api.post('/api/modal-notification/create', {
                ...payloadBase,
                status: status === 'all' ? undefined : status,
            });
            if (response.data.success) {
                toast.success(
                    response.data.scheduledAt
                        ? response.data.message || 'Уведомление запланировано'
                        : `Модальное уведомление создано для ${response.data.count} пользователей`
                );
                const cid = response.data.campaignId;
                if (cid && !response.data.scheduledAt) {
                    navigate(`/admin/modal-notifications/create?campaign=${String(cid)}`);
                } else {
                    navigate('/admin/modal-notifications');
                }
            } else {
                toast.error(response.data.message || 'Ошибка создания уведомления');
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || error.message || 'Ошибка создания уведомления'
            );
        } finally {
            setLoading(false);
        }
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

    const submitLabel = () => {
        if (loading) return 'Создание...';
        if (scheduledAtIso) {
            return selectedUsers.size > 0
                ? `Запланировать для выбранных (${selectedUsers.size})`
                : `Запланировать для всех (${userCount})`;
        }
        return selectedUsers.size > 0
            ? `Создать уведомление для выбранных (${selectedUsers.size})`
            : `Создать уведомление для всех (${userCount})`;
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditing ? 'Редактирование шаблона' : 'Создание модального уведомления'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Создайте модальное уведомление и отправьте его пользователям
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/modal-notifications')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Назад к списку
                    </button>
                </div>

                {viewCampaignId && (
                    <div className="bg-white rounded-lg shadow-sm border border-indigo-100 p-6 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ListFilter size={20} className="text-indigo-600" />
                                    Получатели рассылки
                                </h2>
                                {recipientsMeta?.modalTitle && (
                                    <p className="text-sm text-gray-600 mt-1 break-words">
                                        Кампания:{' '}
                                        <span className="font-medium text-gray-800">
                                            {recipientsMeta.modalTitle}
                                        </span>
                                    </p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Все, кому рассылка выдала это уведомление, в том числе уже закрывших окно
                                    или нажавших кнопку.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={closeRecipientsView}
                                    className="text-sm text-indigo-600 hover:text-indigo-800"
                                >
                                    Скрыть список
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Фильтр по статусу
                                </label>
                                <select
                                    value={recipientStatus}
                                    onChange={(e) => {
                                        setRecipientStatus(e.target.value);
                                        setRecipientPage(1);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">Все статусы</option>
                                    <option value="client">Клиент</option>
                                    <option value="guest">Гость</option>
                                    <option value="registered">Зарегистрирован</option>
                                    <option value="active">Активен</option>
                                    <option value="anonym">Аноним</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <Search
                                            className="absolute left-2.5 top-2.5 text-gray-400"
                                            size={16}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={applyRecipientSearch}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                    >
                                        Найти
                                    </button>
                                </div>
                            </div>
                        </div>

                        {recipientsLoading && (
                            <p className="text-sm text-gray-500 py-4">Загрузка…</p>
                        )}
                        {!recipientsLoading && recipientsMeta && (
                            <p className="text-sm text-gray-600">
                                Найдено: <span className="font-semibold">{recipientsMeta.total}</span>
                            </p>
                        )}

                        {!recipientsLoading && recipients.length > 0 && (
                            <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-[420px] overflow-y-auto">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 font-medium text-gray-700">Имя</th>
                                            <th className="px-3 py-2 font-medium text-gray-700">Контакты</th>
                                            <th className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">
                                                Статус
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recipients.map((u) => (
                                            <tr key={u._id} className="border-b border-gray-100 last:border-0">
                                                <td className="px-3 py-2 font-medium text-gray-900 align-top break-words max-w-[200px]">
                                                    {u.fullName || '—'}
                                                </td>
                                                <td className="px-3 py-2 text-gray-600 align-top break-all max-w-md">
                                                    <div className="flex flex-col gap-0.5 text-xs sm:text-sm">
                                                        {u.telegramUserName && (
                                                            <span>@{u.telegramUserName}</span>
                                                        )}
                                                        {u.phone && <span>{u.phone}</span>}
                                                        {u.mail && <span>{u.mail}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap align-top">
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded ${getStatusColor(
                                                            u.status,
                                                            u.isBlocked
                                                        )}`}
                                                    >
                                                        {getStatusLabel(u.status, u.isBlocked)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {!recipientsLoading &&
                            recipientsMeta &&
                            recipientsMeta.total === 0 &&
                            recipientSearch && (
                                <p className="text-sm text-amber-700">Нет пользователей по заданным условиям.</p>
                            )}

                        {recipientsMeta && recipientsMeta.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-sm text-gray-600">
                                    Стр. {recipientsMeta.currentPage} из {recipientsMeta.totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRecipientPage((p) => Math.max(1, p - 1))}
                                        disabled={recipientsMeta.currentPage <= 1}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft size={16} />
                                        Назад
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setRecipientPage((p) =>
                                                Math.min(recipientsMeta.totalPages, p + 1)
                                            )
                                        }
                                        disabled={recipientsMeta.currentPage >= recipientsMeta.totalPages}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Вперёд
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <MessageSquare size={18} />
                            Заголовок модального окна *
                        </label>
                        <input
                            type="text"
                            value={modalTitle}
                            onChange={(e) => setModalTitle(e.target.value)}
                            placeholder="Введите заголовок модального окна"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <MessageSquare size={18} />
                            Описание модального окна *
                        </label>
                        <RichTextEditor
                            value={modalDescription}
                            onChange={(value) => setModalDescription(value)}
                            placeholder="Введите описание для модального окна"
                            height="200px"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            Текст кнопки *
                        </label>
                        <input
                            type="text"
                            value={modalButtonText}
                            onChange={(e) => setModalButtonText(e.target.value)}
                            placeholder="Например: Понятно, Открыть, Перейти"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <RedirectToPageSelector
                        value={modalButtonLink}
                        onChange={(val) => setModalButtonLink(val)}
                    />

                    <div className="border-t pt-4">
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Clock size={18} />
                            Показать пользователям с{' '}
                            <span className="text-xs text-gray-500 font-normal">
                                (дата и время по московскому времени, необязательно)
                            </span>
                        </label>
                        <input
                            type="datetime-local"
                            value={scheduledSendAt}
                            onChange={(e) => setScheduledSendAt(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Введённое время считается московским (МСК). Если не указано — уведомление
                            будет создано сразу после нажатия кнопки.
                        </p>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Clock size={18} />
                            Отображать до{' '}
                            <span className="text-xs text-gray-500 font-normal">(необязательно)</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={showUpTo}
                            onChange={(e) => setShowUpTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Если указана дата, карточка у пользователя скроется после истечения срока.
                            Если не указана — пока пользователь не закроет или не нажмёт кнопку.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Users size={18} />
                            Фильтр по статусу пользователей
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                            {['all', 'client', 'guest', 'registered', 'active', 'anonym'].map(
                                (statusOption) => (
                                    <button
                                        key={statusOption}
                                        onClick={() => setStatus(statusOption)}
                                        className={`p-3 rounded-lg border-2 transition-all ${
                                            status === statusOption
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="text-center">
                                            <div
                                                className={`text-xs px-2 py-1 rounded inline-block ${getStatusColor(statusOption)}`}
                                            >
                                                {getStatusLabel(statusOption)}
                                            </div>
                                        </div>
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Search size={18} />
                            Поиск конкретных пользователей
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Поиск по имени, username, телефону, email..."
                                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <Search
                                    className="absolute left-3 top-3.5 text-gray-400"
                                    size={18}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={searchLoading || !search.trim()}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                <Search size={18} />
                                {searchLoading ? 'Поиск...' : 'Найти'}
                            </button>
                            {(search || foundUsers.length > 0) && (
                                <button
                                    onClick={handleClearSearch}
                                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                        {foundUsers.length === 0 && !search && (
                            <p className="text-sm text-gray-500 mt-2">
                                Количество получателей по фильтру:{' '}
                                <span className="font-semibold text-blue-600">{userCount}</span>
                            </p>
                        )}
                    </div>

                    {foundUsers.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={
                                            foundUsers.length > 0 &&
                                            selectedUsers.size === foundUsers.length
                                        }
                                        onChange={toggleAllUsers}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-700">
                                        Найдено пользователей: {foundUsers.length}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    Выбрано:{' '}
                                    <span className="font-semibold text-blue-600">
                                        {selectedUsers.size}
                                    </span>
                                </span>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {foundUsers.map((user) => (
                                    <div
                                        key={user._id}
                                        className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                                        onClick={() => toggleUserSelection(user)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(user._id)}
                                            onChange={() => toggleUserSelection(user)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {user.fullName || 'Без имени'}
                                            </div>
                                            <div className="text-sm text-gray-500 flex gap-3">
                                                {user.telegramUserName && (
                                                    <span>@{user.telegramUserName}</span>
                                                )}
                                                {user.userName && <span>{user.userName}</span>}
                                                {user.phone && <span>{user.phone}</span>}
                                                {user.mail && <span>{user.mail}</span>}
                                            </div>
                                        </div>
                                        <div
                                            className={`text-xs px-2 py-1 rounded ${getStatusColor(user.status, user.isBlocked)}`}
                                        >
                                            {getStatusLabel(user.status, user.isBlocked)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedUsers.size > 0 && (
                        <div className="border border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                            <div className="bg-blue-100 px-4 py-3 border-b border-blue-200 flex items-center justify-between">
                                <span className="font-medium text-blue-900">
                                    Выбрано пользователей: {selectedUsers.size}
                                </span>
                                <button
                                    onClick={() => {
                                        setSelectedUsers(new Set());
                                        setSelectedUsersData(new Map());
                                    }}
                                    className="text-sm text-blue-700 hover:text-blue-900 underline"
                                >
                                    Очистить все
                                </button>
                            </div>
                            <div className="max-h-48 overflow-y-auto p-2">
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(selectedUsersData.values()).map((user) => (
                                        <div
                                            key={user._id}
                                            className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-200 shadow-sm"
                                        >
                                            <span className="text-sm font-medium text-gray-900">
                                                {user.fullName || 'Без имени'}
                                            </span>
                                            {user.telegramUserName && (
                                                <span className="text-xs text-gray-500">
                                                    @{user.telegramUserName}
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSelectedUser(user._id);
                                                }}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Удалить из выбранных"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleSaveTemplate}
                            disabled={
                                loading ||
                                !modalTitle.trim() ||
                                !modalDescription.trim() ||
                                !modalButtonText.trim()
                            }
                            className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save size={20} />
                            {isEditing ? 'Сохранить изменения' : 'Сохранить как шаблон'}
                        </button>
                        <button
                            onClick={handleCreateNotification}
                            disabled={
                                loading ||
                                !modalTitle.trim() ||
                                !modalDescription.trim() ||
                                !modalButtonText.trim() ||
                                (selectedUsers.size === 0 && userCount === 0)
                            }
                            className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
                        >
                            <Send size={20} />
                            {submitLabel()}
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};
