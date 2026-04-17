import bgGar from "../../assets/bgGar.png";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import { useAuth, type User } from "../../contexts/AuthContext";
import sunWithHands from "../../assets/sunWithHands.png";
import { getOrCreateClientDeviceId } from "../../utils/clientDeviceId";
import {
    clearPkceSession,
    getOidcRedirectUri,
    parseTelegramOidcReturnUrl,
    readPkceVerifierForState,
    startTelegramOidcRedirectWithPkce,
} from "../../utils/telegramOidcPkceRedirect";

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
    const location = useLocation();
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

    const completeLoginWithTokens = useCallback(
        async (body: Record<string, unknown>) => {
            setLoading(true);
            try {
                const { data } = await api.post<{
                    success: boolean;
                    accessToken?: string;
                    refreshToken?: string;
                    userData?: User;
                    message?: string;
                }>("/api/user/telegram-web-auth", {
                    ...body,
                    deviceId: getOrCreateClientDeviceId(),
                });

                if (!data.success || !data.userData || !data.accessToken) {
                    throw new Error(data.message || "Ошибка авторизации");
                }

                loginWithTelegramSession(data.userData, data.accessToken, data.refreshToken);
                clearPkceSession();
                navigate("/client/telegram-auth", { replace: true });
            } catch (e: unknown) {
                const err = e as { response?: { data?: { message?: string } }; message?: string };
                toast.error(err.response?.data?.message || err.message || "Ошибка авторизации");
                clearPkceSession();
                navigate("/client/telegram-auth", { replace: true });
            } finally {
                setLoading(false);
            }
        },
        [loginWithTelegramSession, navigate]
    );

    /** Обработка возврата с oauth.telegram.org (?code=&state= или ?error=) */
    useEffect(() => {
        if (!OIDC_CLIENT_ID || authLoading) return;

        const parsed = parseTelegramOidcReturnUrl(location.search);
        if (!parsed) return;

        if (parsed.kind === "error") {
            toast.error(parsed.description || parsed.error || "Отказ Telegram");
            navigate("/client/telegram-auth", { replace: true });
            return;
        }

        const claimKey = `sunio_tg_code_claim_${parsed.code.slice(0, 48)}`;
        if (sessionStorage.getItem(claimKey)) return;
        sessionStorage.setItem(claimKey, "1");

        const verifier = readPkceVerifierForState(parsed.state);
        if (!verifier) {
            sessionStorage.removeItem(claimKey);
            toast.error("Сессия входа устарела. Нажмите «Войти через Telegram» ещё раз.");
            navigate("/client/telegram-auth", { replace: true });
            return;
        }

        void (async () => {
            try {
                await completeLoginWithTokens({
                    code: parsed.code,
                    code_verifier: verifier,
                    redirect_uri: getOidcRedirectUri(),
                });
            } finally {
                sessionStorage.removeItem(claimKey);
            }
        })();
    }, [location.search, authLoading, completeLoginWithTokens, navigate]);

    const handleLoginClick = useCallback(async () => {
        if (!OIDC_CLIENT_ID) return;
        try {
            await startTelegramOidcRedirectWithPkce(OIDC_CLIENT_ID, "ru");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Не удалось начать вход");
        }
    }, []);

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
                        Добавьте <code className="bg-black/30 px-1 rounded">VITE_TELEGRAM_OIDC_CLIENT_ID</code> и при
                        необходимости{" "}
                        <code className="bg-black/30 px-1 rounded">VITE_TELEGRAM_OIDC_REDIRECT_URI</code> (полный URL
                        страницы, по умолчанию <code className="bg-black/30 px-1 rounded">…/client/telegram-auth</code>
                        ). На сервере: <code className="bg-black/30 px-1 rounded">TELEGRAM_OIDC_CLIENT_ID</code>,{" "}
                        <code className="bg-black/30 px-1 rounded">TELEGRAM_OIDC_CLIENT_SECRET</code> из @BotFather →
                        Web Login, и тот же URL в{" "}
                        <code className="bg-black/30 px-1 rounded">TELEGRAM_OIDC_REDIRECT_URI</code>.{" "}
                        <a
                            className="underline text-white"
                            href="https://core.telegram.org/bots/telegram-login"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Документация Telegram Login
                        </a>
                        .
                    </p>
                ) : (
                    <>
                        <p className="text-white/80 text-sm mt-3">
                            Запрашиваются только данные профиля Telegram (<code className="bg-black/30 px-1">openid</code>{" "}
                            + <code className="bg-black/30 px-1">profile</code>), без доступа к номеру телефона через
                            OAuth. Откроется страница Telegram, затем вы вернётесь на сайт.
                        </p>
                        <p className="text-white/60 text-xs mt-2">
                            Если браузер просит номер — это вход в аккаунт Telegram в вебе; удобнее открыть сайт из
                            приложения Telegram или уже быть авторизованным на web.telegram.org.
                        </p>
                    </>
                )}
            </div>

            <div className="lg:w-[700px] lg:mx-auto space-y-4">
                {OIDC_CLIENT_ID ? (
                    <div
                        className={`flex flex-col items-center w-full mt-4 min-h-[56px] rounded-2xl bg-white/5 p-3 ring-1 ring-white/20 ${
                            loading || authLoading ? "pointer-events-none opacity-50" : ""
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => void handleLoginClick()}
                            disabled={loading || authLoading}
                            className="w-full max-w-sm rounded-full bg-[#119AF5] hover:bg-[#1090E5] text-white font-semibold text-base py-3 px-7 shadow-lg transition-colors disabled:opacity-60"
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
