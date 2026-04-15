import bgGar from "../../assets/bgGar.png";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api";
import { useAuth, type User } from "../../contexts/AuthContext";
import sunWithHands from "../../assets/sunWithHands.png";
import { getOrCreateClientDeviceId } from "../../utils/clientDeviceId";

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined;

export type TelegramWidgetAuthPayload = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
};

declare global {
    interface Window {
        onTelegramAuth?: (user: TelegramWidgetAuthPayload) => void;
    }
}

export const ClientTelegramAuth = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { loginWithTelegramSession, user, loading: authLoading } = useAuth();
    const [screenHeight, setScreenHeight] = useState(0);
    const widgetHostRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (authLoading) return;
        const token = localStorage.getItem("token");
        if (user && token) {
            const name = (user.fullName ?? "").trim();
            navigate(name ? "/main" : "/client-performance", { replace: true });
        }
    }, [authLoading, user, navigate]);

    const handleTelegramPayload = useCallback(
        async (tg: TelegramWidgetAuthPayload) => {
            setLoading(true);
            try {
                const { data } = await api.post<{
                    success: boolean;
                    accessToken?: string;
                    refreshToken?: string;
                    userData?: User;
                    message?: string;
                }>("/api/user/telegram-web-auth", {
                    ...tg,
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
        window.onTelegramAuth = (u) => {
            void handleTelegramPayload(u);
        };
        return () => {
            delete window.onTelegramAuth;
        };
    }, [handleTelegramPayload]);

    useEffect(() => {
        const el = widgetHostRef.current;
        if (!el || !BOT_USERNAME) {
            return;
        }

        el.innerHTML = "";
        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute("data-telegram-login", BOT_USERNAME);
        script.setAttribute("data-size", "large");
        script.setAttribute("data-radius", "16");
        script.setAttribute("data-request-access", "write");
        script.setAttribute("data-onauth", "onTelegramAuth(user)");
        script.onerror = () => {
            toast.error("Не удалось загрузить виджет Telegram");
        };
        el.appendChild(script);

        return () => {
            el.innerHTML = "";
        };
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
                {!BOT_USERNAME ? (
                    <p className="text-amber-200 text-sm mt-3">
                        Добавьте в окружение <code className="bg-black/30 px-1 rounded">VITE_TELEGRAM_BOT_USERNAME</code>{" "}
                        — имя бота из BotFather (без @). Домен сайта должен быть указан у бота для Login Widget.
                    </p>
                ) : (
                    <p className="text-white/80 text-sm mt-3">
                        Нажмите кнопку ниже — откроется окно Telegram для входа в аккаунт.
                    </p>
                )}
            </div>

            <div className="lg:w-[700px] lg:mx-auto space-y-4">
                {BOT_USERNAME ? (
                    <div
                        className={`flex flex-col items-center w-full mt-4 min-h-[56px] rounded-full bg-white/5 p-3 ring-1 ring-white/20 ${
                            loading || authLoading ? "pointer-events-none opacity-50" : ""
                        }`}
                    >
                        <div
                            ref={widgetHostRef}
                            className="flex justify-center w-full [&_iframe]:rounded-2xl"
                            aria-label="Вход через Telegram"
                        />
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
