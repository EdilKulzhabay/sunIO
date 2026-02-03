import AdminActionLog from "../Models/AdminActionLog.js";

export const getAll = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Нет доступа",
            });
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 100;
        const skip = (page - 1) * limit;

        const totalLogs = await AdminActionLog.countDocuments();
        const logs = await AdminActionLog.find()
            .populate('admin', 'fullName mail role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: logs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalLogs / limit),
                totalLogs,
                limit,
                hasNextPage: page < Math.ceil(totalLogs / limit),
                hasPrevPage: page > 1,
            },
            count: logs.length,
        });
    } catch (error) {
        console.log("Ошибка в AdminActionLogController.getAll:", error);
        res.status(500).json({
            success: false,
            message: "Ошибка при получении журнала действий",
        });
    }
};
