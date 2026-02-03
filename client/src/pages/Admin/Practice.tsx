import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const PracticeAdmin = () => {
    const navigate = useNavigate();
    const [practices, setPractices] = useState([]);

    useEffect(() => {
        fetchPractices();
    }, []);

    const fetchPractices = async () => {
        try {
            const response = await api.get('/api/practice');
            setPractices(response.data.data);
        } catch (error: any) {
            toast.error('Ошибка загрузки практик');
        }
    };

    const handleCreate = () => {
        navigate('/admin/practice/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/practice/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить эту практику?')) return;

        try {
            await api.delete(`/api/practice/${item._id}`);
            toast.success('Практика удалена');
            fetchPractices();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'title', label: 'Название' },
        { key: 'order', label: 'Порядок' },
        { key: 'accessType', label: 'Доступ' },
        { 
            key: 'allowRepeatBonus', 
            label: 'Повторные звёзды',
            render: (value: boolean) => value ? 'Да' : 'Нет'
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Практики</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить практику
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={practices}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};

