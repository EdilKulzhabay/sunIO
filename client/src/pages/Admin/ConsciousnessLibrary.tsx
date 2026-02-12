import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const ConsciousnessLibraryAdmin = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        try { const response = await api.get('/api/consciousness-library?admin=1'); setItems(response.data.data); }
        catch (error: any) { toast.error('Ошибка загрузки данных'); }
    };

    const handleCreate = () => { navigate('/admin/consciousness-library/create'); };
    const handleEdit = (item: any) => { navigate(`/admin/consciousness-library/edit/${item._id}`); };
    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
        try { await api.delete(`/api/consciousness-library/${item._id}`); toast.success('Запись удалена'); fetchItems(); }
        catch (error: any) { toast.error('Ошибка удаления'); }
    };

    const columns = [
        { key: 'title', label: 'Название' },
        { key: 'order', label: 'Порядок' },
        { key: 'accessType', label: 'Доступ' },
        { key: 'allowRepeatBonus', label: 'Повторные баллы', render: (value: boolean) => value ? 'Да' : 'Нет' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Библиотека сознания</h1>
                    <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Plus size={20} />Добавить запись</button>
                </div>
                <AdminTable columns={columns} data={items} onEdit={handleEdit} onDelete={handleDelete} />
            </div>
        </AdminLayout>
    );
};
