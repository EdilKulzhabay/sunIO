import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';

interface SavedBroadcast {
    _id: string;
    title: string;
    imgUrl?: string;
    content: string;
    buttonText?: string;
    createdAt: string;
    updatedAt: string;
}

export const BroadcastAdmin = () => {
    const [savedBroadcasts, setSavedBroadcasts] = useState<SavedBroadcast[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSavedBroadcasts();
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

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Рассылка</h1>
                    <p className="text-gray-600 mt-1">Отправка сообщений пользователям через Telegram бота</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen size={18} />
                        <h2 className="text-xl font-semibold text-gray-900">Сохраненные рассылки</h2>
                        </div>
                            <button
                            onClick={() => navigate('/admin/broadcast/create')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                            <Plus size={18} />
                            Создать рассылку
                            </button>
                    </div>
                    {loading && (
                        <p className="text-gray-500 text-center py-4">Загрузка...</p>
                    )}
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
            </div>
        </AdminLayout>
    );
};

