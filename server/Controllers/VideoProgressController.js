import VideoProgress from '../Models/VideoProgress.js';
import User from '../Models/User.js';
import Practice from '../Models/Practice.js';
import ParablesOfLife from '../Models/ParablesOfLife.js';
import ScientificDiscoveries from '../Models/ScientificDiscoveries.js';
import HealthLab from '../Models/HealthLab.js';
import RelationshipWorkshop from '../Models/RelationshipWorkshop.js';
import SpiritForge from '../Models/SpiritForge.js';
import MastersTower from '../Models/MastersTower.js';
import FemininityGazebo from '../Models/FemininityGazebo.js';
import ConsciousnessLibrary from '../Models/ConsciousnessLibrary.js';
import ProductCatalog from '../Models/ProductCatalog.js';
import AnalysisHealth from '../Models/AnalysisHealth.js';
import AnalysisRelationships from '../Models/AnalysisRelationships.js';
import AnalysisRealization from '../Models/AnalysisRealization.js';
import Psychodiagnostics from '../Models/Psychodiagnostics.js';

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

// Начисление баллов за конкретное видео (YouTube/RuTube — при воспроизведении, Kinescope — при достижении порога)
export const awardPointsForVideo = async (req, res) => {
    try {
        const { contentType, contentId, userId: bodyUserId, videoIndex } = req.body;
        let userId = req.userId;

        if (!userId && bodyUserId) userId = bodyUserId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Пользователь не авторизован' });
        }
        if (!contentType || !contentId || videoIndex === undefined) {
            return res.status(400).json({ success: false, message: 'Необходимо предоставить contentType, contentId и videoIndex' });
        }

        let content;
        const contentIdObj = typeof contentId === 'string' ? contentId : contentId;
        switch (contentType) {
            case 'practice': content = await Practice.findById(contentIdObj); break;
            case 'parables-of-life': content = await ParablesOfLife.findById(contentIdObj); break;
            case 'scientific-discoveries': content = await ScientificDiscoveries.findById(contentIdObj); break;
            case 'health-lab':
            case 'healthLab': content = await HealthLab.findById(contentIdObj); break;
            case 'relationship-workshop':
            case 'relationshipWorkshop': content = await RelationshipWorkshop.findById(contentIdObj); break;
            case 'spirit-forge':
            case 'spiritForge': content = await SpiritForge.findById(contentIdObj); break;
            case 'masters-tower':
            case 'mastersTower': content = await MastersTower.findById(contentIdObj); break;
            case 'femininity-gazebo':
            case 'femininityGazebo': content = await FemininityGazebo.findById(contentIdObj); break;
            case 'consciousness-library':
            case 'consciousnessLibrary': content = await ConsciousnessLibrary.findById(contentIdObj); break;
            case 'product-catalog':
            case 'productCatalog': content = await ProductCatalog.findById(contentIdObj); break;
            case 'analysis-health':
            case 'analysisHealth': content = await AnalysisHealth.findById(contentIdObj); break;
            case 'analysis-relationships':
            case 'analysisRelationships': content = await AnalysisRelationships.findById(contentIdObj); break;
            case 'analysis-realization':
            case 'analysisRealization': content = await AnalysisRealization.findById(contentIdObj); break;
            case 'psychodiagnostics': content = await Psychodiagnostics.findById(contentIdObj); break;
            default:
                return res.status(400).json({ success: false, message: 'Неверный тип контента' });
        }

        if (!content) {
            return res.status(404).json({ success: false, message: 'Контент не найден' });
        }

        const contentArr = content.content || [];
        const item = contentArr[videoIndex];
        const points = item?.video?.points ?? 0;

        if (points <= 0) {
            return res.status(200).json({ success: true, message: 'Баллы не указаны для видео', pointsAwarded: 0 });
        }

        let progress = await VideoProgress.findOne({ userId, contentType, contentId: contentIdObj });
        if (!progress) {
            progress = new VideoProgress({
                userId,
                contentType,
                contentId: contentIdObj,
                awardedVideoIndices: [],
            });
            await progress.save();
        }

        const awarded = progress.awardedVideoIndices || [];
        const alreadyAwarded = awarded.includes(videoIndex);
        const canAward = content.allowRepeatBonus || !alreadyAwarded;

        if (!canAward) {
            return res.status(200).json({
                success: true,
                message: 'Баллы за это видео уже были начислены',
                pointsAwarded: 0,
            });
        }

        await User.findByIdAndUpdate(userId, { $inc: { bonus: points } });

        if (!awarded.includes(videoIndex)) {
            progress.awardedVideoIndices = [...progress.awardedVideoIndices, videoIndex];
            await progress.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Баллы начислены',
            pointsAwarded: points,
        });
    } catch (error) {
        console.error('Ошибка начисления баллов за видео:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка начисления баллов',
            error: error.message,
        });
    }
};

// Начисление бонусов при клике на обложку/воспроизведении (legacy — один бонус за весь контент)
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
        switch (contentType) {
            case 'practice':
                content = await Practice.findById(contentId);
                break;
            case 'parables-of-life':
                content = await ParablesOfLife.findById(contentId);
                break;
            case 'scientific-discoveries':
                content = await ScientificDiscoveries.findById(contentId);
                break;
            case 'health-lab':
            case 'healthLab':
                content = await HealthLab.findById(contentId);
                break;
            case 'relationship-workshop':
            case 'relationshipWorkshop':
                content = await RelationshipWorkshop.findById(contentId);
                break;
            case 'spirit-forge':
            case 'spiritForge':
                content = await SpiritForge.findById(contentId);
                break;
            case 'masters-tower':
            case 'mastersTower':
                content = await MastersTower.findById(contentId);
                break;
            case 'femininity-gazebo':
            case 'femininityGazebo':
                content = await FemininityGazebo.findById(contentId);
                break;
            case 'consciousness-library':
            case 'consciousnessLibrary':
                content = await ConsciousnessLibrary.findById(contentId);
                break;
            case 'product-catalog':
            case 'productCatalog':
                content = await ProductCatalog.findById(contentId);
                break;
            case 'analysis-health':
            case 'analysisHealth':
                content = await AnalysisHealth.findById(contentId);
                break;
            case 'analysis-relationships':
            case 'analysisRelationships':
                content = await AnalysisRelationships.findById(contentId);
                break;
            case 'analysis-realization':
            case 'analysisRealization':
                content = await AnalysisRealization.findById(contentId);
                break;
            case 'psychodiagnostics':
                content = await Psychodiagnostics.findById(contentId);
                break;
            default:
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

