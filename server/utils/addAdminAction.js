import AdminActionLog from "../Models/AdminActionLog.js";

export const addAdminAction = async (adminId, action) => {
    try {
        await AdminActionLog.create({
            admin: adminId,
            action,
        });
        return true;
    } catch (error) {
        console.log("Ошибка при добавлении действия админа:", error);
        return false;
    }
};