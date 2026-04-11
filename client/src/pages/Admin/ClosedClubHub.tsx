import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/Admin/AdminLayout";
import api from "../../api";
import { Lock, ChevronRight, Settings } from "lucide-react";

type Overview = {
    telegramChannelMemberCount: number | null;
    telegramGroupMemberCount: number | null;
    telegramChannelError: string | null;
    telegramGroupError: string | null;
    appSubscribersWithTelegramCount: number;
};

export const ClosedClubHub = () => {
    const [links, setLinks] = useState({ channelLink: "", chatLink: "" });
    const [overview, setOverview] = useState<Overview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [sRes, mRes] = await Promise.all([
                    api.get("/api/closed-club/settings"),
                    api.get("/api/closed-club/members"),
                ]);
                if (cancelled) return;
                if (sRes.data?.success && sRes.data.data) {
                    setLinks({
                        channelLink: sRes.data.data.channelLink || "",
                        chatLink: sRes.data.data.chatLink || "",
                    });
                }
                if (mRes.data?.success && mRes.data.data) {
                    setOverview(mRes.data.data);
                }
            } catch {
                if (!cancelled) setOverview(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Lock className="text-indigo-600" size={32} />
                        Закрытый клуб
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Ссылки для профиля пользователя и ID для бота (приглашения в канал и чат).
                    </p>
                </div>

                {loading ? (
                    <p className="text-gray-500">Загрузка…</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-1 max-w-3xl">
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg font-semibold text-gray-900">Телеграм канал</h2>
                                    <p className="text-sm text-gray-500 mt-1 break-all">{links.channelLink || "—"}</p>
                                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                                        <div>
                                            В Telegram:{" "}
                                            <span className="font-medium">
                                                {overview?.telegramChannelMemberCount ?? "—"}
                                            </span>
                                            {overview?.telegramChannelError ? (
                                                <span className="text-red-600 ml-2">({overview.telegramChannelError})</span>
                                            ) : null}
                                        </div>
                                        <div>
                                            С подпиской в приложении:{" "}
                                            <span className="font-medium">{overview?.appSubscribersWithTelegramCount ?? "—"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <Link
                                        to="/admin/closed-club/channel"
                                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                    >
                                        <Settings size={16} />
                                        Настроить
                                    </Link>
                                    <Link
                                        to="/admin/closed-club/members/channel"
                                        className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                                    >
                                        Подробнее
                                        <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg font-semibold text-gray-900">Телеграм чат</h2>
                                    <p className="text-sm text-gray-500 mt-1 break-all">{links.chatLink || "—"}</p>
                                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                                        <div>
                                            В Telegram:{" "}
                                            <span className="font-medium">
                                                {overview?.telegramGroupMemberCount ?? "—"}
                                            </span>
                                            {overview?.telegramGroupError ? (
                                                <span className="text-red-600 ml-2">({overview.telegramGroupError})</span>
                                            ) : null}
                                        </div>
                                        <div>
                                            С подпиской в приложении:{" "}
                                            <span className="font-medium">{overview?.appSubscribersWithTelegramCount ?? "—"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                    <Link
                                        to="/admin/closed-club/chat"
                                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                                    >
                                        <Settings size={16} />
                                        Настроить
                                    </Link>
                                    <Link
                                        to="/admin/closed-club/members/chat"
                                        className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                                    >
                                        Подробнее
                                        <ChevronRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
