/**
 * Миграция заданий и прогресса под схему:
 *   шаг = { description, contents: [{ stepDescription, contentLink, userControlled }, ...] }
 *
 * Старый формат (плоский шаг): { stepDescription, contentLink, userControlled } на уровне шага
 * или пустой contents → переносится в один элемент contents, description берётся из stepDescription/description.
 *
 * UserAssignmentProgress.completedSteps:
 *   было: boolean на шаг или плоский массив — приводится к массиву булевых по пунктам [[...], ...].
 *
 * Запуск из каталога server (нужен .env с MONGOURL):
 *   node scripts/migrateAssignmentStepsSchema.js
 *
 * Только просмотр без записи:
 *   MIGRATE_DRY_RUN=1 node scripts/migrateAssignmentStepsSchema.js
 */

import mongoose from "mongoose";
import "dotenv/config";
import Assignment from "../Models/Assignment.js";
import UserAssignmentProgress from "../Models/UserAssignmentProgress.js";

const DRY_RUN = process.env.MIGRATE_DRY_RUN === "1" || process.env.MIGRATE_DRY_RUN === "true";

function normalizeStep(step) {
    if (!step) return { description: "", contents: [] };
    const plain = typeof step.toObject === "function" ? step.toObject() : { ...step };
    if (plain.contents && Array.isArray(plain.contents) && plain.contents.length > 0) {
        return {
            description: String(plain.description ?? "").trim() || String(plain.stepDescription ?? "").trim(),
            contents: plain.contents.map((c) => ({
                stepDescription: String(c.stepDescription ?? "").trim(),
                contentLink: String(c.contentLink ?? "").trim(),
                userControlled: !!c.userControlled,
            })),
        };
    }
    return {
        description:
            String(plain.description ?? "").trim() ||
            String(plain.stepDescription ?? "").trim(),
        contents: [
            {
                stepDescription: String(plain.stepDescription ?? "").trim(),
                contentLink: String(plain.contentLink ?? "").trim(),
                userControlled: !!plain.userControlled,
            },
        ],
    };
}

function normalizeAssignmentSteps(steps) {
    if (!Array.isArray(steps)) return [];
    return steps.map(normalizeStep);
}

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

function stepsNeedMigration(rawSteps) {
    const normalized = normalizeAssignmentSteps(rawSteps);
    try {
        return JSON.stringify(rawSteps) !== JSON.stringify(normalized);
    } catch {
        return true;
    }
}

async function migrateAssignments() {
    const all = await Assignment.find({}).lean();
    let updated = 0;
    let skipped = 0;

    for (const doc of all) {
        const rawSteps = doc.steps || [];
        if (!stepsNeedMigration(rawSteps)) {
            skipped++;
            continue;
        }

        const steps = normalizeAssignmentSteps(rawSteps);
        const description = typeof doc.description === "string" ? doc.description : "";

        if (DRY_RUN) {
            console.log(`[dry-run] Assignment ${doc._id}: обновить steps (${steps.length} шаг.)`);
            updated++;
            continue;
        }

        await Assignment.updateOne(
            { _id: doc._id },
            {
                $set: {
                    description,
                    steps,
                },
            },
            { runValidators: false }
        );
        updated++;
        console.log(`✓ Assignment ${doc._id} (${doc.request || "без названия"})`);
    }

    return { total: all.length, updated, skipped };
}

async function migrateUserAssignmentProgress() {
    const all = await UserAssignmentProgress.find({}).lean();
    let updated = 0;
    let skipped = 0;
    let missingAssignment = 0;

    for (const doc of all) {
        const assignment = await Assignment.findById(doc.assignmentId).lean();
        if (!assignment) {
            missingAssignment++;
            console.warn(`⚠ UserAssignmentProgress ${doc._id}: задание ${doc.assignmentId} не найдено — пропуск`);
            continue;
        }

        const normalizedSteps = normalizeAssignmentSteps(assignment.steps || []);
        const aligned = alignNestedCompleted(doc.completedSteps, normalizedSteps);

        let same = false;
        try {
            same = JSON.stringify(doc.completedSteps) === JSON.stringify(aligned);
        } catch {
            same = false;
        }

        if (same) {
            skipped++;
            continue;
        }

        if (DRY_RUN) {
            console.log(`[dry-run] Progress ${doc._id} user=${doc.userId} assignment=${doc.assignmentId}`);
            updated++;
            continue;
        }

        await UserAssignmentProgress.updateOne(
            { _id: doc._id },
            { $set: { completedSteps: aligned } }
        );
        updated++;
        console.log(`✓ Progress ${doc._id} (user ${doc.userId})`);
    }

    return { total: all.length, updated, skipped, missingAssignment };
}

async function main() {
    const url = process.env.MONGOURL;
    if (!url) {
        console.error("Задайте MONGOURL в .env");
        process.exit(1);
    }

    if (DRY_RUN) {
        console.log("Режим MIGRATE_DRY_RUN — записи в БД не выполняются.\n");
    }

    console.log("Подключение к MongoDB...");
    await mongoose.connect(url);
    console.log("Подключено.\n");

    console.log("--- Задания (assignments) ---");
    const a = await migrateAssignments();
    console.log(`Всего: ${a.total}, обновлено: ${a.updated}, без изменений: ${a.skipped}\n`);

    console.log("--- Прогресс пользователей (userassignmentprogresses) ---");
    const p = await migrateUserAssignmentProgress();
    console.log(
        `Всего: ${p.total}, обновлено: ${p.updated}, без изменений: ${p.skipped}, нет задания: ${p.missingAssignment}\n`
    );

    console.log("Готово.");
    await mongoose.disconnect();
    process.exit(0);
}

main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
