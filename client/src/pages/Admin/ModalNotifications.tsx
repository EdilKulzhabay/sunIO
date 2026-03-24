import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { Send, Users, Search, X, MessageSquare, Clock, BarChart3 } from 'lucide-react';
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

/** Значение datetime-local интерпретируется как московское время → ISO (UTC). */
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

function formatMsk(iso?: string | null) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
    } catch {
        return '—';
    }
}

export const ModalNotificationsAdmin = () => {
    const [modalTitle, setModalTitle] = useState('');
    const [modalDescription, setModalDescription] = useState('');
    const [modalButtonText, setModalButtonText] = useState('');
    const [modalButtonLink, setModalButtonLink] = useState('');
    const [showUpTo, setShowUpTo] = useState('');
    /** Дата/время показа уведомления пользователям (ввод как московское время). */
    const [scheduledSendAt, setScheduledSendAt] = useState('');
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectedUsersData, setSelectedUsersData] = useState<Map<string, User>>(new Map());
    const [lastCount, setLastCount] = useState<number | null>(null);
    const [lastScheduled, setLastScheduled] = useState(false);
    const [campaigns, setCampaigns] = useState<ModalCampaignRow[]>([]);
    const [campaignsLoading, setCampaignsLoading] = useState(false);

    const scheduledAtIso = useMemo(() => mskLocalToIso(scheduledSendAt), [scheduledSendAt]);

    const fetchUserCount = async () => {
        try {
            const response = await api.post('/api/modal-notification/users', {
                status: status,
                search: ''
            });
            setUserCount(response.data.count);
        } catch (error: any) {
            toast.error('Ошибка загрузки пользователей');
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

    useEffect(() => {
        fetchUserCount();
        setSearch('');
        setFoundUsers([]);
        setSelectedUsers(new Set());
        setSelectedUsersData(new Map());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleSearch = async () => {
        if (!search.trim()) {
            toast.warning('Введите текст для поиска');
            return;
        }

        setSearchLoading(true);
        try {
            const response = await api.post('/api/modal-notification/users', {
                status: status,
                search: search
            });
            setFoundUsers(response.data.data || []);
            if (response.data.data.length === 0) {
                toast.info('Пользователи не найдены');
            } else {
                toast.success(`Найдено пользователей: ${response.data.data.length}`);
            }
        } catch (error: any) {
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
            const allIds = new Set(foundUsers.map((u) => u._id));
            const allData = new Map(foundUsers.map((u) => [u._id, u]));
            setSelectedUsers(allIds);
            setSelectedUsersData(allData);
        }
    };

    const buildPayload = () => ({
        modalTitle,
        modalDescription,
        modalButtonText,
        modalButtonLink: modalButtonLink.trim() || undefined,
        showUpTo: showUpTo || undefined,
        scheduledAt: scheduledAtIso,
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

    const resetForm = () => {
        setModalTitle('');
        setModalDescription('');
        setModalButtonText('');
        setModalButtonLink('');
        setShowUpTo('');
        setScheduledSendAt('');
        setSelectedUsers(new Set());
        setSelectedUsersData(new Map());
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
                    if (scheduledAtIso && response.data.scheduledAt) {
                        setLastCount(null);
                        setLastScheduled(true);
                        toast.success(response.data.message || 'Уведомление запланировано');
                    } else {
                        setLastScheduled(false);
                        setLastCount(response.data.count ?? null);
                        toast.success(
                            `Модальное уведомление создано для ${response.data.count} пользователей`
                        );
                    }
                    resetForm();
                    fetchCampaigns();
                } else {
                    toast.error(response.data.message || 'Ошибка создания уведомления');
                }
            } catch (error: any) {
                console.error('Ошибка создания уведомления:', error);
                const errorMessage =
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    error.message ||
                    'Ошибка создания уведомления';
                toast.error(errorMessage);
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
                ? `Запланировать для ${userCount} пользователей со статусом "${getStatusLabel(status)}"?`
                : `Создать уведомление для ${userCount} пользователей со статусом "${getStatusLabel(status)}"?`;
        }

        if (!confirm(confirmText)) return;

        setLoading(true);
        try {
            const response = await api.post('/api/modal-notification/create', {
                ...payloadBase,
                status: status === 'all' ? undefined : status,
            });

            if (response.data.success) {
                if (scheduledAtIso && response.data.scheduledAt) {
                    setLastCount(null);
                    setLastScheduled(true);
                    toast.success(response.data.message || 'Уведомление запланировано');
                } else {
                    setLastScheduled(false);
                    setLastCount(response.data.count ?? null);
                    toast.success(
                        `Модальное уведомление создано для ${response.data.count} пользователей`
                    );
                }
                resetForm();
                fetchCampaigns();
            } else {
                toast.error(response.data.message || 'Ошибка создания уведомления');
            }
        } catch (error: any) {
            console.error('Ошибка создания уведомления:', error);
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Ошибка создания уведомления';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (statusValue: string, isBlocked?: boolean) => {
        if (isBlocked) return 'Заблокирован';
        switch (statusValue) {
            case 'client':
                return 'Клиент';
            case 'guest':
                return 'Гость';
            case 'registered':
                return 'Зарегистрирован';
            case 'active':
                return 'Активен';
            case 'anonym':
                return 'Аноним';
            default:
                return 'Все';
        }
    };

    const getStatusColor = (statusValue: string, isBlocked?: boolean) => {
        if (isBlocked) return 'bg-red-100 text-red-700';
        switch (statusValue) {
            case 'anonym':
                return 'bg-red-100 text-red-700';
            case 'guest':
                return 'bg-gray-100 text-gray-700';
            case 'registered':
                return 'bg-blue-100 text-blue-700';
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'client':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-purple-100 text-purple-700';
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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Модальные уведомления</h1>
                    <p className="text-gray-600 mt-1">
                        Создание модальных уведомлений для пользователей (в режиме «Все» анонимы не
                        включаются — как в рассылках)
                    </p>
                </div>

                {lastCount !== null && !lastScheduled && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 mb-2">Последнее уведомление</h3>
                        <div className="text-lg font-bold text-green-600">
                            Создано для {lastCount} пользователей
                        </div>
                    </div>
                )}

                {lastScheduled && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Запланировано</h3>
                        <p className="text-blue-800 text-sm">
                            Уведомление будет показано пользователям в указанное время (МСК).
                        </p>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 font-semibold border-b pb-2">
                        <BarChart3 size={20} />
                        Статистика по кампаниям
                    </div>
                    {campaignsLoading ? (
                        <p className="text-sm text-gray-500">Загрузка…</p>
                    ) : campaigns.length === 0 ? (
                        <p className="text-sm text-gray-500">Пока нет кампаний с этой страницы.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-600">
                                        <th className="py-2 pr-4">Заголовок</th>
                                        <th className="py-2 pr-4">Статус</th>
                                        <th className="py-2 pr-4">План (МСК)</th>
                                        <th className="py-2 pr-4">Отправлено (МСК)</th>
                                        <th className="py-2 pr-4">Получателей</th>
                                        <th className="py-2 pr-4">Закрыли (×)</th>
                                        <th className="py-2 pr-4">Нажали кнопку</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((c) => (
                                        <tr key={c._id} className="border-b border-gray-100">
                                            <td className="py-2 pr-4 max-w-[200px] truncate" title={c.modalTitle}>
                                                {c.modalTitle}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {c.status === 'scheduled' && (
                                                    <span className="text-amber-700">ожидает</span>
                                                )}
                                                {c.status === 'sent' && (
                                                    <span className="text-green-700">отправлено</span>
                                                )}
                                                {c.status === 'failed' && (
                                                    <span className="text-red-700" title={c.error}>
                                                        ошибка
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                {formatMsk(c.scheduledAt)}
                                            </td>
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                {formatMsk(c.sentAt)}
                                            </td>
                                            <td className="py-2 pr-4">{c.recipientCount}</td>
                                            <td className="py-2 pr-4 font-medium text-gray-800">
                                                {c.stats.closedModal}
                                            </td>
                                            <td className="py-2 pr-4 font-medium text-gray-800">
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
                        onClick={() => fetchCampaigns()}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Обновить статистику
                    </button>
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
                                <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
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

                    <div>
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

                    <div className="flex gap-3 pt-4 border-t">
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
