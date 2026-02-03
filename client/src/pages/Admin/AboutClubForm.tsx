import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ImageUpload } from '../../components/Admin/ImageUpload';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

interface ListItem {
    title: string;
    content: string;
}

export const AboutClubForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        image: '',
        content: '',
        list: [] as ListItem[],
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchAboutClub();
        }
    }, [id]);

    const fetchAboutClub = async () => {
        try {
            const response = await api.get(`/api/about-club/${id}`);
            const aboutClub = response.data.data;
            setFormData({
                title: aboutClub.title || '',
                image: aboutClub.image || '',
                content: aboutClub.content || '',
                list: aboutClub.list || [],
            });
        } catch (error: any) {
            toast.error('Ошибка загрузки контента о клубе');
            navigate('/admin/about-club');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/api/about-club/${id}`, formData);
                toast.success('Контент о клубе обновлен');
            } else {
                await api.post('/api/about-club', formData);
                toast.success('Контент о клубе создан');
            }
            navigate('/admin/about-club');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    const handleListItemChange = (index: number, field: 'title' | 'content', value: string) => {
        setFormData(prev => {
            const newList = [...prev.list];
            newList[index] = { ...newList[index], [field]: value };
            return { ...prev, list: newList };
        });
    };

    const addListItem = () => {
        setFormData(prev => ({
            ...prev,
            list: [...prev.list, { title: '', content: '' }]
        }));
    };

    const removeListItem = (index: number) => {
        setFormData(prev => {
            const newList = [...prev.list];
            newList.splice(index, 1);
            return { ...prev, list: newList };
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/about-club')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к контенту о клубе
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать контент о клубе' : 'Создать контент о клубе'}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <MyInput
                            label="Заголовок"
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

                        {/* Список элементов */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium">Список элементов</label>
                                <button
                                    type="button"
                                    onClick={addListItem}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={16} />
                                    Добавить элемент
                                </button>
                            </div>

                            <div className="space-y-4">
                                {formData.list.map((item, index) => (
                                    <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                Элемент {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeListItem(index)}
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
                                                onChange={(e) => handleListItemChange(index, 'title', e.target.value)}
                                                placeholder="Введите заголовок"
                                            />

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Содержание</label>
                                                <RichTextEditor
                                                    value={item.content}
                                                    onChange={(value) => handleListItemChange(index, 'content', value)}
                                                    placeholder="Введите содержание"
                                                    height="200px"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {formData.list.length === 0 && (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                        Нет элементов в списке. Нажмите "Добавить элемент" чтобы начать.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/about-club')}
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
