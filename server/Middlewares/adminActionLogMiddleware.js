import AdminActionLog from "../Models/AdminActionLog.js";

export const adminActionLogMiddleware = (req, res, next) => {
    const user = req.user;
    if (!user) {
        return next();
    }

    const buildActionDescription = () => {
        const method = req.method.toUpperCase();
        const path = req.originalUrl.split('?')[0];
        const status = res.statusCode;
        const isSuccess = status >= 200 && status < 300;

        const title = req.body?.title || req.body?.eventTitle || req.body?.name;
        const titleSuffix = title ? `: "${title}"` : '';

        if (path.includes('/user/logout')) {
            return `Выход из аккаунта (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }

        if (path.includes('/broadcast/send')) {
            return `Отправил(а) рассылку (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }
        if (path.includes('/broadcast/test')) {
            return `Отправил(а) тестовую рассылку (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }

        if (path.includes('/user/') && path.includes('/block')) {
            return `Заблокировал(а) пользователя (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }
        if (path.includes('/user/') && path.includes('/unblock')) {
            return `Разблокировал(а) пользователя (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }
        if (path.includes('/user/') && path.includes('/activate-subscription')) {
            return `Активировал(а) подписку (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }
        if (path.includes('/user/') && path.includes('/deactivate-subscription')) {
            return `Деактивировал(а) подписку (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }

        if (path.includes('/upload/image')) {
            return `Загрузил(а) изображение (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }
        if (path.includes('/upload/delete')) {
            return `Удалил(а) изображение (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }

        const resourceLabels = [
            { prefix: '/api/horoscope', label: 'гороскоп' },
            { prefix: '/api/meditation', label: 'медитацию' },
            { prefix: '/api/practice', label: 'практику' },
            { prefix: '/api/video-lesson', label: 'видео урок' },
            { prefix: '/api/schedule', label: 'событие' },
            { prefix: '/api/transit', label: 'транзит' },
            { prefix: '/api/dynamic-content', label: 'динамический контент' },
            { prefix: '/api/welcome', label: 'контент приветствия' },
            { prefix: '/api/about-club', label: 'информацию о клубе' },
            { prefix: '/api/schumann', label: 'частоту Шумана' },
            { prefix: '/api/broadcast', label: 'рассылку' },
            { prefix: '/api/purpose-energy', label: 'энергию предназначения' },
            { prefix: '/api/faq', label: 'FAQ' },
            { prefix: '/api/user', label: 'пользователя' },
            { prefix: '/api/admin', label: 'администратора' },
        ];

        const resource = resourceLabels.find((item) => path.startsWith(item.prefix));
        const label = resource?.label || 'объект';

        if (method === 'POST') {
            return `Создал(а) ${label}${titleSuffix} (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }
        if (method === 'PUT' || method === 'PATCH') {
            return `Обновил(а) ${label}${titleSuffix} (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }
        if (method === 'DELETE') {
            return `Удалил(а) ${label}${titleSuffix} (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
        }

        return `${method} ${path} (${isSuccess ? 'успешно' : `ошибка ${status}`})`;
    };

    res.on('finish', () => {
        const adminRoles = ['admin', 'manager', 'content_manager', 'client_manager'];
        if (!adminRoles.includes(user.role)) return;

        const method = req.method.toUpperCase();
        if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) return;

        const action = buildActionDescription();
        AdminActionLog.create({
            admin: user._id,
            action,
        }).catch((error) => {
            console.log("Ошибка логирования действий админа:", error);
        });
    });

    next();
};

