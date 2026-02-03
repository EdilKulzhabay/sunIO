import RelationshipWorkshop from "../Models/RelationshipWorkshop.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новую запись
export const create = async (req, res) => {
    try {
        const user = req.user;
        const {
            title,
            shortDescription,
            imageUrl,
            accessType,
            starsRequired,
            duration,
            order,
            allowRepeatBonus,
            location,
            content,
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Название обязательно",
            });
        }

        const normalizedContent = Array.isArray(content) ? content.map((item) => ({
            video: {
                mainUrl: item?.video?.mainUrl || '',
                reserveUrl: item?.video?.reserveUrl || '',
                duration: Number.isFinite(item?.video?.duration) ? item.video.duration : 0,
            },
            text: item?.text || '',
            image: item?.image || '',
        })) : [];

        const relationshipWorkshop = new RelationshipWorkshop({
            title,
            shortDescription: shortDescription || '',
            imageUrl: imageUrl || '',
            accessType: accessType || 'free',
            starsRequired: Number.isFinite(starsRequired) ? starsRequired : 0,
            duration: Number.isFinite(duration) ? duration : 0,
            order: Number.isFinite(order) ? order : 0,
            allowRepeatBonus: Boolean(allowRepeatBonus),
            location: location || 'bottom',
            content: normalizedContent,
        });

        await relationshipWorkshop.save();

        await addAdminAction(user._id, `Создал(а) запись в Мастерской отношений: "${title}"`);

        res.status(201).json({
            success: true,
            data: relationshipWorkshop,
            message: "Запись успешно создана",
        });
    } catch (error) {
        console.log("Ошибка в RelationshipWorkshopController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании записи",
            error: error.message,
        });
    }
};

// Получить все записи
export const getAll = async (req, res) => {
    try {
        const { accessType } = req.query;
        
        const filter = {};
        if (accessType) filter.accessType = accessType;

        const items = await RelationshipWorkshop.find(filter).sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            data: items,
            count: items.length,
        });
    } catch (error) {
        console.log("Ошибка в RelationshipWorkshopController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записей",
            error: error.message,
        });
    }
};

// Получить запись по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await RelationshipWorkshop.findById(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Запись не найдена",
            });
        }

        res.json({
            success: true,
            data: item,
        });
    } catch (error) {
        console.log("Ошибка в RelationshipWorkshopController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записи",
            error: error.message,
        });
    }
};

// Обновить запись
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = { ...req.body };

        if (Array.isArray(updateData.content)) {
            updateData.content = updateData.content.map((item) => ({
                video: {
                    mainUrl: item?.video?.mainUrl || '',
                    reserveUrl: item?.video?.reserveUrl || '',
                    duration: Number.isFinite(item?.video?.duration) ? item.video.duration : 0,
                },
                text: item?.text || '',
                image: item?.image || '',
            }));
        }

        if (updateData.starsRequired !== undefined) {
            updateData.starsRequired = Number.isFinite(updateData.starsRequired)
                ? updateData.starsRequired
                : 0;
        }
        if (updateData.duration !== undefined) {
            updateData.duration = Number.isFinite(updateData.duration)
                ? updateData.duration
                : 0;
        }
        if (updateData.order !== undefined) {
            updateData.order = Number.isFinite(updateData.order)
                ? updateData.order
                : 0;
        }

        const item = await RelationshipWorkshop.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Запись не найдена",
            });
        }

        await addAdminAction(user._id, `Обновил(а) запись в Мастерской отношений: "${item.title}"`);

        res.json({
            success: true,
            data: item,
            message: "Запись успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в RelationshipWorkshopController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении записи",
            error: error.message,
        });
    }
};

// Удалить запись
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const item = await RelationshipWorkshop.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Запись не найдена",
            });
        }

        await addAdminAction(user._id, `Удалил(а) запись из Мастерской отношений: "${item.title}"`);

        res.json({
            success: true,
            message: "Запись успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в RelationshipWorkshopController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении записи",
            error: error.message,
        });
    }
};
