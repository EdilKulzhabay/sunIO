// Утилита для работы с Telegram WebApp API
import { useEffect } from 'react';

// Типы для Telegram WebApp API
declare global {
    interface Window {
        Telegram?: {
            WebApp?: {
                ready: () => void;
                expand: () => void;
                isExpanded: boolean;
                enableClosingConfirmation: () => void;
                disableClosingConfirmation: () => void;
                enableVerticalSwipes: () => void;
                disableVerticalSwipes: () => void;
                setHeaderColor: (color: string) => void;
                setBackgroundColor: (color: string) => void;
                onEvent: (eventType: string, eventHandler: () => void) => void;
                offEvent: (eventType: string, eventHandler: () => void) => void;
                version: string;
                platform: string;
                viewport?: {
                    safeArea?: {
                        top?: number;
                        bottom?: number;
                        left?: number;
                        right?: number;
                    };
                };
                // Новые API для safe area (Android)
                contentSafeAreaInset?: {
                    top?: number;
                    bottom?: number;
                    left?: number;
                    right?: number;
                };
                safeAreaInset?: {
                    top?: number;
                    bottom?: number;
                    left?: number;
                    right?: number;
                };
                initData?: string;
                initDataUnsafe?: {
                    user?: {
                        id: number;
                        first_name?: string;
                        last_name?: string;
                        username?: string;
                    };
                };
                BackButton?: {
                    show: () => void;
                    hide: () => void;
                    onClick: (callback: () => void) => void;
                    offClick: (callback: () => void) => void;
                    isVisible: boolean;
                };
                // Методы для открытия ссылок
                openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
                openTelegramLink: (url: string) => void;
            };
        };
    }
}

/**
 * Инициализирует Telegram WebApp и расширяет его на весь экран
 * Гарантирует полную высоту на всех платформах (Android, iOS, Desktop, Web)
 */
export const initTelegramWebApp = () => {
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // 1. Вызываем expand() ДО ready() для более раннего расширения
        // Это критично для menuButton - нужно расширить до полной инициализации
        try {
            tg.expand();
        } catch (error) {
            console.warn('⚠️ Ошибка при первом расширении Telegram WebApp:', error);
        }
        
        // 2. Вызываем ready() - обязательный вызов для инициализации WebApp
        tg.ready();
        
        // 3. Агрессивное расширение на весь экран с множественными попытками
        // Это критично для автоматического открытия на весь экран при запуске через menuButton
        try {
            // Немедленное расширение после ready()
            tg.expand();
            
            // Множественные вызовы для гарантии полноэкранного режима
            // Telegram menuButton требует больше попыток для корректного расширения
            const expandIntervals = [10, 30, 50, 100, 150, 200, 300, 500, 700, 1000];
            
            expandIntervals.forEach(delay => {
                setTimeout(() => {
                    if (!tg.isExpanded) {
                        console.log(`🔄 Попытка расширения через ${delay}ms...`);
                        tg.expand();
                    }
                }, delay);
            });
            
            // Дополнительные проверки через более длительные интервалы
            setTimeout(() => {
                if (!tg.isExpanded) {
                    console.warn('⚠️ WebApp все еще не расширен, принудительное расширение...');
                    tg.expand();
                }
            }, 1500);
            
            setTimeout(() => {
                if (!tg.isExpanded) {
                    console.warn('⚠️ Финальная попытка расширения...');
                    tg.expand();
                }
            }, 2000);
        } catch (error) {
            console.warn('⚠️ Ошибка при расширении Telegram WebApp:', error);
        }
        
        // 3. Отключаем вертикальные свайпы для предотвращения случайного закрытия приложения
        // Это критично для приложений с длинным контентом и прокруткой
        // Без этого пользователи могут случайно закрыть приложение при прокрутке вниз
        try {
            if (tg.disableVerticalSwipes) {
                tg.disableVerticalSwipes();
            }
        } catch (error) {
            console.warn('⚠️ Ошибка при отключении вертикальных свайпов:', error);
        }
        
        // 4. Обрабатываем событие viewportChanged для поддержания полной высоты
        // Это важно для случаев, когда размер viewport изменяется
        tg.onEvent('viewportChanged', () => {
            if (!tg.isExpanded) {
                tg.expand();
            }
        });
        
        // 5. Отключаем подтверждение закрытия (будем обрабатывать через навигацию)
        tg.disableClosingConfirmation();
        
        // 6. Скрываем кнопку "Назад" по умолчанию (будет показываться при необходимости через навигацию)
        if (tg.BackButton) {
            tg.BackButton.hide();
        }
        
        console.log('✅ Telegram WebApp инициализирован:', {
            version: tg.version,
            platform: tg.platform,
            isExpanded: tg.isExpanded
        });
        
        return tg;
    }
    
    return null;
};

/**
 * Настраивает обработку кнопки "Назад" в Telegram WebView
 * Вместо закрытия приложения использует навигацию назад через React Router
 */
export const setupTelegramBackButton = (onBack: () => void) => {
    if (window.Telegram?.WebApp?.BackButton) {
        const backButton = window.Telegram.WebApp.BackButton;
        
        // Показываем кнопку "Назад"
        backButton.show();
        
        // Обрабатываем клик на кнопку "Назад"
        backButton.onClick(() => {
            onBack();
        });
        
        return () => {
            // Очистка обработчика при размонтировании
            backButton.offClick(() => {
                onBack();
            });
            backButton.hide();
        };
    }
    
    return () => {};
};

/**
 * Скрывает кнопку "Назад" в Telegram WebView
 */
export const hideTelegramBackButton = () => {
    if (window.Telegram?.WebApp?.BackButton) {
        window.Telegram.WebApp.BackButton.hide();
    }
};

/**
 * Показывает кнопку "Назад" в Telegram WebView
 */
export const showTelegramBackButton = () => {
    if (window.Telegram?.WebApp?.BackButton) {
        window.Telegram.WebApp.BackButton.show();
    }
};

/**
 * Открывает ссылку: если в URL есть "t.me", открывает в Telegram (openTelegramLink),
 * иначе — во внешнем браузере (openLink) или window.open вне WebApp.
 */
export const openExternalLink = (url: string): void => {
    if (!url?.trim()) return;
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const tg = window.Telegram?.WebApp;
    if (tg) {
        if (normalized.includes('t.me')) {
            tg.openTelegramLink?.(normalized);
        } else {
            tg.openLink?.(normalized, { try_instant_view: false });
        }
    } else {
        window.open(normalized, '_blank', 'noopener,noreferrer');
    }
};

/**
 * Проверяет, запущено ли приложение в Telegram WebView
 * Более строгая проверка: проверяет наличие initData, который заполняется только в реальном Telegram WebApp
 * В обычном браузере скрипт SDK создает объект, но initData будет пустой строкой или undefined
 */
export const isTelegramWebView = (): boolean => {
    const tg = window.Telegram?.WebApp;
    
    if (!tg) {
        return false;
    }
    
    // Основная проверка: initData должен быть непустой строкой
    // В реальном Telegram WebApp initData всегда присутствует и содержит данные
    // В обычном браузере initData будет пустой строкой или undefined
    if (tg.initData && typeof tg.initData === 'string' && tg.initData.trim().length > 0) {
        return true;
    }
    
    // Дополнительная проверка: initDataUnsafe должен содержать данные
    // В реальном Telegram WebApp initDataUnsafe содержит объект с данными пользователя
    if (tg.initDataUnsafe && typeof tg.initDataUnsafe === 'object') {
        // Проверяем наличие user - это основное поле, которое есть только в реальном Telegram WebApp
        if (tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
            return true;
        }
    }
    
    // Если ничего не подошло, значит это не реальный Telegram WebApp
    return false;
};

/**
 * React хук для настройки Telegram WebApp fullscreen режима
 * Заполняет CSS переменные --tg-safe-* из Telegram API viewport.safeArea
 * Должен использоваться в корневом компоненте App
 */
export const useTelegramFullscreen = () => {
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        tg.ready();
        tg.expand();

        const apply = () => {
            // Для Android используем contentSafeAreaInset (новый API) или safeAreaInset (старый API)
            const safeAreaInset = tg.contentSafeAreaInset || tg.safeAreaInset;
            const viewportSafe = tg.viewport?.safeArea;
            
            let top = 0, bottom = 0, left = 0, right = 0;
            
            if (safeAreaInset) {
                // Новый API для safe area (работает лучше на Android)
                top = safeAreaInset.top || 0;
                bottom = safeAreaInset.bottom || 0;
                left = safeAreaInset.left || 0;
                right = safeAreaInset.right || 0;
            } else if (viewportSafe) {
                // Старый API через viewport
                top = viewportSafe.top || 0;
                bottom = viewportSafe.bottom || 0;
                left = viewportSafe.left || 0;
                right = viewportSafe.right || 0;
            }

            const addPadding = top > 0 ? 40 : 0;
            
            document.documentElement.style.setProperty("--tg-safe-top", `${top + addPadding}px`);
            document.documentElement.style.setProperty("--tg-safe-bottom", `${bottom}px`);
            document.documentElement.style.setProperty("--tg-safe-left", `${left}px`);
            document.documentElement.style.setProperty("--tg-safe-right", `${right}px`);
        };

        // Применяем сразу
        apply();
        
        // Применяем с задержкой для Android (иногда данные приходят позже)
        setTimeout(apply, 100);
        setTimeout(apply, 300);
        setTimeout(apply, 500);

        tg.onEvent?.("viewportChanged", apply);
        tg.onEvent?.("safeAreaChanged", apply);

        return () => {
            tg.offEvent?.("viewportChanged", apply);
            tg.offEvent?.("safeAreaChanged", apply);
        };
    }, []);
};

