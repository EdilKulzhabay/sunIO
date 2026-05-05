import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../../components/Admin/AdminLayout";
import api from "../../api";
import { toast } from "react-toastify";

const SECTIONS = ["open-channel", "open-chat", "closed-channel", "closed-chat"] as const;
type Section = (typeof SECTIONS)[number];

export const ClosedClubSectionForm = () => {
    const { section } = useParams<{ section: string }>();
    const navigate = useNavigate();
    const kind: Section | null = SECTIONS.includes(section as Section) ? (section as Section) : null;

    const [openChannelLink, setOpenChannelLink] = useState("");
    const [openChannelTitle, setOpenChannelTitle] = useState("");
    const [openChatLink, setOpenChatLink] = useState("");
    const [openChatTitle, setOpenChatTitle] = useState("");
    const [closedChannelLink, setClosedChannelLink] = useState("");
    const [closedChannelTitle, setClosedChannelTitle] = useState("");
    const [closedChatLink, setClosedChatLink] = useState("");
    const [closedChatTitle, setClosedChatTitle] = useState("");
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
                    setOpenChannelLink(d.openChannelLink || "");
                    setOpenChannelTitle(d.openChannelTitle || "Открытый канал");
                    setOpenChatLink(d.openChatLink || "");
                    setOpenChatTitle(d.openChatTitle || "Открытый чат");
                    setClosedChannelLink(d.closedChannelLink || "");
                    setClosedChannelTitle(d.closedChannelTitle || "Закрытый канал");
                    setClosedChatLink(d.closedChatLink || "");
                    setClosedChatTitle(d.closedChatTitle || "Закрытый чат");
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
            let payload: Record<string, string> = {};
            if (kind === "open-channel") {
                payload = { openChannelLink, openChannelTitle };
            } else if (kind === "open-chat") {
                payload = { openChatLink, openChatTitle };
            } else if (kind === "closed-channel") {
                payload = { closedChannelLink, closedChannelTitle, channelTelegramId };
            } else if (kind === "closed-chat") {
                payload = { closedChatLink, closedChatTitle, groupTelegramId };
            }
            const res = await api.put("/api/closed-club/settings", payload);
            if (res.data?.success) {
                toast.success("Сохранено");
                navigate("/admin/closed-club");
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

    const titles: Record<Section, string> = {
        "open-channel": "Открытый канал",
        "open-chat": "Открытый чат",
        "closed-channel": "Закрытый канал",
        "closed-chat": "Закрытый чат",
    };
    const title = titles[kind];

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
                        {kind === "open-channel" || kind === "open-chat" ? (
                            <>Публичная ссылка для кнопки в профиле приложения (открывается в Telegram).</>
                        ) : (
                            <>
                                Укажите ссылку на закрытый канал/чат и его Telegram ID. Пользователи в приложении
                                будут открывать бота, а бот по активной подписке выдаст одноразовую ссылку для входа.
                                ID канала или чата — тот же, что для добавления через бота при оплате подписки (как{" "}
                                <code className="bg-gray-100 px-1 rounded text-xs">CHANNEL_ID</code> /{" "}
                                <code className="bg-gray-100 px-1 rounded text-xs">GROUP_ID</code>).
                            </>
                        )}
                    </p>
                </div>

                {loading ? (
                    <p className="text-gray-500">Загрузка…</p>
                ) : (
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        {kind === "open-channel" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Название ссылки
                                    </label>
                                    <input
                                        type="text"
                                        value={openChannelTitle}
                                        onChange={(e) => setOpenChannelTitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Открытый канал"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ссылка на открытый канал
                                    </label>
                                    <input
                                        type="url"
                                        value={openChannelLink}
                                        onChange={(e) => setOpenChannelLink(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="https://t.me/..."
                                    />
                                </div>
                            </>
                        )}

                        {kind === "open-chat" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Название ссылки
                                    </label>
                                    <input
                                        type="text"
                                        value={openChatTitle}
                                        onChange={(e) => setOpenChatTitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Открытый чат"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ссылка на открытый чат
                                    </label>
                                    <input
                                        type="url"
                                        value={openChatLink}
                                        onChange={(e) => setOpenChatLink(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="https://t.me/+..."
                                    />
                                </div>
                            </>
                        )}

                        {kind === "closed-channel" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Название ссылки
                                    </label>
                                    <input
                                        type="text"
                                        value={closedChannelTitle}
                                        onChange={(e) => setClosedChannelTitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Закрытый канал"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ссылка на закрытый канал
                                    </label>
                                    <input
                                        type="url"
                                        value={closedChannelLink}
                                        onChange={(e) => setClosedChannelLink(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="https://t.me/+..."
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Эта ссылка видна администраторам. Пользователям будет открываться бот, который
                                        выдаст персональную invite-ссылку по активной подписке.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ID закрытого канала (для бота)
                                    </label>
                                    <input
                                        type="text"
                                        value={channelTelegramId}
                                        onChange={(e) => setChannelTelegramId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                                        placeholder="-100..."
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Чтобы узнать ID, временно добавьте бота @LeadConverterToolkitBot в админы канала.
                                    </p>
                                </div>
                            </>
                        )}

                        {kind === "closed-chat" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Название ссылки
                                    </label>
                                    <input
                                        type="text"
                                        value={closedChatTitle}
                                        onChange={(e) => setClosedChatTitle(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Закрытый чат"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ссылка на закрытый чат
                                    </label>
                                    <input
                                        type="url"
                                        value={closedChatLink}
                                        onChange={(e) => setClosedChatLink(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="https://t.me/+..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ID закрытого чата (для бота)
                                    </label>
                                    <input
                                        type="text"
                                        value={groupTelegramId}
                                        onChange={(e) => setGroupTelegramId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                                        placeholder="-100..."
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Чтобы узнать ID, временно добавьте бота @LeadConverterToolkitBot в админы группы.
                                    </p>
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
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
