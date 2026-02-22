import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';
import { REDIRECT_TO_PAGE_OPTIONS } from '../../constants/redirectToPageOptions';

const ACTIVATION_TITLES = [
    'Активация тела',
    'Активация здоровья',
    'Активация Рода',
    'Пробуждение Духа',
];

const INTERNAL_PAGES = REDIRECT_TO_PAGE_OPTIONS.filter((opt) => opt.value !== '');

export const ActivationLinkForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        linkType: 'external' as 'internal' | 'external',
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchLink();
        }
    }, [id]);

    const fetchLink = async () => {
        try {
            const response = await api.get(`/api/activation-link/${id}`);
            const data = response.data.data;
            const linkType = data.linkType === 'internal' ? 'internal' : 'external';
            setFormData({
                title: data.title,
                link: data.link || '',
                linkType,
            });
        } catch (error) {
            toast.error('Ошибка загрузки ссылки');
            navigate('/admin/activation-links');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.link.trim()) {
            toast.warning('Введите ссылку');
            return;
        }
        if (!isEdit && !formData.title) {
            toast.warning('Выберите тип активации');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: formData.title,
                link: formData.link,
                linkType: formData.linkType,
            };
            if (isEdit) {
                await api.put(`/api/activation-link/${id}`, payload);
                toast.success('Ссылка обновлена');
            } else {
                if (!formData.title) {
                    toast.warning('Выберите тип активации');
                    setLoading(false);
                    return;
                }
                await api.post('/api/activation-link', payload);
                toast.success('Ссылка создана');
            }
            navigate('/admin/activation-links');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/activation-links')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к списку
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать ссылку' : 'Добавить ссылку активации'}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Тип активации
                            </label>
                            <select
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                disabled={isEdit}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">— Выберите тип —</option>
                                {ACTIVATION_TITLES.map((title) => (
                                    <option key={title} value={title}>
                                        {title}
                                    </option>
                                ))}
                            </select>
                            {isEdit && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Тип нельзя изменить при редактировании
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Тип ссылки</label>
                            <div className="flex gap-4 mb-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="linkType"
                                        value="external"
                                        checked={formData.linkType === 'external'}
                                        onChange={() => setFormData({ ...formData, linkType: 'external', link: '' })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">Внешняя (URL)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="linkType"
                                        value="internal"
                                        checked={formData.linkType === 'internal'}
                                        onChange={() => setFormData({ ...formData, linkType: 'internal', link: '' })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">Внутренняя (страница приложения)</span>
                                </label>
                            </div>
                            {formData.linkType === 'external' ? (
                                <MyInput
                                    label="Ссылка"
                                    type="url"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="https://..."
                                    required
                                />
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Страница приложения</label>
                                    <select
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                        className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                    >
                                        <option value="">— Выберите страницу —</option>
                                        {INTERNAL_PAGES.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/activation-links')}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Отмена
                            </button>
                            <MyButton
                                text={loading ? 'Сохранение...' : 'Сохранить'}
                                type="submit"
                                disabled={loading}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};
