import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import os from "os";
import XLSX from "xlsx";
import Diary from "../Models/Diary.js";
import User from "../Models/User.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN
    ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
    : null;

const formatDiaryExportDate = (createdAt) => {
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

// Создать новую запись дневника
export const create = async (req, res) => {
    try {
        const { userId, discovery, achievement, gratitude, emotions, uselessTask } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Необходима авторизация",
            });
        }

        const diary = new Diary({
            user: userId,
            discovery: discovery || '',
            achievement: achievement || '',
            gratitude: gratitude || '',
            emotions: emotions || '',
            uselessTask: uselessTask || false,
            wasUselessTaskAchieved: uselessTask,
        });

        const bonusCount = uselessTask ? 2 : 1;
        await User.findByIdAndUpdate(userId, {
            $inc: { bonus: bonusCount },
        });

        await diary.save();
        res.status(201).json({
            success: true,
            data: diary,
            message: "Запись дневника успешно создана",
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании записи дневника",
            error: error.message,
        });
    }
};

// Получить все записи дневника
export const getAll = async (req, res) => {
    try {
        const userId = req.userId; // Из authMiddleware
        const userRole = req.user?.role; // Роль пользователя

        let query = {};
        
        // Если пользователь не админ, показываем только его записи
        if (userId && userRole !== 'admin') {
            query.user = userId;
        }

        const diaries = await Diary.find(query)
            .populate('user', 'fullName telegramUserName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: diaries,
            count: diaries.length,
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записей дневника",
            error: error.message,
        });
    }
};

// Получить записи дневника текущего пользователя
export const getMyDiaries = async (req, res) => {
    try {
        const { userId } = req.body;

        const diaries = await Diary.find({ user: userId })
            .populate('user', 'fullName telegramUserName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: diaries,
            count: diaries.length,
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.getMyDiaries:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записей дневника",
            error: error.message,
        });
    }
};

// Получить запись дневника по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.user?.role;

        const diary = await Diary.findById(id).populate('user', 'fullName telegramUserName');

        if (!diary) {
            return res.status(404).json({
                success: false,
                message: "Запись дневника не найдена",
            });
        }

        // Проверка прав доступа: пользователь может видеть только свои записи, админ - все
        const diaryUserId = diary.user._id ? diary.user._id.toString() : diary.user.toString();
        if (userRole !== 'admin' && diaryUserId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Нет доступа к этой записи",
            });
        }

        res.json({
            success: true,
            data: diary,
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записи дневника",
            error: error.message,
        });
    }
};

// Обновить запись дневника
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const diary = await Diary.findById(id);

        if (updateData.uselessTask && !diary.wasUselessTaskAchieved) {
            await User.findByIdAndUpdate(diary.user, {
                $inc: { bonus: 1 },
            });
            await Diary.findByIdAndUpdate(id, {
                wasUselessTaskAchieved: true,
            });
        }

        if (!diary) {
            return res.status(404).json({
                success: false,
                message: "Запись дневника не найдена",
            });
        }

        const updatedDiary = await Diary.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullName telegramUserName');

        res.json({
            success: true,
            data: updatedDiary,
            message: "Запись дневника успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении записи дневника",
            error: error.message,
        });
    }
};

// Удалить запись дневника
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.user?.role;

        const diary = await Diary.findById(id);

        if (!diary) {
            return res.status(404).json({
                success: false,
                message: "Запись дневника не найдена",
            });
        }

        // Проверка прав доступа: пользователь может удалять только свои записи, админ - все
        if (userRole !== 'admin' && diary.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Нет доступа к этой записи",
            });
        }

        await Diary.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Запись дневника успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении записи дневника",
            error: error.message,
        });
    }
};

/**
 * Собирает xlsx, кратко хранит во временном файле (освобождение памяти / предсказуемый поток),
 * удаляет файл с диска, затем отправляет документ пользователю через Telegram Bot API.
 */
export const sendDiaryExportViaBot = async (req, res) => {
    const { telegramId } = req.body;
    let tmpPath = null;
    try {
        if (!TELEGRAM_API_URL) {
            return res.status(503).json({
                success: false,
                message: "Отправка через бота временно недоступна",
            });
        }

        console.log("telegramId: ", telegramId);
        const user = await User.findOne({ telegramId }).select("telegramId").lean();
        console.log("user: ", user);
        const diaries = await Diary.find({ user: user._id }).sort({ createdAt: -1 }).lean();
        console.log("diaries: ", diaries);
        if (!diaries.length) {
            return res.status(400).json({
                success: false,
                message: "Нет записей для экспорта",
            });
        }

        const rows = diaries.map((d) => ({
            Дата: formatDiaryExportDate(d.createdAt),
            Осознание: d.discovery ?? "",
            Достижения: d.achievement ?? "",
            "Цели и задачи": d.gratitude ?? "",
            "Эмоции и энергия": d.emotions ?? "",
            Упражнение: d.uselessTask ? "да" : "нет",
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [{ wch: 12 }, { wch: 36 }, { wch: 36 }, { wch: 36 }, { wch: 36 }, { wch: 12 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Дневник");

        const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
        const stamp = formatDiaryExportDate(new Date());
        const fileName = `Osoznaniya_${stamp}.xlsx`;

        tmpPath = path.join(os.tmpdir(), `diary-exp-${randomBytes(16).toString("hex")}.xlsx`);
        await fs.writeFile(tmpPath, excelBuffer);

        let filePayload;
        try {
            filePayload = await fs.readFile(tmpPath);
        } finally {
            await fs.unlink(tmpPath).catch((err) => {
                console.warn(
                    "Diary export: не удалось удалить временный файл:",
                    tmpPath,
                    err?.message
                );
            });
            tmpPath = null;
        }

        const form = new FormData();
        form.append("chat_id", telegramId);
        form.append(
            "caption",
            "Экспорт дневника «Осознания». Скачайте файл во вложении."
        );
        form.append(
            "document",
            new Blob([filePayload], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            fileName
        );

        const tgRes = await fetch(`${TELEGRAM_API_URL}/sendDocument`, {
            method: "POST",
            body: form,
        });
        const tgJson = await tgRes.json();

        if (!tgJson.ok) {
            console.error("Telegram sendDocument (diary export):", tgJson);
            return res.status(502).json({
                success: false,
                message: tgJson.description || "Не удалось отправить файл в Telegram",
            });
        }

        return res.json({
            success: true,
            message: "Файл отправлен в чат с ботом",
        });
    } catch (error) {
        console.error("Ошибка в DiaryController.sendDiaryExportViaBot:", error);
        if (tmpPath) {
            await fs.unlink(tmpPath).catch(() => {});
        }
        return res.status(500).json({
            success: false,
            message: "Ошибка при подготовке экспорта",
        });
    }
};

