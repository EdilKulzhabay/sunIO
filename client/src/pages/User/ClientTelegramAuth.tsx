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
    readPkceVerifierForStateWithRetries,
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
        /** Пока в URL OAuth-callback (?code=&state=), не уводим на /main — иначе гонка с обменом кода. */
        const oauth = parseTelegramOidcReturnUrl(location.search);
        if (oauth?.kind === "success") return;
        const token = localStorage.getItem("token");
        if (user && token) {
            const name = (user.fullName ?? "").trim();
            navigate(name ? "/main" : "/client-performance", { replace: true });
        }
    }, [authLoading, user, navigate, location.search]);

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

    /**
     * Обработка возврата с oauth.telegram.org (?code=&state= или ?error=).
     * Не ждём authLoading: иначе первый кадр после редиректа может пропустить обмен, пока AuthContext крутится.
     */
    useEffect(() => {
        if (!OIDC_CLIENT_ID) return;

        const parsed = parseTelegramOidcReturnUrl(location.search);
        if (!parsed) return;

        if (parsed.kind === "error") {
            toast.error(parsed.description || parsed.error || "Отказ Telegram");
            navigate("/client/telegram-auth", { replace: true });
            return;
        }

        void (async () => {
            const verifier = await readPkceVerifierForStateWithRetries(parsed.state);
            if (!verifier) {
                toast.error("Сессия входа устарела. Нажмите «Войти через Telegram» ещё раз.");
                navigate("/client/telegram-auth", { replace: true });
                return;
            }

            const claimKey = `sunio_tg_code_claim_${parsed.code}`;
            try {
                if (localStorage.getItem(claimKey)) return;
                localStorage.setItem(claimKey, "1");
            } catch {
                /* private mode — без дедупа */
            }

            try {
                await completeLoginWithTokens({
                    code: parsed.code,
                    code_verifier: verifier,
                    redirect_uri: getOidcRedirectUri(),
                });
            } finally {
                try {
                    localStorage.removeItem(claimKey);
                } catch {
                    /* ignore */
                }
            }
        })();
    }, [location.search, completeLoginWithTokens, navigate]);

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
            </div>

            <div className="lg:w-[700px] lg:mt-20 lg:mx-auto space-y-4">
                {OIDC_CLIENT_ID ? (
                    <button
                        type="button"
                        onClick={() => void handleLoginClick()}
                        disabled={loading || authLoading}
                        className="w-full bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full hover:bg-[#C4841D]/80 hover:cursor-pointer disabled:opacity-60"
                        aria-label="Войти через Telegram"
                    >
                        Войти через Telegram
                    </button>
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
