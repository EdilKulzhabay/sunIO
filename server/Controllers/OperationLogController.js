import DepositLog from '../Models/DepositLog.js';
import PurchaseLog from '../Models/PurchaseLog.js';
import Practice from '../Models/Practice.js';
import ParablesOfLife from '../Models/ParablesOfLife.js';
import Neuromeditation from '../Models/Neuromeditation.js';
import ScientificDiscoveries from '../Models/ScientificDiscoveries.js';
import HealthLab from '../Models/HealthLab.js';
import RelationshipWorkshop from '../Models/RelationshipWorkshop.js';
import SpiritForge from '../Models/SpiritForge.js';
import MastersTower from '../Models/MastersTower.js';
import FemininityGazebo from '../Models/FemininityGazebo.js';
import ConsciousnessLibrary from '../Models/ConsciousnessLibrary.js';
import ProductCatalog from '../Models/ProductCatalog.js';
import AnalysisHealth from '../Models/AnalysisHealth.js';
import AnalysisRelationships from '../Models/AnalysisRelationships.js';
import AnalysisRealization from '../Models/AnalysisRealization.js';
import Psychodiagnostics from '../Models/Psychodiagnostics.js';

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
        const user = await User.findById(userId).select('balance supportKarma');

        const [deposits, purchases] = await Promise.all([
            DepositLog.find({ userId, status: 'paid' }).sort({ createdAt: -1 }),
            PurchaseLog.find({ userId, paymentType: 'balance' }).sort({ createdAt: -1 }),
        ]);

        res.json({
            success: true,
            data: {
                balance: user?.balance || 0,
                supportKarma: user?.supportKarma || 0,
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
            .select('_id createdAt amount productTitle productId')
            .lean();

        // Попробуем для каждого purchase подобрать ссылку на контент по productId
        const CONTENT_SOURCES = [
            { Model: Practice, clientPath: '/client/practice' },
            { Model: ParablesOfLife, clientPath: '/client/parables-of-life' },
            { Model: Neuromeditation, clientPath: '/client/neuromeditations' },
            { Model: ScientificDiscoveries, clientPath: '/client/scientific-discoveries' },
            { Model: HealthLab, clientPath: '/client/health-lab' },
            { Model: RelationshipWorkshop, clientPath: '/client/relationship-workshop' },
            { Model: SpiritForge, clientPath: '/client/spirit-forge' },
            { Model: MastersTower, clientPath: '/client/masters-tower' },
            { Model: FemininityGazebo, clientPath: '/client/femininity-gazebo' },
            { Model: ConsciousnessLibrary, clientPath: '/client/consciousness-library' },
            { Model: ProductCatalog, clientPath: '/client/product-catalog' },
            { Model: AnalysisHealth, clientPath: '/client/analysis-health' },
            { Model: AnalysisRelationships, clientPath: '/client/analysis-relationships' },
            { Model: AnalysisRealization, clientPath: '/client/analysis-realization' },
            { Model: Psychodiagnostics, clientPath: '/client/psychodiagnostics' },
        ];

        const withLinks = [];

        for (const purchase of purchases) {
            let link = null;
            if (purchase.productId) {
                for (const { Model, clientPath } of CONTENT_SOURCES) {
                    // exists быстрее, чем findById, и нам не нужны сами данные
                    // eslint-disable-next-line no-await-in-loop
                    const exists = await Model.exists({ _id: purchase.productId });
                    if (exists) {
                        link = `${clientPath}/${purchase.productId}`;
                        break;
                    }
                }
            }
            withLinks.push({
                ...purchase,
                link,
            });
        }

        res.json({
            success: true,
            data: withLinks,
        });
    } catch (error) {
        console.error('Ошибка получения журнала покупок клиента:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения журнала покупок' });
    }
};
