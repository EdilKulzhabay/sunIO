/**
 * Категории контента для внутренней ссылки кнопки.
 * apiPath — путь к API для загрузки списка, clientPath — базовый путь для ссылки.
 */
export const CONTENT_CATEGORY_OPTIONS: { title: string; apiPath: string; clientPath: string }[] = [
    { title: 'Практики', apiPath: '/api/practice', clientPath: '/client/practice' },
    { title: 'Лаборатория здоровья', apiPath: '/api/health-lab', clientPath: '/client/health-lab' },
    { title: 'Мастерская отношений', apiPath: '/api/relationship-workshop', clientPath: '/client/relationship-workshop' },
    { title: 'Кузница Духа', apiPath: '/api/spirit-forge', clientPath: '/client/spirit-forge' },
    { title: 'Башня мастеров', apiPath: '/api/masters-tower', clientPath: '/client/masters-tower' },
    { title: 'Беседка женственности', apiPath: '/api/femininity-gazebo', clientPath: '/client/femininity-gazebo' },
    { title: 'Библиотека сознания', apiPath: '/api/consciousness-library', clientPath: '/client/consciousness-library' },
    { title: 'Каталог платных продуктов', apiPath: '/api/product-catalog', clientPath: '/client/product-catalog' },
    { title: 'Разборы — Здоровье', apiPath: '/api/analysis-health', clientPath: '/client/analysis-health' },
    { title: 'Разборы — Отношения', apiPath: '/api/analysis-relationships', clientPath: '/client/analysis-relationships' },
    { title: 'Разборы — Реализация', apiPath: '/api/analysis-realization', clientPath: '/client/analysis-realization' },
    { title: 'Психодиагностика', apiPath: '/api/psychodiagnostics', clientPath: '/client/psychodiagnostics' },
];
