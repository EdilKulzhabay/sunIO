import mongoose from "mongoose";

const AssignmentStepSchema = new mongoose.Schema(
    {
        stepDescription: {
            type: String,
            required: true,
        },
        contentLink: {
            type: String,
            required: true,
        },
        /** Если true — «выполнен» выставляет сам пользователь; иначе — по прогрессу видео */
        userControlled: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const AssignmentSchema = new mongoose.Schema(
    {
        /** Запрос (название / тема задания) */
        request: {
            type: String,
            required: true,
        },
        steps: {
            type: [AssignmentStepSchema],
            default: [],
        },
    },
    { timestamps: true }
);

export default mongoose.model("Assignment", AssignmentSchema);
