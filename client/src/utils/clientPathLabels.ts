/**
 * Человекочитаемые названия клиентских маршрутов (для аналитики просмотров).
 * Совпадает с path в routes.tsx (Telegram WebApp).
 */
const EXACT: Record<string, string> = {
    '/main': 'Главная страница',
    '/client/faq': 'Частые вопросы',
    '/client/contactus': 'Связаться с нами',
    '/client/practices': 'Практики',
    '/client/broadcast-recordings': 'Записи эфиров',
    '/client/parables-of-life': 'Притчи',
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
    '/client/schedule': 'Осознание',
    '/client/diary': 'Дневник осознаний',
    '/client/navigator': 'Навигатор',
    '/client/profile': 'Профиль',
    '/client/tasks': 'Задания',
    '/client/new-task': 'Задания',
    '/client/blocked-user': 'Заблокирован',
    '/client/invited-users': 'Приглашённые',
    '/client/documents': 'Документы',
    '/client/operation-log': 'Журнал операций',
    '/client/deposit-log': 'История пополнений',
    '/client/purchase-log': 'История покупок',
    '/client/content-search': 'Поиск контента',
};

const PREFIX_RULES: Array<{ re: RegExp; section: string; fallbackTitle: string }> = [
    { re: /^\/client\/practice\/[^/]+$/, section: 'Практики', fallbackTitle: 'Практика' },
    { re: /^\/client\/broadcast-recording\/[^/]+$/, section: 'Записи эфиров', fallbackTitle: 'Запись эфира' },
    { re: /^\/client\/parables-of-life\/[^/]+$/, section: 'Притчи', fallbackTitle: 'Притча' },
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
    '/',
    '/client/region',
    '/client/ease-launch',
    '/client/choose-your-path',
    '/client/connect-error',
    '/client/register',
    '/client/welcome2',
    '/client/app-temporarily-unavailable',
    '/client/blocked-browser',
    '/client-performance',
    '/client/beggining-journey',
    '/client/login',
]);

/** Страницы главного меню — без отдельной категории */
const MAIN_MENU_PATHS = new Set([
    '/main',
    '/client/faq',
    '/about',
    '/client/content-search',
    '/client/contactus',
    '/client/product-catalog',
    '/client/profile',
    '/client/invited-users',
    '/client/operation-log',
    '/client/deposit-log',
    '/client/purchase-log',
    '/client/documents',
    '/client/navigator',
    '/client/diary',
    '/client/practices',
    '/client/tasks',
    '/client/new-task',
    '/client/blocked-user',
    '/client/schedule',
]);

const SECTION_EXACT: Record<string, string> = {
    '/client/broadcast-recordings': 'Записи эфиров',
    '/client/parables-of-life': 'Притчи',
    '/client/scientific-discoveries': 'Научные открытия',
    '/client/health-lab': 'Лаборатория здоровья',
    '/client/relationship-workshop': 'Мастерская отношений',
    '/client/spirit-forge': 'Кузница духа',
    '/client/masters-tower': 'Башня мастеров',
    '/client/femininity-gazebo': 'Беседка женственности',
    '/client/consciousness-library': 'Библиотека сознания',
    '/client/analysis-health': 'Разборы — здоровье',
    '/client/analysis-relationships': 'Разборы — отношения',
    '/client/analysis-realization': 'Разборы — реализация',
    '/client/psychodiagnostics': 'Психодиагностика',
};

const MAIN_MENU_SECTION = 'Главное меню';

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
    if (MAIN_MENU_PATHS.has(path)) return MAIN_MENU_SECTION;
    if (SECTION_EXACT[path]) return SECTION_EXACT[path];
    for (const { re, section } of PREFIX_RULES) {
        if (re.test(path)) return section;
    }
    return 'Другое';
}

/** Все уникальные разделы для фильтра (алфавитный порядок) */
export function getAllSections(): string[] {
    const set = new Set<string>();
    set.add(MAIN_MENU_SECTION);
    for (const v of Object.values(SECTION_EXACT)) set.add(v);
    for (const { section } of PREFIX_RULES) set.add(section);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
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
