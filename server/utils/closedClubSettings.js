import ClosedClubSettings from "../Models/ClosedClubSettings.js";

const DEFAULT_CHANNEL_LINK = "https://t.me/io_center";
const DEFAULT_CHAT_LINK = "https://t.me/+UWaWd3xq3erdWnny";

async function migrateLegacyClosedClubFields(doc) {
    let changed = false;
    const openCh = (doc.openChannelLink || "").trim();
    const legacyCh = (doc.channelLink || "").trim();
    if (!openCh && legacyCh) {
        doc.openChannelLink = legacyCh;
        changed = true;
    }
    const openChat = (doc.openChatLink || "").trim();
    const legacyChat = (doc.chatLink || "").trim();
    if (!openChat && legacyChat) {
        doc.openChatLink = legacyChat;
        changed = true;
    }
    if (changed) {
        await doc.save();
    }
    return doc;
}

/**
 * Единственная запись настроек закрытого клуба (открытые ссылки + закрытые ресурсы для бота).
 */
export async function getClosedClubSettingsDoc() {
    let doc = await ClosedClubSettings.findOne();
    if (!doc) {
        doc = await ClosedClubSettings.create({
            openChannelLink: DEFAULT_CHANNEL_LINK,
            openChatLink: DEFAULT_CHAT_LINK,
            channelLink: DEFAULT_CHANNEL_LINK,
            chatLink: DEFAULT_CHAT_LINK,
            channelTelegramId: process.env.CHANNEL_ID || "",
            groupTelegramId: process.env.GROUP_ID || "",
        });
        return doc;
    }
    return migrateLegacyClosedClubFields(doc);
}
