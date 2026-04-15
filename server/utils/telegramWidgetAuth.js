import crypto from "crypto";

/** @see https://core.telegram.org/widgets/login#checking-authorization */
export function verifyTelegramWidgetHash(payload, botToken) {
    if (!botToken || !payload || typeof payload !== "object") return false;
    const hash = payload.hash;
    if (!hash || typeof hash !== "string") return false;

    const { hash: _omit, ...rest } = payload;
    const checkString = Object.keys(rest)
        .sort()
        .map((key) => `${key}=${rest[key]}`)
        .join("\n");

    const secretKey = crypto.createHash("sha256").update(botToken).digest();
    const calculated = crypto.createHmac("sha256", secretKey).update(checkString).digest("hex");
    return calculated === hash;
}
