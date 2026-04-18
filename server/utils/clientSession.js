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

/** Устаревшее поле clientDeviceId считаем браузерной сессией до миграции. */
export function getWebDeviceId(user) {
    if (!user) return null;
    return user.clientDeviceIdWeb ?? user.clientDeviceId ?? null;
}

export function getMiniAppDeviceId(user) {
    if (!user) return null;
    return user.clientDeviceIdMiniApp ?? null;
}

export function userHasDeviceSessionBinding(user) {
    return !!(getWebDeviceId(user) || getMiniAppDeviceId(user));
}

export function deviceIdMatchesUserSessions(user, sentRaw) {
    const sent = sanitizeClientDeviceId(sentRaw);
    if (!sent) return false;
    const web = getWebDeviceId(user);
    const mini = getMiniAppDeviceId(user);
    return sent === web || sent === mini;
}
