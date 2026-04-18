import axios from "axios";
import './utils/telegramWebApp';
import { getOrCreateClientDeviceId } from "./utils/clientDeviceId";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 1000 * 30,
    headers: {
        "X-Requested-With": "XMLHttpRequest",
    },
});

api.interceptors.request.use((config) => {
    const token = window.localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    const deviceId = getOrCreateClientDeviceId();
    if (deviceId) {
        config.headers["X-Device-Id"] = deviceId;
    }
    
    // Добавляем специальные заголовки для Telegram WebView
    if (window.Telegram?.WebApp) {
        config.headers['X-Telegram-WebApp'] = 'true';
        config.headers['X-Telegram-Platform'] = window.Telegram.WebApp.platform || 'unknown';
        
        // Добавляем initData если доступно (для серверной валидации)
        if (window.Telegram.WebApp.initData) {
            config.headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
        }
    }
    
    return config;
});

let consecutiveServerErrors = 0;
const SERVER_ERROR_THRESHOLD = 2;
const UNAVAILABLE_PATH = '/client/app-temporarily-unavailable';

function redirectToUnavailable() {
    if (window.location.pathname !== UNAVAILABLE_PATH) {
        window.location.href = UNAVAILABLE_PATH;
    }
}

api.interceptors.response.use(
    (response) => {
        consecutiveServerErrors = 0;
        return response;
    },
    (error) => {
        const isTelegramWebView = window.Telegram?.WebApp !== undefined;
        
        if (isTelegramWebView) {
            console.log('📱 Telegram WebView - Ошибка API:', {
                url: error.config?.url,
                status: error.response?.status,
                message: error.message,
                response: error.response?.data
            });
        }
        
        const isAuthCheck = error.config?.url?.includes('/user/me') || 
                           error.config?.url?.includes('/user/check-session');

        const status = error.response?.status;
        const isServerError = status && status >= 500;
        const isNetworkOrTimeout = !error.response && (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message === 'Network Error');

        if (isServerError || isNetworkOrTimeout) {
            consecutiveServerErrors++;
            if (consecutiveServerErrors >= SERVER_ERROR_THRESHOLD) {
                redirectToUnavailable();
            }
        }
        
        if (!error.response) {
            console.error('❌ Сетевая ошибка:', error.message);
            return Promise.reject(error);
        }

        if (error.response.status === 403 && error.response.data?.deviceSessionInvalid) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            if (window.location.pathname !== "/") {
                window.location.assign("/");
            }
            return Promise.reject(error);
        }
        
        if (error.response && error.response.status === 403 && !isAuthCheck) {
            if (error.response.data?.sessionExpired) {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                const telegramId = localStorage.getItem("telegramId");
                if (!telegramId) {
                    localStorage.removeItem("user");
                }
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;