import BegginingJourney from "../Models/BegginingJourney.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новую запись
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { title, firstText, secondText, video } = req.body;
        if (!title || !firstText || !secondText || !video) {
            return res.status(400).json({
                success: false,
                message: "Заголовок, первый текст, второй текст и видео обязательны",
            });
        }
        const begginingJourney = new BegginingJourney({
            title,
            firstText,
            secondText,
            video,
        });
        await begginingJourney.save();
        await addAdminAction(user._id, `Создал(а) запись о начале путешествия: "${title}"`);
        res.status(201).json({
            success: true,
            data: begginingJourney,
            message: "Запись о начале путешествия успешно создана",
        });
    } catch (error) {
        console.log("Ошибка в BegginingJourneyController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании записи о начале путешествия",
            error: error.message,
        });
    }
};

export const get = async (req, res) => {
    try {
        const journey = await BegginingJourney.findOne({});
        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Запись о начале путешествия не найдена",
            });
        }
        res.json({
            success: true,
            data: journey,
        });
    } catch (error) {
        console.log("Ошибка в BegginingJourneyController.get:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записи о начале путешествия",
            error: error.message,
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const journeys = await BegginingJourney.find({}).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: journeys,
            count: journeys.length,
        });
    } catch (error) {
        console.log("Ошибка в BegginingJourneyController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении записей о начале путешествия",
            error: error.message,
        });
    }
};

export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id, updateData } = req.body;
        const journey = await BegginingJourney.findById(id);
        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Запись о начале путешествия не найдена",
            });
        }

        const updatedJourney = await BegginingJourney.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

        await addAdminAction(user._id, `Обновил(а) запись о начале путешествия: "${journey.title}"`);
        
        res.json({
            success: true,
            data: updatedJourney,
            message: "Запись о начале путешествия успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в BegginingJourneyController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении записи о начале путешествия",
            error: error.message,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const journey = await BegginingJourney.findById(id);
        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Запись о начале путешествия не найдена",
            });
        }
        await BegginingJourney.findByIdAndDelete(id);
        await addAdminAction(user._id, `Удалил(а) запись о начале путешествия: "${journey.title}"`);
        res.json({
            success: true,
            message: "Запись о начале путешествия успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в BegginingJourneyController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении записи о начале путешествия",
            error: error.message,
        });
    }
};