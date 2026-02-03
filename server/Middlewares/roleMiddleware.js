// Middleware для проверки ролей пользователя

/**
 * Проверяет, что у пользователя есть одна из требуемых ролей
 * @param {string[]} allowedRoles - массив разрешенных ролей
 */
export const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        // authMiddleware должен быть вызван перед этим middleware
        if (!req.user) {
            console.log("requireRole: req.user отсутствует");
            return res.status(401).json({
                success: false,
                message: "Требуется авторизация",
            });
        }

        const userRole = req.user.role;
        console.log("requireRole: userRole =", userRole, "allowedRoles =", allowedRoles);

        // Проверяем, есть ли у пользователя одна из разрешенных ролей
        if (!allowedRoles.includes(userRole)) {
            console.log("requireRole: доступ запрещен. Роль пользователя:", userRole, "Разрешенные роли:", allowedRoles);
            return res.status(403).json({
                success: false,
                message: "Недостаточно прав доступа",
            });
        }

        next();
    };
};

/**
 * Проверка доступа для контент-менеджера
 * Разрешает: content_manager, manager, admin
 */
export const requireContentManager = requireRole(['content_manager', 'manager', 'admin']);

/**
 * Проверка доступа для менеджера по клиентам
 * Разрешает: client_manager, manager, admin
 */
export const requireClientManager = requireRole(['client_manager', 'manager', 'admin']);

/**
 * Проверка доступа для менеджера (полный доступ)
 * Разрешает: manager, admin
 */
export const requireManager = requireRole(['manager', 'admin']);

/**
 * Проверка доступа для администратора
 * Разрешает: admin
 */
export const requireAdmin = requireRole(['admin']);

