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

        const filter = {};

        const { search, dateFrom, dateTo } = req.query;

        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        if (search && search.trim()) {
            filter.action = { $regex: search.trim(), $options: 'i' };
        }

        const totalLogs = await AdminActionLog.countDocuments(filter);
        const logs = await AdminActionLog.find(filter)
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
