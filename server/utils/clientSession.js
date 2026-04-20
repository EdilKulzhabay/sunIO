import { sanitizeClientDeviceId } from "./clientDeviceId.js";

/** Браузер: access + refresh 30 дней */
export const BROWSER_JWT_EXPIRES = "30d";

/**
 * Mini App: отдельная сессия без практического срока (JWT требует exp — ~10 лет).
 */
export const MINIAPP_JWT_EXPIRES = "3650d";

export function isTelegramMiniAppRequest(req) {
    const v = req.headers["x-telegram-webapp"];
    return v === "true" || v === true;
}

/** Первый браузерный deviceId (legacy или из массива) — для обратной совместимости. */
export function getWebDeviceId(user) {
    if (!user) return null;
    if (Array.isArray(user.browserWebSessions) && user.browserWebSessions.length > 0) {
        const first = user.browserWebSessions.find((s) => s?.deviceId);
        if (first?.deviceId) return first.deviceId;
    }
    return user.clientDeviceIdWeb ?? user.clientDeviceId ?? null;
}

export function collectBrowserDeviceIds(user) {
    const ids = new Set();
    if (Array.isArray(user?.browserWebSessions)) {
        for (const s of user.browserWebSessions) {
            if (s?.deviceId) ids.add(s.deviceId);
        }
    }
    const legacy = user?.clientDeviceIdWeb ?? user?.clientDeviceId;
    if (legacy) ids.add(legacy);
    return [...ids];
}

export function getMiniAppDeviceId(user) {
    if (!user) return null;
    return user.clientDeviceIdMiniApp ?? null;
}

export function userHasDeviceSessionBinding(user) {
    return collectBrowserDeviceIds(user).length > 0 || !!getMiniAppDeviceId(user);
}

export function deviceIdMatchesUserSessions(user, sentRaw) {
    const sent = sanitizeClientDeviceId(sentRaw);
    if (!sent) return false;
    if (getMiniAppDeviceId(user) === sent) return true;
    return collectBrowserDeviceIds(user).includes(sent);
}

export function sentMatchesAnyBrowserSession(user, sentRaw) {
    const sent = sanitizeClientDeviceId(sentRaw);
    if (!sent) return false;
    return collectBrowserDeviceIds(user).includes(sent);
}
