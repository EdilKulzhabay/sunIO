import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { Send, Users, Search, X, MessageSquare } from 'lucide-react';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';

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

export const ModalNotificationsAdmin = () => {
    const [modalTitle, setModalTitle] = useState('');
    const [modalDescription, setModalDescription] = useState('');
    const [modalButtonText, setModalButtonText] = useState('');
    const [modalButtonLink, setModalButtonLink] = useState('');
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [foundUsers, setFoundUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectedUsersData, setSelectedUsersData] = useState<Map<string, User>>(new Map());
    const [lastCount, setLastCount] = useState<number | null>(null);
    
    // Состояния для контентов
    const [horoscopes, setHoroscopes] = useState<any[]>([]);
    const [transits, setTransits] = useState<any[]>([]);
    const [meditations, setMeditations] = useState<any[]>([]);
    const [practices, setPractices] = useState<any[]>([]);
    const [videoLessons, setVideoLessons] = useState<any[]>([]);
    const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);

    const fetchUserCount = async () => {
        try {
            const response = await api.post('/api/modal-notification/users', {
                status: status,
                search: ""
            });
            setUserCount(response.data.count);
        } catch (error: any) {
            toast.error('Ошибка загрузки пользователей');
        }
    };

    useEffect(() => {
        fetchUserCount();
        // При изменении статуса очищаем поиск и найденных пользователей
        setSearch('');
        setFoundUsers([]);
        setSelectedUsers(new Set());
        setSelectedUsersData(new Map());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

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
            const allIds = new Set(foundUsers.map(u => u._id));
            const allData = new Map(foundUsers.map(u => [u._id, u]));
            setSelectedUsers(allIds);
            setSelectedUsersData(allData);
        }
    };

    const handleCreateNotification = async () => {
        if (!modalTitle.trim() || !modalDescription.trim() || !modalButtonText.trim()) {
            toast.warning('Заполните все обязательные поля');
            return;
        }

        // Если есть выбранные пользователи из поиска
        if (selectedUsers.size > 0) {
            const confirmText = `Вы уверены, что хотите создать модальное уведомление для ${selectedUsers.size} выбранных пользователей?`;
            if (!confirm(confirmText)) return;

            setLoading(true);
            try {
                const response = await api.post('/api/modal-notification/create', {
                    modalTitle,
                    modalDescription,
                    modalButtonText,
                    modalButtonLink: modalButtonLink.trim() || undefined,
                    userIds: Array.from(selectedUsers),
                });
                
                if (response.data.success) {
                    setLastCount(response.data.count);
                    toast.success(`Модальное уведомление создано для ${response.data.count} пользователей`);
                    
                    // Очищаем форму
                    setModalTitle('');
                    setModalDescription('');
                    setModalButtonText('');
                    setModalButtonLink('');
                    setSelectedUsers(new Set());
                    setSelectedUsersData(new Map());
                } else {
                    toast.error(response.data.message || 'Ошибка создания уведомления');
                }
            } catch (error: any) {
                console.error('Ошибка создания уведомления:', error);
                const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Ошибка создания уведомления';
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Иначе отправляем всем по фильтру статуса
        if (userCount === 0) {
            toast.warning('Нет пользователей для создания уведомления');
            return;
        }

        let confirmText = `Вы уверены, что хотите создать модальное уведомление для ${userCount} пользователей?`;
        
        if (status !== 'all') {
            confirmText = `Вы уверены, что хотите создать модальное уведомление для ${userCount} пользователей со статусом "${getStatusLabel(status)}"?`;
        }

        if (!confirm(confirmText)) return;

        setLoading(true);
        try {
            const response = await api.post('/api/modal-notification/create', {
                modalTitle,
                modalDescription,
                modalButtonText,
                modalButtonLink: modalButtonLink.trim() || undefined,
                status: status === 'all' ? undefined : status,
            });
            
            if (response.data.success) {
                setLastCount(response.data.count);
                toast.success(`Модальное уведомление создано для ${response.data.count} пользователей`);
                
                // Очищаем форму
                setModalTitle('');
                setModalDescription('');
                setModalButtonText('');
                setModalButtonLink('');
            } else {
                toast.error(response.data.message || 'Ошибка создания уведомления');
            }
        } catch (error: any) {
            console.error('Ошибка создания уведомления:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Ошибка создания уведомления';
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
            case 'active': return 'Активен';
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
            case 'active': return 'bg-green-100 text-green-700';
            case 'client': return 'bg-purple-100 text-purple-700';
            default: return 'bg-purple-100 text-purple-700';
        }
    };

    // Функции загрузки контентов
    const fetchHoroscopes = async () => {
        setLoadingContent(true);
        try {
            const response = await api.get('/api/horoscope');
            const data = response.data?.success ? response.data.data : response.data?.data || response.data || [];
            setHoroscopes(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Ошибка загрузки гороскопов');
            setHoroscopes([]);
        } finally {
            setLoadingContent(false);
        }
    };

    const fetchTransits = async () => {
        setLoadingContent(true);
        try {
            const response = await api.get('/api/transit');
            const data = response.data?.success ? response.data.data : response.data?.data || response.data || [];
            setTransits(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Ошибка загрузки транзитов');
            setTransits([]);
        } finally {
            setLoadingContent(false);
        }
    };

    const fetchMeditations = async () => {
        setLoadingContent(true);
        try {
            const response = await api.get('/api/meditation');
            const data = response.data?.success ? response.data.data : response.data?.data || response.data || [];
            setMeditations(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Ошибка загрузки медитаций');
            setMeditations([]);
        } finally {
            setLoadingContent(false);
        }
    };

    const fetchPractices = async () => {
        setLoadingContent(true);
        try {
            const response = await api.get('/api/practice');
            const data = response.data?.success ? response.data.data : response.data?.data || response.data || [];
            setPractices(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Ошибка загрузки практик');
            setPractices([]);
        } finally {
            setLoadingContent(false);
        }
    };

    const fetchVideoLessons = async () => {
        setLoadingContent(true);
        try {
            const response = await api.get('/api/video-lesson');
            const data = response.data?.success ? response.data.data : response.data?.data || response.data || [];
            setVideoLessons(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Ошибка загрузки видео-уроков');
            setVideoLessons([]);
        } finally {
            setLoadingContent(false);
        }
    };

    // Обработка выбора страницы с контентом
    const handleContentPageClick = (basePath: string, contentType: string) => {
        setSelectedContentType(contentType);
        setModalButtonLink(basePath);
        
        switch (contentType) {
            case 'horoscope':
                fetchHoroscopes();
                break;
            case 'transit':
                fetchTransits();
                break;
            case 'meditation':
                fetchMeditations();
                break;
            case 'practice':
                fetchPractices();
                break;
            case 'video-lesson':
                fetchVideoLessons();
                break;
        }
    };

    // Обработка выбора контента
    const handleContentSelect = (basePath: string, contentId: string) => {
        setModalButtonLink(`${basePath}/${contentId}`);
        setSelectedContentType(null);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Модальные уведомления</h1>
                    <p className="text-gray-600 mt-1">Создание модальных уведомлений для пользователей</p>
                </div>

                {/* Статистика последнего создания */}
                {lastCount !== null && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-semibold text-green-900 mb-2">Последнее уведомление</h3>
                        <div className="text-lg font-bold text-green-600">
                            Создано для {lastCount} пользователей
                        </div>
                    </div>
                )}

                {/* Форма создания уведомления */}
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    {/* Фильтр по статусу */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Users size={18} />
                            Фильтр по статусу пользователей
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {['all', 'anonym', 'guest', 'registered', 'active', 'client'].map((statusOption) => (
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

                    {/* Поиск по пользователям */}
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
                                Количество получателей по фильтру: <span className="font-semibold text-blue-600">{userCount}</span>
                            </p>
                        )}
                    </div>

                    {/* Выбранные пользователи */}
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

                    {/* Список найденных пользователей */}
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
                                                {user.mail && <span>{user.mail}</span>}
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

                    {/* Заголовок модального окна */}
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

                    {/* Описание модального окна */}
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

                    {/* Текст кнопки */}
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

                    {/* Ссылка кнопки (опционально) */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                            Ссылка кнопки <span className="text-xs text-gray-500 font-normal">(необязательно)</span>
                        </label>
                        <input
                            type="text"
                            value={modalButtonLink}
                            onChange={(e) => setModalButtonLink(e.target.value)}
                            placeholder="Например: /client/profile или https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Если указана ссылка, при нажатии на кнопку произойдет переход на эту страницу
                        </p>
                        
                        {/* Список клиентских страниц */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Доступные клиентские страницы:</h4>
                            <div className="space-y-3">
                                {/* Основные страницы */}
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1.5">Основные:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/main'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-start"
                                        >
                                            <span className="font-medium text-gray-900">Главная страница</span>
                                            <span className="text-gray-500">/main</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/about'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-start"
                                        >
                                            <span className="font-medium text-gray-900">О клубе</span>
                                            <span className="text-gray-500">/about</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/faq'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-start"
                                        >
                                            <span className="font-medium text-gray-900">Вопросы-ответы</span>
                                            <span className="text-gray-500">/client/faq</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/profile'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-start"
                                        >
                                            <span className="font-medium text-gray-900">Профиль</span>
                                            <span className="text-gray-500">/client/profile</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/schedule'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-start"
                                        >
                                            <span className="font-medium text-gray-900">Расписание</span>
                                            <span className="text-gray-500">/client/schedule</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/diary'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-start"
                                        >
                                            <span className="font-medium text-gray-900">Дневник</span>
                                            <span className="text-gray-500">/client/diary</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/schumann'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-start"
                                        >
                                            <span className="font-medium text-gray-900">Частота Шумана</span>
                                            <span className="text-gray-500">/client/schumann</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/contactus'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors flex flex-col items-start"
                                        >
                                            <span className="font-medium text-gray-900">Связаться с нами</span>
                                            <span className="text-gray-500">/client/contactus</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Гороскопы */}
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1.5">Гороскопы:</p>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/horoscope'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                            title="Текущий гороскоп"
                                        >
                                            /client/horoscope
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/horoscopes'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                            title="Список всех гороскопов"
                                        >
                                            /client/horoscopes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleContentPageClick('/client/horoscope', 'horoscope')}
                                            className="px-2.5 py-1 text-xs bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                                            title="Выбрать конкретный гороскоп"
                                        >
                                            /client/horoscope/:id
                                        </button>
                                    </div>
                                </div>

                                {/* Транзиты */}
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1.5">Транзиты:</p>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/transit'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                            title="Текущий транзит"
                                        >
                                            /client/transit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/transits'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                            title="Список всех транзитов"
                                        >
                                            /client/transits
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleContentPageClick('/client/transit', 'transit')}
                                            className="px-2.5 py-1 text-xs bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                                            title="Выбрать конкретный транзит"
                                        >
                                            /client/transit/:id
                                        </button>
                                    </div>
                                </div>

                                {/* Медитации */}
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1.5">Медитации:</p>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/meditations'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                            title="Список всех медитаций"
                                        >
                                            /client/meditations
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleContentPageClick('/client/meditation', 'meditation')}
                                            className="px-2.5 py-1 text-xs bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                                            title="Выбрать конкретную медитацию"
                                        >
                                            /client/meditation/:id
                                        </button>
                                    </div>
                                </div>

                                {/* Практики */}
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1.5">Практики:</p>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/practices'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                            title="Список всех практик"
                                        >
                                            /client/practices
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleContentPageClick('/client/practice', 'practice')}
                                            className="px-2.5 py-1 text-xs bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                                            title="Выбрать конкретную практику"
                                        >
                                            /client/practice/:id
                                        </button>
                                    </div>
                                </div>

                                {/* Видео-уроки */}
                                <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1.5">Видео-уроки:</p>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <button
                                            type="button"
                                            onClick={() => { setModalButtonLink('/client/video-lessons'); setSelectedContentType(null); }}
                                            className="px-2.5 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                            title="Список всех видео-уроков"
                                        >
                                            /client/video-lessons
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleContentPageClick('/client/video-lesson', 'video-lesson')}
                                            className="px-2.5 py-1 text-xs bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 transition-colors"
                                            title="Выбрать конкретный видео-урок"
                                        >
                                            /client/video-lesson/:id
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Список контентов для выбранной страницы */}
                            {selectedContentType && (
                                <div className="mt-4 pt-4 border-t border-gray-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-gray-700">
                                            Выберите контент:
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedContentType(null)}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {loadingContent ? (
                                        <p className="text-xs text-gray-500 py-2">Загрузка...</p>
                                    ) : (
                                        <div className="max-h-48 overflow-y-auto space-y-1">
                                            {selectedContentType === 'horoscope' && horoscopes.length > 0 && (
                                                horoscopes.map((item) => (
                                                    <button
                                                        key={item._id}
                                                        type="button"
                                                        onClick={() => handleContentSelect('/client/horoscope', item._id)}
                                                        className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                                    >
                                                        <div className="font-medium text-gray-900">{item.title || 'Без названия'}</div>
                                                        {item.subtitle && (
                                                            <div className="text-gray-500 text-xs mt-0.5">{item.subtitle}</div>
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                            {selectedContentType === 'transit' && transits.length > 0 && (
                                                transits.map((item) => (
                                                    <button
                                                        key={item._id}
                                                        type="button"
                                                        onClick={() => handleContentSelect('/client/transit', item._id)}
                                                        className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                                    >
                                                        <div className="font-medium text-gray-900">{item.title || 'Без названия'}</div>
                                                        {item.subtitle && (
                                                            <div className="text-gray-500 text-xs mt-0.5">{item.subtitle}</div>
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                            {selectedContentType === 'meditation' && meditations.length > 0 && (
                                                meditations.map((item) => (
                                                    <button
                                                        key={item._id}
                                                        type="button"
                                                        onClick={() => handleContentSelect('/client/meditation', item._id)}
                                                        className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                                    >
                                                        <div className="font-medium text-gray-900">{item.title || 'Без названия'}</div>
                                                    </button>
                                                ))
                                            )}
                                            {selectedContentType === 'practice' && practices.length > 0 && (
                                                practices.map((item) => (
                                                    <button
                                                        key={item._id}
                                                        type="button"
                                                        onClick={() => handleContentSelect('/client/practice', item._id)}
                                                        className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                                    >
                                                        <div className="font-medium text-gray-900">{item.title || 'Без названия'}</div>
                                                    </button>
                                                ))
                                            )}
                                            {selectedContentType === 'video-lesson' && videoLessons.length > 0 && (
                                                videoLessons.map((item) => (
                                                    <button
                                                        key={item._id}
                                                        type="button"
                                                        onClick={() => handleContentSelect('/client/video-lesson', item._id)}
                                                        className="w-full text-left px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                                    >
                                                        <div className="font-medium text-gray-900">{item.title || 'Без названия'}</div>
                                                    </button>
                                                ))
                                            )}
                                            {((selectedContentType === 'horoscope' && horoscopes.length === 0) ||
                                              (selectedContentType === 'transit' && transits.length === 0) ||
                                              (selectedContentType === 'meditation' && meditations.length === 0) ||
                                              (selectedContentType === 'practice' && practices.length === 0) ||
                                              (selectedContentType === 'video-lesson' && videoLessons.length === 0)) && (
                                                <p className="text-xs text-gray-500 py-2">Контент не найден</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    

                    {/* Кнопка создания */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            onClick={handleCreateNotification}
                            disabled={loading || !modalTitle.trim() || !modalDescription.trim() || !modalButtonText.trim() || (selectedUsers.size === 0 && userCount === 0)}
                            className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
                        >
                            <Send size={20} />
                            {loading ? 'Создание...' : selectedUsers.size > 0 
                                ? `Создать уведомление для выбранных (${selectedUsers.size})`
                                : `Создать уведомление для всех (${userCount})`
                            }
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

