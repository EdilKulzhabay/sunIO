import Welcome from "../Models/Welcome.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новый контент приветствия
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { title, image, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Заголовок и контент обязательны",
            });
        }

        const welcome = new Welcome({
            title,
            image,
            content,
        });

        await welcome.save();

        await addAdminAction(user._id, `Создал(а) контент приветствия: "${welcome.title}"`);

        res.status(201).json({
            success: true,
            data: welcome,
            message: "Контент приветствия успешно создан",
        });
    } catch (error) {
        console.log("Ошибка в WelcomeController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании контента приветствия",
            error: error.message,
        });
    }
};

// Получить все контенты приветствия
export const getAll = async (req, res) => {
    try {
        const welcomes = await Welcome.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: welcomes,
            count: welcomes.length,
        });
    } catch (error) {
        console.log("Ошибка в WelcomeController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении контентов приветствия",
            error: error.message,
        });
    }
};

// Получить контент приветствия по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const welcome = await Welcome.findById(id);

        if (!welcome) {
            return res.status(404).json({
                success: false,
                message: "Контент приветствия не найден",
            });
        }

        res.json({
            success: true,
            data: welcome,
        });
    } catch (error) {
        console.log("Ошибка в WelcomeController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении контента приветствия",
            error: error.message,
        });
    }
};

// Обновить контент приветствия
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const welcome = await Welcome.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!welcome) {
            return res.status(404).json({
                success: false,
                message: "Контент приветствия не найден",
            });
        }

        await addAdminAction(user._id, `Обновил(а) контент приветствия: "${welcome.title}"`);

        res.json({
            success: true,
            data: welcome,
            message: "Контент приветствия успешно обновлен",
        });
    } catch (error) {
        console.log("Ошибка в WelcomeController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении контента приветствия",
            error: error.message,
        });
    }
};

// Удалить контент приветствия
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const welcome = await Welcome.findByIdAndDelete(id);

        if (!welcome) {
            return res.status(404).json({
                success: false,
                message: "Контент приветствия не найден",
            });
        }

        await addAdminAction(user._id, `Удалил(а) контент приветствия: "${welcome.title}"`);

        res.json({
            success: true,
            message: "Контент приветствия успешно удален",
        });
    } catch (error) {
        console.log("Ошибка в WelcomeController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении контента приветствия",
            error: error.message,
        });
    }
};
