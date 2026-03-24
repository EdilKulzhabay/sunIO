import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const BroadcastRecordingAdmin = () => {
    const navigate = useNavigate();
    const [recordings, setRecordings] = useState<any[]>([]);

    useEffect(() => {
        fetchRecordings();
    }, []);

    const fetchRecordings = async () => {
        try {
            const response = await api.get('/api/broadcast-recording?admin=1');
            setRecordings(response.data.data);
        } catch (error: any) {
            toast.error('Ошибка загрузки записей эфиров');
        }
    };

    const handleCreate = () => {
        navigate('/admin/broadcast-recordings/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/broadcast-recordings/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить эту запись эфира?')) return;

        try {
            await api.delete(`/api/broadcast-recording/${item._id}`);
            toast.success('Запись эфира удалена');
            fetchRecordings();
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
                    <h1 className="text-3xl font-bold text-gray-900">Записи эфиров</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить запись эфира
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={recordings}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};

