import Level from "../Models/Level.js";
import { addAdminAction } from "../utils/addAdminAction.js";

export const create = async (req, res) => {
    try {
        const user = req.user;
        const { title, level, mainContent, content } = req.body;

        if (title === undefined || title === "" || level === undefined || level === null) {
            return res.status(400).json({
                success: false,
                message: "Поля title и level обязательны",
            });
        }

        const num = Number(level);
        if (Number.isNaN(num) || num < 0 || num > 6) {
            return res.status(400).json({
                success: false,
                message: "level должен быть числом от 0 до 6",
            });
        }

        const doc = new Level({
            title: String(title).trim(),
            level: num,
            mainContent: mainContent ?? "",
            content: content ?? "",
        });
        await doc.save();

        await addAdminAction(user._id, `Создал(а) уровень: "${doc.title}" (level ${doc.level})`);

        res.status(201).json({
            success: true,
            data: doc,
            message: "Уровень создан",
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Уровень с таким номером уже существует",
            });
        }
        console.log("Ошибка в LevelController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании уровня",
            error: error.message,
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const list = await Level.find().sort({ level: 1 }).lean();

        res.json({
            success: true,
            data: list,
            list,
            count: list.length,
        });
    } catch (error) {
        console.log("Ошибка в LevelController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении уровней",
            error: error.message,
        });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Level.findById(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Уровень не найден",
            });
        }

        res.json({
            success: true,
            data: item,
        });
    } catch (error) {
        console.log("Ошибка в LevelController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении уровня",
            error: error.message,
        });
    }
};

export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { title, level, mainContent, content } = req.body;

        const update = {};
        if (title !== undefined) update.title = String(title).trim();
        if (level !== undefined && level !== null) {
            const num = Number(level);
            if (Number.isNaN(num) || num < 0 || num > 6) {
                return res.status(400).json({
                    success: false,
                    message: "level должен быть числом от 0 до 6",
                });
            }
            update.level = num;
        }
        if (mainContent !== undefined) update.mainContent = mainContent;
        if (content !== undefined) update.content = content;

        const item = await Level.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Уровень не найден",
            });
        }

        await addAdminAction(user._id, `Обновил(а) уровень: "${item.title}"`);

        res.json({
            success: true,
            data: item,
            message: "Уровень обновлён",
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Уровень с таким номером уже существует",
            });
        }
        console.log("Ошибка в LevelController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении уровня",
            error: error.message,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const item = await Level.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Уровень не найден",
            });
        }

        await addAdminAction(user._id, `Удалил(а) уровень: "${item.title}"`);

        res.json({
            success: true,
            message: "Уровень удалён",
        });
    } catch (error) {
        console.log("Ошибка в LevelController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении уровня",
            error: error.message,
        });
    }
};
