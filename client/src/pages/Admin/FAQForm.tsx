import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { RichTextEditor } from '../../components/Admin/RichTextEditor';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const FAQForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        order: 0,
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchFAQ();
        }
    }, [id]);

    const fetchFAQ = async () => {
        try {
            const response = await api.get(`/api/faq/${id}`);
            const faq = response.data.data;
            setFormData({
                question: faq.question,
                answer: faq.answer,
                order: faq.order || 0,
            });
        } catch (error) {
            toast.error('Ошибка загрузки FAQ');
            navigate('/admin/faq');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/api/faq/${id}`, formData);
                toast.success('FAQ обновлен');
            } else {
                await api.post('/api/faq', formData);
                toast.success('FAQ создан');
            }
            navigate('/admin/faq');
        } catch (error) {
            toast.error('Ошибка сохранения');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/faq')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к списку
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать вопрос' : 'Добавить вопрос'}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <MyInput
                                label="Вопрос"
                                type="text"
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                placeholder="Введите вопрос"
                                required
                            />

                            <MyInput
                                label="Порядок отображения"
                                type="text"
                                value={formData.order.toString()}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Ответ</label>
                            <RichTextEditor
                                value={formData.answer}
                                onChange={(value) => setFormData({ ...formData, answer: value })}
                                placeholder="Введите ответ"
                                height="400px"
                            />
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/faq')}
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
