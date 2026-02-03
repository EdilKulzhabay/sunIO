import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const ScheduleAdmin = () => {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/api/schedule');
            setSchedules(response.data.data);
        } catch (error: any) {
            toast.error('Ошибка загрузки расписания');
        }
    };

    const handleCreate = () => {
        navigate('/admin/schedule/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/schedule/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить это событие?')) return;

        try {
            await api.delete(`/api/schedule/${item._id}`);
            toast.success('Событие удалено');
            fetchSchedules();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'eventTitle', label: 'Название события' },
        { key: 'priority', label: 'Приоритет', render: (value: boolean) => value ? 'Да' : 'Нет' },
        { 
            key: 'startDate', 
            label: 'Дата начала',
            render: (value: string) => new Date(value).toLocaleString('ru-RU')
        },
        { 
            key: 'endDate', 
            label: 'Дата окончания',
            render: (value: string) => new Date(value).toLocaleString('ru-RU')
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Расписание</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить событие
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={schedules}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};

