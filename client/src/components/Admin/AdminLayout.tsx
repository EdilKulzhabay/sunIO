import { useEffect, useRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    HelpCircle,
    Dumbbell,
    Calendar,
    Link2,
    LogOut,
    User,
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
    Brain,
    MessageSquare,
    FlaskConical,
    FileText,
    Link2 as LinkIcon,
    Video,
    Layers,
    ListChecks,
    BarChart2,
    MessagesSquare,
    Waves,
    LayoutDashboard,
    Sparkles,
    Info,
    Compass,
    Gift,
    Navigation,
} from 'lucide-react';

interface AdminLayoutProps {
    children: ReactNode;
}

type MenuItem = {
    path: string;
    label: string;
    icon: LucideIcon;
    adminOnly?: boolean;
    roles?: readonly string[];
};

const ADMIN_NAV_SCROLL_KEY = 'admin-layout-nav-scroll-top';

const menuSections: { heading: string; items: MenuItem[] }[] = [
    {
        heading: 'Основные разделы',
        items: [
            { path: '/admin/users', label: 'Пользователи', icon: Users },
            { path: '/admin/admins', label: 'Администраторы', icon: Shield },
            { path: '/admin/action-logs', label: 'Журнал действий', icon: ClipboardList, adminOnly: true },
            { path: '/admin/operation-logs', label: 'Журнал операций', icon: ClipboardList, adminOnly: true },
            {
                path: '/admin/client-page-analytics',
                label: 'Статистика просмотра',
                icon: BarChart2,
                roles: ['admin', 'manager', 'client_manager'] as const,
            },
            { path: '/admin/bot-traffic-sources', label: 'Источники трафика', icon: LinkIcon },
            { path: '/admin/closed-club', label: 'Чаты и каналы', icon: MessagesSquare },
            { path: '/admin/broadcast', label: 'Рассылки', icon: Send },
            { path: '/admin/modal-notifications', label: 'Модальные уведомления', icon: Bell },
        ],
    },
    {
        heading: 'Контент страницы',
        items: [
            { path: '/admin/schedule', label: 'Расписание', icon: Calendar },
            { path: '/admin/assignments', label: 'Задания', icon: ListChecks },
            { path: '/admin/practice', label: 'Практики', icon: Dumbbell },
            { path: '/admin/faq', label: 'Частые вопросы', icon: HelpCircle },
            { path: '/admin/product-catalog', label: 'Платные продукты', icon: ShoppingBag },
            { path: '/admin/health-lab', label: 'Лаборатория здоровья', icon: Heart },
            { path: '/admin/analysis-health', label: 'Разборы - Здоровье', icon: Stethoscope },
            { path: '/admin/psychodiagnostics', label: 'Психодиагностика', icon: Brain },
            { path: '/admin/relationship-workshop', label: 'Мастерская отношений', icon: Users2 },
            { path: '/admin/analysis-relationships', label: 'Разборы - Отношения', icon: HeartHandshake },
            { path: '/admin/spirit-forge', label: 'Кузница духа', icon: Flame },
            { path: '/admin/analysis-realization', label: 'Разборы - Реализация', icon: Target },
            { path: '/admin/consciousness-library', label: 'Библиотека сознания', icon: BookOpen },
            { path: '/admin/broadcast-recordings', label: 'Записи эфиров', icon: Video },
            { path: '/admin/parables-of-life', label: 'Притчи о жизни', icon: MessageSquare },
            { path: '/admin/neuromeditations', label: 'Нейромедитации', icon: Waves },
            { path: '/admin/scientific-discoveries', label: 'Научные открытия', icon: FlaskConical },
            { path: '/admin/femininity-gazebo', label: 'Беседка женственности', icon: Flower2 },
            { path: '/admin/masters-tower', label: 'Башня мастеров', icon: Castle },
        ],
    },
    {
        heading: 'Управление контентом',
        items: [
            { path: '/admin/dynamic-content', label: 'Динамический контент', icon: LayoutDashboard },
            { path: '/admin/welcome', label: 'Приветствие', icon: Sparkles },
            { path: '/admin/about-club', label: 'О клубе', icon: Info },
            { path: '/admin/beggining-journey', label: 'Начало путешествия', icon: Compass },
            { path: '/admin/points-awarding-policy', label: 'Политика баллов', icon: Gift },
            { path: '/admin/documents', label: 'Документы', icon: FileText },
            { path: '/admin/navigator-descriptions', label: 'Описания навигатора', icon: Navigation },
            { path: '/admin/activation-links', label: 'Ссылки активации', icon: Link2 },
            { path: '/admin/levels', label: 'Уровни мастерства', icon: Layers },
        ],
    },
];

function visibleItems(items: MenuItem[], role: string | undefined) {
    return items.filter((item) => {
        if (item.adminOnly && role !== 'admin') return false;
        if (item.roles && !item.roles.includes(role as (typeof item.roles)[number])) return false;
        return true;
    });
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const savedScrollTop = sessionStorage.getItem(ADMIN_NAV_SCROLL_KEY);
        if (!savedScrollTop || !navRef.current) return;

        navRef.current.scrollTop = Number(savedScrollTop);
    }, []);

    const handleNavScroll = () => {
        if (!navRef.current) return;
        sessionStorage.setItem(ADMIN_NAV_SCROLL_KEY, String(navRef.current.scrollTop));
    };

    const isLinkActive = (path: string) =>
        location.pathname === path ||
        (path !== '/admin' && location.pathname.startsWith(path));

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 bg-white shadow-lg flex flex-col h-screen">
                <div className="p-6 border-b flex-shrink-0">
                    <Link to="/admin" className="block text-2xl font-bold text-blue-600 hover:text-blue-700">
                        Панель управления
                    </Link>
                    <Link to="/admin/profile" className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                        <User size={16} />
                        <span>{user?.fullName}</span>
                    </Link>
                </div>

                <nav ref={navRef} onScroll={handleNavScroll} className="p-4 flex-1 overflow-y-auto">
                    <div className="space-y-6">
                        {menuSections.map((section) => {
                            const items = visibleItems(section.items, user?.role);
                            if (items.length === 0) return null;

                            return (
                                <div key={section.heading}>
                                    <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                        {section.heading}
                                    </p>
                                    <ul className="space-y-1">
                                        {items.map((item) => {
                                            const Icon = item.icon;
                                            const active = isLinkActive(item.path);

                                            return (
                                                <li key={`${section.heading}-${item.label}-${item.path}`}>
                                                    <Link
                                                        to={item.path}
                                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                                                            active
                                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                                : 'text-gray-700 hover:bg-gray-100 hover:cursor-pointer'
                                                        }`}
                                                    >
                                                        <Icon size={20} />
                                                        <span className="text-sm">{item.label}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </nav>

                <div className="p-4 border-t flex-shrink-0">
                    <button
                        type="button"
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-gray-700 hover:bg-gray-100 hover:cursor-pointer rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Выйти</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto h-screen">
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
};
