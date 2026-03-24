import BroadcastRecording from "../Models/BroadcastRecording.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новую запись эфира
export const create = async (req, res) => {
    try {
        const user = req.user;
        const {
            title,
            shortDescription,
            imageUrl,
            accessType,
            starsRequired,
            price,
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

        const normalizedContent = Array.isArray(content) ? content.map((item) => {
            const hasLinkButton = item?.linkButton?.linkButtonText || item?.linkButton?.linkButtonLink;
            if (hasLinkButton && !item?.video?.mainUrl && !item?.video?.reserveUrl && !item?.text && !item?.image) {
                return { linkButton: item.linkButton };
            }
            if (item?.video?.mainUrl || item?.video?.reserveUrl) {
                return {
                    video: {
                        mainUrl: item?.video?.mainUrl || '',
                        reserveUrl: item?.video?.reserveUrl || '',
                        duration: Number.isFinite(item?.video?.duration) ? item.video.duration : 0,
                        points: Number.isFinite(item?.video?.points) ? item.video.points : 0,
                    },
                };
            }
            if (item?.text) return { text: item.text };
            if (item?.image) return { image: item.image };
            return {
                video: { mainUrl: '', reserveUrl: '', duration: 0, points: 0 },
                text: '',
                image: '',
            };
        }) : [];

        const recording = new BroadcastRecording({
            title,
            shortDescription: shortDescription || '',
            imageUrl: imageUrl || '',
            accessType: accessType || 'free',
            starsRequired: Number.isFinite(starsRequired) ? starsRequired : 0,
            price: Number.isFinite(price) ? price : 0,
            duration: Number.isFinite(duration) ? duration : 0,
            order: Number.isFinite(order) ? order : 0,
            allowRepeatBonus: Boolean(allowRepeatBonus),
            location: location || 'bottom',
            redirectToPage: redirectToPage || null,
            content: normalizedContent,
            visibility: req.body.visibility !== false,
        });

        await recording.save();

        await addAdminAction(user._id, `Создал(а) запись эфира: "${title}"`);

        res.status(201).json({
            success: true,
            data: recording,
            message: "Запись эфира успешно создана",
        });
    } catch (error) {
        console.log("Ошибка в BroadcastRecordingController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании записи эфира",
            error: error.message,
        });
    }
};

// Получить все записи эфиров
export const getAll = async (req, res) => {
    try {
        const { accessType, admin } = req.query;
        
        const filter = {};
        if (accessType) filter.accessType = accessType;
        if (!admin) filter.visibility = { $ne: false };

        const recordings = await BroadcastRecording.find(filter).sort({ order: 1, createdAt: -1 });

        // Вычисляем duration как сумму всех duration из массива content
        const recordingsWithCalculatedDuration = recordings.map(item => {
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
            data: recordingsWithCalculatedDuration,
            count: recordingsWithCalculatedDuration.length,
        });
    } catch (error) {
        console.log("Ошибка в BroadcastRecordingController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записей эфиров",
            error: error.message,
        });
    }
};

// Получить запись эфира по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const recording = await BroadcastRecording.findById(id);

        if (!recording) {
            return res.status(404).json({
                success: false,
                message: "Запись эфира не найдена",
            });
        }

        res.json({
            success: true,
            data: recording,
        });
    } catch (error) {
        console.log("Ошибка в BroadcastRecordingController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записи эфира",
            error: error.message,
        });
    }
};

// Обновить запись эфира
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = { ...req.body };

        if (Array.isArray(updateData.content)) {
            updateData.content = updateData.content.map((item) => {
                const hasLinkButton = item?.linkButton?.linkButtonText || item?.linkButton?.linkButtonLink;
                if (hasLinkButton && !item?.video?.mainUrl && !item?.video?.reserveUrl && !item?.text && !item?.image) {
                    return { linkButton: item.linkButton };
                }
                if (item?.video?.mainUrl || item?.video?.reserveUrl) {
                    return {
                        video: {
                            mainUrl: item?.video?.mainUrl || '',
                            reserveUrl: item?.video?.reserveUrl || '',
                            duration: Number.isFinite(item?.video?.duration) ? item.video.duration : 0,
                            points: Number.isFinite(item?.video?.points) ? item.video.points : 0,
                        },
                    };
                }
                if (item?.text) return { text: item.text };
                if (item?.image) return { image: item.image };
                return { video: { mainUrl: '', reserveUrl: '', duration: 0, points: 0 } };
            });
        }

        if (updateData.starsRequired !== undefined) {
            updateData.starsRequired = Number.isFinite(updateData.starsRequired)
                ? updateData.starsRequired
                : 0;
        }
        if (updateData.price !== undefined) {
            updateData.price = Number.isFinite(updateData.price) ? updateData.price : 0;
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

        const recording = await BroadcastRecording.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!recording) {
            return res.status(404).json({
                success: false,
                message: "Запись эфира не найдена",
            });
        }

        await addAdminAction(user._id, `Обновил(а) запись эфира: "${recording.title}"`);

        res.json({
            success: true,
            data: recording,
            message: "Запись эфира успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в BroadcastRecordingController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении записи эфира",
            error: error.message,
        });
    }
};

// Удалить запись эфира
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const recording = await BroadcastRecording.findByIdAndDelete(id);

        if (!recording) {
            return res.status(404).json({
                success: false,
                message: "Запись эфира не найдена",
            });
        }

        await addAdminAction(user._id, `Удалил(а) запись эфира: "${recording.title}"`);

        res.json({
            success: true,
            message: "Запись эфира успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в BroadcastRecordingController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении записи эфира",
            error: error.message,
        });
    }
};

