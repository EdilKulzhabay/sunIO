import DepositLog from '../Models/DepositLog.js';
import PurchaseLog from '../Models/PurchaseLog.js';

export const getDeposits = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', dateFrom, dateTo } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};

        if (search) {
            filter.$or = [
                { userFullName: { $regex: search, $options: 'i' } },
                { invId: { $regex: search, $options: 'i' } },
            ];
        }

        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = to;
            }
        }

        filter.status = 'paid';

        const [data, total] = await Promise.all([
            DepositLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            DepositLog.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error('Ошибка получения журнала пополнений:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения журнала пополнений' });
    }
};

export const getPurchases = async (req, res) => {
    try {
        const { page = 1, limit = 50, search = '', dateFrom, dateTo } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};

        if (search) {
            filter.$or = [
                { userFullName: { $regex: search, $options: 'i' } },
                { productTitle: { $regex: search, $options: 'i' } },
            ];
        }

        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                const to = new Date(dateTo);
                to.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = to;
            }
        }

        const [data, total] = await Promise.all([
            PurchaseLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            PurchaseLog.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                total,
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error('Ошибка получения журнала покупок:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения журнала покупок' });
    }
};

export const getClientHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const User = (await import('../Models/User.js')).default;
        const user = await User.findById(userId).select('balance');

        const [deposits, purchases] = await Promise.all([
            DepositLog.find({ userId, status: 'paid' }).sort({ createdAt: -1 }),
            PurchaseLog.find({ userId, paymentType: 'balance' }).sort({ createdAt: -1 }),
        ]);

        res.json({
            success: true,
            data: {
                balance: user?.balance || 0,
                deposits,
                purchases,
            },
        });
    } catch (error) {
        console.error('Ошибка получения истории операций клиента:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения истории операций' });
    }
};

export const getClientDeposits = async (req, res) => {
    try {
        const { userId } = req.params;

        const deposits = await DepositLog.find({ userId, status: 'paid' })
            .sort({ createdAt: -1 })
            .select('_id createdAt invId amount');

        res.json({
            success: true,
            data: deposits,
        });
    } catch (error) {
        console.error('Ошибка получения журнала пополнений клиента:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения журнала пополнений' });
    }
};

export const getClientPurchases = async (req, res) => {
    try {
        const { userId } = req.params;

        const purchases = await PurchaseLog.find({ userId, paymentType: 'balance' })
            .sort({ createdAt: -1 })
            .select('_id createdAt amount productTitle');

        res.json({
            success: true,
            data: purchases,
        });
    } catch (error) {
        console.error('Ошибка получения журнала покупок клиента:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения журнала покупок' });
    }
};
