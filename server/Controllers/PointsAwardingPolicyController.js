import PointsAwardingPolicy from "../Models/PointsAwardingPolicy.js";
import { addAdminAction } from "../utils/addAdminAction.js";

// Создать новую политику
export const create = async (req, res) => {
    try {
        const user = req.user;
        const { title, list } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Заголовок обязателен",
            });
        }

        const policy = new PointsAwardingPolicy({
            title,
            list: list || [],
        });

        await policy.save();

        await addAdminAction(user._id, `Создал(а) политику начисления баллов: "${policy.title}"`);

        res.status(201).json({
            success: true,
            data: policy,
            message: "Политика успешно создана",
        });
    } catch (error) {
        console.log("Ошибка в PointsAwardingPolicyController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании политики",
            error: error.message,
        });
    }
};

// Получить все политики
export const getAll = async (req, res) => {
    try {
        const policies = await PointsAwardingPolicy.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: policies,
            count: policies.length,
        });
    } catch (error) {
        console.log("Ошибка в PointsAwardingPolicyController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении политик",
            error: error.message,
        });
    }
};

// Получить политику по ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const policy = await PointsAwardingPolicy.findById(id);

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: "Политика не найдена",
            });
        }

        res.json({
            success: true,
            data: policy,
        });
    } catch (error) {
        console.log("Ошибка в PointsAwardingPolicyController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении политики",
            error: error.message,
        });
    }
};

// Обновить политику
export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const updateData = req.body;

        const policy = await PointsAwardingPolicy.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: "Политика не найдена",
            });
        }

        await addAdminAction(user._id, `Обновил(а) политику начисления баллов: "${policy.title}"`);

        res.json({
            success: true,
            data: policy,
            message: "Политика успешно обновлена",
        });
    } catch (error) {
        console.log("Ошибка в PointsAwardingPolicyController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении политики",
            error: error.message,
        });
    }
};

// Удалить политику
export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const policy = await PointsAwardingPolicy.findByIdAndDelete(id);

        if (!policy) {
            return res.status(404).json({
                success: false,
                message: "Политика не найдена",
            });
        }

        await addAdminAction(user._id, `Удалил(а) политику начисления баллов: "${policy.title}"`);

        res.json({
            success: true,
            message: "Политика успешно удалена",
        });
    } catch (error) {
        console.log("Ошибка в PointsAwardingPolicyController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении политики",
            error: error.message,
        });
    }
};
