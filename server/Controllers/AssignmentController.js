import mongoose from "mongoose";
import Assignment from "../Models/Assignment.js";
import UserAssignmentProgress from "../Models/UserAssignmentProgress.js";
import VideoProgress from "../Models/VideoProgress.js";
import Diary from "../Models/Diary.js";
import User from "../Models/User.js";
import { addAdminAction } from "../utils/addAdminAction.js";
import { parseClientContentLink } from "../utils/parseClientContentLink.js";

const VIDEO_COMPLETE_THRESHOLD = 80;

/** Считаем «заполнил дневник» по числу записей в коллекции Diary. */
const DIARY_AUTO_COMPLETE_THRESHOLD = 6;

function normalizeClientPath(link) {
    if (!link || typeof link !== "string") return "";
    let path = link.trim();
    try {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            path = new URL(path).pathname;
        }
    } catch {
        return "";
    }
    if (!path.startsWith("/")) path = `/${path}`;
    const noTrail = path.replace(/\/+$/, "");
    return noTrail === "" ? "/" : noTrail;
}

function isDiaryAssignmentLink(link) {
    return normalizeClientPath(link) === "/client/diary";
}

function isMastersTowerAssignmentLink(link) {
    return normalizeClientPath(link) === "/client/masters-tower";
}

/** Приводит шаг из БД к виду { description, contents[] } (поддержка старого flat-шага). */
export function normalizeStep(step) {
    if (!step) return { description: "", contents: [] };
    if (step.contents && Array.isArray(step.contents) && step.contents.length > 0) {
        return {
            description: step.description || "",
            contents: step.contents.map((c) => ({
                stepDescription: c.stepDescription || "",
                contentLink: c.contentLink || "",
                userControlled: !!c.userControlled,
            })),
        };
    }
    return {
        description: step.description || step.stepDescription || "",
        contents: [
            {
                stepDescription: step.stepDescription || "",
                contentLink: step.contentLink || "",
                userControlled: !!step.userControlled,
            },
        ],
    };
}

function normalizeAssignmentSteps(steps) {
    if (!Array.isArray(steps)) return [];
    return steps.map(normalizeStep);
}

/**
 * Выровнять completedSteps под текущую структуру шагов.
 * prev: [[bool]] или legacy [bool] (один флаг на весь шаг).
 */
function alignNestedCompleted(prev, normalizedSteps) {
    const n = normalizedSteps.length;
    const out = [];
    for (let i = 0; i < n; i++) {
        const m = normalizedSteps[i].contents.length;
        const row = Array(m).fill(false);
        if (prev && Array.isArray(prev[i])) {
            const legacyRow = prev[i];
            if (legacyRow.length > 0 && typeof legacyRow[0] === "boolean") {
                for (let j = 0; j < Math.min(m, legacyRow.length); j++) {
                    row[j] = !!legacyRow[j];
                }
            }
        } else if (prev && typeof prev[i] === "boolean" && m > 0) {
            for (let j = 0; j < m; j++) {
                row[j] = prev[i];
            }
        }
        out.push(row);
    }
    return out;
}

/**
 * Обновляет completedSteps: для пунктов без userControlled — по VideoProgress;
 * для userControlled — значения из БД.
 */
export async function syncAssignmentProgress(userId, assignment) {
    const normalizedSteps = normalizeAssignmentSteps(assignment.steps);
    const progressDoc = await UserAssignmentProgress.findOne({
        userId,
        assignmentId: assignment._id,
    });
    let completed = alignNestedCompleted(progressDoc?.completedSteps, normalizedSteps);

    const diaryEntryCount = await Diary.countDocuments({ user: userId });

    const userActivations = await User.findById(userId)
        .select("bodyActivation heartActivation healingFamily awakeningSpirit")
        .lean();
    const mastersTowerAnyActivation = !!(
        userActivations &&
        (userActivations.bodyActivation ||
            userActivations.heartActivation ||
            userActivations.healingFamily ||
            userActivations.awakeningSpirit)
    );

    for (let i = 0; i < normalizedSteps.length; i++) {
        const contents = normalizedSteps[i].contents;
        for (let j = 0; j < contents.length; j++) {
            const c = contents[j];
            if (isDiaryAssignmentLink(c.contentLink) && diaryEntryCount > DIARY_AUTO_COMPLETE_THRESHOLD) {
                completed[i][j] = true;
                continue;
            }
            if (isMastersTowerAssignmentLink(c.contentLink) && mastersTowerAnyActivation) {
                completed[i][j] = true;
                continue;
            }
            if (c.userControlled) {
                continue;
            }
            const ref = parseClientContentLink(c.contentLink);
            if (!ref) {
                completed[i][j] = false;
                continue;
            }
            const vp = await VideoProgress.findOne({
                userId,
                contentType: ref.contentType,
                contentId: ref.contentId,
            });
            const pct = vp?.progress ?? 0;
            completed[i][j] = pct > VIDEO_COMPLETE_THRESHOLD;
        }
    }

    await UserAssignmentProgress.findOneAndUpdate(
        { userId, assignmentId: assignment._id },
        { $set: { completedSteps: completed } },
        { upsert: true, new: true }
    );

    return completed;
}

function mapStepsForClient(normalizedSteps, completed) {
    return normalizedSteps.map((step, i) => ({
        description: step.description,
        contents: step.contents.map((c, j) => ({
            stepDescription: c.stepDescription,
            contentLink: c.contentLink,
            userControlled: c.userControlled,
            completed: !!(completed[i] && completed[i][j]),
        })),
    }));
}

function validateStepsPayload(steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
        return "Добавьте хотя бы один шаг";
    }
    for (const s of steps) {
        if (!s.description || !String(s.description).trim()) {
            return "У каждого шага нужно описание (description)";
        }
        const contents = s.contents;
        if (!Array.isArray(contents) || contents.length === 0) {
            return "У каждого шага нужен хотя бы один пункт со ссылкой";
        }
        for (const c of contents) {
            if (!c.stepDescription || !String(c.stepDescription).trim()) {
                return "У каждого пункта нужна подпись (stepDescription)";
            }
            if (!c.contentLink || !String(c.contentLink).trim()) {
                return "У каждого пункта нужна ссылка на контент";
            }
        }
    }
    return null;
}

function mapBodyStepsToSchema(steps) {
    return steps.map((s) => ({
        description: String(s.description).trim(),
        contents: (s.contents || []).map((c) => ({
            stepDescription: String(c.stepDescription).trim(),
            contentLink: String(c.contentLink).trim(),
            userControlled: !!c.userControlled,
        })),
    }));
}

export const create = async (req, res) => {
    try {
        const user = req.user;
        const { request, description, steps } = req.body;

        if (!request || typeof request !== "string" || request.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Поле «запрос» обязательно",
            });
        }

        const err = validateStepsPayload(steps);
        if (err) {
            return res.status(400).json({ success: false, message: err });
        }

        let orderNum = 0;
        if (req.body.order !== undefined && req.body.order !== null && req.body.order !== "") {
            const n = Number(req.body.order);
            if (!Number.isFinite(n)) {
                return res.status(400).json({ success: false, message: "Поле «порядок» должно быть числом" });
            }
            orderNum = n;
        }

        const doc = new Assignment({
            request: request.trim(),
            description: description !== undefined && description !== null ? String(description).trim() : "",
            order: orderNum,
            steps: mapBodyStepsToSchema(steps),
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
        const list = await Assignment.find().sort({ order: 1, updatedAt: -1 }).lean();

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
        const { request, description, steps, order } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Неверный id" });
        }

        const update = {};
        if (request !== undefined) update.request = String(request).trim();
        if (description !== undefined) update.description = String(description).trim();
        if (order !== undefined && order !== null && order !== "") {
            const n = Number(order);
            if (!Number.isFinite(n)) {
                return res.status(400).json({ success: false, message: "Поле «порядок» должно быть числом" });
            }
            update.order = n;
        }
        if (steps !== undefined) {
            const err = validateStepsPayload(steps);
            if (err) {
                return res.status(400).json({ success: false, message: err });
            }
            update.steps = mapBodyStepsToSchema(steps);
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

/** Для клиента: задание + шаги с вложенным completed */
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
        const normalizedSteps = normalizeAssignmentSteps(assignment.steps);
        const steps = mapStepsForClient(normalizedSteps, completed);

        res.json({
            success: true,
            data: {
                _id: assignment._id,
                request: assignment.request,
                description: assignment.description,
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

export const getUserProgressByUserId = async (req, res) => {
    try {
        const { id: assignmentId, userId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(assignmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Неверный id" });
        }

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: "Задание не найдено",
            });
        }

        const completed = await syncAssignmentProgress(userId, assignment);
        const normalizedSteps = normalizeAssignmentSteps(assignment.steps);
        const steps = mapStepsForClient(normalizedSteps, completed);

        res.json({
            success: true,
            data: {
                _id: assignment._id,
                request: assignment.request,
                description: assignment.description,
                steps,
            },
        });
    } catch (error) {
        console.log("Ошибка в AssignmentController.getUserProgressByUserId:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при загрузке задания",
            error: error.message,
        });
    }
};

async function toggleUserControlledContent(req, res, userId) {
    const { id, stepIndex, contentIndex } = req.params;
    const { completed } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Неверный id" });
    }

    const stepIdx = parseInt(stepIndex, 10);
    const contentIdx = parseInt(contentIndex, 10);
    if (Number.isNaN(stepIdx) || stepIdx < 0 || Number.isNaN(contentIdx) || contentIdx < 0) {
        return res.status(400).json({ success: false, message: "Неверный индекс" });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: "Задание не найдено",
        });
    }

    const normalizedSteps = normalizeAssignmentSteps(assignment.steps);
    if (stepIdx >= normalizedSteps.length) {
        return res.status(400).json({
            success: false,
            message: "Шаг не существует",
        });
    }
    const contents = normalizedSteps[stepIdx].contents;
    if (contentIdx >= contents.length) {
        return res.status(400).json({
            success: false,
            message: "Пункт не существует",
        });
    }

    if (!contents[contentIdx].userControlled) {
        return res.status(400).json({
            success: false,
            message: "Этот пункт нельзя отметить вручную",
        });
    }

    const progressDoc = await UserAssignmentProgress.findOne({
        userId,
        assignmentId: assignment._id,
    });
    let arr = alignNestedCompleted(progressDoc?.completedSteps, normalizedSteps);
    arr[stepIdx][contentIdx] = completed === true || completed === "true" || completed === 1;

    await UserAssignmentProgress.findOneAndUpdate(
        { userId, assignmentId: assignment._id },
        { $set: { completedSteps: arr } },
        { upsert: true, new: true }
    );

    const merged = await syncAssignmentProgress(userId, assignment);
    const steps = mapStepsForClient(normalizedSteps, merged);

    res.json({
        success: true,
        data: {
            _id: assignment._id,
            request: assignment.request,
            description: assignment.description,
            steps,
        },
    });
}

export const toggleUserControlledStep = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Требуется авторизация",
            });
        }
        if (req.params.contentIndex === undefined) {
            req.params.contentIndex = "0";
        }
        await toggleUserControlledContent(req, res, userId);
    } catch (error) {
        console.log("Ошибка в AssignmentController.toggleUserControlledStep:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при сохранении шага",
            error: error.message,
        });
    }
};

export const toggleUserControlledStepByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (req.params.contentIndex === undefined) {
            req.params.contentIndex = "0";
        }
        await toggleUserControlledContent(req, res, userId);
    } catch (error) {
        console.log("Ошибка в AssignmentController.toggleUserControlledStepByUserId:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при сохранении шага",
            error: error.message,
        });
    }
};
