import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

interface FormData {
    fullName: string;
    mail: string;
    phone: string;
    bonus: number;
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
}

export const UserForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState('');
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        mail: '',
        phone: '',
        bonus: 0,
        paymentLink: '',
        paymentId: '',
        lastActiveDate: "",
    });
    const lastActiveDateDisplay = formData.lastActiveDate
        ? new Date(formData.lastActiveDate).toLocaleString('ru-RU')
        : '';

    useEffect(() => {
        if (id) {
            fetchUser();
        }
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
            });
            // Преобразуем subscriptionEndDate из Date в формат DD-MM-YYYY
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
                            label="Количество бонусов (Звёзды)"
                            type="text"
                            value={formData.bonus.toString()}
                            onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                setFormData({ ...formData, bonus: value });
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
                            <h2 className="text-xl font-semibold text-gray-900">Активации</h2>
                            
                            {([
                                { key: 'bodyActivation' as const, label: 'Активация тела' },
                                { key: 'heartActivation' as const, label: 'Активация сердца' },
                                { key: 'healingFamily' as const, label: 'Исцеление рода' },
                                { key: 'awakeningSpirit' as const, label: 'Пробуждение духа' },
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

