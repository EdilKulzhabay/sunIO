import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    HelpCircle, 
    Dumbbell, 
    Calendar, 
    LogOut,
    User,
    Home,
    Users,
    Send,
    Shield,
    Bell,
    ClipboardList,
    Heart,
    Users2,
    Flame,
    Castle,
    Flower2,
    BookOpen,
    ShoppingBag,
    Stethoscope,
    HeartHandshake,
    Target,
    Brain
} from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

const menuItems = [
    { path: '/admin', label: 'Главная', icon: Home },
    { path: '/admin/users', label: 'Пользователи', icon: Users },
    { path: '/admin/admins', label: 'Администраторы', icon: Shield },
    { path: '/admin/action-logs', label: 'Журнал действий', icon: ClipboardList, adminOnly: true },
    { path: '/admin/broadcast', label: 'Рассылка', icon: Send },
    { path: '/admin/modal-notifications', label: 'Модальные уведомления', icon: Bell },
    { path: '/admin/profile', label: 'Профиль', icon: User },
    { path: '', label: '', icon: null, divider: true }, // Разделитель
    { path: '/admin/faq', label: 'FAQ', icon: HelpCircle },
    { path: '/admin/practice', label: 'Практики', icon: Dumbbell },
    { path: '/admin/schedule', label: 'Расписание', icon: Calendar },
    { path: '/admin/health-lab', label: 'Лаборатория здоровья', icon: Heart },
    { path: '/admin/relationship-workshop', label: 'Мастерская отношений', icon: Users2 },
    { path: '/admin/spirit-forge', label: 'Кузница Духа', icon: Flame },
    { path: '/admin/masters-tower', label: 'Башня мастеров', icon: Castle },
    { path: '/admin/femininity-gazebo', label: 'Беседка женственности', icon: Flower2 },
    { path: '/admin/consciousness-library', label: 'Библиотека сознания', icon: BookOpen },
    { path: '/admin/product-catalog', label: 'Каталог продуктов', icon: ShoppingBag },
    { path: '/admin/analysis-health', label: 'Разборы - Здоровье', icon: Stethoscope },
    { path: '/admin/analysis-relationships', label: 'Разборы - Отношения', icon: HeartHandshake },
    { path: '/admin/analysis-realization', label: 'Разборы - Реализация', icon: Target },
    { path: '/admin/psychodiagnostics', label: 'Психодиагностика', icon: Brain },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col h-screen">
                <div className="p-6 border-b flex-shrink-0">
                    <h1 className="text-2xl font-bold text-blue-600">Админ панель</h1>
                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                        <User size={16} />
                        <span>{user?.fullName}</span>
                    </div>
                </div>
                
                <nav className="p-4 flex-1 overflow-y-auto">
                    <ul className="space-y-2">
                        {menuItems
                            .filter((item) => !item.adminOnly || user?.role === 'admin')
                            .map((item, index) => {
                            // Разделитель
                            if (item.divider) {
                                return <li key={`divider-${index}`} className="my-4 border-t border-gray-200"></li>;
                            }

                            const Icon = item.icon;
                            const isActive = location.pathname === item.path || 
                                (item.path !== '/admin' && location.pathname.startsWith(item.path));
                            
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                : 'text-gray-700 hover:bg-gray-100 hover:cursor-pointer'
                                        }`}
                                    >
                                        {Icon && <Icon size={20} />}
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t flex-shrink-0">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-100 hover:cursor-pointer rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Выйти</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto h-screen">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

