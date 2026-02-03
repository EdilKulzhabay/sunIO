import FAQ from "../Models/FAQ.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новый FAQ
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { question, answer, order } = req.body;

        if (!question || !answer) {
            return res.status(400).json({
                success: false,
                message: "Вопрос и ответ обязательны",
            });
        }

        // Если order не указан, устанавливаем максимальный order + 1
        let orderValue = order;
        if (orderValue === undefined || orderValue === null) {
            const maxOrderFAQ = await FAQ.findOne().sort({ order: -1 });
            orderValue = maxOrderFAQ ? (maxOrderFAQ.order || 0) + 1 : 0;
        }

        const faq = new FAQ({
            question,
            answer,
            order: orderValue,
        });

        await addAdminAction(user._id, `Создал(а) FAQ: "${faq.question}"`);

        await faq.save();

        res.status(201).json({
            success: true,
            data: faq,
            message: "FAQ успешно создан",
        });
    } catch (error) {
        console.log("Ошибка в FAQController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании FAQ",
            error: error.message,
        });
    }
};

// Получить все FAQ
export const getAll = async (req, res) => {
    try {
        const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            list: faqs,
            count: faqs.length,
        });
    } catch (error) {
        console.log("Ошибка в FAQController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении FAQ",
            error: error.message,
        });
    }
};

// Получить FAQ по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findById(id);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ не найден",
            });
        }

        res.json({
            success: true,
            data: faq,
        });
    } catch (error) {
        console.log("Ошибка в FAQController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении FAQ",
            error: error.message,
        });
    }
};

// Обновить FAQ
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const faq = await FAQ.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ не найден",
            });
        }

        await addAdminAction(user._id, `Обновил(а) FAQ: "${faq.question}"`);

        res.json({
            success: true,
            data: faq,
            message: "FAQ успешно обновлен",
        });
    } catch (error) {
        console.log("Ошибка в FAQController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении FAQ",
            error: error.message,
        });
    }
};

// Удалить FAQ
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const faq = await FAQ.findByIdAndDelete(id);

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ не найден",
            });
        }

        await addAdminAction(user._id, `Удалил(а) FAQ: "${faq.question}"`);

        res.json({
            success: true,
            message: "FAQ успешно удален",
        });
    } catch (error) {
        console.log("Ошибка в FAQController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении FAQ",
            error: error.message,
        });
    }
};

