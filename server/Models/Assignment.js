import mongoose from "mongoose";

const AssignmentContentItemSchema = new mongoose.Schema(
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

const AssignmentStepSchema = new mongoose.Schema(
    {
        /** Текст шага на карте маршрута и в заголовке аккордеона */
        description: {
            type: String,
            default: "",
        },
        /** Несколько ссылок / пунктов внутри одного шага */
        contents: {
            type: [AssignmentContentItemSchema],
            default: [],
            validate: [(v) => Array.isArray(v) && v.length > 0, "Нужен хотя бы один пункт"],
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
        description: {
            type: String,
            default: "",
        },
        order: {
            type: Number,
            default: 0,
        },
        steps: {
            type: [AssignmentStepSchema],
            default: [],
        },
    },
    { timestamps: true }
);

export default mongoose.model("Assignment", AssignmentSchema);
