import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";

/** Не шлём просмотры служебных экранов (вне TelegramGuard обычно не попадаем). */
const EXCLUDE_PREFIXES = ["/client/blocked-browser"];

/**
 * Фиксирует открытие страницы на сервере (популярность URL + разрез по userId при наличии JWT).
 */
export const ClientPageViewTracker = () => {
    const location = useLocation();
    const dedupeRef = useRef<{ path: string; at: number }>({ path: "", at: 0 });

    useEffect(() => {
        const path = location.pathname;
        if (!path.startsWith("/")) return;
        if (EXCLUDE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return;

        const now = Date.now();
        const { path: prev, at } = dedupeRef.current;
        if (prev === path && now - at < 600) return;
        dedupeRef.current = { path, at: now };

        api.post("/api/client-analytics/page-view", { path }).catch(() => {
            /* аналитика не должна ломать приложение */
        });
    }, [location.pathname, location.key]);

    return null;
};
