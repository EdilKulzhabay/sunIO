import mongoose from "mongoose";
import User from "../Models/User.js";
import ModalNotificationCampaign from "../Models/ModalNotificationCampaign.js";
import ModalNotificationSchedule from "../Models/ModalNotificationSchedule.js";
import ModalNotificationInteraction from "../Models/ModalNotificationInteraction.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Получить пользователей с фильтрацией по статусу и поиску (для выбора получателей)
export const getFilteredUsers = async (req, res) => {
    try {
        const { status, search } = req.body;

        let filter = {
            isBlocked: { $ne: true },
        };

        if (status === "all") {
            filter.status = { $ne: "anonym" };
        } else if (status && status !== "all") {
            if (status === "blocked") {
                filter.isBlocked = true;
            } else {
                filter.status = status;
                filter.isBlocked = { $ne: true };
            }
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), "i");
            filter.$or = [
                { telegramUserName: searchRegex },
                { userName: searchRegex },
                { fullName: searchRegex },
                { phone: searchRegex },
                { mail: searchRegex },
            ];
        }

        const users = await User.find(filter)
            .select("_id telegramId telegramUserName userName fullName phone mail status isBlocked createdAt")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users,
            count: users.length,
        });
    } catch (error) {
        console.log("Ошибка в getFilteredUsers:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения пользователей",
        });
    }
};

/**
 * Добавить модальное уведомление пользователям по фильтру или списку id.
 * @returns {Promise<number>} modifiedCount
 */
export async function dispatchModalNotifications({
    campaignId,
    modalTitle,
    modalDescription,
    modalButtonText,
    modalButtonLink,
    showUpTo,
    userIds,
    status,
}) {
    const notification = {
        modalTitle,
        modalDescription,
        modalButtonText,
        modalButtonLink: modalButtonLink || undefined,
        showUpTo: showUpTo ? new Date(showUpTo) : null,
        campaignId,
    };

    let filter = {};

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
        filter._id = { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) };
        filter.isBlocked = { $ne: true };
    } else if (status && status !== "all") {
        filter.status = status;
        filter.isBlocked = { $ne: true };
    } else {
        filter.isBlocked = { $ne: true };
        filter.status = { $ne: "anonym" };
    }

    const result = await User.updateMany(filter, {
        $push: { modalNotifications: notification },
    });
    return result.modifiedCount;
}

// Создать модальное уведомление для пользователей
export const createModalNotification = async (req, res) => {
    try {
        const user = req.user;
        const {
            modalTitle,
            modalDescription,
            modalButtonText,
            modalButtonLink,
            showUpTo,
            userIds,
            status,
            scheduledAt,
        } = req.body;

        if (!modalTitle || !modalDescription || !modalButtonText) {
            return res.status(400).json({
                success: false,
                message: "Заголовок, описание и текст кнопки обязательны",
            });
        }

        const payloadBase = {
            modalTitle,
            modalDescription,
            modalButtonText,
            modalButtonLink: modalButtonLink || undefined,
            showUpTo: showUpTo || undefined,
            userIds: userIds && Array.isArray(userIds) && userIds.length > 0 ? userIds : undefined,
            status: status === "all" ? undefined : status,
        };

        let scheduledDate = null;
        if (scheduledAt) {
            scheduledDate = new Date(scheduledAt);
            if (Number.isNaN(scheduledDate.getTime())) {
                scheduledDate = null;
            }
        }

        if (scheduledDate && scheduledDate > new Date()) {
            const campaign = await ModalNotificationCampaign.create({
                modalTitle,
                scheduledAt: scheduledDate,
                status: "scheduled",
                createdBy: user?._id,
            });

            const schedule = new ModalNotificationSchedule({
                scheduledAt: scheduledDate,
                payload: {
                    campaignId: campaign._id,
                    ...payloadBase,
                },
                scheduledBy: user?._id,
            });
            await schedule.save();

            await addAdminAction(
                user._id,
                `Запланировал(а) модальное уведомление на ${scheduledDate.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })} (МСК): "${modalTitle}"`
            );

            return res.status(200).json({
                success: true,
                message: "Модальное уведомление запланировано",
                scheduledAt: schedule.scheduledAt,
                campaignId: campaign._id,
            });
        }

        const campaign = await ModalNotificationCampaign.create({
            modalTitle,
            scheduledAt: null,
            status: "sent",
            sentAt: new Date(),
            createdBy: user?._id,
        });

        const count = await dispatchModalNotifications({
            campaignId: campaign._id,
            modalTitle,
            modalDescription,
            modalButtonText,
            modalButtonLink: modalButtonLink || undefined,
            showUpTo: showUpTo || undefined,
            userIds: payloadBase.userIds,
            status: payloadBase.status,
        });

        await ModalNotificationCampaign.findByIdAndUpdate(campaign._id, {
            recipientCount: count,
        });

        await addAdminAction(user._id, `Создал(а) модальное уведомление: "${modalTitle}" (${count} польз.)`);

        res.json({
            success: true,
            message: `Модальное уведомление создано для ${count} пользователей`,
            count,
            campaignId: campaign._id,
        });
    } catch (error) {
        console.log("Ошибка в createModalNotification:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка создания модального уведомления",
        });
    }
};

export const processScheduledModalNotifications = async () => {
    const now = new Date();
    const scheduled = await ModalNotificationSchedule.find({
        status: "scheduled",
        scheduledAt: { $lte: now },
    })
        .sort({ scheduledAt: 1 })
        .limit(50);

    for (const job of scheduled) {
        const p = job.payload || {};
        const campaignId = p.campaignId;
        try {
            const count = await dispatchModalNotifications({
                campaignId,
                modalTitle: p.modalTitle,
                modalDescription: p.modalDescription,
                modalButtonText: p.modalButtonText,
                modalButtonLink: p.modalButtonLink,
                showUpTo: p.showUpTo,
                userIds: p.userIds,
                status: p.status,
            });

            job.result = { count };
            job.sentAt = new Date();
            job.status = "sent";
            await job.save();

            if (campaignId) {
                await ModalNotificationCampaign.findByIdAndUpdate(campaignId, {
                    status: "sent",
                    sentAt: new Date(),
                    recipientCount: count,
                });
            }

            if (job.scheduledBy) {
                const preview = (p.modalTitle || "").substring(0, 50);
                await addAdminAction(
                    job.scheduledBy,
                    `Модальное уведомление отправлено по расписанию: "${preview}${preview.length >= 50 ? "..." : ""}" (${count} польз.)`
                );
            }
        } catch (error) {
            job.status = "failed";
            job.error = error.message || "Ошибка";
            job.sentAt = new Date();
            await job.save();
            if (campaignId) {
                await ModalNotificationCampaign.findByIdAndUpdate(campaignId, {
                    status: "failed",
                    error: job.error,
                });
            }
        }
    }
};

/** Список кампаний с агрегированной статистикой (закрыли / нажали кнопку) */
export const listModalCampaigns = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 30, 100);
        const campaigns = await ModalNotificationCampaign.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("createdBy", "fullName telegramUserName")
            .lean();

        const ids = campaigns.map((c) => c._id);
        const statsAgg = await ModalNotificationInteraction.aggregate([
            { $match: { campaignId: { $in: ids } } },
            {
                $group: {
                    _id: { campaignId: "$campaignId", action: "$action" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const statsMap = new Map();
        for (const row of statsAgg) {
            const cid = row._id.campaignId.toString();
            if (!statsMap.has(cid)) statsMap.set(cid, { dismiss: 0, button: 0 });
            const s = statsMap.get(cid);
            if (row._id.action === "dismiss") s.dismiss = row.count;
            if (row._id.action === "button") s.button = row.count;
        }

        const data = campaigns.map((c) => {
            const s = statsMap.get(c._id.toString()) || { dismiss: 0, button: 0 };
            return {
                ...c,
                stats: {
                    closedModal: s.dismiss,
                    clickedButton: s.button,
                },
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        console.log("Ошибка в listModalCampaigns:", error);
        res.status(500).json({ success: false, message: "Ошибка загрузки статистики" });
    }
};

// Удалить модальное уведомление у пользователя (после нажатия на кнопку или закрытия)
export const removeModalNotification = async (req, res) => {
    try {
        const { notificationIndex, telegramId, notificationId, interactionAction } = req.body;

        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        let index = -1;
        if (notificationId) {
            index = user.modalNotifications.findIndex(
                (n) => n._id && n._id.toString() === String(notificationId)
            );
            if (index < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Уведомление не найдено",
                });
            }
        } else {
            if (notificationIndex === undefined || notificationIndex === null) {
                return res.status(400).json({
                    success: false,
                    message: "Необходимо указать индекс уведомления или notificationId",
                });
            }
            index = notificationIndex;
        }

        if (index < 0 || index >= user.modalNotifications.length) {
            return res.status(400).json({
                success: false,
                message: "Неверный индекс уведомления",
            });
        }

        const sub = user.modalNotifications[index];

        if (
            interactionAction &&
            sub.campaignId &&
            ["dismiss", "button"].includes(interactionAction)
        ) {
            try {
                await ModalNotificationInteraction.create({
                    campaignId: sub.campaignId,
                    userId: user._id,
                    action: interactionAction,
                });
            } catch (e) {
                if (e.code !== 11000) throw e;
            }
        }

        user.modalNotifications.splice(index, 1);
        await user.save();

        res.json({
            success: true,
            message: "Модальное уведомление удалено",
        });
    } catch (error) {
        console.log("Ошибка в removeModalNotification:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка удаления модального уведомления",
        });
    }
};

// Получить модальные уведомления пользователя
export const getUserModalNotifications = async (req, res) => {
    try {
        const { telegramId } = req.body;

        const user = await User.findOne({ telegramId }).select("modalNotifications");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        await User.findByIdAndUpdate(user._id, { lastActiveDate: new Date() });

        const now = new Date();
        const expired = user.modalNotifications.filter(
            (n) => n.showUpTo && new Date(n.showUpTo) < now
        );

        if (expired.length > 0) {
            const expiredIds = expired.map((n) => n._id);
            await User.findByIdAndUpdate(user._id, {
                $pull: { modalNotifications: { _id: { $in: expiredIds } } },
            });
        }

        const active = user.modalNotifications.filter(
            (n) => !n.showUpTo || new Date(n.showUpTo) >= now
        );

        res.json({
            success: true,
            notifications: active,
        });
    } catch (error) {
        console.log("Ошибка в getUserModalNotifications:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения модальных уведомлений",
        });
    }
};
