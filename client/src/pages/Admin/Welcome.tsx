import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const WelcomeAdmin = () => {
    const navigate = useNavigate();
    const [welcomes, setWelcomes] = useState([]);

    useEffect(() => {
        fetchWelcomes();
    }, []);

    const fetchWelcomes = async () => {
        try {
            const response = await api.get('/api/welcome');
            setWelcomes(response.data.data);
        } catch (error: any) {
            toast.error('Ошибка загрузки контентов приветствия');
        }
    };

    const handleCreate = () => {
        navigate('/admin/welcome/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/welcome/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить этот контент приветствия?')) return;

        try {
            await api.delete(`/api/welcome/${item._id}`);
            toast.success('Контент приветствия удален');
            fetchWelcomes();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'title', label: 'Заголовок' },
        { 
            key: 'content', 
            label: 'Контент',
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
                    <h1 className="text-3xl font-bold text-gray-900">Контент на главной странице</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить контент
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={welcomes}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};
