const PENDING_KEY = "sunio_tg_oidc_pending";
/** Старые ключи sessionStorage — удаляем при записи, чтобы не путать состояние */
const LEGACY_VERIFIER = "sunio_tg_oidc_pkce_verifier";
const LEGACY_STATE = "sunio_tg_oidc_pkce_state";

const OIDC_AUTH = "https://oauth.telegram.org/auth";
const PENDING_MAX_AGE_MS = 15 * 60 * 1000;

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

function clearLegacySessionKeys(): void {
    try {
        sessionStorage.removeItem(LEGACY_VERIFIER);
        sessionStorage.removeItem(LEGACY_STATE);
    } catch {
        /* ignore */
    }
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

type PendingPayload = { state: string; verifier: string; t: number };

/** Читает verifier по state из URL. PKCE хранится в localStorage — общий для вкладки после редиректа с oauth.telegram.org. */
export function readPkceVerifierForState(urlState: string): string | null {
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingPayload;
        if (!parsed?.verifier || !parsed?.state || typeof parsed.t !== "number") {
            return null;
        }
        if (parsed.state !== urlState) return null;
        if (Date.now() - parsed.t > PENDING_MAX_AGE_MS) {
            localStorage.removeItem(PENDING_KEY);
            return null;
        }
        return parsed.verifier;
    } catch {
        return null;
    }
}

/**
 * После редиректа из WebView (Telegram и др.) localStorage иногда отдаёт pending не с первого тика —
 * несколько попыток с короткой задержкой убирают ложное «Сессия входа устарела».
 */
export async function readPkceVerifierForStateWithRetries(urlState: string): Promise<string | null> {
    const delaysMs = [0, 50, 100, 200];
    for (const ms of delaysMs) {
        if (ms > 0) await new Promise((r) => setTimeout(r, ms));
        const v = readPkceVerifierForState(urlState);
        if (v) return v;
    }
    return null;
}

export function clearPkceSession(): void {
    try {
        localStorage.removeItem(PENDING_KEY);
        clearLegacySessionKeys();
    } catch {
        /* ignore */
    }
}

/**
 * Официальный OIDC: response_type=code + PKCE (см. discovery Telegram).
 * PKCE кладём в localStorage: при возврате с Telegram редирект иногда не сохраняет sessionStorage так же надёжно, как ожидается.
 * Scope только openid profile (без phone).
 */
export async function startTelegramOidcRedirectWithPkce(clientId: number, lang = "ru"): Promise<void> {
    const verifier = randomVerifier();
    const state = randomState();
    clearLegacySessionKeys();
    const pending: PendingPayload = { state, verifier, t: Date.now() };
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));

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
