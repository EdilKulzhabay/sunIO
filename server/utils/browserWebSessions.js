import User from "../Models/User.js";
import { sanitizeClientDeviceId } from "./clientDeviceId.js";

/** Одновременных браузерных сессий (не Mini App) на аккаунт. */
export const MAX_BROWSER_WEB_SESSIONS = 2;

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
 */
export async function upsertBrowserWebSession(userId, deviceIdRaw, refreshToken) {
    const deviceId = sanitizeClientDeviceId(deviceIdRaw);
    const user = await User.findById(userId).lean();
    if (!user) return;

    let sessions = mergeSessionsFromUser(user);

    if (!deviceId) {
        await User.findByIdAndUpdate(userId, {
            $set: { refreshTokenWeb: refreshToken },
            $unset: { clientDeviceId: "", refreshToken: "" },
        });
        return;
    }

    const ix = sessions.findIndex((s) => s.deviceId === deviceId);
    if (ix >= 0) {
        sessions[ix] = { deviceId, refreshToken };
    } else if (sessions.length < MAX_BROWSER_WEB_SESSIONS) {
        sessions.push({ deviceId, refreshToken });
    } else {
        sessions = [...sessions.slice(1), { deviceId, refreshToken }];
    }

    await User.findByIdAndUpdate(userId, {
        $set: {
            browserWebSessions: sessions,
            refreshTokenWeb: refreshToken,
            clientDeviceIdWeb: null,
            clientDeviceId: null,
            refreshToken: null,
        },
    });
}
