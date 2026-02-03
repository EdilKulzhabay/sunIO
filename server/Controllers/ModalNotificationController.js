import User from "../Models/User.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Получить пользователей с фильтрацией по статусу и поиску (для выбора получателей)
export const getFilteredUsers = async (req, res) => {
    try {
        const { status, search } = req.body;

        let filter = {
            // Исключаем заблокированных пользователей
            isBlocked: { $ne: true },
        };
        
        // Фильтр по статусу (если указан)
        if (status && status !== 'all') {
            if (status === 'blocked') {
                filter.isBlocked = true;
            } else {
                filter.status = status;
                filter.isBlocked = { $ne: true };
            }
        }

        // Поиск по нескольким полям
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { telegramUserName: searchRegex },
                { userName: searchRegex },
                { fullName: searchRegex },
                { phone: searchRegex },
                { mail: searchRegex },
            ];
        }

        const users = await User.find(filter)
            .select('_id telegramId telegramUserName userName fullName phone mail status isBlocked createdAt')
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

// Создать модальное уведомление для пользователей
export const createModalNotification = async (req, res) => {
    try {
        const user = req.user;
        const { modalTitle, modalDescription, modalButtonText, modalButtonLink, userIds, status } = req.body;

        // Валидация обязательных полей
        if (!modalTitle || !modalDescription || !modalButtonText) {
            return res.status(400).json({
                success: false,
                message: "Заголовок, описание и текст кнопки обязательны",
            });
        }

        // Формируем объект уведомления
        const notification = {
            modalTitle,
            modalDescription,
            modalButtonText,
            modalButtonLink: modalButtonLink || undefined,
        };

        let filter = {};
        let updatedCount = 0;

        // Если указаны конкретные userIds
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            filter._id = { $in: userIds };
            const result = await User.updateMany(
                filter,
                { $push: { modalNotifications: notification } }
            );
            updatedCount = result.modifiedCount;
        } 
        // Если указан статус
        else if (status && status !== 'all') {
            filter.status = status;
            filter.isBlocked = { $ne: true };
            const result = await User.updateMany(
                filter,
                { $push: { modalNotifications: notification } }
            );
            updatedCount = result.modifiedCount;
        } 
        // Если ничего не указано, отправляем всем активным пользователям
        else {
            filter.isBlocked = { $ne: true };
            const result = await User.updateMany(
                filter,
                { $push: { modalNotifications: notification } }
            );
            updatedCount = result.modifiedCount;
        }

        await addAdminAction(user._id, `Создал(а) модальное уведомление: "${modalTitle}"`);

        res.json({
            success: true,
            message: `Модальное уведомление создано для ${updatedCount} пользователей`,
            count: updatedCount,
        });
    } catch (error) {
        console.log("Ошибка в createModalNotification:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка создания модального уведомления",
        });
    }
};

// Удалить модальное уведомление у пользователя (после нажатия на кнопку)
export const removeModalNotification = async (req, res) => {
    try {
        const admin = req.user;
        const { notificationIndex, mail } = req.body;

        if (notificationIndex === undefined || notificationIndex === null) {
            return res.status(400).json({
                success: false,
                message: "Необходимо указать индекс уведомления",
            });
        }

        const user = await User.findOne({ mail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        // Проверяем, что индекс валиден
        if (notificationIndex < 0 || notificationIndex >= user.modalNotifications.length) {
            return res.status(400).json({
                success: false,
                message: "Неверный индекс уведомления",
            });
        }

        // Удаляем уведомление по индексу
        user.modalNotifications.splice(notificationIndex, 1);
        await user.save();
        await addAdminAction(admin._id, `Удалил(а) модальное уведомление: "${user.modalNotifications[notificationIndex].modalTitle}"`);

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

        const user = await User.findOne({ telegramId }).select('modalNotifications');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Пользователь не найден",
            });
        }

        await User.findByIdAndUpdate(user._id, { lastActiveDate: new Date() });

        res.json({
            success: true,
            notifications: user.modalNotifications || [],
        });
    } catch (error) {
        console.log("Ошибка в getUserModalNotifications:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения модальных уведомлений",
        });
    }
};

