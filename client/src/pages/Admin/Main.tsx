import { AdminLayout } from '../../components/Admin/AdminLayout';
import { 
    HelpCircle, 
    Dumbbell, 
    Calendar, 
    FileText,
    Users,
    User,
    Home,
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
    Compass
} from 'lucide-react';
import { Link } from 'react-router-dom';

const mainCards = [
    { title: 'Пользователи', icon: Users, path: '/admin/users', color: 'bg-cyan-500', description: 'Управление пользователями' },
    { title: 'Профиль', icon: User, path: '/admin/profile', color: 'bg-slate-500', description: 'Настройки профиля' },
];

const contentCards = [
    { title: 'FAQ', icon: HelpCircle, path: '/admin/faq', color: 'bg-blue-500', description: 'Вопросы и ответы' },
    { title: 'Практики', icon: Dumbbell, path: '/admin/practice', color: 'bg-green-500', description: 'Контент на странице Практики' },
    { title: 'Расписание', icon: Calendar, path: '/admin/schedule', color: 'bg-indigo-500', description: 'События и вебинары' },
    { title: 'Лаборатория здоровья', icon: Heart, path: '/admin/health-lab', color: 'bg-rose-500', description: 'Контент Лаборатории здоровья' },
    { title: 'Мастерская отношений', icon: Users2, path: '/admin/relationship-workshop', color: 'bg-pink-500', description: 'Контент Мастерской отношений' },
    { title: 'Кузница Духа', icon: Flame, path: '/admin/spirit-forge', color: 'bg-orange-500', description: 'Контент Кузницы Духа' },
    { title: 'Башня мастеров', icon: Castle, path: '/admin/masters-tower', color: 'bg-stone-600', description: 'Контент Башни мастеров' },
    { title: 'Беседка женственности', icon: Flower2, path: '/admin/femininity-gazebo', color: 'bg-fuchsia-500', description: 'Контент Беседки женственности' },
    { title: 'Библиотека сознания', icon: BookOpen, path: '/admin/consciousness-library', color: 'bg-violet-500', description: 'Контент Библиотеки сознания' },
    { title: 'Каталог продуктов', icon: ShoppingBag, path: '/admin/product-catalog', color: 'bg-emerald-500', description: 'Каталог продуктов' },
    { title: 'Разборы — Здоровье', icon: Stethoscope, path: '/admin/analysis-health', color: 'bg-red-500', description: 'Разборы по здоровью' },
    { title: 'Разборы — Отношения', icon: HeartHandshake, path: '/admin/analysis-relationships', color: 'bg-rose-500', description: 'Разборы по отношениям' },
    { title: 'Разборы — Реализация', icon: Target, path: '/admin/analysis-realization', color: 'bg-amber-500', description: 'Разборы по реализации' },
    { title: 'Психодиагностика', icon: Brain, path: '/admin/psychodiagnostics', color: 'bg-purple-500', description: 'Психодиагностика' },
    { title: 'Динамический контент', icon: FileText, path: '/admin/dynamic-content', color: 'bg-teal-500', description: 'Управление динамическим контентом' },
    { title: 'Приветствие', icon: Home, path: '/admin/welcome', color: 'bg-amber-500', description: 'Контент на странице Приветствие' },
    { title: 'О клубе', icon: Info, path: '/admin/about-club', color: 'bg-cyan-600', description: 'Контент на странице О клубе' },
    { title: 'Начало путешествия', icon: Compass, path: '/admin/beggining-journey', color: 'bg-sky-500', description: 'Контент начала путешествия' },
];

export const Main = () => {

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Добро пожаловать в админ-панель</h1>
                    <p className="text-gray-600 mt-2">Выберите раздел для управления контентом</p>
                </div>

                {/* Основные разделы */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Основные разделы</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mainCards.map((card) => {
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

                {/* Управление контентом */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Управление контентом</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {contentCards.map((card) => {
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
            </div>
        </AdminLayout>
    );
};