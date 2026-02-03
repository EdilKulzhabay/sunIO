import { RouterProvider } from "react-router-dom";
import { routes } from "./routes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import { useTelegramFullscreen } from "./utils/telegramWebApp";

function App() {
    useTelegramFullscreen();
    
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
            tg.setHeaderColor("#161616");
            tg.setBackgroundColor("#161616");
            
            if (tg.BackButton) {
                tg.BackButton.hide();
            }
            
            setTimeout(() => {
                if (!tg.isExpanded) {
                    tg.expand();
                }
            }, 100);
            
            tg.onEvent('viewportChanged', () => {
                if (!tg.isExpanded) {
                    tg.expand();
                }
            });
        }
    }, []);
    
    return (
        <>
            <RouterProvider router={routes} />
            <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </>
    )
}

export default App
