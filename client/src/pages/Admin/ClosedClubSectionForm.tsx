import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../components/Admin/AdminLayout";
import api from "../../api";
import { toast } from "react-toastify";
import { ChevronRight } from "lucide-react";

type Section = "channel" | "chat";

export const ClosedClubSectionForm = () => {
    const { section } = useParams<{ section: string }>();
    const navigate = useNavigate();
    const kind: Section | null = section === "channel" || section === "chat" ? section : null;

    const [channelLink, setChannelLink] = useState("");
    const [chatLink, setChatLink] = useState("");
    const [channelTelegramId, setChannelTelegramId] = useState("");
    const [groupTelegramId, setGroupTelegramId] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!kind) {
            navigate("/admin/closed-club", { replace: true });
            return;
        }
        (async () => {
            try {
                const res = await api.get("/api/closed-club/settings");
                if (res.data?.success && res.data.data) {
                    const d = res.data.data;
                    setChannelLink(d.channelLink || "");
                    setChatLink(d.chatLink || "");
                    setChannelTelegramId(d.channelTelegramId || "");
                    setGroupTelegramId(d.groupTelegramId || "");
                }
            } catch {
                toast.error("Не удалось загрузить настройки");
            } finally {
                setLoading(false);
            }
        })();
    }, [kind, navigate]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload =
                kind === "channel"
                    ? { channelLink, channelTelegramId }
                    : { chatLink, groupTelegramId };
            const res = await api.put("/api/closed-club/settings", payload);
            if (res.data?.success) {
                toast.success("Сохранено");
            } else {
                toast.error(res.data?.message || "Ошибка");
            }
        } catch {
            toast.error("Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    if (!kind) return null;

    const title = kind === "channel" ? "Телеграм канал" : "Телеграм чат";
    const membersPath = kind === "channel" ? "/admin/closed-club/members/channel" : "/admin/closed-club/members/chat";

    return (
        <AdminLayout>
            <div className="max-w-2xl space-y-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/admin/closed-club")}
                        className="text-sm text-indigo-600 hover:underline mb-2"
                    >
                        ← Закрытый клуб
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Публичная ссылка открывается в профиле пользователя. ID чата для API — тот же, что в .env{" "}
                        <code className="bg-gray-100 px-1 rounded">CHANNEL_ID</code> /{" "}
                        <code className="bg-gray-100 px-1 rounded">GROUP_ID</code> (например{" "}
                        <code className="bg-gray-100 px-1 rounded">-1001234567890</code>).
                    </p>
                </div>

                {loading ? (
                    <p className="text-gray-500">Загрузка…</p>
                ) : (
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        {kind === "channel" ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на канал</label>
                                    <input
                                        type="url"
                                        value={channelLink}
                                        onChange={(e) => setChannelLink(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="https://t.me/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID канала (для бота)</label>
                                    <input
                                        type="text"
                                        value={channelTelegramId}
                                        onChange={(e) => setChannelTelegramId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                                        placeholder="-100..."
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка на чат</label>
                                    <input
                                        type="url"
                                        value={chatLink}
                                        onChange={(e) => setChatLink(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="https://t.me/+..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID чата (для бота)</label>
                                    <input
                                        type="text"
                                        value={groupTelegramId}
                                        onChange={(e) => setGroupTelegramId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                                        placeholder="-100..."
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {saving ? "Сохранение…" : "Сохранить"}
                            </button>
                            <Link
                                to={membersPath}
                                className="inline-flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Подробнее
                                <ChevronRight size={18} />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
