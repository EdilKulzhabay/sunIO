import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const DynamicContentForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        content: '',
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchDynamicContent();
        }
    }, [id]);

    const fetchDynamicContent = async () => {
        try {
            const response = await api.get(`/api/dynamic-content/${id}`);
            const dynamicContent = response.data.data;
            setFormData({
                name: dynamicContent.name,
                content: dynamicContent.content,
            });
        } catch (error: any) {
            toast.error('Ошибка загрузки динамического контента');
            navigate('/admin/dynamic-content');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/api/dynamic-content/${id}`, formData);
                toast.success('Динамический контент обновлен');
            } else {
                await api.post('/api/dynamic-content', formData);
                toast.success('Динамический контент создан');
            }
            navigate('/admin/dynamic-content');
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
                        onClick={() => navigate('/admin/dynamic-content')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к динамическому контенту
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать динамический контент' : 'Создать динамический контент'}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <MyInput
                            label="Название"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Введите название"
                            required
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
                                onClick={() => navigate('/admin/dynamic-content')}
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

