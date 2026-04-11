import ClosedClubSettings from "../Models/ClosedClubSettings.js";

const DEFAULT_CHANNEL_LINK = "https://t.me/io_center";
const DEFAULT_CHAT_LINK = "https://t.me/+UWaWd3xq3erdWnny";

/**
 * Единственная запись настроек закрытого клуба (канал + чат).
 */
export async function getClosedClubSettingsDoc() {
    let doc = await ClosedClubSettings.findOne();
    if (!doc) {
        doc = await ClosedClubSettings.create({
            channelLink: DEFAULT_CHANNEL_LINK,
            chatLink: DEFAULT_CHAT_LINK,
            channelTelegramId: process.env.CHANNEL_ID || "",
            groupTelegramId: process.env.GROUP_ID || "",
        });
    }
    return doc;
}
