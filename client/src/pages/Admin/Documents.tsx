import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const DocumentsAdmin = () => {
    const navigate = useNavigate();
    const [docs, setDocs] = useState<any[]>([]);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/api/documents');
            setDocs(response.data?.data || []);
        } catch (error: any) {
            toast.error('Ошибка загрузки документов');
            setDocs([]);
        }
    };

    const handleCreate = () => {
        navigate('/admin/documents/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/documents/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить этот документ?')) return;

        try {
            await api.delete(`/api/documents/${item._id}`);
            toast.success('Документ удален');
            fetchDocuments();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'title', label: 'Название' },
        {
            key: 'link',
            label: 'Ссылка',
            render: (value: string) => (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-xs block"
                >
                    {value}
                </a>
            ),
        },
        {
            key: 'createdAt',
            label: 'Создан',
            render: (value: string) => new Date(value).toLocaleDateString('ru-RU'),
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Документы</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить документ
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={docs}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};
