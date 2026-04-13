import mongoose from "mongoose";

const ClosedClubSettingsSchema = new mongoose.Schema(
    {
        /** Публичная ссылка на открытый канал (профиль пользователя) */
        openChannelLink: {
            type: String,
            trim: true,
            default: "",
        },
        /** Публичная ссылка на открытый чат */
        openChatLink: {
            type: String,
            trim: true,
            default: "",
        },
        /** Ссылка на бота для доступа к закрытому каналу (подписка) */
        closedChannelLink: {
            type: String,
            trim: true,
            default: "",
        },
        /** Ссылка на бота для доступа к закрытому чату */
        closedChatLink: {
            type: String,
            trim: true,
            default: "",
        },
        /** @deprecated дублирует open* при миграции; читать через getClosedClubSettingsDoc */
        channelLink: {
            type: String,
            trim: true,
            default: "https://t.me/io_center",
        },
        chatLink: {
            type: String,
            trim: true,
            default: "https://t.me/+UWaWd3xq3erdWnny",
        },
        /** ID закрытого канала для Bot API, например -1001234567890 */
        channelTelegramId: {
            type: String,
            trim: true,
            default: "",
        },
        /** ID закрытого чата (супергруппы) для Bot API */
        groupTelegramId: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

export default mongoose.model("ClosedClubSettings", ClosedClubSettingsSchema);
