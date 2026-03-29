import mongoose from "mongoose";
import ClientPageView from "../Models/ClientPageView.js";
import User from "../Models/User.js";

const MAX_PATH_LEN = 512;

function sanitizePath(raw) {
    if (typeof raw !== "string") return null;
    const t = raw.trim();
    if (!t || t.length > MAX_PATH_LEN) return null;
    if (!t.startsWith("/")) return null;
    if (t.includes("..") || t.includes("\\")) return null;
    return t;
}

export const recordPageView = async (req, res) => {
    try {
        const path = sanitizePath(req.body?.path);
        if (!path) {
            return res.status(400).json({
                success: false,
                message: "Некорректный path",
            });
        }

        const doc = {
            path,
            viewedAt: new Date(),
        };

        if (req.userId && mongoose.Types.ObjectId.isValid(req.userId)) {
            doc.userId = req.userId;
        }
        if (req.user?.telegramId) {
            doc.telegramId = String(req.user.telegramId).slice(0, 64);
        }

        await ClientPageView.create(doc);

        res.status(201).json({ success: true });
    } catch (error) {
        console.error("ClientPageAnalyticsController.recordPageView:", error);
        res.status(500).json({ success: false, message: "Ошибка записи просмотра" });
    }
};

/** Сколько раз открывалась каждая страница (path) */
export const getSummaryByPath = async (req, res) => {
    try {
        const sinceRaw = req.query.since;
        const match = {};
        if (sinceRaw) {
            const d = new Date(String(sinceRaw));
            if (!Number.isNaN(d.getTime())) {
                match.viewedAt = { $gte: d };
            }
        }

        const rows = await ClientPageView.aggregate([
            { $match: match },
            { $group: { _id: "$path", totalViews: { $sum: 1 } } },
            { $sort: { totalViews: -1 } },
            { $limit: 500 },
            { $project: { path: "$_id", totalViews: 1, _id: 0 } },
        ]);

        const total = await ClientPageView.countDocuments(match);

        res.json({
            success: true,
            data: { totalEvents: total, byPath: rows },
        });
    } catch (error) {
        console.error("ClientPageAnalyticsController.getSummaryByPath:", error);
        res.status(500).json({ success: false, message: "Ошибка выборки" });
    }
};

/** Какие страницы и сколько раз открывал конкретный пользователь */
export const getByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Неверный userId" });
        }

        const sinceRaw = req.query.since;
        const match = { userId: new mongoose.Types.ObjectId(userId) };
        if (sinceRaw) {
            const d = new Date(String(sinceRaw));
            if (!Number.isNaN(d.getTime())) {
                match.viewedAt = { $gte: d };
            }
        }

        const rows = await ClientPageView.aggregate([
            { $match: match },
            { $group: { _id: "$path", views: { $sum: 1 } } },
            { $sort: { views: -1 } },
            { $limit: 200 },
            { $project: { path: "$_id", views: 1, _id: 0 } },
        ]);

        const total = await ClientPageView.countDocuments(match);

        res.json({
            success: true,
            data: { userId, totalViews: total, byPath: rows },
        });
    } catch (error) {
        console.error("ClientPageAnalyticsController.getByUserId:", error);
        res.status(500).json({ success: false, message: "Ошибка выборки" });
    }
};

/** Топ пользователей по числу просмотров (активность) */
export const getTopUsers = async (req, res) => {
    try {
        const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "30"), 10) || 30));
        const sinceRaw = req.query.since;
        const match = { userId: { $ne: null } };
        if (sinceRaw) {
            const d = new Date(String(sinceRaw));
            if (!Number.isNaN(d.getTime())) {
                match.viewedAt = { $gte: d };
            }
        }

        const rows = await ClientPageView.aggregate([
            { $match: match },
            { $group: { _id: "$userId", views: { $sum: 1 } } },
            { $sort: { views: -1 } },
            { $limit: limit },
        ]);

        const ids = rows.map((r) => r._id).filter(Boolean);
        const users = await User.find({ _id: { $in: ids } })
            .select("fullName telegramUserName telegramId mail phone")
            .lean();

        const byId = Object.fromEntries(users.map((u) => [String(u._id), u]));

        const data = rows.map((r) => ({
            userId: String(r._id),
            views: r.views,
            user: byId[String(r._id)] || null,
        }));

        res.json({ success: true, data });
    } catch (error) {
        console.error("ClientPageAnalyticsController.getTopUsers:", error);
        res.status(500).json({ success: false, message: "Ошибка выборки" });
    }
};
