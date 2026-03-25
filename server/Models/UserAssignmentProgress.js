import mongoose from "mongoose";

/**
 * Прогресс по заданию для пользователя.
 * completedSteps[i][j] — пункт j внутри шага i (соответствует assignment.steps[i].contents[j])
 * Legacy: completedSteps[i] как boolean — при чтении преобразуется в контроллере.
 */
const UserAssignmentProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
            index: true,
        },
        completedSteps: {
            type: mongoose.Schema.Types.Mixed,
            default: [],
        },
    },
    { timestamps: true }
);

UserAssignmentProgressSchema.index({ userId: 1, assignmentId: 1 }, { unique: true });

export default mongoose.model("UserAssignmentProgress", UserAssignmentProgressSchema);
