import jwt from "jsonwebtoken";
import User from "../Models/User.js";

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

