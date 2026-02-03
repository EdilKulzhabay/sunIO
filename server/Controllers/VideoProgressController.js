import VideoProgress from '../Models/VideoProgress.js';
import User from '../Models/User.js';
import Meditation from '../Models/Meditation.js';
import Practice from '../Models/Practice.js';
import VideoLesson from '../Models/VideoLesson.js';

// Сохранение или обновление прогресса просмотра
export const saveProgress = async (req, res) => {
    try {
        const { contentType, contentId, currentTime, duration, userId: bodyUserId } = req.body;
        let userId = req.userId; // Из authMiddleware

        // Если нет userId из токена, используем из body (для Telegram пользователей)
        if (!userId && bodyUserId) {
            userId = bodyUserId;
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Пользователь не авторизован'
            });
        }

        if (!contentType || !contentId || currentTime === undefined || !duration) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо предоставить contentType, contentId, currentTime и duration'
            });
        }

        // Вычисляем прогресс в процентах
        const progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
        const completed = progress >= 90; // Считаем завершенным, если просмотрено 90% или больше

        // Ищем существующий прогресс или создаем новый
        const existingProgress = await VideoProgress.findOne({
            userId,
            contentType,
            contentId
        });

        // Бонусы больше не начисляются здесь - они начисляются при клике на обложку/воспроизведении

        if (existingProgress) {
            // Обновляем существующий прогресс
            existingProgress.currentTime = Math.max(currentTime, existingProgress.currentTime);
            existingProgress.duration = Math.max(duration, existingProgress.duration);
            existingProgress.progress = Math.max(progress, existingProgress.progress);
            existingProgress.completed = Math.max(completed, existingProgress.completed);
            existingProgress.lastWatched = new Date();
            await existingProgress.save();

            return res.status(200).json({
                success: true,
                data: existingProgress
            });
        } else {
            // Создаем новый прогресс
            const newProgress = new VideoProgress({
                userId,
                contentType,
                contentId,
                currentTime,
                duration,
                progress,
                completed,
                lastWatched: new Date()
            });
            await newProgress.save();

            return res.status(201).json({
                success: true,
                data: newProgress
            });
        }
    } catch (error) {
        console.error('Ошибка сохранения прогресса:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка сохранения прогресса',
            error: error.message
        });
    }
};

// Получение прогресса просмотра
export const getProgress = async (req, res) => {
    try {
        const { userId, contentType, contentId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо предоставить userId'
            });
        }

        const progress = await VideoProgress.findOne({
            userId,
            contentType,
            contentId
        });

        if (!progress) {
            return res.status(200).json({
                success: true,
                data: {
                    currentTime: 0,
                    duration: 0,
                    progress: 0,
                    completed: false
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Ошибка получения прогресса:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка получения прогресса',
            error: error.message
        });
    }
};

// Получение всех прогрессов пользователя по типу контента
export const getUserProgresses = async (req, res) => {
    try {
        const { userId, contentType } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо предоставить userId'
            });
        }

        const progresses = await VideoProgress.find({
            userId,
            ...(contentType && { contentType })
        }).sort({ lastWatched: -1 });

        return res.status(200).json({
            success: true,
            data: progresses
        });
    } catch (error) {
        console.error('Ошибка получения прогрессов:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка получения прогрессов',
            error: error.message
        });
    }
};

// Получение прогрессов для списка контента (для отображения в карточках)
export const getProgressesForContents = async (req, res) => {
    try {
        const { userId, contentType } = req.params;

        if (!userId) {
            return res.status(200).json({
                success: true,
                data: {}
            });
        }

        const { contentIds } = req.body; // Массив ID контента

        if (!Array.isArray(contentIds) || contentIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо предоставить массив contentIds'
            });
        }

        const progresses = await VideoProgress.find({
            userId,
            contentType,
            contentId: { $in: contentIds }
        });

        // Преобразуем в объект для быстрого доступа по contentId
        const progressMap = {};
        progresses.forEach(progress => {
            progressMap[progress.contentId.toString()] = {
                progress: progress.progress,
                currentTime: progress.currentTime,
                duration: progress.duration,
                completed: progress.completed
            };
        });

        return res.status(200).json({
            success: true,
            data: progressMap
        });
    } catch (error) {
        console.error('Ошибка получения прогрессов для контента:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка получения прогрессов',
            error: error.message
        });
    }
};

// Начисление бонусов при клике на обложку/воспроизведении
export const awardBonusOnPlay = async (req, res) => {
    try {
        const { contentType, contentId, userId: bodyUserId } = req.body;
        let userId = req.userId; // Из authMiddleware

        // Если нет userId из токена, используем из body (для Telegram пользователей)
        if (!userId && bodyUserId) {
            userId = bodyUserId;
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Пользователь не авторизован'
            });
        }

        if (!contentType || !contentId) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо предоставить contentType и contentId'
            });
        }

        // Получаем контент для проверки allowRepeatBonus
        let content;
        if (contentType === 'meditation') {
            content = await Meditation.findById(contentId);
        } else if (contentType === 'practice') {
            content = await Practice.findById(contentId);
        } else if (contentType === 'videoLesson' || contentType === 'video-lesson') {
            content = await VideoLesson.findById(contentId);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Неверный тип контента'
            });
        }

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Контент не найден'
            });
        }

        // Проверяем существующий прогресс
        const existingProgress = await VideoProgress.findOne({
            userId,
            contentType,
            contentId
        });

        // Начисляем бонус если:
        // 1. allowRepeatBonus = true (можно начислять повторно)
        // 2. ИЛИ бонус еще не был начислен (нет прогресса или прогресс не завершен)
        const canAwardBonus = content.allowRepeatBonus || !existingProgress || !existingProgress.completed;

        if (canAwardBonus) {
            await User.findByIdAndUpdate(userId, {
                $inc: { bonus: 1 },
            });

            // Обновляем или создаем прогресс с отметкой о начислении бонуса
            if (existingProgress) {
                existingProgress.completed = true;
                existingProgress.lastWatched = new Date();
                await existingProgress.save();
            } else {
                const newProgress = new VideoProgress({
                    userId,
                    contentType,
                    contentId,
                    currentTime: 0,
                    duration: 0,
                    progress: 0,
                    completed: true,
                    lastWatched: new Date()
                });
                await newProgress.save();
            }

            return res.status(200).json({
                success: true,
                message: 'Бонус начислен',
                bonusAwarded: true
            });
        } else {
            return res.status(200).json({
                success: true,
                message: 'Бонус уже был начислен ранее',
                bonusAwarded: false
            });
        }
    } catch (error) {
        console.error('Ошибка начисления бонуса:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка начисления бонуса',
            error: error.message
        });
    }
};

