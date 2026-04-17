const KEY_VERIFIER = "sunio_tg_oidc_pkce_verifier";
const KEY_STATE = "sunio_tg_oidc_pkce_state";

const OIDC_AUTH = "https://oauth.telegram.org/auth";

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
    const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let bin = "";
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
    const b64 = btoa(bin);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomVerifier(): string {
    const u8 = new Uint8Array(32);
    crypto.getRandomValues(u8);
    return base64UrlEncode(u8);
}

function randomState(): string {
    const u8 = new Uint8Array(16);
    crypto.getRandomValues(u8);
    return base64UrlEncode(u8);
}

async function pkceChallengeS256(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return base64UrlEncode(digest);
}

/** Полный redirect_uri — должен совпадать с TELEGRAM_OIDC_REDIRECT_URI на сервере и с Allowed URL в @BotFather */
export function getOidcRedirectUri(): string {
    const raw = import.meta.env.VITE_TELEGRAM_OIDC_REDIRECT_URI as string | undefined;
    if (raw?.trim()) return raw.trim().replace(/\/+$/, "");
    return `${window.location.origin}/client/telegram-auth`.replace(/\/+$/, "");
}

export type ParsedOidcReturn =
    | { kind: "success"; code: string; state: string }
    | { kind: "error"; error: string; description?: string };

export function parseTelegramOidcReturnUrl(search: string): ParsedOidcReturn | null {
    const q = search.startsWith("?") ? search.slice(1) : search;
    if (!q) return null;
    const sp = new URLSearchParams(q);
    const oauthErr = sp.get("error");
    if (oauthErr) {
        return {
            kind: "error",
            error: oauthErr,
            description: sp.get("error_description") || undefined,
        };
    }
    const code = sp.get("code");
    const state = sp.get("state");
    if (code && state) return { kind: "success", code, state };
    return null;
}

/** Прочитать verifier без удаления (удалить после успешного обмена через clearPkceSession). */
export function readPkceVerifierForState(urlState: string): string | null {
    const storedState = sessionStorage.getItem(KEY_STATE);
    const verifier = sessionStorage.getItem(KEY_VERIFIER);
    if (!verifier || !storedState || urlState !== storedState) return null;
    return verifier;
}

export function clearPkceSession(): void {
    sessionStorage.removeItem(KEY_STATE);
    sessionStorage.removeItem(KEY_VERIFIER);
}

/**
 * Официальный OIDC: response_type=code + PKCE (см. discovery Telegram).
 * Полноэкранный редирект — стабильно в мобильных браузерах, без postMessage/popup.
 * Scope только openid profile (без phone).
 */
export async function startTelegramOidcRedirectWithPkce(clientId: number, lang = "ru"): Promise<void> {
    const verifier = randomVerifier();
    const state = randomState();
    sessionStorage.setItem(KEY_VERIFIER, verifier);
    sessionStorage.setItem(KEY_STATE, state);

    const redirectUri = getOidcRedirectUri();
    const challenge = await pkceChallengeS256(verifier);

    const params = new URLSearchParams({
        response_type: "code",
        client_id: String(clientId),
        redirect_uri: redirectUri,
        scope: "openid profile",
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
        origin: window.location.origin,
    });
    if (lang) params.set("lang", lang);

    window.location.assign(`${OIDC_AUTH}?${params.toString()}`);
}
