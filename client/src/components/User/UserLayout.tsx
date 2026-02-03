import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useTelegramFullscreen } from '../../utils/telegramWebApp';

interface UserLayoutProps {
    children: ReactNode;
}

export const UserLayout = ({ children }: UserLayoutProps) => {
    // Используем хук для safe area и fullscreen режима
    useTelegramFullscreen();

    // Защита от копирования текста
    useEffect(() => {
        // Функция для проверки, является ли элемент полем ввода или находится внутри него
        const isInputElement = (element: HTMLElement | null): boolean => {
            if (!element) return false;
            const tagName = element.tagName?.toUpperCase();
            if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
                return true;
            }
            // Проверяем родительские элементы
            const closestInput = element.closest('input, textarea, [contenteditable="true"]');
            return closestInput !== null;
        };

        // Функция для проверки, является ли элемент iframe или находится внутри iframe контейнера
        const isVideoElement = (element: HTMLElement | null): boolean => {
            if (!element) return false;
            const tagName = element.tagName?.toUpperCase();
            if (tagName === 'IFRAME') {
                return true;
            }
            // Проверяем, находится ли элемент внутри контейнера с iframe
            const closestIframe = element.closest('iframe');
            if (closestIframe) return true;
            // Проверяем, находится ли элемент внутри контейнера видео (может иметь data-video-id или специфические классы)
            const videoContainer = element.closest('[data-video-id], .relative.w-full.rounded-lg');
            return videoContainer !== null && videoContainer.querySelector('iframe') !== null;
        };

        // Предотвращение выделения текста
        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement;
            // Разрешаем выделение в полях ввода, textarea и видео элементах
            if (!isInputElement(target) && !isVideoElement(target)) {
                e.preventDefault();
                return false;
            }
        };

        // Предотвращение копирования
        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            // Разрешаем копирование только из полей ввода и textarea
            if (!isInputElement(target)) {
                e.preventDefault();
                return false;
            }
        };

        // Предотвращение вырезания
        const handleCut = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            // Разрешаем вырезание только из полей ввода и textarea
            if (!isInputElement(target)) {
                e.preventDefault();
                return false;
            }
        };

        // Предотвращение контекстного меню (правый клик)
        const handleContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Разрешаем контекстное меню в полях ввода, textarea и видео элементах (для полноэкранного режима)
            if (!isInputElement(target) && !isVideoElement(target)) {
                e.preventDefault();
                return false;
            }
        };

        // Предотвращение горячих клавиш
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Разрешаем горячие клавиши только в полях ввода и textarea
            if (isInputElement(target)) {
                return;
            }

            // Блокируем Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+X, Ctrl+S, Ctrl+P
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                if (['c', 'a', 'v', 'x', 's', 'p'].includes(key)) {
                    e.preventDefault();
                    return false;
                }
            }

            // Блокируем F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Блокируем Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (DevTools и просмотр кода)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
                if (['i', 'j'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    return false;
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
                e.preventDefault();
                return false;
            }
        };

        // Предотвращение перетаскивания изображений
        const handleDragStart = (e: DragEvent) => {
            e.preventDefault();
            return false;
        };

        // Добавляем обработчики событий
        document.addEventListener('selectstart', handleSelectStart);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('dragstart', handleDragStart);

        // Очистка обработчиков при размонтировании
        return () => {
            document.removeEventListener('selectstart', handleSelectStart);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('dragstart', handleDragStart);
        };
    }, []);

    return (
        <div 
            className="min-h-screen" 
            style={{ 
                backgroundColor: '#161616', 
                color: '#ffffff',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                WebkitTouchCallout: 'none',
                margin: 0,
                // CSS переменные устанавливаются через useTelegramFullscreen()
                paddingTop: 'var(--tg-safe-top, 0px)',
                paddingBottom: 'var(--tg-safe-bottom, 0px)',
                paddingLeft: 'var(--tg-safe-left, 0px)',
                paddingRight: 'var(--tg-safe-right, 0px)'
            }}
        >
            <div className="">
                {children}
            </div>
        </div>
    );
};

