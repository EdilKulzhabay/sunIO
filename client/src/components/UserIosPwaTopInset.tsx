import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isIosPwaStandalone } from "../utils/pwaEnv";
import { pathnameIsClientUserAppPage } from "../utils/clientUserRoutes";

const TOP_PX = 30;

/**
 * В PWA на iOS контент заходит под статус-бар / вырез.
 * Добавляет padding-top корневому контейнеру на экранах из `pages/User`.
 */
export function UserIosPwaTopInset() {
    const { pathname } = useLocation();

    useEffect(() => {
        const root = document.getElementById("root");
        if (!root) return;

        const apply =
            isIosPwaStandalone() && pathnameIsClientUserAppPage(pathname) ? `${TOP_PX}px` : "";

        root.style.paddingTop = apply;

        return () => {
            root.style.paddingTop = "";
        };
    }, [pathname]);

    return null;
}
