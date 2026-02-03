import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { AdminTable } from '../../components/Admin/AdminTable';
import { Search, ArrowUpDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface User {
    _id: string;
    fullName?: string;
    telegramUserName?: string;
    phone?: string;
    mail?: string;
    role: string;
    status: string;
    isBlocked?: boolean;
    bonus?: number;
    subscriptionEndDate?: string;
    createdAt: string;
    userNumber?: number; // Номер пользователя
    lastActiveDate?: string;
}

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export const UsersAdmin = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [lastActiveFilter, setLastActiveFilter] = useState<string>('all');
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const limit = 100;

    // Сбрасываем страницу при изменении фильтров/сортировки
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, lastActiveFilter, sortField, sortDirection, searchQuery]);

    // Загружаем данные при изменении страницы или параметров
    useEffect(() => {
        fetchUsers(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, statusFilter, lastActiveFilter, sortField, sortDirection, searchQuery]);

    const fetchUsers = async (page: number = 1) => {
        setLoading(true);
        try {
            const params: any = {
                page,
                limit,
            };

            // Добавляем параметры фильтрации
            if (statusFilter !== 'all') {
                params.statusFilter = statusFilter;
            }
            if (lastActiveFilter !== 'all') {
                params.lastActiveFilter = lastActiveFilter;
            }

            // Добавляем параметры поиска
            if (searchQuery.trim()) {
                params.searchQuery = searchQuery.trim();
            }

            // Добавляем параметры сортировки
            if (sortField) {
                params.sortField = sortField;
                params.sortDirection = sortDirection;
            }

            const response = await api.get('/api/user/all', { params });
            setUsers(response.data.data);
            setPagination(response.data.pagination);
        } catch (error: any) {
            toast.error('Ошибка загрузки пользователей');
        } finally {
            setLoading(false);
        }
    };

    // Фильтрация и сортировка теперь выполняются на сервере
    // Оставляем только для отображения (на случай если нужна дополнительная клиентская обработка)
    const filteredAndSortedUsers = users;

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleOpenForm = (item?: any) => {
        if (item) {
            navigate(`/admin/users/edit/${item._id}`);
        } else {
            navigate('/admin/users/create');
        }
    };

    const handleDelete = async (item: any) => {
        if (!confirm(`Вы уверены, что хотите удалить пользователя ${item.fullName}?`)) return;

        try {
            await api.delete(`/api/user/${item._id}`);
            toast.success('Пользователь удален');
            // Если на текущей странице остался только один пользователь и это не первая страница, переходим на предыдущую
            if (users.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchUsers(currentPage);
            }
        } catch (error: any) {
            toast.error('Ошибка удаления');
        }
    };

    const handleExportToExcel = async () => {
        try {
            const response = await api.get('/api/user/export/excel', {
                responseType: 'blob', // Важно для скачивания файла
            });

            // Создаем URL для blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Получаем имя файла из заголовка Content-Disposition или используем дефолтное
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'users_export.xlsx';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (fileNameMatch && fileNameMatch[1]) {
                    fileName = fileNameMatch[1].replace(/['"]/g, '');
                    // Декодируем URI компонент если нужно
                    try {
                        fileName = decodeURIComponent(fileName);
                    } catch (e) {
                        // Если не удалось декодировать, используем как есть
                    }
                }
            }
            
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Файл успешно скачан');
        } catch (error: any) {
            console.error('Ошибка экспорта:', error);
            toast.error('Ошибка экспорта пользователей в Excel');
        }
    };

    const columns = [
        { 
            key: 'userNumber', 
            label: '№',
            render: (value: number) => value || '-'
        },
        { key: 'fullName', label: 'Полное имя' },
        { key: 'telegramUserName', label: 'TG Имя' },
        { key: 'mail', label: 'Email' },
        { key: 'phone', label: 'Телефон' },
        // { 
        //     key: 'role', 
        //     label: 'Роль',
        //     render: (value: string) => {
        //         const roleLabels: { [key: string]: string } = {
        //             'user': 'Пользователь',
        //             'admin': 'Администратор',
        //             'content_manager': 'Контент-менеджер',
        //             'client_manager': 'Менеджер по клиентам',
        //             'manager': 'Менеджер'
        //         };
        //         const roleColors: { [key: string]: string } = {
        //             'user': 'bg-gray-100 text-gray-700',
        //             'admin': 'bg-purple-100 text-purple-700',
        //             'content_manager': 'bg-blue-100 text-blue-700',
        //             'client_manager': 'bg-green-100 text-green-700',
        //             'manager': 'bg-yellow-100 text-yellow-700'
        //         };
        //         return (
        //             <span className={`px-2 py-1 rounded text-xs ${roleColors[value] || 'bg-gray-100 text-gray-700'}`}>
        //                 {roleLabels[value] || value}
        //             </span>
        //         );
        //     }
        // },
        { 
            key: 'status', 
            label: 'Статус',
            render: (value: string, row: any) => {
                // Если пользователь заблокирован, показываем статус "Заблокирован"
                if (row.isBlocked) {
                    return (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                            Заблокирован
                        </span>
                    );
                }
                // Иначе показываем обычный статус
                return (
                    <span className={`px-2 py-1 rounded text-xs ${
                        value === 'anonym' ? 'bg-red-100 text-red-700' : value === 'guest' ? 'bg-gray-100 text-gray-700' : value === 'registered' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                        {value === 'anonym' ? 'Аноним' : value === 'guest' ? 'Гость' : value === 'registered' ? 'Зарегистрирован' : 'Клиент'}
                    </span>
                );
            }
        },
        { 
            key: 'bonus', 
            label: 'Звёзды',
            sortable: true
        },
        { 
            key: 'inviteesCount', 
            label: 'РЕФЕРАЛЫ',
            sortable: true,
            render: (value: number) => {
                return value || 0;
            }
        },
        { 
            key: 'subscriptionEndDate', 
            label: 'Подписка до',
            sortable: true,
            render: (value: string) => {
                if (!value) return 'Нет подписки';
                const date = new Date(value);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
            }
        },
        { 
            key: 'lastActiveDate', 
            label: 'Дата последней активности',
            render: (value: string) => {
                if (!value) return 'Нет активности';
                const date = new Date(value);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minute = String(date.getMinutes()).padStart(2, '0');
                return `${day}-${month}-${year} ${hours}:${minute}`;
            }
        },
        { 
            key: 'createdAt', 
            label: 'Дата регистрации',
            render: (value: string) => new Date(value).toLocaleDateString('ru-RU')
        },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
                        <p className="text-gray-600 mt-1">
                            {pagination ? (
                                <>
                                    Всего пользователей: {pagination.totalUsers}
                                    {' | '}
                                    Страница {pagination.currentPage} из {pagination.totalPages}
                                </>
                            ) : (
                                `Всего пользователей: ${users.length}`
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportToExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Download size={20} />
                            Выгрузить в Excel
                        </button>
                        {/* <button
                            onClick={() => handleOpenForm()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={20} />
                            Создать пользователя
                        </button> */}
                    </div>
                </div>

                {/* Фильтры и поиск */}
                <div className="bg-white p-4 rounded-lg shadow space-y-4">
                    {/* Поиск */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Поиск по имени, TG имени, телефону, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Фильтры */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Фильтр по статусу */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Статус
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Все статусы</option>
                                <option value="anonym">Аноним</option>
                                <option value="guest">Гость</option>
                                <option value="registered">Зарегистрирован</option>
                                <option value="client">Клиент</option>
                                <option value="blocked">Заблокирован</option>
                            </select>
                        </div>

                        {/* Фильтр по активности */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Активность
                            </label>
                            <select
                                value={lastActiveFilter}
                                onChange={(e) => setLastActiveFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Все</option>
                                <option value="active">Активные (в течение 15 дней)</option>
                                <option value="inactive">Неактивные (больше 15 дней)</option>
                            </select>
                        </div>

                        {/* Фильтр по роли */}
                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Роль
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Все роли</option>
                                <option value="user">Пользователь</option>
                                <option value="admin">Администратор</option>
                                <option value="content_manager">Контент-менеджер</option>
                                <option value="client_manager">Менеджер по клиентам</option>
                            </select>
                        </div> */}
                    </div>

                    {/* Сортировка */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">Сортировка:</span>
                        <button
                            onClick={() => handleSort('bonus')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                sortField === 'bonus' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <ArrowUpDown size={16} />
                            Звёзды
                            {sortField === 'bonus' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                        </button>
                        <button
                            onClick={() => handleSort('subscriptionEndDate')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                sortField === 'subscriptionEndDate' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <ArrowUpDown size={16} />
                            Подписка до
                            {sortField === 'subscriptionEndDate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                        </button>
                        <button
                            onClick={() => handleSort('inviteesCount')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                sortField === 'inviteesCount' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <ArrowUpDown size={16} />
                            Рефералы
                            {sortField === 'inviteesCount' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                        </button>
                        <button
                            onClick={() => handleSort('lastActiveDate')}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${
                                sortField === 'lastActiveDate' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <ArrowUpDown size={16} />
                            Активность
                            {sortField === 'lastActiveDate' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                        </button>
                        {(sortField === 'bonus' || sortField === 'subscriptionEndDate' || sortField === 'inviteesCount' || sortField === 'lastActiveDate') && (
                            <button
                                onClick={() => {
                                    setSortField('');
                                    setSortDirection('asc');
                                }}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Сбросить
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Загрузка пользователей...</p>
                    </div>
                ) : (
                    <AdminTable
                        columns={columns}
                        data={filteredAndSortedUsers}
                        onEdit={handleOpenForm}
                        onDelete={handleDelete}
                    />
                )}

                {/* Пагинация */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    if (pagination.hasPrevPage) {
                                        setCurrentPage(currentPage - 1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                disabled={!pagination.hasPrevPage || loading}
                                className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                                    pagination.hasPrevPage && !loading
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                <ChevronLeft size={20} />
                                Назад
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => {
                                                setCurrentPage(pageNum);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            disabled={loading}
                                            className={`px-3 py-2 rounded-lg transition-colors ${
                                                pagination.currentPage === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => {
                                    if (pagination.hasNextPage) {
                                        setCurrentPage(currentPage + 1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }
                                }}
                                disabled={!pagination.hasNextPage || loading}
                                className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                                    pagination.hasNextPage && !loading
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Вперед
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="text-sm text-gray-600">
                            Показано {((pagination.currentPage - 1) * limit) + 1} - {Math.min(pagination.currentPage * limit, pagination.totalUsers)} из {pagination.totalUsers}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

