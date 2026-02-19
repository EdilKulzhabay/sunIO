import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, BookOpen, CalendarClock, Send, XCircle } from 'lucide-react';

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
    payload: { message?: string; imageUrl?: string; buttonText?: string };
    scheduledBy?: { fullName?: string };
}

interface SentBroadcast {
    _id: string;
    scheduledAt: string;
    sentAt: string;
    status: string;
    payload: { message?: string; imageUrl?: string; buttonText?: string };
    result?: { sent?: number; failed?: number; total?: number };
    scheduledBy?: { fullName?: string };
}

export const BroadcastAdmin = () => {
    const [savedBroadcasts, setSavedBroadcasts] = useState<SavedBroadcast[]>([]);
    const [scheduledBroadcasts, setScheduledBroadcasts] = useState<ScheduledBroadcast[]>([]);
    const [sentBroadcasts, setSentBroadcasts] = useState<SentBroadcast[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingScheduled, setLoadingScheduled] = useState(false);
    const [loadingSent, setLoadingSent] = useState(false);
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

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Рассылка</h1>
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

                {/* Сохраненные рассылки */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen size={18} />
                            <h2 className="text-xl font-semibold text-gray-900">Сохраненные рассылки</h2>
                        </div>
                        
                    </div>
                    {loading && <p className="text-gray-500 text-center py-4">Загрузка...</p>}
                    {!loading && savedBroadcasts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {savedBroadcasts.map((broadcast) => (
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
                    {!loading && savedBroadcasts.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Нет сохраненных рассылок</p>
                    )}
                </div>

                {/* Запланированные рассылки */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarClock size={18} />
                        <h2 className="text-xl font-semibold text-gray-900">Запланированные рассылки</h2>
                    </div>
                    {loadingScheduled && <p className="text-gray-500 text-center py-4">Загрузка...</p>}
                    {!loadingScheduled && scheduledBroadcasts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {scheduledBroadcasts.map((item) => (
                                <div
                                    key={item._id}
                                    className="border border-amber-200 rounded-lg p-4 bg-amber-50/50 hover:bg-amber-50 transition-colors"
                                >
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
                    {!loadingScheduled && scheduledBroadcasts.length === 0 && (
                        <p className="text-gray-500 text-center py-4">Нет запланированных рассылок</p>
                    )}
                </div>

                {/* Отправленные рассылки */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Send size={18} />
                        <h2 className="text-xl font-semibold text-gray-900">Отправленные рассылки</h2>
                    </div>
                    {loadingSent && <p className="text-gray-500 text-center py-4">Загрузка...</p>}
                    {!loadingSent && sentBroadcasts.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sentBroadcasts.map((item) => (
                                <div
                                    key={item._id}
                                    className="border border-green-200 rounded-lg p-4 bg-green-50/30 hover:bg-green-50/50 transition-colors"
                                >
                                    <div className="text-sm text-gray-700 line-clamp-2 mb-2">
                                        {getMessagePreview(item.payload?.message)}
                                    </div>
                                    <div className="text-xs text-green-700 font-medium mb-1">
                                        Отправлено: {new Date(item.sentAt).toLocaleString('ru-RU')}
                                    </div>
                                    {item.result && (
                                        <div className="text-xs text-gray-600 mb-1">
                                            {item.result.sent ?? 0} доставлено
                                            {(item.result.failed ?? 0) > 0 && `, ${item.result.failed} ошибок`}
                                        </div>
                                    )}
                                    {item.scheduledBy?.fullName && (
                                        <div className="text-xs text-gray-500">
                                            Запланировал: {item.scheduledBy.fullName}
                                        </div>
                                    )}
                                </div>
                            ))}
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
