import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { ArrowLeft, Send } from 'lucide-react';

interface SentBroadcastDetail {
    _id: string;
    scheduledAt: string;
    sentAt: string;
    status: string;
    payload?: {
        title?: string;
        message?: string;
        imageUrl?: string;
        buttonText?: string;
        buttonUrl?: string;
        broadcastId?: string;
        broadcastTitle?: string;
        status?: string;
        parseMode?: string;
    };
    result?: { sent?: number; failed?: number; total?: number };
    scheduledBy?: { fullName?: string; telegramUserName?: string };
}

export const BroadcastSentView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<SentBroadcastDetail | null>(null);

    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get<{ success: boolean; data: SentBroadcastDetail }>(
                    `/api/broadcast/sent/${encodeURIComponent(id)}`
                );
                if (res.data.success && res.data.data) {
                    setData(res.data.data);
                } else {
                    setData(null);
                    toast.error('Запись не найдена');
                }
            } catch {
                toast.error('Не удалось загрузить рассылку');
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const p = data?.payload;
    const r = data?.result;

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl">
                <button
                    type="button"
                    onClick={() => navigate('/admin/broadcast')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={20} />
                    К списку рассылок
                </button>

                <div className="flex items-center gap-2">
                    <Send size={28} className="text-green-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Отправленная рассылка</h1>
                </div>
                <p className="text-gray-600 text-sm">Только просмотр — запись из журнала отправок.</p>

                {loading && <p className="text-gray-500">Загрузка…</p>}

                {!loading && data && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500">Название (в письме)</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {p?.title || '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Время отправки</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.sentAt
                                        ? new Date(data.sentAt).toLocaleString('ru-RU')
                                        : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Плановое время (из расписания)</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.scheduledAt
                                        ? new Date(data.scheduledAt).toLocaleString('ru-RU')
                                        : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Инициатор</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.scheduledBy?.fullName || '—'}
                                    {data.scheduledBy?.telegramUserName
                                        ? ` (@${data.scheduledBy.telegramUserName})`
                                        : ''}
                                </dd>
                            </div>
                        </dl>

                        <div className="border-t pt-4">
                            <h2 className="text-sm font-semibold text-gray-700 mb-2">Статистика доставки</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                                    <div className="text-xs text-green-800">Доставлено</div>
                                    <div className="text-xl font-semibold text-green-900 tabular-nums">
                                        {r?.sent ?? '—'}
                                    </div>
                                </div>
                                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                                    <div className="text-xs text-red-800">Ошибок</div>
                                    <div className="text-xl font-semibold text-red-900 tabular-nums">
                                        {r?.failed ?? '—'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="text-xs text-gray-600">Всего в выборке</div>
                                    <div className="text-xl font-semibold text-gray-900 tabular-nums">
                                        {r?.total ?? '—'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <div className="text-xs text-gray-600">Режим текста</div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {p?.parseMode || 'HTML'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(p?.broadcastTitle || p?.broadcastId) && (
                            <div className="text-sm text-gray-600">
                                Сохранённый шаблон:{' '}
                                <span className="font-medium text-gray-800">
                                    {p.broadcastTitle || p.broadcastId}
                                </span>
                            </div>
                        )}

                        {p?.imageUrl ? (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-700 mb-2">Изображение</h2>
                                <img
                                    src={p.imageUrl}
                                    alt=""
                                    className="max-w-md rounded-lg border border-gray-200"
                                />
                            </div>
                        ) : null}

                        <div>
                            <h2 className="text-sm font-semibold text-gray-700 mb-2">Текст сообщения</h2>
                            <div
                                className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-4 bg-gray-50"
                                dangerouslySetInnerHTML={{ __html: p?.message || '<p>—</p>' }}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Кнопка</span>
                                <p className="font-medium text-gray-900 mt-0.5">{p?.buttonText || '—'}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Ссылка кнопки</span>
                                <p className="font-medium text-gray-900 mt-0.5 break-all">
                                    {p?.buttonUrl || '—'}
                                </p>
                            </div>
                        </div>

                        {p?.status && (
                            <div className="text-sm text-gray-600">
                                Фильтр получателей (статус):{' '}
                                <span className="font-medium">{p.status}</span>
                            </div>
                        )}
                    </div>
                )}

                {!loading && !data && (
                    <p className="text-gray-500">Запись не найдена или недоступна.</p>
                )}
            </div>
        </AdminLayout>
    );
};
