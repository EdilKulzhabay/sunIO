import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const AssignmentsAdmin = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/api/assignments');
            const data = response.data?.data ?? response.data?.list ?? [];
            setItems(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error(error);
            toast.error('Ошибка загрузки заданий');
            setItems([]);
        }
    };

    const handleCreate = () => navigate('/admin/assignments/create');
    const handleEdit = (item: any) => navigate(`/admin/assignments/edit/${item._id}`);

    const handleDelete = async (item: any) => {
        if (!confirm('Удалить это задание и прогресс пользователей по нему?')) return;
        try {
            await api.delete(`/api/assignments/${item._id}`);
            toast.success('Удалено');
            fetchItems();
        } catch {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        {
            key: 'order',
            label: '№',
            render: (value: unknown) => (value !== undefined && value !== null ? String(value) : '0'),
        },
        { key: 'request', label: 'Запрос' },
        {
            key: 'steps',
            label: 'Шагов',
            render: (_: unknown, row: any) => row?.steps?.length ?? 0,
        },
        {
            key: 'updatedAt',
            label: 'Обновлено',
            render: (value: string) => (value ? new Date(value).toLocaleString('ru-RU') : '—'),
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Задания</h1>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить задание
                    </button>
                </div>

                <p className="text-sm text-gray-600">
                    Шаги со ссылками на контент с видео автоматически отмечаются при прогрессе просмотра &gt; 80%.
                </p>

                <AdminTable columns={columns} data={items} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
        </AdminLayout>
    );
};
