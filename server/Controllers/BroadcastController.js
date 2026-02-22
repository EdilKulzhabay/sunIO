import User from "../Models/User.js";
import Broadcast from "../Models/Broadcast.js";
import BroadcastSchedule from "../Models/BroadcastSchedule.js";
import axios from "axios";
import { addAdminAction } from "../utils/addAdminAction.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
// URL бот сервера для рассылки
const BOT_SERVER_URL = process.env.BOT_SERVER_URL || 'http://localhost:5011';

// Отправка сообщения через Telegram Bot API
const sendTelegramMessage = async (chatId, message) => {
    try {
        const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.log(`Ошибка отправки сообщения пользователю ${chatId}:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

// Получить пользователей с фильтрацией по статусу и поиску
export const getFilteredUsers = async (req, res) => {
    try {
        const { status, search, lastActiveFilter } = req.body;
        console.log("status: ", status);
        console.log("search: ", search);

        let filter = {
            // Исключаем заблокированных пользователей
            isBlocked: { $ne: true },
        };
        
        // Фильтр по статусу (если указан)
        if (status && status !== 'all') {
            if (status === 'blocked') {
                // Если фильтр "blocked", показываем только заблокированных
                filter.isBlocked = true;
            } else {
                // Иначе исключаем заблокированных и фильтруем по статусу
                filter.status = status;
                filter.isBlocked = { $ne: true };
            }
        }

        // Получаем только пользователей с telegramId (для рассылки)
        filter.telegramId = { $exists: true, $ne: null, $ne: '' };

        // Фильтр по активности (15 дней)
        if (lastActiveFilter === 'active' || lastActiveFilter === 'inactive') {
            const thresholdDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            if (lastActiveFilter === 'active') {
                filter.lastActiveDate = { $gte: thresholdDate };
            } else {
                filter.$or = [
                    { lastActiveDate: { $lt: thresholdDate } },
                    { lastActiveDate: { $eq: null } },
                ];
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
            ];
        }

        const users = await User.find(filter)
            .select('telegramId telegramUserName userName fullName phone status isBlocked notifyPermission createdAt')
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

const resolveBroadcastContent = async ({ message, imageUrl, buttonText, broadcastId, broadcastTitle }) => {
        let savedBroadcast = null;
        if (broadcastId) {
            savedBroadcast = await Broadcast.findById(broadcastId);
            if (!savedBroadcast) {
            throw new Error("Сохраненная рассылка не найдена");
            }
        } else if (broadcastTitle) {
            savedBroadcast = await Broadcast.findOne({ title: broadcastTitle });
            if (!savedBroadcast) {
            throw new Error("Сохраненная рассылка не найдена");
            }
        }
        
    return {
        finalMessage: message || savedBroadcast?.content || '',
        finalImageUrl: imageUrl || savedBroadcast?.imgUrl || undefined,
        finalButtonText: buttonText || savedBroadcast?.buttonText || undefined,
    };
};

const executeBroadcast = async (payload) => {
    const { message, status, search, lastActiveFilter, userIds, imageUrl, parseMode, buttonText, buttonUrl, broadcastId, broadcastTitle } = payload;

    const { finalMessage, finalImageUrl, finalButtonText } = await resolveBroadcastContent({
        message,
        imageUrl,
        buttonText,
        broadcastId,
        broadcastTitle,
    });

        if (!finalMessage) {
        return {
                success: false,
            statusCode: 400,
                message: "Сообщение обязательно для отправки",
        };
        }

        if (!TELEGRAM_BOT_TOKEN) {
        return {
                success: false,
            statusCode: 500,
                message: "Telegram Bot Token не настроен в переменных окружения",
        };
        }

        let filter = {};
        let users;

        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            filter._id = { $in: userIds };
            filter.telegramId = { $exists: true, $ne: null, $ne: '' };
            filter.isBlocked = { $ne: true };
            filter.notifyPermission = { $ne: false };
            users = await User.find(filter).select('telegramId telegramUserName userName fullName phone status isBlocked profilePhotoUrl');
        } else {
            filter.isBlocked = { $ne: true };
            filter.notifyPermission = { $ne: false };
            
            if (status && status !== 'all') {
                if (status !== 'blocked') {
                    filter.status = status;
                }
            }

            filter.telegramId = { $exists: true, $ne: null, $ne: '' };

            if (lastActiveFilter === 'active' || lastActiveFilter === 'inactive') {
                const thresholdDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
                if (lastActiveFilter === 'active') {
                    filter.lastActiveDate = { $gte: thresholdDate };
                } else {
                    filter.$or = [
                        { lastActiveDate: { $lt: thresholdDate } },
                        { lastActiveDate: { $eq: null } },
                    ];
                }
            }

            if (search && search.trim()) {
                const searchRegex = new RegExp(search.trim(), 'i');
                filter.$or = [
                    { telegramUserName: searchRegex },
                    { userName: searchRegex },
                    { fullName: searchRegex },
                    { phone: searchRegex },
                ];
            }

            users = await User.find(filter).select('telegramId telegramUserName userName fullName phone status isBlocked profilePhotoUrl');
        }

        if (users.length === 0) {
        return {
                success: true,
                message: "Нет пользователей для отправки",
                sent: 0,
                failed: 0,
                total: 0,
        };
        }

    const telegramIds = users.map(user => user.telegramId).filter(id => id);
        
        if (telegramIds.length === 0) {
        return {
                success: true,
                message: "Нет пользователей с telegramId для отправки",
                sent: 0,
                failed: 0,
                total: 0,
        };
        }

        console.log(`Начинаем рассылку для ${telegramIds.length} пользователей через бот сервер`);
        console.log(`BOT_SERVER_URL: ${BOT_SERVER_URL}`);

        if (!BOT_SERVER_URL || BOT_SERVER_URL === 'http://localhost:5011') {
            console.warn('BOT_SERVER_URL не настроен или использует значение по умолчанию');
        }

        const usersData = users.map(user => ({
            telegramId: user.telegramId,
            telegramUserName: user.telegramUserName || '',
            profilePhotoUrl: user.profilePhotoUrl || '',
        }));

        try {
            const response = await axios.post(`${BOT_SERVER_URL}/api/bot/broadcast`, {
                text: finalMessage,
                telegramIds: telegramIds,
                imageUrl: finalImageUrl,
                parseMode: parseMode || 'HTML',
                buttonText: finalButtonText,
                buttonUrl: buttonUrl || undefined,
            usersData: usersData,
            }, {
                headers: {
                    "Content-Type": "application/json",
                },
            timeout: 300000,
            });

            if (!response.data || !response.data.results) {
                console.error('Неожиданная структура ответа от бот сервера:', response.data);
            return {
                    success: false,
                statusCode: 500,
                    message: "Неожиданный формат ответа от бот сервера",
                    error: response.data,
            };
            }

            const { results } = response.data;
            const totalSent = results.success?.length || 0;
            const totalFailed = results.failed?.length || 0;

            console.log(`Рассылка завершена. Отправлено: ${totalSent}, Ошибок: ${totalFailed}`);

        return {
                success: true,
                message: "Рассылка завершена",
                sent: totalSent,
                failed: totalFailed,
                total: telegramIds.length,
                failedUsers: results.failed || [],
        };
        } catch (error) {
            console.error('Ошибка при отправке запроса на бот сервер:', {
                message: error.message,
                code: error.code,
                response: error.response?.data,
                status: error.response?.status,
                url: `${BOT_SERVER_URL}/api/bot/broadcast`
            });
            
            if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return {
                    success: false,
                statusCode: 500,
                    message: `Бот сервер недоступен по адресу ${BOT_SERVER_URL}. Проверьте, что бот сервер запущен и доступен.`,
                    error: error.message,
            };
            }
            
            if (error.response) {
            return {
                    success: false,
                statusCode: error.response.status || 500,
                    message: "Ошибка при отправке рассылки на бот сервер",
                    error: error.response.data || error.message,
            };
            }
            
        return {
                success: false,
            statusCode: 500,
                message: "Ошибка при отправке рассылки на бот сервер",
                error: error.message,
        };
    }
};

// Отправить рассылку
export const sendBroadcast = async (req, res) => {
    try {
        const user = req.user;
        const { scheduledAt, ...payload } = req.body;

        if (scheduledAt) {
            const scheduledDate = new Date(scheduledAt);
            if (!Number.isNaN(scheduledDate.getTime()) && scheduledDate > new Date()) {
                const schedule = new BroadcastSchedule({
                    scheduledAt: scheduledDate,
                    payload,
                    scheduledBy: user?._id,
                });
                await schedule.save();
                if (user) {
                    const preview = (payload.message || '').substring(0, 50);
                    await addAdminAction(user._id, `Запланировал(а) рассылку на ${scheduledDate.toLocaleString('ru-RU')}: "${preview}${preview.length >= 50 ? '...' : ''}"`);
                }
                return res.status(200).json({
                    success: true,
                    message: "Рассылка запланирована",
                    scheduledAt: schedule.scheduledAt,
                });
            }
        }

        const result = await executeBroadcast(payload);
        if (!result.success) {
            return res.status(result.statusCode || 500).json(result);
        }

        if (user) {
            const preview = (payload.message || '').substring(0, 50);
            const sentInfo = result.sent ? ` (отправлено ${result.sent} пользователям)` : '';
            await addAdminAction(user._id, `Отправил(а) рассылку: "${preview}${preview.length >= 50 ? '...' : ''}"${sentInfo}`);
        }

        // Сохраняем запись об отправке для раздела «Отправленные рассылки»
        const sentRecord = new BroadcastSchedule({
            scheduledAt: new Date(),
            status: 'sent',
            payload,
            result,
            sentAt: new Date(),
            scheduledBy: user?._id,
        });
        await sentRecord.save();

        return res.status(200).json(result);
    } catch (error) {
        console.log("Ошибка в sendBroadcast:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при отправке рассылки",
        });
    }
};

/** Рассылка "diaryCheck" всем пользователям с notifyPermission и diaryNotifyPermission === true */
export const sendDiaryCheckBroadcast = async () => {
    try {
        const broadcast = await Broadcast.findOne({ title: 'diaryCheck' });
        if (!broadcast) {
            console.log('[sendDiaryCheckBroadcast] Рассылка с title "diaryCheck" не найдена');
            return { success: false, message: 'Рассылка diaryCheck не найдена' };
        }

        const users = await User.find({
            notifyPermission: true,
            diaryNotifyPermission: true,
            telegramId: { $exists: true, $ne: null, $ne: '' },
            isBlocked: { $ne: true },
        }).select('_id telegramId');

        if (users.length === 0) {
            console.log('[sendDiaryCheckBroadcast] Нет пользователей для рассылки diaryCheck');
            return { success: true, sent: 0, message: 'Нет пользователей для рассылки' };
        }

        const userIds = users.map(u => u._id);
        const result = await executeBroadcast({
            broadcastTitle: 'diaryCheck',
            userIds,
        });

        console.log(`[sendDiaryCheckBroadcast] Завершено: отправлено ${result.sent || 0}, ошибок ${result.failed || 0}`);
        return result;
    } catch (error) {
        console.error('[sendDiaryCheckBroadcast] Ошибка:', error);
        return { success: false, message: error.message };
    }
};

export const processScheduledBroadcasts = async () => {
    const now = new Date();
    const scheduled = await BroadcastSchedule.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
    })
        .sort({ scheduledAt: 1 })
        .limit(50);

    for (const job of scheduled) {
        try {
            const result = await executeBroadcast(job.payload || {});
            job.result = result;
            job.sentAt = new Date();
            if (result.success) {
                job.status = 'sent';
                if (job.scheduledBy) {
                    const preview = (job.payload?.message || '').substring(0, 50);
                    const sentInfo = result.sent ? ` (отправлено ${result.sent} пользователям)` : '';
                    await addAdminAction(job.scheduledBy, `Рассылка отправлена по расписанию: "${preview}${preview.length >= 50 ? '...' : ''}"${sentInfo}`);
                }
            } else {
                job.status = 'failed';
                job.error = result.message || 'Ошибка отправки рассылки';
            }
            await job.save();
        } catch (error) {
            job.status = 'failed';
            job.error = error.message || 'Ошибка отправки рассылки';
            job.sentAt = new Date();
            await job.save();
        }
    }
};

// Отправить тестовое сообщение (только себе - админу)
export const sendTestMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.userId;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Сообщение обязательно для отправки",
            });
        }

        if (!TELEGRAM_BOT_TOKEN) {
            return res.status(500).json({
                success: false,
                message: "Telegram Bot Token не настроен в переменных окружения",
            });
        }

        // Получаем telegramId текущего пользователя (админа)
        const user = await User.findById(userId).select('telegramId');

        if (!user || !user.telegramId) {
            return res.status(400).json({
                success: false,
                message: "У вас не привязан Telegram аккаунт",
            });
        }

        const result = await sendTelegramMessage(user.telegramId, message);

        if (result.success) {
            res.json({
                success: true,
                message: "Тестовое сообщение отправлено",
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Ошибка отправки тестового сообщения",
                error: result.error,
            });
        }
    } catch (error) {
        console.log("Ошибка в sendTestMessage:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при отправке тестового сообщения",
        });
    }
};

// Создать сохраненную рассылку
export const createBroadcast = async (req, res) => {
    try {
        const user = req.user;
        const { title, imgUrl, content, buttonText, buttonUrl } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Название и содержание рассылки обязательны",
            });
        }

        // Проверяем, существует ли уже рассылка с таким названием
        const existingBroadcast = await Broadcast.findOne({ title });
        if (existingBroadcast) {
            return res.status(400).json({
                success: false,
                message: "Рассылка с таким названием уже существует",
            });
        }

        const broadcast = new Broadcast({
            title,
            imgUrl: imgUrl || '',
            content,
            buttonText: buttonText || '',
            buttonUrl: buttonUrl || '',
        });

        await broadcast.save();

        await addAdminAction(user._id, `Создал(а) рассылку: "${broadcast.title}"`);

        res.status(201).json({
            success: true,
            message: "Рассылка успешно сохранена",
            data: broadcast,
        });
    } catch (error) {
        console.log("Ошибка в createBroadcast:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Рассылка с таким названием уже существует",
            });
        }
        res.status(500).json({
            success: false,
            message: "Ошибка при сохранении рассылки",
            error: error.message,
        });
    }
};

// Получить все сохраненные рассылки
export const getAllBroadcasts = async (req, res) => {
    try {
        const broadcasts = await Broadcast.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: broadcasts,
            count: broadcasts.length,
        });
    } catch (error) {
        console.log("Ошибка в getAllBroadcasts:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения сохраненных рассылок",
        });
    }
};

// Получить сохраненную рассылку по ID
export const getBroadcastById = async (req, res) => {
    try {
        const { id } = req.params;

        const broadcast = await Broadcast.findById(id);

        if (!broadcast) {
            return res.status(404).json({
                success: false,
                message: "Сохраненная рассылка не найдена",
            });
        }

        res.json({
            success: true,
            data: broadcast,
        });
    } catch (error) {
        console.log("Ошибка в getBroadcastById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения сохраненной рассылки",
        });
    }
};

// Обновить сохраненную рассылку
export const updateBroadcast = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { title, imgUrl, content, buttonText, buttonUrl } = req.body;

        const broadcast = await Broadcast.findById(id);

        if (!broadcast) {
            return res.status(404).json({
                success: false,
                message: "Сохраненная рассылка не найдена",
            });
        }

        // Если изменяется title, проверяем уникальность
        if (title && title !== broadcast.title) {
            const existingBroadcast = await Broadcast.findOne({ title });
            if (existingBroadcast) {
                return res.status(400).json({
                    success: false,
                    message: "Рассылка с таким названием уже существует",
                });
            }
            broadcast.title = title;
        }

        if (imgUrl !== undefined) broadcast.imgUrl = imgUrl;
        if (content !== undefined) broadcast.content = content;
        if (buttonText !== undefined) broadcast.buttonText = buttonText;
        if (buttonUrl !== undefined) broadcast.buttonUrl = buttonUrl;

        await broadcast.save();

        await addAdminAction(user._id, `Обновил(а) рассылку: "${broadcast.title}"`);

        res.json({
            success: true,
            message: "Рассылка успешно обновлена",
            data: broadcast,
        });
    } catch (error) {
        console.log("Ошибка в updateBroadcast:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Рассылка с таким названием уже существует",
            });
        }
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении рассылки",
            error: error.message,
        });
    }
};

// Удалить сохраненную рассылку
export const deleteBroadcast = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const broadcast = await Broadcast.findById(id);

        if (!broadcast) {
            return res.status(404).json({
                success: false,
                message: "Сохраненная рассылка не найдена",
            });
        }

        await Broadcast.findByIdAndDelete(id);

        await addAdminAction(user._id, `Удалил(а) рассылку: "${broadcast.title}"`);

        res.json({
            success: true,
            message: "Рассылка успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в deleteBroadcast:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении рассылки",
        });
    }
};

// Получить запланированные рассылки
export const getScheduledBroadcasts = async (req, res) => {
    try {
        const schedules = await BroadcastSchedule.find({ status: 'scheduled' })
            .sort({ scheduledAt: 1 })
            .populate('scheduledBy', 'fullName');

        res.json({
            success: true,
            data: schedules,
            count: schedules.length,
        });
    } catch (error) {
        console.log("Ошибка в getScheduledBroadcasts:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения запланированных рассылок",
        });
    }
};

// Получить отправленные рассылки
export const getSentBroadcasts = async (req, res) => {
    try {
        const schedules = await BroadcastSchedule.find({ status: 'sent' })
            .sort({ sentAt: -1 })
            .limit(100)
            .populate('scheduledBy', 'fullName');

        res.json({
            success: true,
            data: schedules,
            count: schedules.length,
        });
    } catch (error) {
        console.log("Ошибка в getSentBroadcasts:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка получения отправленных рассылок",
        });
    }
};

// Отменить запланированную рассылку
export const cancelScheduledBroadcast = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const schedule = await BroadcastSchedule.findById(id);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Запланированная рассылка не найдена",
            });
        }

        if (schedule.status !== 'scheduled') {
            return res.status(400).json({
                success: false,
                message: "Можно отменить только запланированную рассылку",
            });
        }

        const preview = (schedule.payload?.message || '').substring(0, 50);
        await BroadcastSchedule.findByIdAndDelete(id);

        if (user) {
            await addAdminAction(user._id, `Отменил(а) запланированную рассылку: "${preview}${preview.length >= 50 ? '...' : ''}"`);
        }

        res.json({
            success: true,
            message: "Рассылка отменена",
        });
    } catch (error) {
        console.log("Ошибка в cancelScheduledBroadcast:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при отмене рассылки",
        });
    }
};

