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

    const dateToLocalDateTime = (date: Date | string): string => {
        const d = typeof date === 'string' ? new Date(date) : date;
        // Конвертируем UTC в Asia/Almaty (UTC+6)
        const localDate = new Date(d.getTime() + (6 * 60 * 60 * 1000)); // Добавляем 6 часов
        const year = localDate.getUTCFullYear();
        const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(localDate.getUTCDate()).padStart(2, '0');
        const hours = String(localDate.getUTCHours()).padStart(2, '0');
        const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

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
            render: (value: string) => new Date(dateToLocalDateTime(value)).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        { 
            key: 'endDate', 
            label: 'Дата окончания',
            render: (value: string) => new Date(dateToLocalDateTime(value)).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
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

