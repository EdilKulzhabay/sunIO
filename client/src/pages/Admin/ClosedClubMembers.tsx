import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../components/Admin/AdminLayout";
import api from "../../api";
import { toast } from "react-toastify";

type MemberUser = {
    _id: string;
    fullName: string;
    telegramUserName: string;
    telegramId: string;
    subscriptionEndDate: string;
    mail: string;
};

type MembersPayload = {
    telegramChannelMemberCount: number | null;
    telegramGroupMemberCount: number | null;
    telegramChannelError: string | null;
    telegramGroupError: string | null;
    appSubscribersWithTelegramCount: number;
    users: MemberUser[];
};

export const ClosedClubMembers = () => {
    const { context } = useParams<{ context: string }>();
    const navigate = useNavigate();
    const isChannel = context === "channel";
    const isChat = context === "chat";
    const valid = isChannel || isChat;

    const [data, setData] = useState<MembersPayload | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!valid) {
            navigate("/admin/closed-club", { replace: true });
            return;
        }
        (async () => {
            try {
                const res = await api.get("/api/closed-club/members");
                if (res.data?.success && res.data.data) {
                    setData(res.data.data);
                }
            } catch {
                toast.error("Не удалось загрузить данные");
            } finally {
                setLoading(false);
            }
        })();
    }, [valid, navigate]);

    if (!valid) return null;

    const title = isChannel ? "Телеграм канал — участники" : "Телеграм чат — участники";
    const tgCount = isChannel ? data?.telegramChannelMemberCount : data?.telegramGroupMemberCount;
    const tgErr = isChannel ? data?.telegramChannelError : data?.telegramGroupError;

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <Link to="/admin/closed-club" className="text-sm text-indigo-600 hover:underline">
                        ← Закрытый клуб
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 mt-2">{title}</h1>
                    <p className="text-gray-600 text-sm mt-2 max-w-3xl">
                        Число в Telegram — из API (бот должен быть администратором). Список ниже — пользователи приложения с
                        действующей подпиской и привязанным Telegram (им отправлялись приглашения); фактическое членство в
                        канале/чате может отличаться.
                    </p>
                </div>

                {loading ? (
                    <p className="text-gray-500">Загрузка…</p>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-100 max-w-xl">
                            <div className="text-sm text-gray-500">Участников в Telegram (по данным бота)</div>
                            <div className="text-3xl font-bold text-gray-900 mt-1">{tgCount ?? "—"}</div>
                            {tgErr ? <div className="text-sm text-red-600 mt-2">{tgErr}</div> : null}
                            <div className="text-sm text-gray-600 mt-4">
                                С подпиской в приложении:{" "}
                                <span className="font-semibold">{data?.appSubscribersWithTelegramCount ?? 0}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                            <div className="px-4 py-3 border-b border-gray-200 font-medium text-gray-900">Список пользователей</div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-left text-gray-600">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">Имя</th>
                                            <th className="px-4 py-2 font-medium">Telegram</th>
                                            <th className="px-4 py-2 font-medium">Telegram ID</th>
                                            <th className="px-4 py-2 font-medium">Подписка до</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data?.users || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                                    Нет пользователей с действующей подпиской и Telegram
                                                </td>
                                            </tr>
                                        ) : (
                                            data!.users.map((u) => (
                                                <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                                                    <td className="px-4 py-2">{u.fullName || "—"}</td>
                                                    <td className="px-4 py-2">
                                                        {u.telegramUserName ? `@${u.telegramUserName}` : "—"}
                                                    </td>
                                                    <td className="px-4 py-2 font-mono text-xs">{u.telegramId || "—"}</td>
                                                    <td className="px-4 py-2">
                                                        {u.subscriptionEndDate
                                                            ? new Date(u.subscriptionEndDate).toLocaleDateString("ru-RU")
                                                            : "—"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};
