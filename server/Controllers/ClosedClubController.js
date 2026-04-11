import axios from "axios";
import User from "../Models/User.js";
import { getClosedClubSettingsDoc } from "../utils/closedClubSettings.js";
import { addAdminAction } from "../utils/addAdminAction.js";

const BOT_SERVER_URL = process.env.BOT_SERVER_URL || "http://localhost:5011";

const ALLOWED_FIELDS = ["channelLink", "chatLink", "channelTelegramId", "groupTelegramId"];

export const getPublicLinks = async (req, res) => {
    try {
        const doc = await getClosedClubSettingsDoc();
        res.json({
            success: true,
            data: {
                channelLink: doc.channelLink || "",
                chatLink: doc.chatLink || "",
            },
        });
    } catch (error) {
        console.error("ClosedClubController.getPublicLinks:", error);
        res.status(500).json({ success: false, message: "Ошибка при загрузке ссылок" });
    }
};

export const getSettings = async (req, res) => {
    try {
        const doc = await getClosedClubSettingsDoc();
        res.json({
            success: true,
            data: {
                channelLink: doc.channelLink || "",
                chatLink: doc.chatLink || "",
                channelTelegramId: doc.channelTelegramId || "",
                groupTelegramId: doc.groupTelegramId || "",
            },
        });
    } catch (error) {
        console.error("ClosedClubController.getSettings:", error);
        res.status(500).json({ success: false, message: "Ошибка при загрузке настроек" });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const admin = req.user;
        const doc = await getClosedClubSettingsDoc();
        const body = req.body || {};

        for (const key of ALLOWED_FIELDS) {
            if (body[key] !== undefined && body[key] !== null) {
                doc[key] = String(body[key]).trim();
            }
        }

        await doc.save();

        if (admin?._id) {
            await addAdminAction(admin._id, "Обновил(а) настройки закрытого клуба (Telegram канал/чат)");
        }

        res.json({
            success: true,
            data: {
                channelLink: doc.channelLink || "",
                chatLink: doc.chatLink || "",
                channelTelegramId: doc.channelTelegramId || "",
                groupTelegramId: doc.groupTelegramId || "",
            },
            message: "Сохранено",
        });
    } catch (error) {
        console.error("ClosedClubController.updateSettings:", error);
        res.status(500).json({ success: false, message: "Ошибка при сохранении" });
    }
};

async function fetchTelegramMemberCounts(channelTelegramId, groupTelegramId) {
    const secret = process.env.BOT_API_SECRET;
    if (!secret) {
        return {
            channel: null,
            group: null,
            channelError: "BOT_API_SECRET не задан на сервере",
            groupError: "BOT_API_SECRET не задан на сервере",
        };
    }

    try {
        const response = await axios.post(
            `${BOT_SERVER_URL}/api/bot/member-counts`,
            {
                channelId: channelTelegramId || undefined,
                groupId: groupTelegramId || undefined,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Bot-Secret": secret,
                },
                timeout: 15000,
            }
        );
        return response.data;
    } catch (e) {
        const msg = e.response?.data?.message || e.message || "Ошибка запроса к боту";
        return {
            channel: null,
            group: null,
            channelError: msg,
            groupError: msg,
        };
    }
}

/**
 * Пользователи приложения с действующей подпиской и Telegram — им отправлялись приглашения в клуб.
 * Состав в Telegram может отличаться (не все перешли по ссылке).
 */
export const getMembers = async (req, res) => {
    try {
        const doc = await getClosedClubSettingsDoc();
        const now = new Date();

        const users = await User.find({
            telegramId: { $exists: true, $nin: [null, ""] },
            subscriptionEndDate: { $gt: now },
        })
            .select("fullName telegramUserName telegramId subscriptionEndDate mail")
            .sort({ fullName: 1 })
            .lean();

        const counts = await fetchTelegramMemberCounts(doc.channelTelegramId, doc.groupTelegramId);

        res.json({
            success: true,
            data: {
                telegramChannelMemberCount: counts.channel,
                telegramGroupMemberCount: counts.group,
                telegramChannelError: counts.channelError || null,
                telegramGroupError: counts.groupError || null,
                appSubscribersWithTelegramCount: users.length,
                users: users.map((u) => ({
                    _id: u._id,
                    fullName: u.fullName || "",
                    telegramUserName: u.telegramUserName || "",
                    telegramId: u.telegramId || "",
                    subscriptionEndDate: u.subscriptionEndDate,
                    mail: u.mail || "",
                })),
            },
        });
    } catch (error) {
        console.error("ClosedClubController.getMembers:", error);
        res.status(500).json({ success: false, message: "Ошибка при загрузке списка" });
    }
};
