import api from "../api";
import type { User } from "../contexts/AuthContext";
import { getOrCreateClientDeviceId } from "./clientDeviceId";

export function hasWebAppBootstrapParams(searchParams: URLSearchParams): boolean {
    return !!(searchParams.get("telegramId") && searchParams.get("wb_ts") && searchParams.get("wb_sig"));
}

export function searchParamsWithoutBootstrap(searchParams: URLSearchParams): URLSearchParams {
    const n = new URLSearchParams(searchParams);
    n.delete("wb_ts");
    n.delete("wb_sig");
    return n;
}

export async function requestWebAppBootstrapSession(searchParams: URLSearchParams): Promise<{
    accessToken: string;
    refreshToken?: string;
    userData: User;
}> {
    const telegramId = searchParams.get("telegramId");
    const ts = searchParams.get("wb_ts");
    const sig = searchParams.get("wb_sig");
    if (!telegramId || !ts || !sig) {
        throw new Error("Нет параметров входа из Telegram (wb_ts, wb_sig)");
    }
    const { data } = await api.post<{
        success: boolean;
        accessToken?: string;
        refreshToken?: string;
        userData?: User;
        message?: string;
    }>("/api/user/telegram-webapp-bootstrap", {
        telegramId,
        ts: Number(ts),
        sig,
        deviceId: getOrCreateClientDeviceId(),
    });
    if (!data?.success || !data.accessToken || !data.userData) {
        throw new Error(data?.message || "Не удалось получить сессию");
    }
    return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        userData: data.userData,
    };
}
