import User from "../Models/User.js";
import { sanitizeClientDeviceId } from "./clientDeviceId.js";

/** Одновременных браузерных сессий (не Mini App) на аккаунт. */
export const MAX_BROWSER_WEB_SESSIONS = 2;

const UPSERT_MAX_ATTEMPTS = 16;

function mergeSessionsFromUser(user) {
    const byId = new Map();
    if (Array.isArray(user?.browserWebSessions)) {
        for (const s of user.browserWebSessions) {
            if (s?.deviceId) {
                byId.set(s.deviceId, { deviceId: s.deviceId, refreshToken: s.refreshToken ?? null });
            }
        }
    }
    const legacyDev = user?.clientDeviceIdWeb ?? user?.clientDeviceId;
    const legacyRt = user?.refreshTokenWeb ?? user?.refreshToken;
    if (legacyDev && !byId.has(legacyDev)) {
        byId.set(legacyDev, { deviceId: legacyDev, refreshToken: legacyRt ?? null });
    }
    return [...byId.values()];
}

/**
 * До MAX_BROWSER_WEB_SESSIONS слотов: новое устройство вытесняет самую старую запись (FIFO).
 * Сохранение через `save()` + повтор при VersionError — иначе два параллельных входа
 * перезаписывают друг друга и в БД остаётся одна браузерная сессия.
 */
export async function upsertBrowserWebSession(userId, deviceIdRaw, refreshToken) {
    const deviceId = sanitizeClientDeviceId(deviceIdRaw);

    for (let attempt = 0; attempt < UPSERT_MAX_ATTEMPTS; attempt++) {
        const user = await User.findById(userId);
        if (!user) return;

        if (!deviceId) {
            user.refreshTokenWeb = refreshToken;
            user.clientDeviceId = null;
            user.refreshToken = null;
            try {
                await user.save();
                return;
            } catch (e) {
                if (e?.name === "VersionError" && attempt < UPSERT_MAX_ATTEMPTS - 1) continue;
                throw e;
            }
        }

        let sessions = mergeSessionsFromUser(user);

        const ix = sessions.findIndex((s) => s.deviceId === deviceId);
        if (ix >= 0) {
            sessions[ix] = { deviceId, refreshToken };
        } else if (sessions.length < MAX_BROWSER_WEB_SESSIONS) {
            sessions.push({ deviceId, refreshToken });
        } else {
            sessions = [...sessions.slice(1), { deviceId, refreshToken }];
        }

        user.browserWebSessions = sessions;
        user.markModified("browserWebSessions");
        user.refreshTokenWeb = refreshToken;
        user.clientDeviceIdWeb = null;
        user.clientDeviceId = null;
        user.refreshToken = null;

        try {
            await user.save();
            return;
        } catch (e) {
            if (e?.name === "VersionError" && attempt < UPSERT_MAX_ATTEMPTS - 1) continue;
            throw e;
        }
    }
}
