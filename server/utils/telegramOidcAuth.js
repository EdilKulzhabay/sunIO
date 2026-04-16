import * as jose from "jose";

const TELEGRAM_ISSUER = "https://oauth.telegram.org";
const JWKS = jose.createRemoteJWKSet(new URL("https://oauth.telegram.org/.well-known/jwks.json"));

/**
 * Проверка id_token из потока Log In With Telegram (OIDC).
 * @see https://core.telegram.org/bots/telegram-login
 */
export async function verifyTelegramOidcIdToken(idToken, clientId) {
    if (!idToken || typeof idToken !== "string") {
        throw new Error("missing id_token");
    }
    const audStr = String(clientId).trim();
    if (!audStr) {
        throw new Error("missing client_id");
    }
    const audNum = Number(audStr);
    const audience = Number.isFinite(audNum) ? [audStr, audNum] : [audStr];

    const { payload } = await jose.jwtVerify(idToken, JWKS, {
        issuer: TELEGRAM_ISSUER,
        audience,
    });

    const hasId = payload.id != null && payload.id !== "";
    const hasSub = payload.sub != null && payload.sub !== "";
    if (!hasId && !hasSub) {
        throw new Error("token missing user id");
    }

    return payload;
}
