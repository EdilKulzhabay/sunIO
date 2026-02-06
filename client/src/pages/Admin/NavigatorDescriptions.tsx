import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const NavigatorDescriptionsAdmin = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/api/navigator-descriptions');
            setItems(response.data.data || []);
        } catch (error: any) {
            toast.error('Ошибка загрузки данных');
            setItems([]);
        }
    };

    const handleCreate = () => {
        navigate('/admin/navigator-descriptions/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/navigator-descriptions/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;

        try {
            await api.delete(`/api/navigator-descriptions/${item._id}`);
            toast.success('Запись удалена');
            fetchItems();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'name', label: 'Название' },
        { key: 'title', label: 'Заголовок' },
        { 
            key: 'description', 
            label: 'Описание',
            render: (value: string) => (
                <div className="max-w-xs truncate">
                    {value}
                </div>
            )
        },
        { 
            key: 'content', 
            label: 'Элементов',
            render: (value: any[]) => value ? value.length : 0
        },
        { 
            key: 'link', 
            label: 'Ссылка',
            render: (value: string) => (
                <div className="max-w-xs truncate text-blue-600">
                    {value}
                </div>
            )
        },
        { 
            key: 'createdAt', 
            label: 'Создан',
            render: (value: string) => value ? new Date(value).toLocaleDateString('ru-RU') : '-'
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Описания навигатора</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить запись
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
