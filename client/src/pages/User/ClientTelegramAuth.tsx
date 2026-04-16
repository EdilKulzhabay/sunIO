import bgGar from "../../assets/bgGar.png";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import { useAuth, type User } from "../../contexts/AuthContext";
import sunWithHands from "../../assets/sunWithHands.png";
import { getOrCreateClientDeviceId } from "../../utils/clientDeviceId";
import type { TelegramOidcLoginResult } from "../../utils/telegramWebApp";

const OIDC_CLIENT_ID_RAW = import.meta.env.VITE_TELEGRAM_OIDC_CLIENT_ID as string | undefined;

function parseOidcClientId(raw: string | undefined): number | null {
    if (!raw || typeof raw !== "string") return null;
    const t = raw.trim();
    if (!/^\d+$/.test(t)) return null;
    const n = Number(t);
    return Number.isSafeInteger(n) ? n : null;
}

const OIDC_CLIENT_ID = parseOidcClientId(OIDC_CLIENT_ID_RAW);

export const ClientTelegramAuth = () => {
    const [loading, setLoading] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);
    const navigate = useNavigate();
    const { loginWithTelegramSession, user, loading: authLoading } = useAuth();
    const [screenHeight, setScreenHeight] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        const token = localStorage.getItem("token");
        if (user && token) {
            const name = (user.fullName ?? "").trim();
            navigate(name ? "/main" : "/client-performance", { replace: true });
        }
    }, [authLoading, user, navigate]);

    const handleIdToken = useCallback(
        async (idToken: string) => {
            setLoading(true);
            try {
                const { data } = await api.post<{
                    success: boolean;
                    accessToken?: string;
                    refreshToken?: string;
                    userData?: User;
                    message?: string;
                }>("/api/user/telegram-web-auth", {
                    id_token: idToken,
                    deviceId: getOrCreateClientDeviceId(),
                });

                if (!data.success || !data.userData || !data.accessToken) {
                    throw new Error(data.message || "Ошибка авторизации");
                }

                loginWithTelegramSession(data.userData, data.accessToken, data.refreshToken);
            } catch (e: unknown) {
                const err = e as { response?: { data?: { message?: string } }; message?: string };
                toast.error(err.response?.data?.message || err.message || "Ошибка авторизации");
            } finally {
                setLoading(false);
            }
        },
        [loginWithTelegramSession]
    );

    useEffect(() => {
        if (!OIDC_CLIENT_ID) return;

        let cancelled = false;
        const existing = document.querySelector('script[data-app="telegram-login-sdk"]');
        if (existing && window.Telegram?.Login) {
            setSdkReady(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-login.js";
        script.async = true;
        script.dataset.app = "telegram-login-sdk";
        script.onload = () => {
            if (cancelled) return;
            setSdkReady(true);
        };
        script.onerror = () => {
            if (!cancelled) toast.error("Не удалось загрузить Telegram Login SDK");
        };
        document.body.appendChild(script);

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!sdkReady || !OIDC_CLIENT_ID) return;
        try {
            window.Telegram?.Login?.init({ client_id: OIDC_CLIENT_ID, lang: "ru" }, (result: TelegramOidcLoginResult) => {
                if ("error" in result && result.error) {
                    if (result.error === "popup_closed") return;
                    toast.error(`Telegram: ${result.error}`);
                    return;
                }
                if ("id_token" in result && result.id_token) {
                    void handleIdToken(result.id_token);
                }
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Ошибка инициализации Telegram Login";
            toast.error(msg);
        }
    }, [sdkReady, handleIdToken]);

    useEffect(() => {
        const updateScreenHeight = () => setScreenHeight(window.innerHeight);
        updateScreenHeight();
        window.addEventListener("resize", updateScreenHeight);
        return () => window.removeEventListener("resize", updateScreenHeight);
    }, []);

    return (
        <div
            style={{
                backgroundImage: `url(${bgGar})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
            className="min-h-screen px-4 pb-6 flex flex-col justify-between lg:justify-start"
        >
            <div style={{ height: `${screenHeight / 3}px` }} className="flex justify-center items-end">
                <img src={sunWithHands} alt="" className="object-cover h-[175px] w-[175px] mb-5" />
            </div>
            <div className="flex-1 lg:flex-0 lg:w-[700px] lg:mx-auto">
                <h1 className="text-[48px] font-semibold text-white leading-12">Авторизуйтесь через Telegram</h1>
                {!OIDC_CLIENT_ID ? (
                    <p className="text-amber-200 text-sm mt-3">
                        Добавьте в окружение фронта{" "}
                        <code className="bg-black/30 px-1 rounded">VITE_TELEGRAM_OIDC_CLIENT_ID</code> — числовой
                        Client ID из @BotFather (Bot Settings → Web Login). На сервере задайте{" "}
                        <code className="bg-black/30 px-1 rounded">TELEGRAM_OIDC_CLIENT_ID</code> с тем же значением.
                        В Web Login у бота должны быть разрешены URL вашего сайта (
                        <a
                            className="underline text-white"
                            href="https://core.telegram.org/bots/telegram-login"
                            target="_blank"
                            rel="noreferrer"
                        >
                            документация
                        </a>
                        ).
                    </p>
                ) : (
                    <p className="text-white/80 text-sm mt-3">
                        Вход без номера телефона (профиль Telegram). Нажмите кнопку — откроется окно авторизации.
                    </p>
                )}
            </div>

            <div className="lg:w-[700px] lg:mx-auto space-y-4">
                {OIDC_CLIENT_ID ? (
                    <div
                        className={`flex flex-col items-center w-full mt-4 min-h-[56px] rounded-full bg-white/5 p-3 ring-1 ring-white/20 ${
                            loading || authLoading || !sdkReady ? "pointer-events-none opacity-50" : ""
                        }`}
                    >
                        <button
                            type="button"
                            className="tg-auth-button w-full max-w-sm justify-center"
                            data-style="rounded shine"
                            disabled={loading || authLoading || !sdkReady}
                            aria-label="Войти через Telegram"
                        >
                            Войти через Telegram
                        </button>
                    </div>
                ) : null}
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full mt-2 lg:mt-6 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full"
                >
                    Назад
                </button>
            </div>
        </div>
    );
};
