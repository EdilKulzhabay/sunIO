/** Ключ в localStorage — тот же проверяем на Main при входе из Web App бота */
export const CLIENT_DEVICE_STORAGE_KEY = "sunio_client_device_id";

const STORAGE_KEY = CLIENT_DEVICE_STORAGE_KEY;

function generateId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `d_${Date.now()}_${Math.random().toString(36).slice(2, 12)}_${Math.random().toString(36).slice(2, 12)}`;
}

/** Постоянный идентификатор браузера/устройства для привязки сессии на сервере. */
export function getOrCreateClientDeviceId(): string {
    try {
        let id = window.localStorage.getItem(STORAGE_KEY);
        if (!id || id.trim().length < 8) {
            id = generateId();
            window.localStorage.setItem(STORAGE_KEY, id);
        }
        return id;
    } catch {
        return generateId();
    }
}
