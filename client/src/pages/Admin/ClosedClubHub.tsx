import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/Admin/AdminLayout";
import api from "../../api";
import { MessagesSquare, ChevronRight, Settings } from "lucide-react";

type Overview = {
    telegramChannelMemberCount: number | null;
    telegramGroupMemberCount: number | null;
    telegramChannelError: string | null;
    telegramGroupError: string | null;
    appSubscribersWithTelegramCount: number;
};

type ClubLinks = {
    openChannelLink: string;
    openChannelTitle: string;
    openChatLink: string;
    openChatTitle: string;
    closedChannelLink: string;
    closedChannelTitle: string;
    closedChatLink: string;
    closedChatTitle: string;
};

export const ClosedClubHub = () => {
    const [links, setLinks] = useState<ClubLinks>({
        openChannelLink: "",
        openChannelTitle: "Открытый канал",
        openChatLink: "",
        openChatTitle: "Открытый чат",
        closedChannelLink: "",
        closedChannelTitle: "Закрытый канал",
        closedChatLink: "",
        closedChatTitle: "Закрытый чат",
    });
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
                    const d = sRes.data.data;
                    setLinks({
                        openChannelLink: d.openChannelLink || "",
                        openChannelTitle: d.openChannelTitle || "Открытый канал",
                        openChatLink: d.openChatLink || "",
                        openChatTitle: d.openChatTitle || "Открытый чат",
                        closedChannelLink: d.closedChannelLink || "",
                        closedChannelTitle: d.closedChannelTitle || "Закрытый канал",
                        closedChatLink: d.closedChatLink || "",
                        closedChatTitle: d.closedChatTitle || "Закрытый чат",
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

    const card = (opts: {
        title: string;
        subtitle: string;
        url: string;
        configurePath: string;
        membersPath?: string;
    }) => (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">{opts.title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{opts.subtitle}</p>
                    <p className="text-sm text-gray-500 mt-2 break-all">{opts.url || "—"}</p>
                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                        <div>
                            С подпиской в приложении:{" "}
                            <span className="font-medium">{overview?.appSubscribersWithTelegramCount ?? "—"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                    <Link
                        to={opts.configurePath}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                    >
                        <Settings size={16} />
                        Настроить
                    </Link>
                    {opts.membersPath ? (
                        <Link
                            to={opts.membersPath}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                        >
                            Подробнее
                            <ChevronRight size={16} />
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <MessagesSquare className="text-indigo-600" size={32} />
                        Закрытый клуб
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Открытые ссылки ведут в Telegram напрямую. Закрытые — ссылки на бота: по подписке бот
                        добавляет пользователей в канал и чат (ID ниже — для API бота).
                    </p>
                </div>

                {loading ? (
                    <p className="text-gray-500">Загрузка…</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 max-w-5xl">
                        {card({
                            title: links.openChannelTitle || "Открытый канал",
                            subtitle: "Публичная ссылка в профиле пользователя",
                            url: links.openChannelLink,
                            configurePath: "/admin/closed-club/open-channel",
                        })}
                        {card({
                            title: links.openChatTitle || "Открытый чат",
                            subtitle: "Публичная ссылка в профиле пользователя",
                            url: links.openChatLink,
                            configurePath: "/admin/closed-club/open-chat",
                        })}
                        {card({
                            title: links.closedChannelTitle || "Закрытый канал",
                            subtitle: "Ссылка на бота + ID канала для добавления по подписке",
                            url: links.closedChannelLink,
                            configurePath: "/admin/closed-club/closed-channel",
                            membersPath: "/admin/closed-club/members/channel",
                        })}
                        {card({
                            title: links.closedChatTitle || "Закрытый чат",
                            subtitle: "Ссылка на бота + ID чата для добавления по подписке",
                            url: links.closedChatLink,
                            configurePath: "/admin/closed-club/closed-chat",
                            membersPath: "/admin/closed-club/members/chat",
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
