/**
 * Список страниц контента для селекта «Ссылка перехода» в админ-формах.
 * title — название на русском, value — путь к странице списка.
 * Отсортировано по title в алфавитном порядке (ru).
 */
export const REDIRECT_TO_PAGE_OPTIONS: { title: string; value: string }[] = [
    { title: 'Башня мастеров', value: '/client/masters-tower' },
    { title: 'Беседка женственности', value: '/client/femininity-gazebo' },
    { title: 'Библиотека сознания', value: '/client/consciousness-library' },
    { title: 'Главная приложения', value: '/' },
    { title: 'Документы', value: '/client/documents' },
    { title: 'Журнал операций', value: '/client/operation-log' },
    { title: 'Задания', value: '/client/new-task' },
    { title: 'Записи эфиров', value: '/client/broadcast-recordings' },
    { title: 'История пополнений', value: '/client/deposit-log' },
    { title: 'История покупок', value: '/client/purchase-log' },
    { title: 'Каталог платных продуктов', value: '/client/product-catalog' },
    { title: 'Кузница Духа', value: '/client/spirit-forge' },
    { title: 'Лаборатория здоровья', value: '/client/health-lab' },
    { title: 'Мастерская отношений', value: '/client/relationship-workshop' },
    { title: 'Навигатор', value: '/client/navigator' },
    { title: 'Нейромедитации', value: '/client/neuromeditations' },
    { title: 'Научные открытия', value: '/client/scientific-discoveries' },
    { title: 'Не перенаправлять', value: '' },
    { title: 'Осознания', value: '/client/diary' },
    { title: 'Практики', value: '/client/practices' },
    { title: 'Притчи о жизни', value: '/client/parables-of-life' },
    { title: 'Профиль', value: '/client/profile' },
    { title: 'Психодиагностика', value: '/client/psychodiagnostics' },
    { title: 'Разборы — Здоровье', value: '/client/analysis-health' },
    { title: 'Разборы — Отношения', value: '/client/analysis-relationships' },
    { title: 'Разборы — Реализация', value: '/client/analysis-realization' },
    { title: 'Связаться с нами', value: '/client/contactus' },
    { title: 'Сообщество', value: '/about' },
    { title: 'Часто задаваемые вопросы', value: '/client/faq' },
];
