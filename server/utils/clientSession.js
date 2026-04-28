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

/** Актуальный браузерный deviceId: слот [1] (последний вход), иначе [0], иначе legacy. */
export function getWebDeviceId(user) {
    if (!user) return null;
    const bw = user.browserWebSessions;
    if (Array.isArray(bw) && bw.length >= 2) {
        if (bw[1]?.deviceId) return bw[1].deviceId;
        if (bw[0]?.deviceId) return bw[0].deviceId;
    }
    if (Array.isArray(bw) && bw.length === 1 && bw[0]?.deviceId) return bw[0].deviceId;
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

/** Все deviceId активных слотов Telegram Mini App + legacy один слой. */
export function collectMiniAppDeviceIds(user) {
    const ids = [];
    const ma = user?.miniAppWebSessions;
    if (Array.isArray(ma)) {
        for (const s of ma) {
            if (s?.deviceId) ids.push(s.deviceId);
        }
    }
    const legacy = user?.clientDeviceIdMiniApp;
    if (legacy && !ids.includes(legacy)) ids.push(legacy);
    return ids;
}

/** Последний слот Mini App [1], иначе [0], иначе legacy — для операций «одним id». */
export function getMiniAppDeviceId(user) {
    if (!user) return null;
    const bw = user.miniAppWebSessions;
    if (Array.isArray(bw) && bw.length >= 2) {
        if (bw[1]?.deviceId) return bw[1].deviceId;
        if (bw[0]?.deviceId) return bw[0].deviceId;
    }
    if (Array.isArray(bw) && bw.length === 1 && bw[0]?.deviceId) return bw[0].deviceId;
    return user.clientDeviceIdMiniApp ?? null;
}

export function userHasDeviceSessionBinding(user) {
    return collectBrowserDeviceIds(user).length > 0 || collectMiniAppDeviceIds(user).length > 0;
}

export function deviceIdMatchesUserSessions(user, sentRaw) {
    const sent = sanitizeClientDeviceId(sentRaw);
    if (!sent) return false;
    if (collectMiniAppDeviceIds(user).includes(sent)) return true;
    return collectBrowserDeviceIds(user).includes(sent);
}

export function sentMatchesAnyBrowserSession(user, sentRaw) {
    const sent = sanitizeClientDeviceId(sentRaw);
    if (!sent) return false;
    return collectBrowserDeviceIds(user).includes(sent);
}
