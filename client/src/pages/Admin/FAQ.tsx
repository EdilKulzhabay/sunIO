import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const FAQAdmin = () => {
    const navigate = useNavigate();
    const [faqs, setFaqs] = useState<any[]>([]);

    useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        try {
            const response = await api.get('/api/faq');
            // FAQController возвращает { success: true, list: faqs, count: faqs.length }
            if (response.data && Array.isArray(response.data.list)) {
                setFaqs(response.data.list);
            } else if (response.data && Array.isArray(response.data.data)) {
                setFaqs(response.data.data);
            } else if (Array.isArray(response.data)) {
                setFaqs(response.data);
            } else {
                setFaqs([]);
                console.error('Неожиданный формат данных:', response.data);
            }
        } catch (error: any) {
            console.error('Ошибка загрузки FAQ:', error);
            toast.error('Ошибка загрузки FAQ');
            setFaqs([]);
        }
    };

    const handleCreate = () => {
        navigate('/admin/faq/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/faq/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить этот FAQ?')) return;

        try {
            await api.delete(`/api/faq/${item._id}`);
            toast.success('FAQ удален');
            fetchFAQs();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { 
            key: 'order', 
            label: 'Порядок',
            render: (value: number) => value || 0
        },
        { key: 'question', label: 'Вопрос' },
        { 
            key: 'answer', 
            label: 'Ответ',
            render: (value: string) => (
                <div 
                    className="max-w-xs truncate" 
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            )
        },
        { 
            key: 'createdAt', 
            label: 'Создан',
            render: (value: string) => new Date(value).toLocaleDateString('ru-RU')
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">FAQ</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить FAQ
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={faqs}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};

