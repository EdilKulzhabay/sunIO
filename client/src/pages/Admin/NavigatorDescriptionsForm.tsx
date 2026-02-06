import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

interface ContentItem {
    title: string;
    description: string;
}

export const NavigatorDescriptionsForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        description: '',
        content: [] as ContentItem[],
        link: '',
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchNavigatorDescription();
        }
    }, [id]);

    const fetchNavigatorDescription = async () => {
        try {
            if (id) {
                const response = await api.get(`/api/navigator-descriptions/${id}`);
                const data = response.data.data;
                if (data) {
                    setFormData({
                        name: data.name || '',
                        title: data.title || '',
                        description: data.description || '',
                        content: data.content || [],
                        link: data.link || '',
                    });
                } else {
                    toast.error('Запись не найдена');
                    navigate('/admin/navigator-descriptions');
                }
            }
        } catch (error: any) {
            toast.error('Ошибка загрузки данных');
            navigate('/admin/navigator-descriptions');
        }
    };

    const handleContentItemChange = (index: number, field: 'title' | 'description', value: string) => {
        setFormData(prev => {
            const newContent = [...prev.content];
            newContent[index] = { ...newContent[index], [field]: value };
            return { ...prev, content: newContent };
        });
    };

    const addContentItem = () => {
        setFormData(prev => ({
            ...prev,
            content: [...prev.content, { title: '', description: '' }]
        }));
    };

    const removeContentItem = (index: number) => {
        setFormData(prev => {
            const newContent = [...prev.content];
            newContent.splice(index, 1);
            return { ...prev, content: newContent };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit && id) {
                await api.put(`/api/navigator-descriptions/${id}`, formData);
                toast.success('Запись обновлена');
            } else {
                await api.post('/api/navigator-descriptions', formData);
                toast.success('Запись создана');
            }
            navigate('/admin/navigator-descriptions');
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
                        onClick={() => navigate('/admin/navigator-descriptions')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к описаниям навигатора
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать описание' : 'Создать описание'} - Навигатор
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <MyInput
                            label="Название (name)"
                            type="text"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Введите название (уникальный идентификатор)"
                            required
                        />

                        <MyInput
                            label="Заголовок"
                            type="text"
                            value={formData.title}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Введите заголовок"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium mb-2">Описание</label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                                placeholder="Введите описание"
                                height="200px"
                            />
                        </div>

                        <MyInput
                            label="Ссылка"
                            type="text"
                            value={formData.link}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="Введите ссылку"
                            required
                        />

                        {/* Список элементов контента */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium">Элементы контента</label>
                                <button
                                    type="button"
                                    onClick={addContentItem}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={16} />
                                    Добавить элемент
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.content.map((item, index) => (
                                    <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Элемент {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeContentItem(index)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            <MyInput
                                                label="Заголовок элемента"
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => handleContentItemChange(index, 'title', e.target.value)}
                                                placeholder="Введите заголовок"
                                                required
                                            />

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Описание элемента</label>
                                                <RichTextEditor
                                                    value={item.description}
                                                    onChange={(value) => handleContentItemChange(index, 'description', value)}
                                                    placeholder="Введите описание"
                                                    height="150px"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {formData.content.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                        Нет элементов в списке. Нажмите "Добавить элемент" чтобы начать.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/navigator-descriptions')}
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
