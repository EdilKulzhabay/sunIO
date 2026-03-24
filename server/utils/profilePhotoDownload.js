import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

const MAX_BYTES = 5 * 1024 * 1024;

const mimeToExt = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
};

/**
 * Скачивает аватар по URL (например api.telegram.org) и сохраняет в server/uploads.
 * @returns {Promise<string|null>} Путь вида `/uploads/filename` или null при ошибке
 */
export async function saveRemoteProfilePhotoToUploads(remoteUrl, telegramId) {
    if (!remoteUrl || typeof remoteUrl !== "string" || !/^https?:\/\//i.test(remoteUrl.trim())) {
        return null;
    }

    try {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const response = await axios.get(remoteUrl.trim(), {
            responseType: "arraybuffer",
            timeout: 25000,
            maxContentLength: MAX_BYTES,
            maxBodyLength: MAX_BYTES,
            validateStatus: (s) => s === 200,
            headers: {
                "User-Agent": "sunIO-server/1.0",
            },
        });

        const contentType = (response.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
        const ext = mimeToExt[contentType] || ".jpg";
        const buf = Buffer.from(response.data);

        if (!buf.length || buf.length > MAX_BYTES) {
            console.warn("saveRemoteProfilePhotoToUploads: пустой или слишком большой файл");
            return null;
        }

        const safeId = String(telegramId).replace(/[^\d-]/g, "") || "user";
        const filename = `telegram-avatar-${safeId}-${Date.now()}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        await fs.promises.writeFile(filePath, buf);
        return `/uploads/${filename}`;
    } catch (error) {
        console.error("saveRemoteProfilePhotoToUploads:", error.message);
        return null;
    }
}

/**
 * Если передан URL с нашего сервера — возвращает как есть; иначе пытается скачать и вернуть локальный путь.
 */
export async function resolveProfilePhotoUrl(profilePhotoUrl, telegramId) {
    if (!profilePhotoUrl || typeof profilePhotoUrl !== "string") {
        return null;
    }
    const trimmed = profilePhotoUrl.trim();
    if (trimmed.startsWith("/uploads/")) {
        return trimmed;
    }
    const local = await saveRemoteProfilePhotoToUploads(trimmed, telegramId);
    return local != null ? local : trimmed;
}
