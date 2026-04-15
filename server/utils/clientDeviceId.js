/** Идентификатор клиентского устройства (UUID и т.п.), только безопасные символы. */
export function sanitizeClientDeviceId(raw) {
    if (raw == null || typeof raw !== "string") return "";
    const s = String(raw).trim().slice(0, 128);
    if (s.length < 8) return "";
    if (!/^[a-zA-Z0-9_-]+$/.test(s)) return "";
    return s;
}
