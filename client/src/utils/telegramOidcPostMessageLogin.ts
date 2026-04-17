import type { TelegramOidcLoginResult } from "./telegramWebApp";

const OIDC_ORIGIN = "https://oauth.telegram.org";
const OIDC_AUTH_URL = `${OIDC_ORIGIN}/auth`;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const pad = payload.length % 4;
        if (pad) payload += "=".repeat(4 - pad);
        return JSON.parse(atob(payload)) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function buildResult(data: { error?: string; result?: string }): TelegramOidcLoginResult {
    if (data.error) {
        return { error: data.error };
    }
    const idToken = data.result;
    if (!idToken || typeof idToken !== "string") {
        return { error: "missing id_token" };
    }
    const user = decodeJwtPayload(idToken);
    if (!user) {
        return { error: "malformed id_token" };
    }
    return { id_token: idToken, user };
}

export type TelegramOidcPostMessageOptions = {
    clientId: number;
    lang?: string;
    nonce?: string;
    /** По умолчанию `location.pathname` — должен совпадать с Allowed URL / redirect в @BotFather */
    redirectPath?: string;
};

/**
 * Вход через Telegram OIDC с response_type=post_message (как в telegram-login.js),
 * но с обязательным query-параметром `origin`, иначе oauth.telegram.org отвечает «origin required».
 * @see https://core.telegram.org/bots/telegram-login
 */
export function openTelegramOidcPostMessageLogin(
    options: TelegramOidcPostMessageOptions,
    onResult: (result: TelegramOidcLoginResult) => void
): void {
    const { clientId, lang, nonce, redirectPath } = options;
    const redirectUri = `${window.location.origin}${redirectPath ?? window.location.pathname}`;
    const scopes = ["openid", "profile"];

    const params = new URLSearchParams({
        response_type: "post_message",
        client_id: String(clientId),
        redirect_uri: redirectUri,
        scope: scopes.join(" "),
        origin: window.location.origin,
    });
    if (nonce) params.set("nonce", nonce);
    if (lang) params.set("lang", lang);

    const authUrl = `${OIDC_AUTH_URL}?${params.toString()}`;

    let authFinished = false;
    const popup = window.open(authUrl, "telegram_oidc_login", "width=550,height=650,status=0,location=0,menubar=0,toolbar=0");

    if (!popup) {
        onResult({ error: "popup_blocked" });
        return;
    }
    popup.focus();

    const finish = (result: TelegramOidcLoginResult) => {
        if (authFinished) return;
        authFinished = true;
        window.removeEventListener("message", onMessage);
        onResult(result);
    };

    const onMessage = (event: MessageEvent) => {
        if (event.origin !== OIDC_ORIGIN) return;
        if (event.source !== popup) return;

        let data: { event?: string; error?: string; result?: string };
        try {
            data = typeof event.data === "string" ? (JSON.parse(event.data) as typeof data) : event.data;
        } catch {
            return;
        }
        if (data && data.event === "auth_result") {
            finish(buildResult(data));
        }
    };

    window.addEventListener("message", onMessage);

    const checkClosed = () => {
        if (authFinished) return;
        if (!popup || popup.closed) {
            finish({ error: "popup_closed" });
            return;
        }
        window.setTimeout(checkClosed, 200);
    };
    checkClosed();
}
