import DynamicContent from "../Models/DynamicContent.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новый динамический контент
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { name, content } = req.body;

        if (!name || !content) {
            return res.status(400).json({
                success: false,
                message: "Название и контент обязательны",
            });
        }

        const dynamicContent = new DynamicContent({
            name,
            content,
        });

        await dynamicContent.save();

        await addAdminAction(user._id, `Создал(а) динамический контент: "${name}"`);

        res.status(201).json({
            success: true,
            data: dynamicContent,
            message: "Динамический контент успешно создан",
        });
    } catch (error) {
        console.log("Ошибка в DynamicContentController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании динамического контента",
            error: error.message,
        });
    }
};

// Получить все динамические контенты
export const getAll = async (req, res) => {
    try {
        const dynamicContents = await DynamicContent.find().sort({ name: 1 });

        res.json({
            success: true,
            data: dynamicContents,
            count: dynamicContents.length,
        });
    } catch (error) {
        console.log("Ошибка в DynamicContentController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении динамических контентов",
            error: error.message,
        });
    }
};

// Получить динамический контент по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const dynamicContent = await DynamicContent.findById(id);

        if (!dynamicContent) {
            return res.status(404).json({
                success: false,
                message: "Динамический контент не найден",
            });
        }

        res.json({
            success: true,
            data: dynamicContent,
        });
    } catch (error) {
        console.log("Ошибка в DynamicContentController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении динамического контента",
            error: error.message,
        });
    }
};

export const getByName = async (req, res) => {
    try {
        const { name } = req.params;
        const dynamicContent = await DynamicContent.findOne({ name });
        res.json({ success: true, data: dynamicContent });
    } catch (error) {
        console.log("Ошибка в DynamicContentController.getBySlug:", error);
        res.status(500).json({ success: false, message: "Ошибка при получении динамического контента" });
    }
};

export const getHoroscopeCorridorContent = async (req, res) => {
    try {
        const nameRegex = new RegExp('horoscope-corridor', 'i');
        const dynamicContent = await DynamicContent.find({ name: nameRegex });
        const contentMap = Object.fromEntries(
            dynamicContent.map((el) => [el.name, el.content])
          );
        res.json({ success: true, data: contentMap });
    } catch (error) {
        console.log("Ошибка в DynamicContentController.getHoroscopeCorridorContent:", error);
        res.status(500).json({ success: false, message: "Ошибка при получении динамического контента" });
    }
};

export const getBlockedBrowserContent = async (req, res) => {
    try {
        const title = await DynamicContent.findOne({ name: 'blocked-browser-bot-title' });
        const link = await DynamicContent.findOne({ name: 'blocked-browser-bot-link' });
        const buttonText = await DynamicContent.findOne({ name: 'blocked-browser-button-text' });
        res.json({ success: true, data: { title, link, buttonText } });
    } catch (error) {
        console.log("Ошибка в DynamicContentController.getBlockedBrowserContent:", error);
        res.status(500).json({ success: false, message: "Ошибка при получении динамического контента" });
    }
};

// Обновить динамический контент
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const dynamicContent = await DynamicContent.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!dynamicContent) {
            return res.status(404).json({
                success: false,
                message: "Динамический контент не найден",
            });
        }

        await addAdminAction(user._id, `Обновил(а) динамический контент: "${dynamicContent.name}"`);

        res.json({
            success: true,
            data: dynamicContent,
            message: "Динамический контент успешно обновлен",
        });
    } catch (error) {
        console.log("Ошибка в DynamicContentController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении динамического контента",
            error: error.message,
        });
    }
};

// Удалить динамический контент
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const dynamicContent = await DynamicContent.findByIdAndDelete(id);

        if (!dynamicContent) {
            return res.status(404).json({
                success: false,
                message: "Динамический контент не найден",
            });
        }

        await addAdminAction(user._id, `Удалил(а) динамический контент: "${dynamicContent.name}"`);

        res.json({
            success: true,
            message: "Динамический контент успешно удален",
        });
    } catch (error) {
        console.log("Ошибка в DynamicContentController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении динамического контента",
            error: error.message,
        });
    }
};

