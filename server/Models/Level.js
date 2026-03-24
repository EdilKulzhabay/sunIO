import mongoose from "mongoose";

const LevelSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    /** Соответствует числу пройденных активаций тонких тел (0–6) */
    level: {
        type: Number,
        required: true,
        min: 0,
        max: 6,
        unique: true,
    },
    mainContent: {
        type: String,
        default: "",
    },
    content: {
        type: String,
        default: "",
    },
}, { timestamps: true });

export default mongoose.model("Level", LevelSchema);
