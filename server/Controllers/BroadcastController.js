import User from "../Models/User.js";
import Broadcast from "../Models/Broadcast.js";
import BroadcastSchedule from "../Models/BroadcastSchedule.js";
import Diary from "../Models/Diary.js";
import Schedule from "../Models/Schedule.js";
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

        if (!status || status === 'all') {
            filter.status = { $ne: 'anonym' };
        }

        if (status && status !== 'all') {
            if (status === 'blocked') {
                filter.isBlocked = true;
            } else {
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

const resolveBroadcastContent = async ({ message, imageUrl, buttonText, buttonUrl, broadcastId, broadcastTitle }) => {
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
        finalButtonUrl: buttonUrl || savedBroadcast?.buttonUrl || undefined,
    };
};

export const executeBroadcast = async (payload) => {
    const { message, status, search, lastActiveFilter, userIds, imageUrl, parseMode, buttonText, buttonUrl, broadcastId, broadcastTitle } = payload;

    const { finalMessage, finalImageUrl, finalButtonText, finalButtonUrl } = await resolveBroadcastContent({
        message,
        imageUrl,
        buttonText,
        buttonUrl,
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

            if (!status || status === 'all') {
                filter.status = { $ne: 'anonym' };
            } else if (status !== 'blocked') {
                filter.status = status;
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

    const validUsers = users.filter(u => {
            const id = u.telegramId;
            return id != null && id !== '' && String(id).trim() !== '';
        });
        const telegramIds = validUsers.map(u => String(u.telegramId));

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

        const PAYLOAD_USERDATA_MAX = 400;
        const usersData = validUsers.map(user => (
            telegramIds.length > PAYLOAD_USERDATA_MAX
                ? { telegramId: String(user.telegramId) }
                : {
                    telegramId: String(user.telegramId),
                    telegramUserName: user.telegramUserName || '',
                    profilePhotoUrl: user.profilePhotoUrl || '',
                }
        ));

        try {
            const response = await axios.post(`${BOT_SERVER_URL}/api/bot/broadcast`, {
                text: finalMessage,
                telegramIds: telegramIds,
                imageUrl: finalImageUrl,
                parseMode: parseMode || 'HTML',
                buttonText: finalButtonText,
                buttonUrl: finalButtonUrl || buttonUrl || undefined,
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

            let message = "Рассылка завершена";
            if (totalFailed > 0) {
                message = `Рассылка завершена. Отправлено: ${totalSent}. Не доставлено: ${totalFailed} (блокировка бота, неверный URL картинки/Web App и др. — см. логи бот-сервера)`;
            } else if (totalSent > 0) {
                message = `Рассылка отправлена ${totalSent} пользователям`;
            }

        return {
                success: true,
                message,
                sent: totalSent,
                failed: totalFailed,
                total: telegramIds.length,
                failedUsers: results.failed || [],
                sentTelegramIds: (results.success || []).map((tid) => String(tid)),
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
                    const label = payload.title || (payload.message || '').replace(/<[^>]*>/g, '').substring(0, 50);
                    const labelTrimmed = label.length >= 50 ? label.substring(0, 50) + '...' : label;
                    await addAdminAction(user._id, `Запланировал(а) рассылку на ${scheduledDate.toLocaleString('ru-RU')}: "${labelTrimmed}"`);
                }
                return res.status(200).json({
                    success: true,
                    message: "Рассылка запланирована",
                    scheduledAt: schedule.scheduledAt,
                });
            }
        }

        // Создаём запись со статусом 'sending' ДО начала рассылки,
        // чтобы она сразу появилась в отчётах
        const record = new BroadcastSchedule({
            scheduledAt: new Date(),
            status: 'sending',
            payload,
            scheduledBy: user?._id,
        });
        await record.save();

        const actionLabel = payload.title || (payload.message || '').replace(/<[^>]*>/g, '').substring(0, 50);
        const actionLabelTrimmed = actionLabel.length >= 50 ? actionLabel.substring(0, 50) + '...' : actionLabel;

        if (user) {
            await addAdminAction(user._id, `Запустил(а) рассылку: "${actionLabelTrimmed}"`);
        }

        // Сразу отвечаем клиенту — рассылка уходит в фон
        res.status(200).json({
            success: true,
            message: "Рассылка запущена. Результат можно посмотреть в отчётах.",
            broadcastId: record._id,
        });

        // Выполняем рассылку асинхронно (после ответа клиенту)
        executeBroadcast(payload)
            .then(async (result) => {
                try {
                    record.result = result;
                    record.sentAt = new Date();
                    record.status = result.success ? 'sent' : 'failed';
                    record.error = result.success ? undefined : (result.message || 'Ошибка отправки');
                    await record.save();

                    if (user && result.sent) {
                        await addAdminAction(user._id, `Рассылка завершена: "${actionLabelTrimmed}" (отправлено ${result.sent} пользователям)`);
                    }
                } catch (saveErr) {
                    console.error('Ошибка сохранения результата рассылки:', saveErr);
                }
            })
            .catch(async (err) => {
                try {
                    record.status = 'failed';
                    record.error = err.message || 'Неизвестная ошибка';
                    record.sentAt = new Date();
                    await record.save();
                } catch (saveErr) {
                    console.error('Ошибка сохранения ошибки рассылки:', saveErr);
                }
                console.error('Ошибка выполнения рассылки в фоне:', err);
            });
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

        const nowMsk = new Date(Date.now() + 3 * 60 * 60 * 1000);
        const todayStartMsk = new Date(Date.UTC(
            nowMsk.getUTCFullYear(), nowMsk.getUTCMonth(), nowMsk.getUTCDate(), 0, 0, 0
        ));
        const todayStartUtc = new Date(todayStartMsk.getTime() - 3 * 60 * 60 * 1000);

        const todayCompletedUsers = await Diary.find({
            createdAt: { $gte: todayStartUtc },
        }).select('user');

        if (users.length === 0) {
            console.log('[sendDiaryCheckBroadcast] Нет пользователей для рассылки diaryCheck');
            return { success: true, sent: 0, message: 'Нет пользователей для рассылки' };
        }

        const userIds = users.filter(u => !todayCompletedUsers.some(d => d.user.toString() === u._id.toString())).map(u => u._id);
        const result = await executeBroadcast({
            broadcastTitle: 'diaryCheck',
            userIds,
        });

        if (result.success) {
            await Broadcast.findByIdAndUpdate(broadcast._id, { lastDiaryCheckSentAt: new Date() });
        }
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
                    const label = job.payload?.title || (job.payload?.message || '').replace(/<[^>]*>/g, '').substring(0, 50);
                    const labelTrimmed = label.length >= 50 ? label.substring(0, 50) + '...' : label;
                    const sentInfo = result.sent ? ` (отправлено ${result.sent} пользователям)` : '';
                    await addAdminAction(job.scheduledBy, `Рассылка отправлена по расписанию: "${labelTrimmed}"${sentInfo}`);
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
        const { title, imgUrl, content, buttonText, buttonUrl, scheduledAt, dailyScheduleTime } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Название и содержание рассылки обязательны",
            });
        }

        const existingBroadcast = await Broadcast.findOne({ title });
        if (existingBroadcast) {
            return res.status(400).json({
                success: false,
                message: "Рассылка с таким названием уже существует",
            });
        }

        const scheduledDate = scheduledAt && !Number.isNaN(new Date(scheduledAt).getTime()) ? new Date(scheduledAt) : null;
        let dailyTime = '20:00';
        if (dailyScheduleTime && typeof dailyScheduleTime === 'string') {
            const match = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(dailyScheduleTime.trim());
            if (match) dailyTime = `${String(parseInt(match[1], 10)).padStart(2, '0')}:${match[2]}`;
        }
        const broadcast = new Broadcast({
            title,
            imgUrl: imgUrl || '',
            content,
            buttonText: buttonText || '',
            buttonUrl: buttonUrl || '',
            scheduledAt: scheduledDate,
            dailyScheduleTime: dailyTime,
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
        const { title, imgUrl, content, buttonText, buttonUrl, scheduledAt, dailyScheduleTime } = req.body;

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
        if (Object.prototype.hasOwnProperty.call(req.body, 'buttonUrl')) {
            broadcast.buttonUrl = req.body.buttonUrl != null ? String(req.body.buttonUrl).trim() : '';
        }
        if (scheduledAt !== undefined) {
            broadcast.scheduledAt = (scheduledAt && !Number.isNaN(new Date(scheduledAt).getTime())) ? new Date(scheduledAt) : null;
        }
        if (dailyScheduleTime !== undefined) {
            const trimmed = String(dailyScheduleTime).trim();
            if (trimmed === '') {
                broadcast.dailyScheduleTime = '';
            } else {
                const match = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(trimmed);
                if (match) broadcast.dailyScheduleTime = `${String(parseInt(match[1], 10)).padStart(2, '0')}:${match[2]}`;
            }
        }

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
        const schedules = await BroadcastSchedule.find({ status: { $in: ['sent', 'sending'] } })
            .sort({ createdAt: -1 })
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

/** Одна запись из журнала отправленных (для просмотра в админке) */
export const getSentBroadcastById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await BroadcastSchedule.findById(id)
            .populate("scheduledBy", "fullName telegramUserName")
            .lean();

        if (!schedule || !['sent', 'sending', 'failed'].includes(schedule.status)) {
            return res.status(404).json({
                success: false,
                message: "Отправленная рассылка не найдена",
            });
        }

        const payload = schedule.payload || {};
        let displayImageUrl = payload.imageUrl || '';
        try {
            const resolved = await resolveBroadcastContent({
                message: payload.message,
                imageUrl: payload.imageUrl,
                buttonText: payload.buttonText,
                buttonUrl: payload.buttonUrl,
                broadcastId: payload.broadcastId,
                broadcastTitle: payload.broadcastTitle,
            });
            if (resolved.finalImageUrl) {
                displayImageUrl = resolved.finalImageUrl;
            }
        } catch {
            /* шаблон удалён или битый broadcastId — остаётся imageUrl из payload */
        }

        const recipients = { successful: [], failed: [], note: null };
        const result = schedule.result || {};

        const enrichByTelegramIds = async (ids) => {
            const unique = [...new Set(ids.map(String).filter(Boolean))];
            if (unique.length === 0) return [];
            const users = await User.find({ telegramId: { $in: unique } })
                .select("telegramId telegramUserName userName fullName phone status")
                .lean();
            const map = new Map(users.map((u) => [String(u.telegramId), u]));
            return unique.map((tg) => {
                const u = map.get(String(tg));
                if (u) {
                    return {
                        telegramId: String(u.telegramId),
                        telegramUserName: u.telegramUserName || "",
                        userName: u.userName || "",
                        fullName: u.fullName || "",
                        phone: u.phone || "",
                        status: u.status || "",
                    };
                }
                return {
                    telegramId: String(tg),
                    telegramUserName: "",
                    userName: "",
                    fullName: "",
                    phone: "",
                    status: "",
                    notInDb: true,
                };
            });
        };

        const sentTelegramIds = Array.isArray(result.sentTelegramIds)
            ? result.sentTelegramIds.map(String)
            : [];

        if (sentTelegramIds.length > 0) {
            recipients.successful = await enrichByTelegramIds(sentTelegramIds);
        } else if (Array.isArray(payload.userIds) && payload.userIds.length > 0) {
            const users = await User.find({ _id: { $in: payload.userIds } })
                .select("telegramId telegramUserName userName fullName phone status")
                .lean();
            recipients.successful = users
                .filter((u) => u.telegramId != null && String(u.telegramId).trim() !== "")
                .map((u) => ({
                    telegramId: String(u.telegramId),
                    telegramUserName: u.telegramUserName || "",
                    userName: u.userName || "",
                    fullName: u.fullName || "",
                    phone: u.phone || "",
                    status: u.status || "",
                    approximate: true,
                }));
            recipients.note =
                "Список по пользователям из выборки на момент запуска; фактическая доставка могла отличаться (старая запись без сохранения Telegram ID успешных отправок).";
        } else {
            recipients.note =
                "Список получателей не сохранён для этой рассылки (отправка до обновления). Ниже — только ошибки доставки, если они были.";
        }

        const failedUsers = Array.isArray(result.failedUsers) ? result.failedUsers : [];
        const failedIds = failedUsers.map((f) => String(f.telegramId)).filter(Boolean);
        let failedMap = new Map();
        if (failedIds.length > 0) {
            const docs = await User.find({ telegramId: { $in: failedIds } })
                .select("telegramId telegramUserName userName fullName phone status")
                .lean();
            failedMap = new Map(docs.map((u) => [String(u.telegramId), u]));
        }

        recipients.failed = failedUsers.map((f) => {
            const u = failedMap.get(String(f.telegramId));
            return {
                telegramId: String(f.telegramId),
                error: f.error || "",
                errorCode: f.errorCode,
                telegramUserName: u?.telegramUserName || "",
                userName: u?.userName || "",
                fullName: u?.fullName || "",
                phone: u?.phone || "",
                status: u?.status || "",
            };
        });

        res.json({
            success: true,
            data: {
                ...schedule,
                displayImageUrl: displayImageUrl || undefined,
                recipients,
            },
        });
    } catch (error) {
        console.log("Ошибка в getSentBroadcastById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка загрузки записи",
        });
    }
};

export const deleteSentBroadcast = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await BroadcastSchedule.findById(id);

        if (!schedule || !['sent', 'sending', 'failed'].includes(schedule.status)) {
            return res.status(404).json({
                success: false,
                message: "Отправленная рассылка не найдена",
            });
        }

        await BroadcastSchedule.findByIdAndDelete(id);

        const user = req.user;
        if (user) {
            const { addAdminAction } = await import("../utils/addAdminAction.js");
            const title = schedule.payload?.title || schedule.payload?.broadcastTitle || (schedule.payload?.message || '').substring(0, 50) || id;
            await addAdminAction(user._id, `Удалил(а) запись отправленной рассылки: "${title}"`);
        }

        res.json({ success: true, message: "Запись удалена" });
    } catch (error) {
        console.log("Ошибка в deleteSentBroadcast:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка удаления записи",
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

        const label = schedule.payload?.title || (schedule.payload?.message || '').replace(/<[^>]*>/g, '').substring(0, 50);
        const labelTrimmed = label.length >= 50 ? label.substring(0, 50) + '...' : label;
        await BroadcastSchedule.findByIdAndDelete(id);

        if (user) {
            await addAdminAction(user._id, `Отменил(а) запланированную рассылку: "${labelTrimmed}"`);
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

const SCHEDULE_REMINDER_BROADCAST_ID = '69d09143ddf042774c8cd27c';

export const sendScheduleReminders = async () => {
    try {
        const broadcast = await Broadcast.findById(SCHEDULE_REMINDER_BROADCAST_ID).lean();
        if (!broadcast || !broadcast.content) {
            return;
        }

        const now = new Date();

        const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        const window1hStart = new Date(now.getTime() + 30 * 60 * 1000);
        const window1hEnd = new Date(now.getTime() + 90 * 60 * 1000);

        const events = await Schedule.find({
            $or: [
                { startDate: { $gte: window24hStart, $lte: window24hEnd }, reminder24hSentAt: null },
                { startDate: { $gte: window1hStart, $lte: window1hEnd }, reminder1hSentAt: null },
            ],
        }).lean();

        if (events.length === 0) return;

        for (const event of events) {
            const is24h = event.startDate >= window24hStart && event.startDate <= window24hEnd && !event.reminder24hSentAt;
            const is1h = event.startDate >= window1hStart && event.startDate <= window1hEnd && !event.reminder1hSentAt;

            if (!is24h && !is1h) continue;

            const subscribers = await User.find({
                'scheduleSubscriptions.scheduleId': event._id,
                telegramId: { $exists: true, $ne: null, $ne: '' },
                isBlocked: { $ne: true },
                notifyPermission: { $ne: false },
            }).select('_id telegramId');

            if (subscribers.length === 0) {
                if (is24h) await Schedule.updateOne({ _id: event._id }, { reminder24hSentAt: now });
                if (is1h) await Schedule.updateOne({ _id: event._id }, { reminder1hSentAt: now });
                continue;
            }

            const eventTitle = event.eventTitle || '';
            const rawDescription = event.description || '';
            const eventDescription = rawDescription.replace(/<[^>]*>/g, '');

            let content = broadcast.content
                .replace('[Название события]', eventTitle)
                .replace('[Описание события]', eventDescription);

            const userIds = subscribers.map(u => u._id);

            const eventLink =
                typeof event.eventLink === 'string' ? event.eventLink.trim() : '';
            const templateButtonUrl =
                broadcast.buttonUrl != null && String(broadcast.buttonUrl).trim()
                    ? String(broadcast.buttonUrl).trim()
                    : '';
            const reminderButtonUrl = eventLink || templateButtonUrl || undefined;
            const templateButtonText =
                broadcast.buttonText != null && String(broadcast.buttonText).trim()
                    ? String(broadcast.buttonText).trim()
                    : '';
            const reminderButtonText =
                templateButtonText || (reminderButtonUrl ? 'Перейти к событию' : undefined);

            try {
                await executeBroadcast({
                    message: content,
                    userIds,
                    imageUrl: broadcast.imgUrl || undefined,
                    parseMode: 'HTML',
                    buttonText: reminderButtonText,
                    buttonUrl: reminderButtonUrl,
                });

                const label = is1h ? '1ч' : '24ч';
                console.log(`[schedule-reminder] Напоминание (${label}) отправлено для события "${eventTitle}" — ${subscribers.length} подписчиков`);
            } catch (err) {
                console.error(`[schedule-reminder] Ошибка отправки для события "${eventTitle}":`, err.message);
            }

            if (is24h) await Schedule.updateOne({ _id: event._id }, { reminder24hSentAt: now });
            if (is1h) await Schedule.updateOne({ _id: event._id }, { reminder1hSentAt: now });
        }
    } catch (error) {
        console.error('[schedule-reminder] Ошибка в sendScheduleReminders:', error);
    }
};

