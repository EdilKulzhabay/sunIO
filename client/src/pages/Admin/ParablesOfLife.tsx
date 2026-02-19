import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const ParablesOfLifeAdmin = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/api/parables-of-life?admin=1');
            setItems(response.data.data);
        } catch (error: any) {
            toast.error('Ошибка загрузки притч');
        }
    };

    const handleCreate = () => {
        navigate('/admin/parables-of-life/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/parables-of-life/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить эту притчу?')) return;

        try {
            await api.delete(`/api/parables-of-life/${item._id}`);
            toast.success('Притча удалена');
            fetchItems();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const accessTypeLabels: Record<string, string> = { free: 'Бесплатно', paid: 'Платно', subscription: 'Подписка', stars: 'Баллы' };
    const columns = [
        { key: 'title', label: 'Название' },
        { key: 'order', label: 'Порядок' },
        { key: 'accessType', label: 'Доступ', render: (v: string) => accessTypeLabels[v] || v },
        { key: 'visibility', label: 'Видимость', render: (v: boolean) => v !== false ? 'Да' : 'Нет' },
        { key: 'allowRepeatBonus', label: 'Повторные баллы', render: (value: boolean) => value ? 'Да' : 'Нет' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Притчи о жизни</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить притчу
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};
