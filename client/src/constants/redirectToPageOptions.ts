/**
 * Список страниц контента для селекта «Ссылка перехода» в админ-формах.
 * title — название на русском, value — путь к странице списка.
 */
export const REDIRECT_TO_PAGE_OPTIONS: { title: string; value: string }[] = [
    { title: 'Не перенаправлять', value: '' },
    { title: 'Главная приложения', value: '/' },
    { title: 'Практики', value: '/client/practices' },
    { title: 'Притчи о жизни', value: '/client/parables-of-life' },
    { title: 'Научные открытия', value: '/client/scientific-discoveries' },
    { title: 'Лаборатория здоровья', value: '/client/health-lab' },
    { title: 'Мастерская отношений', value: '/client/relationship-workshop' },
    { title: 'Кузница Духа', value: '/client/spirit-forge' },
    { title: 'Башня мастеров', value: '/client/masters-tower' },
    { title: 'Беседка женственности', value: '/client/femininity-gazebo' },
    { title: 'Библиотека сознания', value: '/client/consciousness-library' },
    { title: 'Каталог платных продуктов', value: '/client/product-catalog' },
    { title: 'Разборы — Здоровье', value: '/client/analysis-health' },
    { title: 'Разборы — Отношения', value: '/client/analysis-relationships' },
    { title: 'Разборы — Реализация', value: '/client/analysis-realization' },
    { title: 'Психодиагностика', value: '/client/psychodiagnostics' },
    { title: 'Связаться с нами', value: '/client/contactus' },
    { title: 'Задания', value: '/client/tasks' },
    { title: 'Документы', value: '/client/documents' },
    { title: 'История пополнений', value: '/client/deposit-log' },
    { title: 'История покупок', value: '/client/purchase-log' },
    { title: 'Журнал операций', value: '/client/operation-log' },
    { title: 'Навигатор', value: '/client/navigator' },
    { title: 'Осознания', value: '/client/diary' },
    { title: 'Профиль', value: '/client/profile' },
    { title: 'Часто задаваемые вопросы', value: '/client/faq' },
    { title: 'Сообщество', value: '/about' },
];
