import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

export const AboutClubAdmin = () => {
    const navigate = useNavigate();
    const [aboutClubs, setAboutClubs] = useState([]);

    useEffect(() => {
        fetchAboutClubs();
    }, []);

    const fetchAboutClubs = async () => {
        try {
            const response = await api.get('/api/about-club');
            setAboutClubs(response.data.data);
        } catch (error: any) {
            toast.error('Ошибка загрузки контентов о клубе');
        }
    };

    const handleCreate = () => {
        navigate('/admin/about-club/create');
    };

    const handleEdit = (item: any) => {
        navigate(`/admin/about-club/edit/${item._id}`);
    };

    const handleDelete = async (item: any) => {
        if (!confirm('Вы уверены, что хотите удалить этот контент о клубе?')) return;

        try {
            await api.delete(`/api/about-club/${item._id}`);
            toast.success('Контент о клубе удален');
            fetchAboutClubs();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'title', label: 'Заголовок' },
        { 
            key: 'content', 
            label: 'Контент',
            render: (value: string) => (
                <div 
                    className="max-w-xs truncate" 
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            )
        },
        { 
            key: 'list', 
            label: 'Элементов в списке',
            render: (value: any[]) => value ? value.length : 0
        },
        { 
            key: 'createdAt', 
            label: 'Создан',
            render: (value: string) => new Date(value).toLocaleDateString('ru-RU')
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Контент на странице "О клубе Tochka.li"</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить контент
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={aboutClubs}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};
