import NavigatorDescriptions from "../Models/NavigatorDescriptions.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новую запись
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { name, title, description, content, link } = req.body;
        
        if (!name || !title || !description || !link) {
            return res.status(400).json({
                success: false,
                message: "Название, заголовок, описание и ссылка обязательны",
            });
        }

        const navigatorDescription = new NavigatorDescriptions({
            name,
            title,
            description,
            content: content || [],
            link,
        });
        
        await navigatorDescription.save();
        await addAdminAction(user._id, `Создал(а) описание навигатора: "${title}"`);
        
        res.status(201).json({
            success: true,
            data: navigatorDescription,
            message: "Описание навигатора успешно создано",
        });
    } catch (error) {
        console.log("Ошибка в NavigatorDescriptionsController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании описания навигатора",
            error: error.message,
        });
    }
};

// Получить все записи
export const getAll = async (req, res) => {
    try {
        const descriptions = await NavigatorDescriptions.find({}).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: descriptions,
            count: descriptions.length,
        });
    } catch (error) {
        console.log("Ошибка в NavigatorDescriptionsController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении описаний навигатора",
            error: error.message,
        });
    }
};

// Получить одну запись по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const description = await NavigatorDescriptions.findById(id);
        
        if (!description) {
            return res.status(404).json({
                success: false,
                message: "Описание навигатора не найдено",
            });
        }
        
        res.json({
            success: true,
            data: description,
        });
    } catch (error) {
        console.log("Ошибка в NavigatorDescriptionsController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении описания навигатора",
            error: error.message,
        });
    }
};

// Получить запись по имени (name)
export const getByName = async (req, res) => {
    try {
        const { name } = req.params;
        const description = await NavigatorDescriptions.findOne({ name });
        
        if (!description) {
            return res.status(404).json({
                success: false,
                message: "Описание навигатора не найдено",
            });
        }
        
        res.json({
            success: true,
            data: description,
        });
    } catch (error) {
        console.log("Ошибка в NavigatorDescriptionsController.getByName:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении описания навигатора",
            error: error.message,
        });
    }
};

// Обновить запись
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = req.body;
        
        const description = await NavigatorDescriptions.findById(id);
        if (!description) {
            return res.status(404).json({
                success: false,
                message: "Описание навигатора не найдено",
            });
        }

        const updatedDescription = await NavigatorDescriptions.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        await addAdminAction(user._id, `Обновил(а) описание навигатора: "${description.title}"`);
        
        res.json({
            success: true,
            data: updatedDescription,
            message: "Описание навигатора успешно обновлено",
        });
    } catch (error) {
        console.log("Ошибка в NavigatorDescriptionsController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении описания навигатора",
            error: error.message,
        });
    }
};

// Удалить запись
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const description = await NavigatorDescriptions.findById(id);
        
        if (!description) {
            return res.status(404).json({
                success: false,
                message: "Описание навигатора не найдено",
            });
        }
        
        await NavigatorDescriptions.findByIdAndDelete(id);
        await addAdminAction(user._id, `Удалил(а) описание навигатора: "${description.title}"`);
        
        res.json({
            success: true,
            message: "Описание навигатора успешно удалено",
        });
    } catch (error) {
        console.log("Ошибка в NavigatorDescriptionsController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении описания навигатора",
            error: error.message,
        });
    }
};
