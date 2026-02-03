import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// КРИТИЧНО: Расширяем WebApp ДО любого импорта или инициализации
// Это особенно важно для menuButton, который открывается в компактном режиме
if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    
    // Первое расширение - максимально рано, до ready()
    try {
        tg.expand();
        // console.log('🚀 Первое расширение WebApp выполнено');
    } catch (e) {
        console.warn('⚠️ Ошибка первого расширения:', e);
    }
    
    // Динамический импорт и инициализация
    import('./utils/telegramWebApp').then(({ initTelegramWebApp }) => {
        initTelegramWebApp();
    });
}

createRoot(document.getElementById('root')!).render(
    <App />
)
