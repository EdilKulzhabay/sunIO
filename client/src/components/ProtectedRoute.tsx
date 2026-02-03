import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Role = "user" | "admin" | "content_manager" | "client_manager" | "manager";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: Role | Role[];
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Загрузка...</div>
            </div>
        );
    }

    // Проверка для админских страниц
    if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        
        // Проверяем наличие токена в localStorage перед редиректом
        // Это позволяет избежать редиректа при временных проблемах с API
        const token = localStorage.getItem("token");
        const userFromStorage = localStorage.getItem("user");
        
        // Если пользователь не авторизован и нет токена - редирект на /login
        if (!user && !token && !userFromStorage) {
            return <Navigate to="/login" replace />;
        }
        
        // Если пользователь не авторизован, но есть токен - возможно идет проверка
        // Для админов даем больше времени на проверку
        if (!user && token) {
            try {
                const parsedUser = userFromStorage ? JSON.parse(userFromStorage) : null;
                // Если в localStorage есть админ, показываем контент (API может быть временно недоступен)
                if (parsedUser && ['admin', 'manager', 'content_manager', 'client_manager'].includes(parsedUser.role)) {
                    // Проверяем, что роль соответствует требуемой
                    if (allowedRoles.includes(parsedUser.role as Role)) {
                        return <>{children}</>;
                    }
                }
            } catch (e) {
                // Если ошибка парсинга, продолжаем обычную проверку
            }
        }
        
        // Если пользователь не авторизован - редирект на /login
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        
        // Если у пользователя нет нужной роли - редирект на главную
        if (!user.role || !allowedRoles.includes(user.role as Role)) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

