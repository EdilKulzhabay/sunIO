import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { hasWebAppBootstrapParams } from "../utils/telegramWebAppSessionBootstrap";

/** Неавторизованных ведём на Welcome — дальше сценарий входа (в т.ч. Telegram) с этой ветки. */
const UNAUTHENTICATED_REDIRECT = "/";

function getStoredAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token") || window.localStorage.getItem("authToken");
}

type Role = "user" | "admin" | "content_manager" | "client_manager" | "manager";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: Role | Role[];
}

function isMainPath(pathname: string): boolean {
    const p = (pathname || "/").replace(/\/+$/, "") || "/";
    return p === "/main";
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Загрузка...</div>
            </div>
        );
    }

    if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        const token = getStoredAuthToken();
        const userFromStorage = localStorage.getItem("user");

        if (!user && !token && !userFromStorage) {
            return <Navigate to={UNAUTHENTICATED_REDIRECT} replace />;
        }

        if (!user && token) {
            try {
                const parsedUser = userFromStorage ? JSON.parse(userFromStorage) : null;
                if (
                    parsedUser &&
                    ["admin", "manager", "content_manager", "client_manager"].includes(parsedUser.role)
                ) {
                    if (allowedRoles.includes(parsedUser.role as Role)) {
                        return <>{children}</>;
                    }
                }
            } catch {
                /* ignore */
            }
        }

        if (!user) {
            return <Navigate to={UNAUTHENTICATED_REDIRECT} replace />;
        }

        if (!user || !user.role || !allowedRoles.includes(user.role as Role)) {
            return <Navigate to="/" replace />;
        }

        return <>{children}</>;
    }

    /** Вход из кнопки Web App бота: на /main уже есть wb_ts/wb_sig — пусть Main запросит сессию, не редирект на telegram-auth */
    const mainWebAppBootstrap =
        isMainPath(location.pathname) && hasWebAppBootstrapParams(new URLSearchParams(location.search));
    if (mainWebAppBootstrap) {
        return <>{children}</>;
    }

    const token = getStoredAuthToken();
    if (!token || !user) {
        return <Navigate to={UNAUTHENTICATED_REDIRECT} replace />;
    }

    return <>{children}</>;
};
