import MastersTower from "../Models/MastersTower.js";
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
            redirectToPage,
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

        const mastersTower = new MastersTower({
            title,
            shortDescription: shortDescription || '',
            imageUrl: imageUrl || '',
            accessType: accessType || 'free',
            starsRequired: Number.isFinite(starsRequired) ? starsRequired : 0,
            duration: Number.isFinite(duration) ? duration : 0,
            order: Number.isFinite(order) ? order : 0,
            allowRepeatBonus: Boolean(allowRepeatBonus),
            location: location || 'bottom',
            redirectToPage: redirectToPage || null,
            content: normalizedContent,
        });

        await mastersTower.save();

        await addAdminAction(user._id, `Создал(а) запись в Башне мастеров: "${title}"`);

        res.status(201).json({
            success: true,
            data: mastersTower,
            message: "Запись успешно создана",
        });
    } catch (error) {
        console.log("Ошибка в MastersTowerController.create:", error);
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

        const items = await MastersTower.find(filter).sort({ order: 1, createdAt: -1 });

        // Вычисляем duration как сумму всех duration из массива content
        const itemsWithCalculatedDuration = items.map(item => {
            const totalDuration = Array.isArray(item.content) 
                ? item.content.reduce((sum, contentItem) => {
                    const duration = Number.isFinite(contentItem?.video?.duration) ? contentItem.video.duration : 0;
                    return sum + duration;
                }, 0)
                : 0;
            
            return {
                ...item.toObject(),
                duration: totalDuration
            };
        });

        res.json({
            success: true,
            data: itemsWithCalculatedDuration,
            count: itemsWithCalculatedDuration.length,
        });
    } catch (error) {
        console.log("Ошибка в MastersTowerController.getAll:", error);
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

        const item = await MastersTower.findById(id);

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
        console.log("Ошибка в MastersTowerController.getById:", error);
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

        const item = await MastersTower.findByIdAndUpdate(
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

        await addAdminAction(user._id, `Обновил(а) запись в Башне мастеров: "${item.title}"`);

        res.json({
            success: true,
            data: item,
            message: "Запись успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в MastersTowerController.update:", error);
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

        const item = await MastersTower.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Запись не найдена",
            });
        }

        await addAdminAction(user._id, `Удалил(а) запись из Башни мастеров: "${item.title}"`);

        res.json({
            success: true,
            message: "Запись успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в MastersTowerController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении записи",
            error: error.message,
        });
    }
};
