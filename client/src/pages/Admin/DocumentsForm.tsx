import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const DocumentsForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        order: 0,
    });

    useEffect(() => {
        if (id) {
            setIsEdit(true);
            fetchDocument();
        }
    }, [id]);

    const fetchDocument = async () => {
        try {
            const response = await api.get(`/api/documents/${id}`);
            const doc = response.data.data;
            setFormData({
                title: doc.title || '',
                link: doc.link || '',
                order: doc.order ?? 0,
            });
        } catch (error) {
            toast.error('Ошибка загрузки документа');
            navigate('/admin/documents');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEdit) {
                await api.put(`/api/documents/${id}`, formData);
                toast.success('Документ обновлен');
            } else {
                await api.post('/api/documents', formData);
                toast.success('Документ создан');
            }
            navigate('/admin/documents');
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
                        onClick={() => navigate('/admin/documents')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                        Назад к списку
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Редактировать документ' : 'Добавить документ'}
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <MyInput
                            label="Название"
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Введите название"
                            required
                        />

                        <MyInput
                            label="Ссылка"
                            type="url"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="https://..."
                            required
                        />

                        <MyInput
                            label="Порядковый номер"
                            type="number"
                            value={String(formData.order)}
                            onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })}
                            placeholder="0"
                        />

                        <div className="flex gap-3 justify-end pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/documents')}
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
