import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import api from '../../api';
import { toast } from 'react-toastify';

interface FormData {
    title: string;
    botParameter: string;
    description: string;
    isActive: boolean;
}

export const BotTrafficSourceForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<FormData>({
        title: '',
        botParameter: '',
        description: '',
        isActive: true,
    });

    useEffect(() => {
        if (isEdit) {
            fetchSource();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchSource = async () => {
        try {
            const response = await api.get(`/api/bot-traffic-sources/${id}`);
            const data = response.data.data;
            setFormData({
                title: data.title,
                botParameter: data.botParameter,
                description: data.description || '',
                isActive: data.isActive,
            });
        } catch (error: any) {
            toast.error('Ошибка загрузки источника трафика');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, type } = e.target;
        const value = type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (isEdit) {
                await api.put(`/api/bot-traffic-sources/${id}`, formData);
                toast.success('Источник трафика обновлён');
            } else {
                await api.post('/api/bot-traffic-sources', formData);
                toast.success('Источник трафика создан');
            }
            navigate('/admin/bot-traffic-sources');
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Ошибка сохранения';
            toast.error(message);
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать источник трафика' : 'Создать источник трафика'}
                    </h1>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/bot-traffic-sources')}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Назад
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Название</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Реклама с YouTube"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">botParameter</label>
                        <input
                            type="text"
                            name="botParameter"
                            value={formData.botParameter}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="youtube"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Это значение будет использовано в ссылке вида: t.me/io_sun_bot?start=&lt;botParameter&gt;
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Описание (необязательно)</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Где именно размещена реклама, дополнительные заметки"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            id="isActive"
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm text-gray-700">
                            Активный источник (можно использовать в кампаниях)
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/bot-traffic-sources')}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            {isEdit ? 'Сохранить' : 'Создать'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
};

