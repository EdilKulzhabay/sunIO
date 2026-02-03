import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

interface FormData {
    fullName: string;
    mail: string;
    phone: string;
    role: string;
    status: string;
    password?: string;
    isSuperAdmin?: boolean;
}

export const AdminForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        mail: '',
        phone: '',
        role: 'admin',
        status: 'active',
        password: '',
        isSuperAdmin: false,
    });

    useEffect(() => {
        if (id) {
            if (formData?.isSuperAdmin) {
                toast.warning('Этот администратор защищен от изменений');
                navigate('/admin/admins');
                return;
            }
            fetchAdmin();
        }
    }, [id]);

    const fetchAdmin = async () => {
        try {
            const response = await api.get(`/api/admin/${id}`);
            const data = response.data.data;
            setFormData({
                fullName: data.fullName || '',
                mail: data.mail || '',
                phone: data.phone || '',
                role: data.role || 'admin',
                status: data.status || 'active',
                password: '', // Пароль не загружаем
                isSuperAdmin: data.isSuperAdmin || false,
            });
        } catch (error: any) {
            toast.error('Ошибка загрузки администратора');
            navigate('/admin/admins');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const submitData: any = {
                fullName: formData.fullName,
                mail: formData.mail,
                phone: formData.phone,
                role: formData.role,
                status: formData.status,
            };

            // Пароль добавляем только если он указан (при создании или изменении)
            if (formData.password && formData.password.trim() !== '') {
                submitData.password = formData.password;
            }

            if (id) {
                await api.put(`/api/admin/${id}`, submitData);
                toast.success('Администратор обновлен');
            } else {
                const response = await api.post('/api/admin/create', submitData);
                toast.success('Администратор создан');
                // Если был сгенерирован пароль, показываем его
                if (response.data.generatedPassword) {
                    toast.info(`Сгенерированный пароль: ${response.data.generatedPassword}`, {
                        autoClose: 10000,
                    });
                }
            }
            navigate('/admin/admins');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Ошибка сохранения';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Заголовок с кнопкой назад */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/admins')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {id ? 'Редактировать администратора' : 'Создать администратора'}
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
                            required
                        />

                        <MyInput
                            label="Email"
                            type="email"
                            value={formData.mail}
                            onChange={(e) => setFormData({ ...formData, mail: e.target.value })}
                            placeholder="Введите email"
                            required
                        />

                        <MyInput
                            label="Телефон"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+7 (___) ___-__-__"
                            required
                        />

                        {/* Роль */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Роль</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="admin">Администратор</option>
                                <option value="content_manager">Контент-менеджер</option>
                                <option value="client_manager">Клиент-менеджер</option>
                            </select>
                        </div>

                        {/* Статус */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Статус</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="active">Активен</option>
                                <option value="inactive">Неактивен</option>
                            </select>
                        </div>

                        {/* Пароль */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Пароль
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder={id ? "Оставьте пустым, чтобы не менять пароль" : "Оставьте пустым для автогенерации"}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {id && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Оставьте поле пустым, чтобы не изменять пароль
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Сохранение...' : (id ? 'Сохранить изменения' : 'Создать администратора')}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/admins')}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

