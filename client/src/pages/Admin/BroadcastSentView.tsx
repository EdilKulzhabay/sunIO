import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, Send, Trash2 } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3002').replace(/\/$/, '');

function absoluteAssetUrl(pathOrUrl?: string | null): string {
    if (!pathOrUrl?.trim()) return '';
    const t = pathOrUrl.trim();
    if (/^https?:\/\//i.test(t)) return t;
    return `${API_BASE}${t.startsWith('/') ? '' : '/'}${t}`;
}

function apiPathFromAbsolute(absoluteUrl: string): string | null {
    if (!API_BASE || !absoluteUrl.startsWith(API_BASE)) return null;
    const p = absoluteUrl.slice(API_BASE.length);
    return p.startsWith('/') ? p : `/${p}`;
}

interface RecipientRow {
    telegramId: string;
    telegramUserName?: string;
    userName?: string;
    fullName?: string;
    phone?: string;
    status?: string;
    approximate?: boolean;
    notInDb?: boolean;
}

interface FailedRecipientRow extends RecipientRow {
    error: string;
    errorCode?: number;
}

interface RecipientsBlock {
    successful: RecipientRow[];
    failed: FailedRecipientRow[];
    note: string | null;
}

interface SentBroadcastDetail {
    _id: string;
    scheduledAt: string;
    sentAt: string;
    status: string;
    displayImageUrl?: string;
    recipients?: RecipientsBlock;
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

    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!id) return;
        if (!window.confirm('Удалить запись об этой рассылке? Действие необратимо.')) return;
        setDeleting(true);
        try {
            await api.delete(`/api/broadcast/sent/${encodeURIComponent(id)}`);
            toast.success('Запись удалена');
            navigate('/admin/broadcast');
        } catch {
            toast.error('Не удалось удалить запись');
        } finally {
            setDeleting(false);
        }
    };

    const statusLabel = (status?: string) => {
        switch (status) {
            case 'guest':
                return 'Гости';
            case 'registered':
                return 'Зарегистрированные';
            case 'client':
                return 'Клиенты';
            case 'anonym':
                return 'Анонимы';
            default:
                return 'Все пользователи';
        }
    };

    const p = data?.payload;
    const r = data?.result;
    const recipients = data?.recipients;

    const imageSrc = useMemo(
        () => absoluteAssetUrl(data?.displayImageUrl || p?.imageUrl),
        [data?.displayImageUrl, p?.imageUrl]
    );

    const handleDownloadImage = useCallback(async () => {
        if (!imageSrc) {
            toast.error('Нет изображения для скачивания');
            return;
        }
        try {
            const path = apiPathFromAbsolute(imageSrc);
            let blob: Blob;
            if (path) {
                const res = await api.get(path, { responseType: 'blob' });
                blob = res.data;
            } else {
                const res = await fetch(imageSrc);
                if (!res.ok) throw new Error('fetch failed');
                blob = await res.blob();
            }
            const ext = blob.type.includes('png')
                ? 'png'
                : blob.type.includes('webp')
                  ? 'webp'
                  : blob.type.includes('gif')
                    ? 'gif'
                    : 'jpg';
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = `broadcast-${data?._id || 'image'}.${ext}`;
            a.click();
            URL.revokeObjectURL(objectUrl);
            toast.success('Файл сохранён');
        } catch {
            toast.error('Не удалось скачать изображение');
        }
    }, [imageSrc, data?._id]);

    const tableCellClass = 'px-3 py-2 border-b border-gray-100 text-gray-800';

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

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Send size={28} className="text-green-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Отправленная рассылка</h1>
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
                <p className="text-gray-600 text-sm">Только просмотр — запись из журнала отправок.</p>

                {loading && <p className="text-gray-500">Загрузка…</p>}

                {!loading && data && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-gray-500">Название (в письме)</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">{p?.title || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Время отправки</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.sentAt ? new Date(data.sentAt).toLocaleString('ru-RU') : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-gray-500">Плановое время (из расписания)</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">
                                    {data.scheduledAt ? new Date(data.scheduledAt).toLocaleString('ru-RU') : '—'}
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
                            <div>
                                <dt className="text-gray-500">Получатели (по статусу)</dt>
                                <dd className="font-medium text-gray-900 mt-0.5">{statusLabel(p?.status)}</dd>
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
                                    <div className="text-sm font-medium text-gray-900">{p?.parseMode || 'HTML'}</div>
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

                        {imageSrc ? (
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <h2 className="text-sm font-semibold text-gray-700">Изображение</h2>
                                    <button
                                        type="button"
                                        onClick={handleDownloadImage}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                                    >
                                        <Download size={16} />
                                        Скачать
                                    </button>
                                </div>
                                <img
                                    src={imageSrc}
                                    alt=""
                                    className="max-w-md w-full rounded-lg border border-gray-200"
                                />
                                <p className="text-xs text-gray-500 mt-1 break-all">{imageSrc}</p>
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
                                <p className="font-medium text-gray-900 mt-0.5 break-all">{p?.buttonUrl || '—'}</p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h2 className="text-sm font-semibold text-gray-700 mb-2">
                                Пользователи, которым отправлено
                            </h2>
                            {recipients?.note ? (
                                <p className="text-xs text-gray-500 mb-3">{recipients.note}</p>
                            ) : null}
                            {recipients && recipients.successful.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                            <tr>
                                                <th className={tableCellClass}>Имя</th>
                                                <th className={tableCellClass}>Telegram</th>
                                                <th className={tableCellClass}>Телефон</th>
                                                <th className={tableCellClass}>Статус</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recipients.successful.map((row) => (
                                                <tr key={row.telegramId} className="hover:bg-gray-50/80">
                                                    <td className={tableCellClass}>
                                                        {row.fullName || '—'}
                                                        {row.approximate ? (
                                                            <span className="block text-xs text-amber-700">
                                                                ориентировочно
                                                            </span>
                                                        ) : null}
                                                        {row.notInDb ? (
                                                            <span className="block text-xs text-gray-500">
                                                                нет в базе
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td className={tableCellClass}>
                                                        {row.telegramUserName ? `@${row.telegramUserName}` : '—'}
                                                        <span className="block text-xs text-gray-500 font-mono">
                                                            {row.telegramId}
                                                        </span>
                                                    </td>
                                                    <td className={tableCellClass}>{row.phone || '—'}</td>
                                                    <td className={tableCellClass}>{row.status || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Нет сохранённого списка успешных получателей для этой записи.
                                </p>
                            )}
                        </div>

                        {recipients && recipients.failed.length > 0 ? (
                            <div className="border-t pt-4">
                                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                                    Не доставлено (ошибки)
                                </h2>
                                <div className="border border-red-100 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-red-50 text-red-900 sticky top-0">
                                            <tr>
                                                <th className={tableCellClass}>Пользователь</th>
                                                <th className={tableCellClass}>Telegram ID</th>
                                                <th className={tableCellClass}>Ошибка</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recipients.failed.map((row, i) => (
                                                <tr key={`${row.telegramId}-${i}`} className="hover:bg-red-50/40">
                                                    <td className={tableCellClass}>
                                                        {row.fullName || '—'}
                                                        {row.telegramUserName ? (
                                                            <span className="block text-xs text-gray-600">
                                                                @{row.telegramUserName}
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                    <td className={`${tableCellClass} font-mono text-xs`}>
                                                        {row.telegramId}
                                                    </td>
                                                    <td className={`${tableCellClass} text-red-800`}>
                                                        {row.error}
                                                        {row.errorCode != null ? (
                                                            <span className="block text-xs text-gray-500">
                                                                код {row.errorCode}
                                                            </span>
                                                        ) : null}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {!loading && !data && (
                    <p className="text-gray-500">Запись не найдена или недоступна.</p>
                )}
            </div>
        </AdminLayout>
    );
};
