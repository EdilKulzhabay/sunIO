import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const ActivationLinksAdmin = () => {
    const navigate = useNavigate();
    const [links, setLinks] = useState<any[]>([]);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const response = await api.get('/api/activation-link');
            const data = response.data?.list ?? response.data?.data ?? response.data;
            setLinks(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Ошибка загрузки ссылок активации:', error);
            toast.error('Ошибка загрузки ссылок активации');
            setLinks([]);
        }
    };

    const handleCreate = () => {
        navigate('/admin/activation-links/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/activation-links/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm(`Удалить ссылку "${item.title}"?`)) return;

        try {
            await api.delete(`/api/activation-link/${item._id}`);
            toast.success('Ссылка удалена');
            fetchLinks();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'title', label: 'Название' },
        {
            key: 'linkType',
            label: 'Тип',
            render: (value: string) => (value === 'internal' ? 'Внутренняя' : 'Внешняя'),
        },
        {
            key: 'link',
            label: 'Ссылка',
            render: (value: string, row: any) =>
                row.linkType === 'internal' ? (
                    <span className="max-w-xs truncate block">{value}</span>
                ) : (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline max-w-xs truncate block"
                    >
                        {value}
                    </a>
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
                    <h1 className="text-3xl font-bold text-gray-900">Ссылки активации</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить ссылку
                    </button>
                </div>
                <p className="text-gray-600">
                    Доступные типы: Активация тела, Активация здоровья, Активация Рода, Пробуждение Духа
                </p>
                <AdminTable
                    columns={columns}
                    data={links}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};
