import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isIosPwaStandalone } from "../utils/pwaEnv";
import {
    pathnameExcludesUserIosPwaTopInset,
    pathnameIsClientUserAppPage,
} from "../utils/clientUserRoutes";

const TOP_PX = 50;
/** Фон полосы под статус-баром (как на клиентских экранах), иначе виден белый body */
const INSET_BG = "#031F23";

/**
 * В PWA на iOS контент заходит под статус-бар / вырез.
 * Добавляет padding-top корневому контейнеру на экранах из `pages/User`.
 */
export function UserIosPwaTopInset() {
    const { pathname } = useLocation();

    useEffect(() => {
        const root = document.getElementById("root");
        if (!root) return;

        const active =
            isIosPwaStandalone() &&
            pathnameIsClientUserAppPage(pathname) &&
            !pathnameExcludesUserIosPwaTopInset(pathname);

        if (active) {
            root.style.paddingTop = `${TOP_PX}px`;
            root.style.backgroundColor = INSET_BG;
        } else {
            root.style.paddingTop = "";
            root.style.backgroundColor = "";
        }

        return () => {
            root.style.paddingTop = "";
            root.style.backgroundColor = "";
        };
    }, [pathname]);

    return null;
}
