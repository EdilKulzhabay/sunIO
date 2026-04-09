import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { ArrowLeft, BarChart3, Trash2 } from 'lucide-react';

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
        modalTitle?: string;
        modalDescription?: string;
        modalButtonText?: string;
        modalButtonLink?: string;
        status?: string;
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
