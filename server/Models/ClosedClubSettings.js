import mongoose from "mongoose";

const ClosedClubSettingsSchema = new mongoose.Schema(
    {
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
        /** ID канала для Bot API, например -1001234567890 */
        channelTelegramId: {
            type: String,
            trim: true,
            default: "",
        },
        /** ID чата (супергруппы) для Bot API */
        groupTelegramId: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

export default mongoose.model("ClosedClubSettings", ClosedClubSettingsSchema);
