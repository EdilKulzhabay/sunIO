const TOKEN_URL = "https://oauth.telegram.org/token";

/**
 * Обмен authorization_code на id_token (официальный OIDC Telegram).
 * @see https://core.telegram.org/bots/telegram-login
 */
export async function exchangeTelegramAuthorizationCode({
    code,
    redirectUri,
    codeVerifier,
    clientId,
    clientSecret,
}) {
    const basic = Buffer.from(`${String(clientId).trim()}:${String(clientSecret).trim()}`, "utf8").toString("base64");

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code).trim(),
        redirect_uri: String(redirectUri).trim(),
        client_id: String(clientId).trim(),
        code_verifier: String(codeVerifier).trim(),
    });

    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${basic}`,
        },
        body: body.toString(),
    });

    const text = await res.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch {
        throw new Error(`token endpoint not json: ${res.status}`);
    }

    if (!res.ok) {
        throw new Error(json.error || json.error_description || `token ${res.status}`);
    }
    if (!json.id_token || typeof json.id_token !== "string") {
        throw new Error("no id_token in token response");
    }
    return json.id_token;
}
