import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

const COMPLETED_BODY_ACTIVATIONS = [
    { key: 'ethericBodyActivation' as const, label: 'Активация эфирного тела' },
    { key: 'astralBodyActivation' as const, label: 'Активация астрального тела' },
    { key: 'mentalBodyActivation' as const, label: 'Активация ментального тела' },
    { key: 'karmicBodyActivation' as const, label: 'Активация кармического тела' },
    { key: 'buddhicBodyActivation' as const, label: 'Активация будхиального тела' },
    { key: 'atmicBodyActivation' as const, label: 'Активация атманического тела' },
];

interface Referral {
    _id: string;
    fullName: string;
    telegramUserName?: string;
    createdAt: string;
}

interface FormData {
    fullName: string;
    mail: string;
    phone: string;
    bonus: number;
    balance: number;
    telegramId?: string;
    telegramUserName?: string;
    status?: string;
    isBlocked?: boolean;
    paymentLink?: string;
    paymentId?: string;
    lastActiveDate?: string;
    bodyActivation?: boolean;
    heartActivation?: boolean;
    healingFamily?: boolean;
    awakeningSpirit?: boolean;
    botStartSource?: string;
    ethericBodyActivation?: boolean;
    astralBodyActivation?: boolean;
    mentalBodyActivation?: boolean;
    karmicBodyActivation?: boolean;
    buddhicBodyActivation?: boolean;
    atmicBodyActivation?: boolean;
    hdBirthDate?: string;
    hdBirthTime?: string;
    hdBirthCity?: string;
}

export const UserForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState('');
    const [botTrafficSources, setBotTrafficSources] = useState<Array<{ _id: string; title: string; botParameter: string }>>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [referralsLoading, setReferralsLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        mail: '',
        phone: '',
        bonus: 0,
        balance: 0,
        paymentLink: '',
        paymentId: '',
        lastActiveDate: "",
        ethericBodyActivation: false,
        astralBodyActivation: false,
        mentalBodyActivation: false,
        karmicBodyActivation: false,
        buddhicBodyActivation: false,
        atmicBodyActivation: false,
    });
    const lastActiveDateDisplay = formData.lastActiveDate
        ? new Date(formData.lastActiveDate).toLocaleString('ru-RU')
        : '';

    useEffect(() => {
        const load = async () => {
            if (id) {
                await fetchUser();
            }
            await fetchBotTrafficSources();
        };
        load();
    }, [id]);

    const fetchUser = async () => {
        try {
            const response = await api.get(`/api/user/${id}`);
            const data = response.data.data;
            setFormData({
                fullName: data.fullName || '',
                mail: data.mail || '',
                phone: data.phone || '',
                bonus: data.bonus || 0,
                balance: data.balance ?? 0,
                telegramId: data.telegramId || '',
                telegramUserName: data.telegramUserName || '',
                status: data.status || '',
                isBlocked: data.isBlocked || false,
                paymentLink: data.paymentLink || '',
                paymentId: data.paymentId || '',
                lastActiveDate: data.lastActiveDate ? new Date(data.lastActiveDate).toISOString() : '',
                bodyActivation: data.bodyActivation || false,
                heartActivation: data.heartActivation || false,
                healingFamily: data.healingFamily || false,
                awakeningSpirit: data.awakeningSpirit || false,
                botStartSource: data.botStartSource || '',
                ethericBodyActivation: !!data.ethericBodyActivation,
                astralBodyActivation: !!data.astralBodyActivation,
                mentalBodyActivation: !!data.mentalBodyActivation,
                karmicBodyActivation: !!data.karmicBodyActivation,
                buddhicBodyActivation: !!data.buddhicBodyActivation,
                atmicBodyActivation: !!data.atmicBodyActivation,
            });
            if (data.telegramId) {
                fetchReferrals(data.telegramId);
            }
            if (data.subscriptionEndDate) {
                const date = new Date(data.subscriptionEndDate);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                setSubscriptionEndDate(`${day}-${month}-${year}`);
            } else {
                setSubscriptionEndDate('');
            }
        } catch (error: any) {
            toast.error('Ошибка загрузки пользователя');
            navigate('/admin/users');
        }
    };

    const fetchReferrals = async (telegramId: string) => {
        if (!telegramId) return;
        setReferralsLoading(true);
        try {
            const response = await api.post('/api/user/invited-users', { telegramId });
            if (response.data.success) {
                setReferrals(response.data.invitedUsers || []);
            }
        } catch {
            /* ignore */
        } finally {
            setReferralsLoading(false);
        }
    };

    const fetchBotTrafficSources = async () => {
        try {
            const response = await api.get('/api/bot-traffic-sources');
            const data = response.data?.data || [];
            setBotTrafficSources(data.map((item: any) => ({
                _id: item._id,
                title: item.title,
                botParameter: item.botParameter,
            })));
        } catch (error: any) {
            toast.error('Ошибка загрузки источников трафика');
        }
    };

    // Функция для преобразования DD-MM-YYYY в Date
    const parseDate = (dateString: string): Date | null => {
        if (!dateString || dateString.trim() === '') return null;
        const parts = dateString.split('-');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // месяцы в JS начинаются с 0
        const year = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        return new Date(year, month, day);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: FormData = {
                ...formData,
                lastActiveDate: formData.lastActiveDate || undefined,
                ethericBodyActivation: !!formData.ethericBodyActivation,
                astralBodyActivation: !!formData.astralBodyActivation,
                mentalBodyActivation: !!formData.mentalBodyActivation,
                karmicBodyActivation: !!formData.karmicBodyActivation,
                buddhicBodyActivation: !!formData.buddhicBodyActivation,
                atmicBodyActivation: !!formData.atmicBodyActivation,
            };

            if (id) {
                await api.put(`/api/user/${id}`, payload);
                toast.success('Пользователь обновлен');
            } else {
                await api.post('/api/user/create-by-admin', payload);
                toast.success('Пользователь создан');
            }
            navigate('/admin/users');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    const handleActivateSubscription = async () => {
        if (!subscriptionEndDate || subscriptionEndDate.trim() === '') {
            toast.error('Укажите дату окончания подписки');
            return;
        }

        const date = parseDate(subscriptionEndDate);
        if (!date) {
            toast.error('Неверный формат даты. Используйте формат DD-MM-YYYY');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/api/user/${id}/activate-subscription`, {
                subscriptionEndDate: date.toISOString()
            });
            toast.success('Подписка активирована');
            fetchUser();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка активации подписки');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateSubscription = async () => {
        if (!confirm('Вы уверены, что хотите отменить подписку у этого пользователя?')) {
            return;
        }

        setLoading(true);
        try {
            await api.put(`/api/user/${id}/deactivate-subscription`);
            toast.success('Подписка отменена');
            setSubscriptionEndDate('');
            fetchUser();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка отмены подписки');
        } finally {
            setLoading(false);
        }
    };

    const handleBlockUser = async () => {
        if (!confirm('Вы уверены, что хотите заблокировать этого пользователя?')) {
            return;
        }

        setLoading(true);
        try {
            await api.put(`/api/user/${id}/block`);
            toast.success('Пользователь заблокирован');
            fetchUser();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка блокировки пользователя');
        } finally {
            setLoading(false);
        }
    };

    const handleUnblockUser = async () => {
        if (!confirm('Вы уверены, что хотите разблокировать этого пользователя?')) {
            return;
        }

        setLoading(true);
        try {
            await api.put(`/api/user/${id}/unblock`);
            toast.success('Пользователь разблокирован');
            fetchUser();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка разблокировки пользователя');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPaymentLink = () => {
        navigator.clipboard.writeText(formData.paymentLink || '');
        toast.success('Ссылка на оплату скопирована в буфер обмена');
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Заголовок с кнопкой назад */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {id ? 'Редактировать пользователя' : 'Создать пользователя'}
                    </h1>
                </div>

                {/* Форма */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Основная информация */}
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900">Основная информация</h2>
                        
                        <MyInput
                            label="Полное имя"
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            placeholder="Введите имя"
                        />

                        <MyInput
                            label="Email"
                            type="email"
                            value={formData.mail}
                            onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
                            placeholder="Введите email"
                        />

                        <MyInput
                            label="Телефон"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+7 (___) ___-__-__"
                        />

                        <MyInput
                            label="Количество бонусов (Баллы)"
                            type="text"
                            value={formData.bonus.toString()}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setFormData({ ...formData, bonus: value });
                            }}
                            placeholder="0"
                            min="0"
                        />

                        <MyInput
                            label="Баланс (руб.)"
                            type="text"
                            value={formData.balance.toString()}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setFormData({ ...formData, balance: value });
                            }}
                            placeholder="0"
                            min="0"
                        />

                        {id && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Telegram ID</label>
                                    <input
                                        type="text"
                                        value={formData.telegramId || ''}
                                        readOnly
                                        className="w-full p-2 border rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Telegram Username</label>
                                    <input
                                        type="text"
                                        value={formData.telegramUserName || ''}
                                        readOnly
                                        className="w-full p-2 border rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Реферальная ссылка</label>
                                    {formData.telegramId ? (
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm text-blue-600">
                                                {`https://t.me/io_sun_bot?start=${formData.telegramId}`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const link = `https://t.me/io_sun_bot?start=${formData.telegramId}`;
                                                    navigator.clipboard
                                                        .writeText(link)
                                                        .then(() => toast.success('Ссылка скопирована'))
                                                        .catch(() => toast.error('Не удалось скопировать ссылку'));
                                                }}
                                                className="px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Скопировать
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-sm">Telegram ID не указан</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Источник трафика бота (botTrafficSource)</label>
                                    <input
                                        type="text"
                                        value={botTrafficSources.find((source) => source._id === formData.botStartSource)?.title || ''}
                                        readOnly
                                        className="w-full p-2 border rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Дата последней активности</label>
                                    <input
                                        type="text"
                                        value={lastActiveDateDisplay}
                                        readOnly
                                        className="w-full p-2 border rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Статус пользователя */}
                    {id && (
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">Статус пользователя</h2>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">Текущий статус</label>
                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-2 rounded-lg font-medium ${
                                        formData.isBlocked 
                                            ? 'bg-red-100 text-red-700' 
                                            : 'bg-green-100 text-green-700'
                                    }`}>
                                        {formData.isBlocked ? '🚫 Заблокирован' : '✅ Активен'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {formData.isBlocked ? (
                                    <button
                                        type="button"
                                        onClick={handleUnblockUser}
                                        disabled={loading}
                                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Разблокировать пользователя
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleBlockUser}
                                        disabled={loading}
                                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Заблокировать пользователя
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Управление подпиской */}
                    {id && (
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">Управление подпиской</h2>
                            
                            <div>
                                <MyInput
                                    label="Дата окончания подписки (DD-MM-YYYY)"
                                    type="text"
                                    value={subscriptionEndDate}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        let formatted = value;
                                        if (value.length > 2) {
                                            formatted = value.slice(0, 2) + '-' + value.slice(2);
                                        }
                                        if (value.length > 4) {
                                            formatted = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 8);
                                        }
                                        // Ограничиваем длину до 10 символов (DD-MM-YYYY)
                                        if (formatted.length <= 10) {
                                            setSubscriptionEndDate(formatted);
                                        }
                                    }}
                                    placeholder="ДД-ММ-ГГГГ"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Текущая дата окончания: {subscriptionEndDate || 'Не установлена'}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <MyButton
                                    text="Активировать подписку"
                                    onClick={handleActivateSubscription}
                                    disabled={loading || !subscriptionEndDate || subscriptionEndDate.trim() === ''}
                                    className="w-auto px-3 py-1.5 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleDeactivateSubscription}
                                    disabled={loading}
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Отменить подписку
                                </button>
                            </div>

                            <div className='mt-3'>
                                <div>
                                    Номер заказа: {formData.paymentId || 'Не установлен'}
                                </div>
                                <button onClick={handleCopyPaymentLink} className='text-blue-500 hover:text-blue-700 mt-2'>
                                    Ссылка на оплату
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Активации */}
                    {id && (
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">Пройденные программы</h2>
                            
                            {([
                                { key: 'bodyActivation' as const, label: 'Активация тела' },
                                { key: 'heartActivation' as const, label: 'Активация здоровья' },
                                { key: 'healingFamily' as const, label: 'Активация Рода' },
                                { key: 'awakeningSpirit' as const, label: 'Пробуждение Духа' },
                            ]).map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData[key] || false}
                                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                                        formData[key]
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {formData[key] ? 'Активировано' : 'Не активировано'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {id && (
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">Пройденные активации</h2>
                            {COMPLETED_BODY_ACTIVATIONS.map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData[key] || false}
                                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{label}</span>
                                    <span
                                        className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
                                            formData[key]
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {formData[key] ? 'Активировано' : 'Не активировано'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Дизайн Человека */}
                    {id && (formData.hdBirthDate || formData.hdBirthTime || formData.hdBirthCity) && (
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">Дизайн Человека</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Дата рождения</label>
                                    <p className="text-sm text-gray-900">{formData.hdBirthDate || '—'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Время рождения</label>
                                    <p className="text-sm text-gray-900">{formData.hdBirthTime || '—'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Город рождения</label>
                                    <p className="text-sm text-gray-900">{formData.hdBirthCity || '—'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Рефералы */}
                    {id && (
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Рефералы {referrals.length > 0 && <span className="text-base font-normal text-gray-500">({referrals.length})</span>}
                            </h2>
                            {referralsLoading && (
                                <p className="text-gray-500 text-center py-4">Загрузка…</p>
                            )}
                            {!referralsLoading && referrals.length === 0 && (
                                <p className="text-gray-500 text-center py-4">Нет рефералов</p>
                            )}
                            {!referralsLoading && referrals.length > 0 && (
                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="min-w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 font-medium text-gray-700">Полное имя</th>
                                                <th className="px-4 py-3 font-medium text-gray-700">TG Имя</th>
                                                <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Дата регистрации</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {referrals.map((ref) => (
                                                <tr key={ref._id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-gray-900">{ref.fullName || '—'}</td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {ref.telegramUserName ? `@${ref.telegramUserName}` : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                        {ref.createdAt
                                                            ? new Date(ref.createdAt).toLocaleDateString('ru-RU')
                                                            : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Кнопки действий */}
                    <div className="flex gap-2 justify-end bg-white rounded-lg shadow-sm p-6">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/users')}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Отмена
                        </button>
                        <MyButton
                            text={loading ? (id ? 'Сохранение...' : 'Создание...') : (id ? 'Сохранить' : 'Создать')}
                            type="submit"
                            disabled={loading}
                            className="w-auto px-3 py-1.5 text-sm"
                        />
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

