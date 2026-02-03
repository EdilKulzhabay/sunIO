import Practice from "../Models/Practice.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новую практику
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

        const practice = new Practice({
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

        await practice.save();

        await addAdminAction(user._id, `Создал(а) практику: "${title}"`);

        res.status(201).json({
            success: true,
            data: practice,
            message: "Практика успешно создана",
        });
    } catch (error) {
        console.log("Ошибка в PracticeController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании практики",
            error: error.message,
        });
    }
};

// Получить все практики
export const getAll = async (req, res) => {
    try {
        const { accessType } = req.query;
        
        const filter = {};
        if (accessType) filter.accessType = accessType;

        const practices = await Practice.find(filter).sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            data: practices,
            count: practices.length,
        });
    } catch (error) {
        console.log("Ошибка в PracticeController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении практик",
            error: error.message,
        });
    }
};

// Получить практику по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const practice = await Practice.findById(id);

        if (!practice) {
            return res.status(404).json({
                success: false,
                message: "Практика не найдена",
            });
        }

        res.json({
            success: true,
            data: practice,
        });
    } catch (error) {
        console.log("Ошибка в PracticeController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении практики",
            error: error.message,
        });
    }
};

// Обновить практику
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

        const practice = await Practice.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!practice) {
            return res.status(404).json({
                success: false,
                message: "Практика не найдена",
            });
        }

        await addAdminAction(user._id, `Обновил(а) практику: "${practice.title}"`);

        res.json({
            success: true,
            data: practice,
            message: "Практика успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в PracticeController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении практики",
            error: error.message,
        });
    }
};

// Удалить практику
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const practice = await Practice.findByIdAndDelete(id);

        if (!practice) {
            return res.status(404).json({
                success: false,
                message: "Практика не найдена",
            });
        }

        await addAdminAction(user._id, `Удалил(а) практику: "${practice.title}"`);

        res.json({
            success: true,
            message: "Практика успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в PracticeController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении практики",
            error: error.message,
        });
    }
};

