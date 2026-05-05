import { AdminLayout } from '../../components/Admin/AdminLayout';
import { 
    HelpCircle, 
    Dumbbell, 
    Calendar, 
    Link2,
    FileText,
    Users,
    User,
    Info,
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
    Compass,
    Navigation,
    Gift,
    MessageSquare,
    FlaskConical,
    Link2 as LinkIcon,
    MessagesSquare,
    Shield,
    ClipboardList,
    BarChart2,
    Send,
    Bell,
    LayoutDashboard,
    Sparkles,
    Layers,
    ListChecks,
    Video,
    Waves,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const cardSections = [
    {
        title: 'Основные разделы',
        cards: [
            { title: 'Пользователи', icon: Users, path: '/admin/users', color: 'bg-cyan-500', description: 'Управление пользователями' },
            { title: 'Администраторы', icon: Shield, path: '/admin/admins', color: 'bg-slate-600', description: 'Управление администраторами' },
            { title: 'Профиль', icon: User, path: '/admin/profile', color: 'bg-slate-500', description: 'Настройки профиля' },
            { title: 'Журнал действий', icon: ClipboardList, path: '/admin/action-logs', color: 'bg-gray-600', description: 'История действий администраторов' },
            { title: 'Журнал операций', icon: ClipboardList, path: '/admin/operation-logs', color: 'bg-zinc-600', description: 'История операций пользователей' },
            { title: 'Статистика просмотра', icon: BarChart2, path: '/admin/client-page-analytics', color: 'bg-blue-600', description: 'Аналитика посещения страниц' },
            { title: 'Источники трафика', icon: LinkIcon, path: '/admin/bot-traffic-sources', color: 'bg-sky-600', description: 'Справочник источников трафика и ссылок' },
            { title: 'Чаты и каналы', icon: MessagesSquare, path: '/admin/closed-club', color: 'bg-indigo-600', description: 'Открытые и закрытые канал/чат, участники' },
            { title: 'Рассылки', icon: Send, path: '/admin/broadcast', color: 'bg-emerald-600', description: 'Управление рассылками' },
            { title: 'Модальные уведомления', icon: Bell, path: '/admin/modal-notifications', color: 'bg-orange-500', description: 'Управление модальными уведомлениями' },
        ],
    },
    {
        title: 'Контент страницы',
        cards: [
            { title: 'Расписание', icon: Calendar, path: '/admin/schedule', color: 'bg-indigo-500', description: 'События и вебинары' },
            { title: 'Задания', icon: ListChecks, path: '/admin/assignments', color: 'bg-lime-600', description: 'Управление заданиями' },
            { title: 'Практики', icon: Dumbbell, path: '/admin/practice', color: 'bg-green-500', description: 'Контент на странице Практики' },
            { title: 'FAQ', icon: HelpCircle, path: '/admin/faq', color: 'bg-blue-500', description: 'Вопросы и ответы' },
            { title: 'Платные продукты', icon: ShoppingBag, path: '/admin/product-catalog', color: 'bg-emerald-500', description: 'Каталог платных продуктов' },
            { title: 'Лаборатория здоровья', icon: Heart, path: '/admin/health-lab', color: 'bg-rose-500', description: 'Контент Лаборатории здоровья' },
            { title: 'Разборы — Здоровье', icon: Stethoscope, path: '/admin/analysis-health', color: 'bg-red-500', description: 'Разборы по здоровью' },
            { title: 'Психодиагностика', icon: Brain, path: '/admin/psychodiagnostics', color: 'bg-purple-500', description: 'Психодиагностика' },
            { title: 'Мастерская отношений', icon: Users2, path: '/admin/relationship-workshop', color: 'bg-pink-500', description: 'Контент Мастерской отношений' },
            { title: 'Разборы — Отношения', icon: HeartHandshake, path: '/admin/analysis-relationships', color: 'bg-rose-500', description: 'Разборы по отношениям' },
            { title: 'Кузница Духа', icon: Flame, path: '/admin/spirit-forge', color: 'bg-orange-500', description: 'Контент Кузницы Духа' },
            { title: 'Разборы — Реализация', icon: Target, path: '/admin/analysis-realization', color: 'bg-amber-500', description: 'Разборы по реализации' },
            { title: 'Библиотека сознания', icon: BookOpen, path: '/admin/consciousness-library', color: 'bg-violet-500', description: 'Контент Библиотеки сознания' },
            { title: 'Записи эфиров', icon: Video, path: '/admin/broadcast-recordings', color: 'bg-cyan-700', description: 'Контент записей эфиров' },
            { title: 'Притчи о жизни', icon: MessageSquare, path: '/admin/parables-of-life', color: 'bg-amber-600', description: 'Контент Притчи о жизни' },
            { title: 'Нейромедитации', icon: Waves, path: '/admin/neuromeditations', color: 'bg-sky-500', description: 'Контент нейромедитаций' },
            { title: 'Научные открытия', icon: FlaskConical, path: '/admin/scientific-discoveries', color: 'bg-cyan-600', description: 'Контент Научные открытия' },
            { title: 'Беседка женственности', icon: Flower2, path: '/admin/femininity-gazebo', color: 'bg-fuchsia-500', description: 'Контент Беседки женственности' },
            { title: 'Башня мастеров', icon: Castle, path: '/admin/masters-tower', color: 'bg-stone-600', description: 'Контент Башни мастеров' },
        ],
    },
    {
        title: 'Управление контентом',
        cards: [
            { title: 'Динамический контент', icon: LayoutDashboard, path: '/admin/dynamic-content', color: 'bg-teal-500', description: 'Управление динамическим контентом' },
            { title: 'Приветствие', icon: Sparkles, path: '/admin/welcome', color: 'bg-amber-500', description: 'Контент на странице Приветствие' },
            { title: 'О клубе', icon: Info, path: '/admin/about-club', color: 'bg-cyan-600', description: 'Контент на странице О клубе' },
            { title: 'Начало путешествия', icon: Compass, path: '/admin/beggining-journey', color: 'bg-sky-500', description: 'Контент начала путешествия' },
            { title: 'Политика баллов', icon: Gift, path: '/admin/points-awarding-policy', color: 'bg-amber-600', description: 'Политика баллов' },
            { title: 'Документы', icon: FileText, path: '/admin/documents', color: 'bg-stone-500', description: 'Управление документами' },
            { title: 'Описания навигатора', icon: Navigation, path: '/admin/navigator-descriptions', color: 'bg-blue-600', description: 'Управление описаниями навигатора' },
            { title: 'Ссылки активации', icon: Link2, path: '/admin/activation-links', color: 'bg-teal-600', description: 'Активация тела, здоровья, Рода, Духа' },
            { title: 'Уровни мастерства', icon: Layers, path: '/admin/levels', color: 'bg-violet-600', description: 'Настройка уровней мастерства' },
        ],
    },
];

export const Main = () => {

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Добро пожаловать в панель управления</h1>
                    <p className="text-gray-600 mt-2">Выберите раздел для управления контентом</p>
                </div>

                {cardSections.map((section) => (
                    <div key={section.title}>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">{section.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.cards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <Link
                                        key={card.path}
                                        to={card.path}
                                        className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-1"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`${card.color} p-3 rounded-lg text-white`}>
                                                <Icon size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-900">{card.title}</h2>
                                                <p className="text-gray-500 text-sm mt-1">{card.description}</p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
};