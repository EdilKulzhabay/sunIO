/**
 * Человекочитаемые названия клиентских маршрутов (для аналитики просмотров).
 * Совпадает с path в routes.tsx (Telegram WebApp).
 */
const EXACT: Record<string, string> = {
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
    '/client/tasks': 'Задания',
    '/client/new-task': 'Задания',
    '/client/app-temporarily-unavailable': 'Приложение недоступно',
    '/client/blocked-user': 'Заблокирован',
    '/client/invited-users': 'Приглашённые',
    '/client/documents': 'Документы',
    '/client/operation-log': 'Журнал операций',
    '/client/deposit-log': 'История пополнений',
    '/client/purchase-log': 'История покупок',
    '/client/content-search': 'Поиск контента',
};

const PREFIX_RULES: Array<{ re: RegExp; section: string; fallbackTitle: string }> = [
    { re: /^\/client\/horoscope\/[^/]+$/, section: 'Гороскопы', fallbackTitle: 'Гороскоп' },
    { re: /^\/client\/transit\/[^/]+$/, section: 'Транзиты', fallbackTitle: 'Транзит' },
    { re: /^\/client\/practice\/[^/]+$/, section: 'Практики', fallbackTitle: 'Практика' },
    { re: /^\/client\/broadcast-recording\/[^/]+$/, section: 'Записи эфиров', fallbackTitle: 'Запись эфира' },
    { re: /^\/client\/parables-of-life\/[^/]+$/, section: 'Притчи о жизни', fallbackTitle: 'Притча о жизни' },
    { re: /^\/client\/scientific-discoveries\/[^/]+$/, section: 'Научные открытия', fallbackTitle: 'Научное открытие' },
    { re: /^\/client\/health-lab\/[^/]+$/, section: 'Лаборатория здоровья', fallbackTitle: 'Лаборатория здоровья' },
    { re: /^\/client\/relationship-workshop\/[^/]+$/, section: 'Мастерская отношений', fallbackTitle: 'Мастерская отношений' },
    { re: /^\/client\/spirit-forge\/[^/]+$/, section: 'Кузница духа', fallbackTitle: 'Кузница духа' },
    { re: /^\/client\/masters-tower\/[^/]+$/, section: 'Башня мастеров', fallbackTitle: 'Башня мастеров' },
    { re: /^\/client\/femininity-gazebo\/[^/]+$/, section: 'Беседка женственности', fallbackTitle: 'Беседка женственности' },
    { re: /^\/client\/consciousness-library\/[^/]+$/, section: 'Библиотека сознания', fallbackTitle: 'Библиотека сознания' },
    { re: /^\/client\/product-catalog\/[^/]+$/, section: 'Каталог продуктов', fallbackTitle: 'Каталог продуктов' },
    { re: /^\/client\/analysis-health\/[^/]+$/, section: 'Разборы — здоровье', fallbackTitle: 'Разбор — здоровье' },
    { re: /^\/client\/analysis-relationships\/[^/]+$/, section: 'Разборы — отношения', fallbackTitle: 'Разбор — отношения' },
    { re: /^\/client\/analysis-realization\/[^/]+$/, section: 'Разборы — реализация', fallbackTitle: 'Разбор — реализация' },
    { re: /^\/client\/psychodiagnostics\/[^/]+$/, section: 'Психодиагностика', fallbackTitle: 'Психодиагностика' },
];

const EXCLUDED_PATHS = new Set([
    '/client/region',
    '/client/ease-launch',
    '/client/choose-your-path',
    '/client/connect-error',
    '/about',
    '/client/register',
    '/client/welcome2',
    '/client/app-temporarily-unavailable',
]);

const SECTION_EXACT: Record<string, string> = {
    '/': 'Основное',
    '/main': 'Основное',
    '/client/login': 'Основное',
    '/client/faq': 'Основное',
    '/client/profile': 'Профиль',
    '/client/invited-users': 'Профиль',
    '/client/documents': 'Профиль',
    '/client/operation-log': 'Профиль',
    '/client/deposit-log': 'Профиль',
    '/client/purchase-log': 'Профиль',
    '/client/schedule': 'Расписание',
    '/client/diary': 'Дневник осознаний',
    '/client/navigator': 'Навигатор',
    '/client/tasks': 'Задания',
    '/client/new-task': 'Задания',
    '/client/beggining-journey': 'Начало пути',
    '/client/contactus': 'Основное',
    '/client/content-search': 'Основное',
    '/client/blocked-user': 'Основное',
    '/client/blocked-browser': 'Основное',
    '/client-performance': 'Основное',
    '/client/horoscope': 'Гороскопы',
    '/client/horoscopes': 'Гороскопы',
    '/client/transit': 'Транзиты',
    '/client/transits': 'Транзиты',
    '/client/schumann': 'Резонанс Шумана',
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
};

export function normalizePathname(raw: string): string {
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

/** Извлечь ObjectId из конца пути (если есть) */
export function extractContentId(rawPath: string): string | null {
    const path = normalizePathname(rawPath);
    const match = path.match(/\/([a-fA-F0-9]{24})$/);
    return match ? match[1] : null;
}

/** Проверяет, исключён ли путь из статистики */
export function isExcludedPath(rawPath: string): boolean {
    return EXCLUDED_PATHS.has(normalizePathname(rawPath));
}

/** Раздел, к которому принадлежит путь */
export function getClientPageSection(rawPath: string): string {
    const path = normalizePathname(rawPath);
    if (SECTION_EXACT[path]) return SECTION_EXACT[path];
    for (const { re, section } of PREFIX_RULES) {
        if (re.test(path)) return section;
    }
    return 'Другое';
}

/** Все уникальные разделы для фильтра */
export function getAllSections(): string[] {
    const set = new Set<string>(Object.values(SECTION_EXACT));
    for (const { section } of PREFIX_RULES) set.add(section);
    const ordered = [
        'Основное', 'Профиль', 'Расписание', 'Навигатор', 'Дневник осознаний',
        'Задания', 'Начало пути', 'Гороскопы', 'Транзиты', 'Резонанс Шумана',
        'Практики', 'Записи эфиров', 'Притчи о жизни', 'Научные открытия',
        'Лаборатория здоровья', 'Мастерская отношений', 'Кузница духа',
        'Башня мастеров', 'Беседка женственности', 'Библиотека сознания',
        'Каталог продуктов', 'Разборы — здоровье', 'Разборы — отношения',
        'Разборы — реализация', 'Психодиагностика',
    ];
    return ordered.filter((s) => set.has(s));
}

/**
 * Название страницы для таблиц аналитики.
 * titleMap — опциональная карта contentId → название (для контента с ObjectId в пути).
 */
export function getClientPageTitle(rawPath: string, titleMap?: Map<string, string>): string {
    const path = normalizePathname(rawPath);
    if (EXACT[path]) return EXACT[path];

    const contentId = extractContentId(rawPath);
    if (contentId && titleMap?.has(contentId)) return titleMap.get(contentId)!;

    for (const { re, fallbackTitle } of PREFIX_RULES) {
        if (re.test(path)) return fallbackTitle;
    }
    return path;
}
