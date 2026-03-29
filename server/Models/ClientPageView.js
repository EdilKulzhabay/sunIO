import mongoose from "mongoose";

/**
 * Просмотр клиентской страницы (Telegram WebApp): для популярности URL и разреза по пользователям.
 */
const ClientPageViewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        path: {
            type: String,
            required: true,
            trim: true,
            maxlength: 512,
            index: true,
        },
        telegramId: {
            type: String,
            default: null,
            trim: true,
            index: true,
        },
        viewedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: false }
);

ClientPageViewSchema.index({ path: 1, viewedAt: -1 });
ClientPageViewSchema.index({ userId: 1, path: 1 });

export default mongoose.model("ClientPageView", ClientPageViewSchema);
