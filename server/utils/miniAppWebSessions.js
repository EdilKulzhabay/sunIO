import User from "../Models/User.js";
import { sanitizeClientDeviceId } from "./clientDeviceId.js";

/** Два слота Telegram Mini App: [0] — предыдущий, [1] — последний вход (как browserWebSessions). */

const UPSERT_MAX_ATTEMPTS = 16;

function emptySlot() {
    return { deviceId: null, refreshToken: null };
}

/**
 * Читает два слота: из `miniAppWebSessions` либо legacy (refreshTokenMiniApp / clientDeviceIdMiniApp).
 */
export function readMiniAppTwoSlots(user) {
    const ma = user?.miniAppWebSessions;
    if (Array.isArray(ma) && ma.length >= 2) {
        const a = ma[0]?.deviceId
            ? { deviceId: ma[0].deviceId, refreshToken: ma[0].refreshToken ?? null }
            : null;
        const b = ma[1]?.deviceId
            ? { deviceId: ma[1].deviceId, refreshToken: ma[1].refreshToken ?? null }
            : null;
        return { s0: a, s1: b };
    }
    if (Array.isArray(ma) && ma.length === 1 && ma[0]?.deviceId) {
        return { s0: null, s1: { deviceId: ma[0].deviceId, refreshToken: ma[0].refreshToken ?? null } };
    }
    const legacyDev = user?.clientDeviceIdMiniApp;
    const legacyRt = user?.refreshTokenMiniApp;
    if (legacyDev) {
        return { s0: null, s1: { deviceId: legacyDev, refreshToken: legacyRt } };
    }
    return { s0: null, s1: null };
}

function normalizeTwoSlotsForSave(s0, s1) {
    const slot0 = s0?.deviceId
        ? { deviceId: s0.deviceId, refreshToken: s0.refreshToken ?? null }
        : emptySlot();
    const slot1 = s1?.deviceId
        ? { deviceId: s1.deviceId, refreshToken: s1.refreshToken ?? null }
        : emptySlot();
    return [slot0, slot1];
}

/**
 * Новый вход Mini App: бывший второй слот → первый, новая пара → второй.
 */
export async function upsertMiniAppWebSession(userId, deviceIdRaw, refreshToken) {
    const deviceId = sanitizeClientDeviceId(deviceIdRaw);

    for (let attempt = 0; attempt < UPSERT_MAX_ATTEMPTS; attempt++) {
        const user = await User.findById(userId);
        if (!user) return;

        if (!deviceId) {
            user.refreshTokenMiniApp = refreshToken;
            user.clientDeviceIdMiniApp = null;
            try {
                await user.save();
                return;
            } catch (e) {
                if (e?.name === "VersionError" && attempt < UPSERT_MAX_ATTEMPTS - 1) continue;
                throw e;
            }
        }

        const { s0, s1 } = readMiniAppTwoSlots(user);
        const newFirst = s1;
        const newSecond = { deviceId, refreshToken };

        user.miniAppWebSessions = normalizeTwoSlotsForSave(newFirst, newSecond);
        user.markModified("miniAppWebSessions");
        user.refreshTokenMiniApp = null;
        user.clientDeviceIdMiniApp = null;

        try {
            await user.save();
            return;
        } catch (e) {
            if (e?.name === "VersionError" && attempt < UPSERT_MAX_ATTEMPTS - 1) continue;
            throw e;
        }
    }
}

/** Снять один слот Mini App по deviceId (logout из Web App на этом устройстве). */
export async function removeMiniAppWebSession(userId, deviceIdRaw) {
    const sent = sanitizeClientDeviceId(deviceIdRaw);
    if (!sent) return;

    for (let attempt = 0; attempt < UPSERT_MAX_ATTEMPTS; attempt++) {
        const user = await User.findById(userId);
        if (!user) return;

        const { s0, s1 } = readMiniAppTwoSlots(user);
        let new0 = s0;
        let new1 = s1;

        if (s0?.deviceId === sent) {
            new0 = null;
        } else if (s1?.deviceId === sent) {
            new1 = null;
        } else {
            const legacy = user.clientDeviceIdMiniApp;
            if (legacy !== sent) return;
            user.clientDeviceIdMiniApp = null;
            user.refreshTokenMiniApp = null;
        }

        user.miniAppWebSessions = normalizeTwoSlotsForSave(new0, new1);
        user.markModified("miniAppWebSessions");

        try {
            await user.save();
            return;
        } catch (e) {
            if (e?.name === "VersionError" && attempt < UPSERT_MAX_ATTEMPTS - 1) continue;
            throw e;
        }
    }
}
