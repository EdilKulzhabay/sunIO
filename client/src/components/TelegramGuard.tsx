import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isTelegramWebView } from '../utils/telegramWebApp';

interface TelegramGuardProps {
    children: React.ReactNode;
}

/**
 * Компонент для защиты страниц - разрешает доступ только из Telegram WebApp
 * Перенаправляет на страницу блокировки, если открыто в обычном браузере
 */
export const TelegramGuard = ({ children }: TelegramGuardProps) => {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);
    const [isTelegram, setIsTelegram] = useState(false);

    useEffect(() => {
        // Даем небольшую задержку для инициализации Telegram WebApp SDK
        const checkTelegram = () => {
            const isInTelegram = isTelegramWebView();
            setIsTelegram(isInTelegram);
            setIsChecking(false);
            
            if (!isInTelegram) {
                // Если не в Telegram, перенаправляем на страницу блокировки
                console.warn('⚠️ Доступ запрещен: приложение открыто не в Telegram WebApp');
                navigate('/client/blocked-browser', { replace: true });
            }
        };

        // Проверяем сразу и через небольшую задержку (на случай, если SDK еще загружается)
        checkTelegram();
        const timeout = setTimeout(checkTelegram, 100);

        return () => clearTimeout(timeout);
    }, [navigate]);

    if (isChecking) {
        return null;
    }

    if (!isTelegram) {
        return null;
    }

    return <>{children}</>;
};

