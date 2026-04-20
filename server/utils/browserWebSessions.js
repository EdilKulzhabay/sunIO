import User from "../Models/User.js";
import { sanitizeClientDeviceId } from "./clientDeviceId.js";

/** Два слота браузера: [0] — предыдущий «второй», [1] — последний вход (сдвиг при каждом новом входе). */

const UPSERT_MAX_ATTEMPTS = 16;

function emptySlot() {
    return { deviceId: null, refreshToken: null };
}

/**
 * Читает два слота: либо из `browserWebSessions`, либо legacy (clientDeviceIdWeb / clientDeviceId).
 */
function readBrowserTwoSlots(user) {
    const bw = user?.browserWebSessions;
    if (Array.isArray(bw) && bw.length >= 2) {
        const a = bw[0]?.deviceId
            ? { deviceId: bw[0].deviceId, refreshToken: bw[0].refreshToken ?? null }
            : null;
        const b = bw[1]?.deviceId
            ? { deviceId: bw[1].deviceId, refreshToken: bw[1].refreshToken ?? null }
            : null;
        return { s0: a, s1: b };
    }
    if (Array.isArray(bw) && bw.length === 1 && bw[0]?.deviceId) {
        return { s0: null, s1: { deviceId: bw[0].deviceId, refreshToken: bw[0].refreshToken ?? null } };
    }
    const legacyDev = user?.clientDeviceIdWeb ?? user?.clientDeviceId;
    const legacyRt = user?.refreshTokenWeb ?? user?.refreshToken;
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
 * Новый браузерный вход: бывший второй слот → первый, новая пара → второй.
 * Параллельные входы — через save() + повтор при VersionError.
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

        const { s0, s1 } = readBrowserTwoSlots(user);
        const newFirst = s1;
        const newSecond = { deviceId, refreshToken };

        user.browserWebSessions = normalizeTwoSlotsForSave(newFirst, newSecond);
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

/**
 * Снять один браузерный слот по deviceId (logout с X-Device-Id).
 */
export async function removeBrowserWebSession(userId, deviceIdRaw) {
    const sent = sanitizeClientDeviceId(deviceIdRaw);
    if (!sent) return;

    for (let attempt = 0; attempt < UPSERT_MAX_ATTEMPTS; attempt++) {
        const user = await User.findById(userId);
        if (!user) return;

        const { s0, s1 } = readBrowserTwoSlots(user);
        let new0 = s0;
        let new1 = s1;

        if (s0?.deviceId === sent) {
            new0 = null;
        } else if (s1?.deviceId === sent) {
            new1 = null;
        } else {
            const legacy = user.clientDeviceIdWeb ?? user.clientDeviceId;
            if (legacy !== sent) return;
            user.clientDeviceIdWeb = null;
            user.clientDeviceId = null;
            user.refreshToken = null;
            user.refreshTokenWeb = null;
        }

        user.browserWebSessions = normalizeTwoSlotsForSave(new0, new1);
        user.markModified("browserWebSessions");

        try {
            await user.save();
            return;
        } catch (e) {
            if (e?.name === "VersionError" && attempt < UPSERT_MAX_ATTEMPTS - 1) continue;
            throw e;
        }
    }
}
