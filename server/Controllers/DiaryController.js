import Diary from "../Models/Diary.js";
import User from "../Models/User.js";

// Создать новую запись дневника
export const create = async (req, res) => {
    try {
        const { userId, discovery, achievement, gratitude, uselessTask } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Необходима авторизация",
            });
        }

        const diary = new Diary({
            user: userId,
            discovery: discovery || '',
            achievement: achievement || '',
            gratitude: gratitude || '',
            uselessTask: uselessTask || false,
            wasUselessTaskAchieved: uselessTask,
        });

        const bonusCount = uselessTask ? 2 : 1;
        await User.findByIdAndUpdate(userId, {
            $inc: { bonus: bonusCount },
        });

        await diary.save();
        res.status(201).json({
            success: true,
            data: diary,
            message: "Запись дневника успешно создана",
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании записи дневника",
            error: error.message,
        });
    }
};

// Получить все записи дневника
export const getAll = async (req, res) => {
    try {
        const userId = req.userId; // Из authMiddleware
        const userRole = req.user?.role; // Роль пользователя

        let query = {};
        
        // Если пользователь не админ, показываем только его записи
        if (userId && userRole !== 'admin') {
            query.user = userId;
        }

        const diaries = await Diary.find(query)
            .populate('user', 'fullName telegramUserName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: diaries,
            count: diaries.length,
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записей дневника",
            error: error.message,
        });
    }
};

// Получить записи дневника текущего пользователя
export const getMyDiaries = async (req, res) => {
    try {
        const { userId } = req.body;

        const diaries = await Diary.find({ user: userId })
            .populate('user', 'fullName telegramUserName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: diaries,
            count: diaries.length,
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.getMyDiaries:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записей дневника",
            error: error.message,
        });
    }
};

// Получить запись дневника по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.user?.role;

        const diary = await Diary.findById(id).populate('user', 'fullName telegramUserName');

        if (!diary) {
            return res.status(404).json({
                success: false,
                message: "Запись дневника не найдена",
            });
        }

        // Проверка прав доступа: пользователь может видеть только свои записи, админ - все
        const diaryUserId = diary.user._id ? diary.user._id.toString() : diary.user.toString();
        if (userRole !== 'admin' && diaryUserId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Нет доступа к этой записи",
            });
        }

        res.json({
            success: true,
            data: diary,
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записи дневника",
            error: error.message,
        });
    }
};

// Обновить запись дневника
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const diary = await Diary.findById(id);

        if (updateData.uselessTask && !diary.wasUselessTaskAchieved) {
            await User.findByIdAndUpdate(diary.user, {
                $inc: { bonus: 1 },
            });
            await Diary.findByIdAndUpdate(id, {
                wasUselessTaskAchieved: true,
            });
        }

        if (!diary) {
            return res.status(404).json({
                success: false,
                message: "Запись дневника не найдена",
            });
        }

        const updatedDiary = await Diary.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('user', 'fullName telegramUserName');

        res.json({
            success: true,
            data: updatedDiary,
            message: "Запись дневника успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении записи дневника",
            error: error.message,
        });
    }
};

// Удалить запись дневника
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.user?.role;

        const diary = await Diary.findById(id);

        if (!diary) {
            return res.status(404).json({
                success: false,
                message: "Запись дневника не найдена",
            });
        }

        // Проверка прав доступа: пользователь может удалять только свои записи, админ - все
        if (userRole !== 'admin' && diary.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Нет доступа к этой записи",
            });
        }

        await Diary.findByIdAndDelete(id);

        res.json({
            success: true,
            message: "Запись дневника успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в DiaryController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении записи дневника",
            error: error.message,
        });
    }
};

