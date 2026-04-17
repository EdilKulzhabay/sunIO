import crypto from "crypto";

export function signWebAppBootstrap(telegramId, ts, secret) {
    const msg = `${String(telegramId).trim()}.${ts}`;
    return crypto.createHmac("sha256", String(secret)).update(msg, "utf8").digest("hex");
}

const MAX_SKEW_SEC = 600;

export function verifyWebAppBootstrap(telegramId, ts, sig, secret) {
    if (!secret || !telegramId || sig == null || sig === "") return false;
    const t = typeof ts === "number" ? ts : Number.parseInt(String(ts), 10);
    if (!Number.isFinite(t)) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - t) > MAX_SKEW_SEC) return false;
    const expected = signWebAppBootstrap(telegramId, t, secret);
    const a = Buffer.from(String(sig).trim(), "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}
