import ActivationLink, { ACTIVATION_TITLES } from "../Models/ActivationLink.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новую ссылку активации
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { title, link, linkType } = req.body;

        if (!title || !link) {
            return res.status(400).json({
                success: false,
                message: "Название и ссылка обязательны",
            });
        }

        if (!ACTIVATION_TITLES.includes(title)) {
            return res.status(400).json({
                success: false,
                message: `Название должно быть одним из: ${ACTIVATION_TITLES.join(", ")}`,
            });
        }

        const existing = await ActivationLink.findOne({ title });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Ссылка для "${title}" уже существует. Используйте редактирование.`,
            });
        }

        const activationLink = new ActivationLink({
            title,
            link,
            linkType: linkType === 'internal' ? 'internal' : 'external',
        });
        await activationLink.save();

        await addAdminAction(user._id, `Создал(а) ссылку активации: "${title}"`);

        res.status(201).json({
            success: true,
            data: activationLink,
            message: "Ссылка активации успешно создана",
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Ссылка для этого типа уже существует",
            });
        }
        console.log("Ошибка в ActivationLinkController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании ссылки активации",
            error: error.message,
        });
    }
};

// Получить все ссылки активации
export const getAll = async (req, res) => {
    try {
        const links = await ActivationLink.find().sort({ title: 1 });

        res.json({
            success: true,
            data: links,
            list: links,
            count: links.length,
        });
    } catch (error) {
        console.log("Ошибка в ActivationLinkController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении ссылок активации",
            error: error.message,
        });
    }
};

// Получить ссылку по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const activationLink = await ActivationLink.findById(id);

        if (!activationLink) {
            return res.status(404).json({
                success: false,
                message: "Ссылка активации не найдена",
            });
        }

        res.json({
            success: true,
            data: activationLink,
        });
    } catch (error) {
        console.log("Ошибка в ActivationLinkController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении ссылки активации",
            error: error.message,
        });
    }
};

// Обновить ссылку активации
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { title, link, linkType } = req.body;

        if (!link) {
            return res.status(400).json({
                success: false,
                message: "Ссылка обязательна",
            });
        }

        const updateData = {
            link,
            linkType: linkType === 'internal' ? 'internal' : 'external',
        };
        if (title && ACTIVATION_TITLES.includes(title)) {
            updateData.title = title;
        }

        const activationLink = await ActivationLink.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!activationLink) {
            return res.status(404).json({
                success: false,
                message: "Ссылка активации не найдена",
            });
        }

        await addAdminAction(user._id, `Обновил(а) ссылку активации: "${activationLink.title}"`);

        res.json({
            success: true,
            data: activationLink,
            message: "Ссылка активации успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в ActivationLinkController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении ссылки активации",
            error: error.message,
        });
    }
};

// Удалить ссылку активации
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const activationLink = await ActivationLink.findByIdAndDelete(id);

        if (!activationLink) {
            return res.status(404).json({
                success: false,
                message: "Ссылка активации не найдена",
            });
        }

        await addAdminAction(user._id, `Удалил(а) ссылку активации: "${activationLink.title}"`);

        res.json({
            success: true,
            message: "Ссылка активации успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в ActivationLinkController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении ссылки активации",
            error: error.message,
        });
    }
};
