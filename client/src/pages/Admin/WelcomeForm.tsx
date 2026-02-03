import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ImageUpload } from '../../components/Admin/ImageUpload';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const WelcomeForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        image: '',
        content: '',
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchWelcome();
        }
    }, [id]);

    const fetchWelcome = async () => {
        try {
            const response = await api.get(`/api/welcome/${id}`);
            const welcome = response.data.data;
            setFormData({
                title: welcome.title || '',
                image: welcome.image || '',
                content: welcome.content || '',
            });
        } catch (error: any) {
            toast.error('Ошибка загрузки контента приветствия');
            navigate('/admin/welcome');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/api/welcome/${id}`, formData);
                toast.success('Контент приветствия обновлен');
            } else {
                await api.post('/api/welcome', formData);
                toast.success('Контент приветствия создан');
            }
            navigate('/admin/welcome');
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
                        onClick={() => navigate('/admin/welcome')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к контенту приветствия
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать контент приветствия' : 'Создать контент приветствия'}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <MyInput
                            label="Заголовок"
                            type="text"
                            value={formData.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Введите заголовок"
                            required
                        />

                        <ImageUpload
                            value={formData.image}
                            onChange={(url: string) => setFormData({ ...formData, image: url })}
                            label="Изображение"
                        />

                        <div>
                            <label className="block text-sm font-medium mb-2">Контент</label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(value) => setFormData({ ...formData, content: value })}
                                placeholder="Введите контент"
                                height="400px"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/welcome')}
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
