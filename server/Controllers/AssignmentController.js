import mongoose from "mongoose";
import Assignment from "../Models/Assignment.js";
import UserAssignmentProgress from "../Models/UserAssignmentProgress.js";
import VideoProgress from "../Models/VideoProgress.js";
import { addAdminAction } from "../utils/addAdminAction.js";
import { parseClientContentLink } from "../utils/parseClientContentLink.js";

const VIDEO_COMPLETE_THRESHOLD = 80;

function alignCompletedSteps(prev, n) {
    const arr = Array(n).fill(false);
    if (!prev || !Array.isArray(prev)) return arr;
    for (let i = 0; i < Math.min(n, prev.length); i++) {
        arr[i] = !!prev[i];
    }
    return arr;
}

/**
 * Обновляет completedSteps: для шагов без userControlled — по VideoProgress > 80%;
 * для userControlled — сохраняет значения из БД.
 */
export async function syncAssignmentProgress(userId, assignment) {
    const n = assignment.steps.length;
    const progressDoc = await UserAssignmentProgress.findOne({
        userId,
        assignmentId: assignment._id,
    });
    const completed = alignCompletedSteps(progressDoc?.completedSteps, n);

    for (let i = 0; i < n; i++) {
        const step = assignment.steps[i];
        if (step.userControlled) {
            continue;
        }

        const ref = parseClientContentLink(step.contentLink);
        if (!ref) {
            completed[i] = false;
            continue;
        }

        const vp = await VideoProgress.findOne({
            userId,
            contentType: ref.contentType,
            contentId: ref.contentId,
        });
        const pct = vp?.progress ?? 0;
        completed[i] = pct > VIDEO_COMPLETE_THRESHOLD;
    }

    await UserAssignmentProgress.findOneAndUpdate(
        { userId, assignmentId: assignment._id },
        { $set: { completedSteps: completed } },
        { upsert: true, new: true }
    );

    return completed;
}

export const create = async (req, res) => {
    try {
        const user = req.user;
        const { request, steps } = req.body;

        if (!request || typeof request !== "string" || request.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Поле «запрос» обязательно",
            });
        }

        if (!Array.isArray(steps) || steps.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Добавьте хотя бы один шаг",
            });
        }

        for (const s of steps) {
            if (!s.stepDescription || !s.contentLink) {
                return res.status(400).json({
                    success: false,
                    message: "У каждого шага нужны описание и ссылка на контент",
                });
            }
        }

        const doc = new Assignment({
            request: request.trim(),
            steps: steps.map((s) => ({
                stepDescription: String(s.stepDescription).trim(),
                contentLink: String(s.contentLink).trim(),
                userControlled: !!s.userControlled,
            })),
        });
        await doc.save();

        await addAdminAction(user._id, `Создал(а) задание: "${doc.request}"`);

        res.status(201).json({
            success: true,
            data: doc,
            message: "Задание создано",
        });
    } catch (error) {
        console.log("Ошибка в AssignmentController.create:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при создании задания",
            error: error.message,
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const list = await Assignment.find().sort({ updatedAt: -1 }).lean();

        res.json({
            success: true,
            data: list,
            list,
            count: list.length,
        });
    } catch (error) {
        console.log("Ошибка в AssignmentController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении заданий",
            error: error.message,
        });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Неверный id" });
        }

        const item = await Assignment.findById(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Задание не найдено",
            });
        }

        res.json({
            success: true,
            data: item,
        });
    } catch (error) {
        console.log("Ошибка в AssignmentController.getById:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении задания",
            error: error.message,
        });
    }
};

export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { request, steps } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Неверный id" });
        }

        const update = {};
        if (request !== undefined) update.request = String(request).trim();
        if (steps !== undefined) {
            if (!Array.isArray(steps) || steps.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Нужен непустой массив шагов",
                });
            }
            for (const s of steps) {
                if (!s.stepDescription || !s.contentLink) {
                    return res.status(400).json({
                        success: false,
                        message: "У каждого шага нужны описание и ссылка",
                    });
                }
            }
            update.steps = steps.map((s) => ({
                stepDescription: String(s.stepDescription).trim(),
                contentLink: String(s.contentLink).trim(),
                userControlled: !!s.userControlled,
            }));
        }

        const item = await Assignment.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Задание не найдено",
            });
        }

        await addAdminAction(user._id, `Обновил(а) задание: "${item.request}"`);

        res.json({
            success: true,
            data: item,
            message: "Задание обновлено",
        });
    } catch (error) {
        console.log("Ошибка в AssignmentController.update:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при обновлении задания",
            error: error.message,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Неверный id" });
        }

        const item = await Assignment.findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Задание не найдено",
            });
        }

        await UserAssignmentProgress.deleteMany({ assignmentId: id });
        await addAdminAction(user._id, `Удалил(а) задание: "${item.request}"`);

        res.json({
            success: true,
            message: "Задание удалено",
        });
    } catch (error) {
        console.log("Ошибка в AssignmentController.remove:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при удалении задания",
            error: error.message,
        });
    }
};

/** Для клиента: задание + шаги с полем completed (после синхронизации с VideoProgress) */
export const getForUser = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Требуется авторизация",
            });
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Неверный id" });
        }

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Задание не найдено",
            });
        }

        const completed = await syncAssignmentProgress(userId, assignment);

        const steps = assignment.steps.map((s, i) => ({
            stepDescription: s.stepDescription,
            contentLink: s.contentLink,
            userControlled: s.userControlled,
            completed: !!completed[i],
        }));

        res.json({
            success: true,
            data: {
                _id: assignment._id,
                request: assignment.request,
                steps,
            },
        });
    } catch (error) {
        console.log("Ошибка в AssignmentController.getForUser:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при загрузке задания",
            error: error.message,
        });
    }
};

/** Ручная отметка шага (только userControlled) */
export const toggleUserControlledStep = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Требуется авторизация",
            });
        }

        const { id, stepIndex } = req.params;
        const { completed } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Неверный id" });
        }

        const idx = parseInt(stepIndex, 10);
        if (Number.isNaN(idx) || idx < 0) {
            return res.status(400).json({ success: false, message: "Неверный индекс шага" });
        }

        const assignment = await Assignment.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Задание не найдено",
            });
        }

        if (idx >= assignment.steps.length) {
            return res.status(400).json({
                success: false,
                message: "Шаг не существует",
            });
        }

        if (!assignment.steps[idx].userControlled) {
            return res.status(400).json({
                success: false,
                message: "Этот шаг нельзя отметить вручную",
            });
        }

        const progressDoc = await UserAssignmentProgress.findOne({
            userId,
            assignmentId: assignment._id,
        });
        const arr = alignCompletedSteps(progressDoc?.completedSteps, assignment.steps.length);
        arr[idx] = completed === true || completed === "true" || completed === 1;

        await UserAssignmentProgress.findOneAndUpdate(
            { userId, assignmentId: assignment._id },
            { $set: { completedSteps: arr } },
            { upsert: true, new: true }
        );

        const merged = await syncAssignmentProgress(userId, assignment);

        const steps = assignment.steps.map((s, i) => ({
            stepDescription: s.stepDescription,
            contentLink: s.contentLink,
            userControlled: s.userControlled,
            completed: !!merged[i],
        }));

        res.json({
            success: true,
            data: {
                _id: assignment._id,
                request: assignment.request,
                steps,
            },
        });
    } catch (error) {
        console.log("Ошибка в AssignmentController.toggleUserControlledStep:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при сохранении шага",
            error: error.message,
        });
    }
};
