import mongoose from "mongoose";

const BotTrafficSourceSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Название обязательно"],
            trim: true,
        },
        botParameter: {
            type: String,
            required: [true, "botParameter обязателен"],
            trim: true,
            unique: true,
        },
        description: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("BotTrafficSource", BotTrafficSourceSchema);

