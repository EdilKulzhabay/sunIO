import BotTrafficSource from "../Models/BotTrafficSource.js";
import User from "../Models/User.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новый источник трафика
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { title, botParameter, description, isActive } = req.body;

        if (!title || !botParameter) {
            return res.status(400).json({
                success: false,
                message: "Название и botParameter обязательны",
            });
        }

        const existing = await BotTrafficSource.findOne({ botParameter });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Источник с таким botParameter уже существует",
            });
        }

        const source = new BotTrafficSource({
            title,
            botParameter,
            description: description || "",
            isActive: typeof isActive === "boolean" ? isActive : true,
        });

        await source.save();

        await addAdminAction(user._id, `Создал(а) источник трафика бота: "${source.title}" (${source.botParameter})`);

        res.status(201).json({
            success: true,
            data: source,
            message: "Источник трафика успешно создан",
        });
    } catch (error) {
        console.log("Ошибка в BotTrafficSourceController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании источника трафика",
            error: error.message,
        });
    }
};

// Получить все источники
export const getAll = async (req, res) => {
    try {
        const sources = await BotTrafficSource.find().sort({ createdAt: -1 }).lean();

        const counts = await User.aggregate([
            { $match: { botStartSource: { $ne: null } } },
            { $group: { _id: "$botStartSource", count: { $sum: 1 } } },
        ]);
        const countMap = new Map();
        for (const row of counts) {
            countMap.set(row._id.toString(), row.count);
        }

        const data = sources.map((s) => ({
            ...s,
            registrationCount: countMap.get(s._id.toString()) || 0,
        }));

        res.json({
            success: true,
            data,
            count: data.length,
        });
    } catch (error) {
        console.log("Ошибка в BotTrafficSourceController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении источников трафика",
            error: error.message,
        });
    }
};

// Получить источник по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const source = await BotTrafficSource.findById(id);

        if (!source) {
            return res.status(404).json({
                success: false,
                message: "Источник трафика не найден",
            });
        }

        res.json({
            success: true,
            data: source,
        });
    } catch (error) {
        console.log("Ошибка в BotTrafficSourceController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении источника трафика",
            error: error.message,
        });
    }
};

// Обновить источник
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.botParameter) {
            const existing = await BotTrafficSource.findOne({
                botParameter: updateData.botParameter,
                _id: { $ne: id },
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: "Источник с таким botParameter уже существует",
                });
            }
        }

        const source = await BotTrafficSource.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!source) {
            return res.status(404).json({
                success: false,
                message: "Источник трафика не найден",
            });
        }

        await addAdminAction(user._id, `Обновил(а) источник трафика бота: "${source.title}" (${source.botParameter})`);

        res.json({
            success: true,
            data: source,
            message: "Источник трафика успешно обновлён",
        });
    } catch (error) {
        console.log("Ошибка в BotTrafficSourceController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении источника трафика",
            error: error.message,
        });
    }
};

// Удалить источник
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const source = await BotTrafficSource.findByIdAndDelete(id);

        if (!source) {
            return res.status(404).json({
                success: false,
                message: "Источник трафика не найден",
            });
        }

        await addAdminAction(user._id, `Удалил(а) источник трафика бота: "${source.title}" (${source.botParameter})`);

        res.json({
            success: true,
            message: "Источник трафика успешно удалён",
        });
    } catch (error) {
        console.log("Ошибка в BotTrafficSourceController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении источника трафика",
            error: error.message,
        });
    }
};

