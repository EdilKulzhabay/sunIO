import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Plus } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';

interface BotTrafficSource {
    _id: string;
    title: string;
    botParameter: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export const BotTrafficSourcesAdmin = () => {
    const navigate = useNavigate();
    const [sources, setSources] = useState<BotTrafficSource[]>([]);

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const response = await api.get('/api/bot-traffic-sources');
            const list = response.data.data.sort((a: any, b: any) => a.title.localeCompare(b.title));
            setSources(list);
        } catch (error: any) {
            toast.error('Ошибка загрузки источников трафика');
        }
    };

    const handleCreate = () => {
        navigate('/admin/bot-traffic-sources/create');
    };

    const handleEdit = (item: BotTrafficSource) => {
        navigate(`/admin/bot-traffic-sources/edit/${item._id}`);
    };

    const handleDelete = async (item: BotTrafficSource) => {
        if (!confirm('Вы уверены, что хотите удалить этот источник трафика?')) return;

        try {
            await api.delete(`/api/bot-traffic-sources/${item._id}`);
            toast.success('Источник трафика удалён');
            fetchSources();
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const columns = [
        { key: 'title', label: 'Название' },
        { key: 'botParameter', label: 'botParameter' },
        {
            key: 'createdAt',
            label: 'Создан',
            render: (value: string) => new Date(value).toLocaleDateString('ru-RU'),
        },
        {
            key: 'link',
            label: 'Ссылка для рекламы',
            render: (_: unknown, item: BotTrafficSource) => {
                const link = `https://t.me/io_sun_bot?start=${item.botParameter}`;
                const copyLink = () => {
                    navigator.clipboard
                        .writeText(link)
                        .then(() => toast.success('Ссылка скопирована'))
                        .catch(() => toast.error('Не удалось скопировать ссылку'));
                };
                return (
                    <button
                        type="button"
                        onClick={copyLink}
                        className="text-blue-600 hover:underline text-sm"
                    >
                        Скопировать ссылку
                    </button>
                );
            },
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Источники трафика бота</h1>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Добавить источник
                    </button>
                </div>

                <AdminTable
                    columns={columns}
                    data={sources}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
        </AdminLayout>
    );
};

