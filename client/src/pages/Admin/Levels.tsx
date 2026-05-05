import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const LevelsAdmin = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        fetchLevels();
    }, []);

    const fetchLevels = async () => {
        try {
            const response = await api.get('/api/levels');
            const data = response.data?.data ?? response.data?.list ?? [];
            setItems(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error(error);
            toast.error('Ошибка загрузки уровней');
            setItems([]);
        }
    };

    const handleCreate = () => {
        navigate('/admin/levels/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/levels/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Удалить этот уровень?')) return;
        try {
            await api.delete(`/api/levels/${item._id}`);
            toast.success('Уровень удалён');
            fetchLevels();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'level', label: 'Номер (0–6)' },
        { key: 'title', label: 'Заголовок' },
        {
            key: 'mainContent',
            label: 'Основной блок',
            render: (value: string) => (
                <div className="max-w-xs truncate" dangerouslySetInnerHTML={{ __html: value || '' }} />
            ),
        },
        {
            key: 'createdAt',
            label: 'Создан',
            render: (value: string) => (value ? new Date(value).toLocaleDateString('ru-RU') : '—'),
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Уровни мастерства</h1>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить уровень
                    </button>
                </div>

                <p className="text-sm text-gray-600">
                    Номер уровня (0–6) должен совпадать с количеством пройденных активаций тонких тел у пользователя.
                </p>

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
