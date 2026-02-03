import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { Send, Users, MessageSquare, Search, X, Image as ImageIcon, Save, ArrowLeft } from 'lucide-react';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { ImageUpload } from '../../components/Admin/ImageUpload';

interface User {
    _id: string;
    fullName: string;
    userName?: string;
    telegramUserName?: string;
    phone?: string;
    status: string;
    isBlocked?: boolean;
}

interface SavedBroadcast {
    _id: string;
    title: string;
    imgUrl?: string;
    content: string;
    buttonText?: string;
    createdAt: string;
    updatedAt: string;
}

export const BroadcastFormAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [parseMode, setParseMode] = useState<'HTML' | 'Markdown'>('HTML');
    const [buttonText, setButtonText] = useState('');
    const [buttonUrl, setButtonUrl] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');

    const [status, setStatus] = useState('all');
    const [lastActiveFilter, setLastActiveFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectedUsersData, setSelectedUsersData] = useState<Map<string, User>>(new Map());

    const scheduledAtIso = useMemo(() => {
        if (!scheduledAt) return undefined;
        const date = new Date(scheduledAt);
        return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    }, [scheduledAt]);

    useEffect(() => {
        fetchUserCount();
        // При изменении статуса очищаем поиск и найденных пользователей
        setSearch('');
        setFoundUsers([]);
        setSelectedUsers(new Set());
        setSelectedUsersData(new Map());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, lastActiveFilter]);

    useEffect(() => {
        if (!id) return;
        fetchBroadcast(id);
    }, [id]);

    const fetchBroadcast = async (broadcastId: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/broadcast/${broadcastId}`);
            if (response.data.success) {
                const broadcast: SavedBroadcast = response.data.data;
                setTitle(broadcast.title || '');
                setMessage(broadcast.content || '');
                setImageUrl(broadcast.imgUrl || '');
                setButtonText(broadcast.buttonText || '');
            }
        } catch (error: any) {
            toast.error('Ошибка загрузки рассылки');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserCount = async () => {
        try {
            const response = await api.post('/api/broadcast/users', {
                status: status,
                lastActiveFilter: lastActiveFilter,
                search: ""
            });
            setUserCount(response.data.count);
        } catch (error: any) {
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
            const response = await api.post('/api/broadcast/users', {
                status: status,
                lastActiveFilter: lastActiveFilter,
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
            const allIds = new Set(foundUsers.map(u => u._id));
            const allData = new Map(foundUsers.map(u => [u._id, u]));
            setSelectedUsers(allIds);
            setSelectedUsersData(allData);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.warning('Введите название рассылки');
            return;
        }
        if (!message.trim()) {
            toast.warning('Введите сообщение для сохранения');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                title: title.trim(),
                imgUrl: imageUrl || '',
                content: message,
                buttonText: buttonText || '',
            };

            const response = isEditing
                ? await api.put(`/api/broadcast/${id}`, payload)
                : await api.post('/api/broadcast', payload);

            if (response.data.success) {
                toast.success(isEditing ? 'Рассылка успешно обновлена' : 'Рассылка успешно сохранена');
                if (!isEditing) {
                    navigate(`/admin/broadcast/edit/${response.data.data?._id}`);
                }
            } else {
                toast.error(response.data.message || 'Ошибка сохранения рассылки');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Ошибка сохранения рассылки';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSendBroadcast = async () => {
        const finalMessage = message.trim();
        if (!finalMessage) {
            toast.warning('Введите сообщение для рассылки');
            return;
        }

        if (scheduledAtIso) {
            const scheduledDate = new Date(scheduledAtIso);
            if (scheduledDate <= new Date()) {
                toast.warning('Время рассылки должно быть в будущем');
                return;
            }
        }

        // Если есть выбранные пользователи из поиска
        if (selectedUsers.size > 0) {
            const confirmText = scheduledAtIso
                ? `Запланировать рассылку ${selectedUsers.size} выбранным пользователям?`
                : `Вы уверены, что хотите отправить сообщение ${selectedUsers.size} выбранным пользователям?`;
            if (!confirm(confirmText)) return;

            setLoading(true);
            try {
                const response = await api.post('/api/broadcast/send', { 
                    message: finalMessage || undefined,
                    userIds: Array.from(selectedUsers),
                    imageUrl: imageUrl || undefined,
                    parseMode: parseMode,
                    buttonText: buttonText || undefined,
                    buttonUrl: buttonUrl || undefined,
                    scheduledAt: scheduledAtIso,
                });
                
                if (response.data.success) {
                    toast.success(response.data.message || 'Рассылка выполнена');
                    if (!scheduledAtIso) {
                        setMessage('');
                        setImageUrl('');
                        setButtonText('');
                        setButtonUrl('');
                    }
                } else {
                    toast.error(response.data.message || 'Ошибка отправки рассылки');
                }
            } catch (error: any) {
                console.error('Ошибка отправки рассылки:', error);
                const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Ошибка отправки рассылки';
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
            return;
        }

        if (userCount === 0) {
            toast.warning('Нет пользователей для рассылки');
            return;
        }

        let confirmText = scheduledAtIso
            ? `Запланировать рассылку ${userCount} пользователям?`
            : `Вы уверены, что хотите отправить сообщение ${userCount} пользователям?`;
        
        if (status !== 'all') {
            confirmText = scheduledAtIso
                ? `Запланировать рассылку ${userCount} пользователям со статусом "${getStatusLabel(status)}"?`
                : `Вы уверены, что хотите отправить сообщение ${userCount} пользователям со статусом "${getStatusLabel(status)}"?`;
        }

        if (!confirm(confirmText)) return;

        setLoading(true);
        try {
            const response = await api.post('/api/broadcast/send', { 
                message: finalMessage || undefined,
                status: status === 'all' ? undefined : status,
                lastActiveFilter: lastActiveFilter === 'all' ? undefined : lastActiveFilter,
                imageUrl: imageUrl || undefined,
                parseMode: parseMode,
                buttonText: buttonText || undefined,
                buttonUrl: buttonUrl || undefined,
                scheduledAt: scheduledAtIso,
            });
            
            if (response.data.success) {
                toast.success(response.data.message || 'Рассылка выполнена');
                if (!scheduledAtIso) {
                    setMessage('');
                    setImageUrl('');
                    setButtonText('');
                    setButtonUrl('');
                }
            } else {
                toast.error(response.data.message || 'Ошибка отправки рассылки');
            }
        } catch (error: any) {
            console.error('Ошибка отправки рассылки:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Ошибка отправки рассылки';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (statusValue: string, isBlocked?: boolean) => {
        if (isBlocked) return 'Заблокирован';
        switch (statusValue) {
            case 'anonym': return 'Аноним';
            case 'guest': return 'Гость';
            case 'registered': return 'Зарегистрирован';
            case 'client': return 'Клиент';
            default: return 'Все';
        }
    };

    const getStatusColor = (statusValue: string, isBlocked?: boolean) => {
        if (isBlocked) return 'bg-red-100 text-red-700';
        switch (statusValue) {
            case 'anonym': return 'bg-red-100 text-red-700';
            case 'guest': return 'bg-gray-100 text-gray-700';
            case 'registered': return 'bg-blue-100 text-blue-700';
            case 'client': return 'bg-purple-100 text-purple-700';
            default: return 'bg-purple-100 text-purple-700';
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEditing ? 'Редактирование рассылки' : 'Создание рассылки'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Создайте рассылку и отправьте ее пользователям
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/broadcast')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Назад к списку
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            Название рассылки
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Введите название"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <ImageIcon size={18} />
                            Изображение
                            <span className="text-xs text-gray-500 font-normal">(необязательно)</span>
                        </label>
                        <ImageUpload
                            value={imageUrl}
                            onChange={(url) => setImageUrl(url)}
                            label="Изображение для рассылки"
                        />
                        {imageUrl && (
                            <button
                                onClick={() => setImageUrl('')}
                                className="mt-2 text-sm text-red-600 hover:text-red-800"
                            >
                                Удалить изображение
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <MessageSquare size={18} />
                            Режим форматирования
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setParseMode('HTML')}
                                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                    parseMode === 'HTML'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                HTML
                            </button>
                            <button
                                onClick={() => setParseMode('Markdown')}
                                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                    parseMode === 'Markdown'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                Markdown
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <MessageSquare size={18} />
                            Сообщение для рассылки
                        </label>
                        <RichTextEditor
                            value={message}
                            onChange={(value) => setMessage(value)}
                            placeholder="Введите текст сообщения."
                            height="350px"
                        />
                    </div>

                    <div className="border-t pt-4">
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            Inline кнопка (опционально)
                        </label>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">Текст кнопки</label>
                            <input
                                type="text"
                                value={buttonText}
                                onChange={(e) => setButtonText(e.target.value)}
                                placeholder="Например: Открыть приложение"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            URL кнопки будет автоматически сформирован как <code className="bg-gray-100 px-1 rounded">{import.meta.env.VITE_APP_URL}/</code> с параметрами <code className="bg-gray-100 px-1 rounded">telegramId</code> и <code className="bg-gray-100 px-1 rounded">profilePhotoUrl</code> (если указан) для каждого пользователя.
                        </p>
                    </div>

                    <div className="border-t pt-4">
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            Время рассылки (опционально)
                        </label>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Если указать время, рассылка будет выполнена автоматически в этот момент.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={handleSave}
                            disabled={loading || !title.trim() || !message.trim()}
                            className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save size={20} />
                            {isEditing ? 'Сохранить изменения' : 'Создать рассылку'}
                        </button>
                        <button
                            onClick={handleSendBroadcast}
                            disabled={loading || !message.trim() || (selectedUsers.size === 0 && userCount === 0)}
                            className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
                        >
                            <Send size={20} />
                            {loading ? 'Отправка...' : selectedUsers.size > 0 
                                ? `Отправить выбранным (${selectedUsers.size})`
                                : `Отправить рассылку (${userCount})`
                            }
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Users size={18} />
                            Фильтр по статусу пользователей
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {['all', 'anonym', 'guest', 'registered', 'client'].map((statusOption) => (
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
                                        <div className={`text-xs px-2 py-1 rounded inline-block ${getStatusColor(statusOption)}`}>
                                            {getStatusLabel(statusOption)}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            Активность пользователей
                        </label>
                        <select
                            value={lastActiveFilter}
                            onChange={(e) => setLastActiveFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">Все</option>
                            <option value="active">Активные (в течение 15 дней)</option>
                            <option value="inactive">Неактивные (больше 15 дней)</option>
                        </select>
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
                                    placeholder="Поиск по имени, username, телефону..."
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
                                Количество получателей по фильтру: <span className="font-semibold text-blue-600">{userCount}</span>
                            </p>
                        )}
                    </div>

                    {foundUsers.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={foundUsers.length > 0 && selectedUsers.size === foundUsers.length}
                                        onChange={toggleAllUsers}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-700">
                                        Найдено пользователей: {foundUsers.length}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    Выбрано: <span className="font-semibold text-blue-600">{selectedUsers.size}</span>
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
                                            <div className="font-medium text-gray-900">{user.fullName || 'Без имени'}</div>
                                            <div className="text-sm text-gray-500 flex gap-3">
                                                {user.telegramUserName && <span>@{user.telegramUserName}</span>}
                                                {user.userName && <span>{user.userName}</span>}
                                                {user.phone && <span>{user.phone}</span>}
                                            </div>
                                        </div>
                                        <div className={`text-xs px-2 py-1 rounded ${getStatusColor(user.status, user.isBlocked)}`}>
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
                                                <span className="text-xs text-gray-500">@{user.telegramUserName}</span>
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
                </div>
            </div>
        </AdminLayout>
    );
};

