import mongoose from "mongoose";

/**
 * Прогресс по шагам задания для пользователя.
 * completedSteps[i] соответствует assignment.steps[i]
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
            type: [Boolean],
            default: [],
        },
    },
    { timestamps: true }
);

UserAssignmentProgressSchema.index({ userId: 1, assignmentId: 1 }, { unique: true });

export default mongoose.model("UserAssignmentProgress", UserAssignmentProgressSchema);
