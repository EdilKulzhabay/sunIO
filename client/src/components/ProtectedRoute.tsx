import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const CLIENT_TELEGRAM_AUTH = "/client/telegram-auth";

function getStoredAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token") || window.localStorage.getItem("authToken");
}

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

    if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

        const token = getStoredAuthToken();
        const userFromStorage = localStorage.getItem("user");

        if (!user && !token && !userFromStorage) {
            return <Navigate to={CLIENT_TELEGRAM_AUTH} replace />;
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
            return <Navigate to={CLIENT_TELEGRAM_AUTH} replace />;
        }

        if (!user || !user.role || !allowedRoles.includes(user.role as Role)) {
            return <Navigate to="/" replace />;
        }

        return <>{children}</>;
    }

    const token = getStoredAuthToken();
    if (!token || !user) {
        return <Navigate to={CLIENT_TELEGRAM_AUTH} replace />;
    }

    return <>{children}</>;
};
