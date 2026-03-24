import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const LevelForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        level: 0,
        mainContent: '',
        content: '',
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchLevel();
        }
    }, [id]);

    const fetchLevel = async () => {
        try {
            const response = await api.get(`/api/levels/${id}`);
            const row = response.data.data;
            setFormData({
                title: row.title || '',
                level: typeof row.level === 'number' ? row.level : 0,
                mainContent: row.mainContent || '',
                content: row.content || '',
            });
        } catch (error) {
            toast.error('Ошибка загрузки уровня');
            navigate('/admin/levels');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                title: formData.title.trim(),
                level: formData.level,
                mainContent: formData.mainContent,
                content: formData.content,
            };
            if (isEdit) {
                await api.put(`/api/levels/${id}`, payload);
                toast.success('Уровень обновлён');
            } else {
                await api.post('/api/levels', payload);
                toast.success('Уровень создан');
            }
            navigate('/admin/levels');
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
                        type="button"
                        onClick={() => navigate('/admin/levels')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к списку
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать уровень' : 'Добавить уровень'}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <MyInput
                                label="Заголовок (после «Твой уровень —»)"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Например: Первый шаг"
                                required
                            />
                            <MyInput
                                label="Номер уровня (0–6)"
                                type="text"
                                value={formData.level.toString()}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        level: Math.min(6, Math.max(0, parseInt(e.target.value, 10) || 0)),
                                    })
                                }
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Основной блок (mainContent)</label>
                            <RichTextEditor
                                value={formData.mainContent}
                                onChange={(value) => setFormData({ ...formData, mainContent: value })}
                                placeholder="Текст под заголовком уровня"
                                height="280px"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Дополнительный контент (content)</label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(value) => setFormData({ ...formData, content: value })}
                                placeholder="Дополнительный текст"
                                height="280px"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/levels')}
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
