import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

interface User {
    _id: string;
    fullName: string;
    telegramUserName: string;
    phone: string;
    mail: string;
    role: string;
    status: string;
    isBlocked?: boolean;
    hasPaid?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (fullName: string, email: string, phone: string, telegramId?: string) => Promise<void>;
    logout: () => void;
    checkSession: () => Promise<boolean>;
    updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            checkSession();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem("token");
        
        const userStr = localStorage.getItem("user");
        let userFromStorage: User | null = null;
        if (userStr) {
            try {
                const parsed = JSON.parse(userStr);
                if (parsed && parsed !== null && Object.keys(parsed).length > 0) {
                    userFromStorage = parsed;
                    setUser(userFromStorage);
                    // Проверка на блокировку пользователя
                    if (userFromStorage && userFromStorage.isBlocked && userFromStorage.role !== 'admin') {
                        navigate('/client/blocked-user');
                    }
                }
            } catch (e) {
                console.error("Ошибка парсинга user из localStorage:", e);
            }
        }
        
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get("/api/user/me");
            if (response.data.success) {
                setUser(response.data.user);
                localStorage.setItem("user", JSON.stringify(response.data.user));
                
                // Проверка на блокировку пользователя
                if (response.data.user.isBlocked && response.data.user.role !== 'admin') {
                    navigate('/client/blocked-user');
                }
            } else {
                // Если ответ не успешен, но пользователь был в localStorage с валидной ролью админа
                // Оставляем его, чтобы не выбрасывать со страницы при временных проблемах
                if (userFromStorage && ['admin', 'manager', 'content_manager', 'client_manager'].includes(userFromStorage.role)) {
                    // Оставляем пользователя из localStorage
                    console.log("API вернул ошибку, но оставляем пользователя из localStorage (админ)");
                } else {
                    // Только если ответ явно говорит об ошибке авторизации и нет валидного пользователя в localStorage
                    setUser(null);
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                }
            }
        } catch (error: any) {
            console.log("Ошибка проверки авторизации:", error);
            // Сбрасываем пользователя только при явной ошибке авторизации (401/403)
            // При других ошибках (сеть, таймаут и т.д.) оставляем пользователя из localStorage
            if (error.response?.status === 403 || error.response?.status === 401) {
                // При 401/403 сбрасываем только если пользователь не админ
                // Админы могут иметь доступ даже при временных проблемах с API
                if (!userFromStorage || !['admin', 'manager', 'content_manager', 'client_manager'].includes(userFromStorage.role)) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                    setUser(null);
                } else {
                    // Для админов оставляем пользователя из localStorage даже при 401/403
                    console.log("401/403 ошибка, но оставляем админа из localStorage");
                }
            } else {
                // При сетевых ошибках или других проблемах оставляем пользователя из localStorage
                // Это позволяет оставаться на странице при временных проблемах с сетью
                if (!userFromStorage) {
                    // Если пользователя не было в localStorage, то сбрасываем
                    setUser(null);
                } else {
                    // Пользователь из localStorage остается, даже если API недоступен
                    console.log("Сетевая ошибка, но оставляем пользователя из localStorage");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const checkSession = async (): Promise<boolean> => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            return false;
        }

        try {
            const response = await api.get("/api/user/check-session");
            return response.data.success;
        } catch (error: any) {
            if (error.response?.data?.sessionExpired) {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                const telegramId = localStorage.getItem("telegramId");
                if (!telegramId) {
                    localStorage.removeItem("user");
                    setUser(null);
                }
            }
            return false;
        }
    };

    const login = async (email: string, password: string) => {
        const response = await api.post("/api/user/login", { email, password });
        
        if (response.data.success) {
            localStorage.setItem("token", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);
            setUser(response.data.userData);
            localStorage.setItem("user", JSON.stringify(response.data.userData));
            
            // Проверка на блокировку пользователя
            if (response.data.userData.isBlocked && response.data.userData.role !== 'admin') {
                navigate('/client/blocked-user');
                return;
            }
            
            const redirectPath = localStorage.getItem("redirectAfterLogin");
            if (redirectPath) {
                localStorage.removeItem("redirectAfterLogin");
                navigate(redirectPath);
            } else {
                if (response.data.userData.role === "admin") {
                    navigate("/admin");
                } else {
                    navigate("/main");
                }
            }
        } else {
            throw new Error(response.data.message || "Ошибка авторизации");
        }
    };

    const register = async (fullName: string, email: string, phone: string, telegramId?: string) => {
        const response = await api.post("/api/user/register", { 
            fullName, 
            mail: email, 
            phone, 
            ...(telegramId && { telegramId })
        });
        
        if (response.data.success) {
            localStorage.setItem("token", response.data.accessToken);
            localStorage.setItem("refreshToken", response.data.refreshToken);
            setUser(response.data.userData);
            localStorage.setItem("user", JSON.stringify(response.data.userData));
            
            // Проверка на блокировку пользователя
            if (response.data.userData.isBlocked && response.data.userData.role !== 'admin') {
                navigate('/client/blocked-user');
                return;
            }
            
            const redirectPath = localStorage.getItem("redirectAfterLogin");
            if (redirectPath) {
                localStorage.removeItem("redirectAfterLogin");
                navigate(redirectPath);
            } else {
                if (response.data.userData.role === "admin") {
                    navigate("/admin");
                } else {
                    navigate("/main");
                }
            }
        } else {
            throw new Error(response.data.message || "Ошибка регистрации");
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/login");
    };

    const updateUser = (userData: User) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Проверка на блокировку пользователя
        if (userData.isBlocked && userData.role !== 'admin') {
            navigate('/client/blocked-user');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, checkSession, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth должен использоваться внутри AuthProvider");
    }
    return context;
};

