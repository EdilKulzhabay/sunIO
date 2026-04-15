import jwt from "jsonwebtoken";
import User from "../Models/User.js";
import { sanitizeClientDeviceId } from "../utils/clientDeviceId.js";

const STAFF_ROLES_DEVICE_SKIP = ["admin", "manager", "content_manager", "client_manager"];

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            next();
            return;
            // return res.status(401).json({
            //     success: false,
            //     message: "Токен не предоставлен",
            // });
        }

        // Проверяем валидность токена
        const decoded = jwt.verify(token, process.env.SecretKey);

        // Проверяем, что этот токен является актуальным для пользователя
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(403).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        // Админы и менеджеры могут иметь доступ даже если заблокированы
        // Для обычных пользователей проверяем блокировку
        if (user.isBlocked && !['admin', 'manager', 'content_manager', 'client_manager'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: "Аккаунт заблокирован",
            });
        }

        if (
            user.clientDeviceId &&
            !STAFF_ROLES_DEVICE_SKIP.includes(user.role)
        ) {
            const sent = sanitizeClientDeviceId(req.headers["x-device-id"]);
            if (!sent || sent !== user.clientDeviceId) {
                return res.status(403).json({
                    success: false,
                    message: "Сессия привязана к другому устройству. Войдите снова.",
                    deviceSessionInvalid: true,
                    sessionExpired: true,
                });
            }
        }

        req.userId = decoded.userId;
        req.user = user;

        console.log("authMiddleware: user установлен, role =", user.role, "status =", user.status);
        next();
    } catch (error) {
        console.log("Auth middleware error:", error);
        
        if (error.name === "TokenExpiredError") {
            return res.status(403).json({
                success: false,
                message: "Токен истек",
                sessionExpired: true,
            });
        }

        return res.status(403).json({
            success: false,
            message: "Нет доступа",
            sessionExpired: true,
        });
    }
};

/** JWT при наличии; при ошибке или отсутствии токена — просто next() (без 403). Для аналитики просмотров. */
export const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) return next();

        const decoded = jwt.verify(token, process.env.SecretKey);
        const user = await User.findById(decoded.userId);
        if (!user) return next();

        if (
            user.isBlocked &&
            !["admin", "manager", "content_manager", "client_manager"].includes(user.role)
        ) {
            return next();
        }

        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch {
        next();
    }
};

/** Сводки по клиентским просмотрам — admin, manager, client_manager */
export const requireStaffAnalyticsMiddleware = (req, res, next) => {
    if (!req.userId || !req.user) {
        return res.status(401).json({ success: false, message: "Требуется авторизация" });
    }
    if (!["admin", "manager", "client_manager"].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Доступ запрещён" });
    }
    next();
};

