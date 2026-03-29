/**
 * Человекочитаемые названия клиентских маршрутов (для аналитики просмотров).
 * Совпадает с path в routes.tsx (Telegram WebApp).
 */
const EXACT: Record<string, string> = {
    '/': 'Приветствие',
    '/main': 'Главная',
    '/about': 'О проекте',
    '/client/register': 'Регистрация',
    '/client/login': 'Вход',
    '/client/welcome2': 'Welcome',
    '/client/faq': 'FAQ',
    '/client/horoscope': 'Гороскоп',
    '/client/horoscopes': 'Гороскопы',
    '/client/transit': 'Транзит',
    '/client/transits': 'Транзиты',
    '/client/schumann': 'Резонанс Шумана',
    '/client/contactus': 'Связаться с нами',
    '/client/practices': 'Практики',
    '/client/broadcast-recordings': 'Записи эфиров',
    '/client/parables-of-life': 'Притчи о жизни',
    '/client/scientific-discoveries': 'Научные открытия',
    '/client/health-lab': 'Лаборатория здоровья',
    '/client/relationship-workshop': 'Мастерская отношений',
    '/client/spirit-forge': 'Кузница духа',
    '/client/masters-tower': 'Башня мастеров',
    '/client/femininity-gazebo': 'Беседка женственности',
    '/client/consciousness-library': 'Библиотека сознания',
    '/client/product-catalog': 'Каталог продуктов',
    '/client/analysis-health': 'Разборы — здоровье',
    '/client/analysis-relationships': 'Разборы — отношения',
    '/client/analysis-realization': 'Разборы — реализация',
    '/client/psychodiagnostics': 'Психодиагностика',
    '/client/schedule': 'Расписание',
    '/client/diary': 'Дневник осознаний',
    '/client/navigator': 'Навигатор',
    '/client/profile': 'Профиль',
    '/client/beggining-journey': 'Начало пути',
    '/client/tasks': 'Задания',
    '/client/new-task': 'Новое задание',
    '/client/region': 'Регион',
    '/client/app-temporarily-unavailable': 'Приложение недоступно',
    '/client/ease-launch': 'Ease Launch',
    '/client/blocked-user': 'Заблокирован',
    '/client/blocked-browser': 'Браузер заблокирован',
    '/client/connect-error': 'Ошибка подключения',
    '/client/invited-users': 'Приглашённые',
    '/client/documents': 'Документы',
    '/client/operation-log': 'Операции',
    '/client/deposit-log': 'Пополнения',
    '/client/purchase-log': 'Покупки',
    '/client/content-search': 'Поиск контента',
    '/client/choose-your-path': 'Выбор пути',
    '/client-performance': 'Показатели',
};

const PREFIX_RULES: Array<{ re: RegExp; title: string }> = [
    { re: /^\/client\/horoscope\/[^/]+$/, title: 'Гороскоп (материал)' },
    { re: /^\/client\/transit\/[^/]+$/, title: 'Транзит (материал)' },
    { re: /^\/client\/practice\/[^/]+$/, title: 'Практика' },
    { re: /^\/client\/broadcast-recording\/[^/]+$/, title: 'Запись эфира' },
    { re: /^\/client\/parables-of-life\/[^/]+$/, title: 'Притча о жизни' },
    { re: /^\/client\/scientific-discoveries\/[^/]+$/, title: 'Научное открытие' },
    { re: /^\/client\/health-lab\/[^/]+$/, title: 'Лаборатория здоровья (урок)' },
    { re: /^\/client\/relationship-workshop\/[^/]+$/, title: 'Мастерская отношений (урок)' },
    { re: /^\/client\/spirit-forge\/[^/]+$/, title: 'Кузница духа (урок)' },
    { re: /^\/client\/masters-tower\/[^/]+$/, title: 'Башня мастеров (урок)' },
    { re: /^\/client\/femininity-gazebo\/[^/]+$/, title: 'Беседка женственности (урок)' },
    { re: /^\/client\/consciousness-library\/[^/]+$/, title: 'Библиотека сознания (материал)' },
    { re: /^\/client\/product-catalog\/[^/]+$/, title: 'Продукт из каталога' },
    { re: /^\/client\/analysis-health\/[^/]+$/, title: 'Разбор — здоровье' },
    { re: /^\/client\/analysis-relationships\/[^/]+$/, title: 'Разбор — отношения' },
    { re: /^\/client\/analysis-realization\/[^/]+$/, title: 'Разбор — реализация' },
    { re: /^\/client\/psychodiagnostics\/[^/]+$/, title: 'Психодиагностика (материал)' },
];

function normalizePathname(raw: string): string {
    let p = (raw || '').trim().split('?')[0].split('#')[0];
    try {
        p = decodeURIComponent(p);
    } catch {
        /* оставляем как есть */
    }
    if (!p.startsWith('/')) p = `/${p}`;
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p || '/';
}

/** Короткое название страницы для таблиц аналитики */
export function getClientPageTitle(rawPath: string): string {
    const path = normalizePathname(rawPath);
    if (EXACT[path]) return EXACT[path];
    for (const { re, title } of PREFIX_RULES) {
        if (re.test(path)) return title;
    }
    return path;
}
