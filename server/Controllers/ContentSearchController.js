/**
 * Поиск контента по title по всем разделам.
 * GET /api/content-search?q=...
 */

import Practice from '../Models/Practice.js';
import ParablesOfLife from '../Models/ParablesOfLife.js';
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

const CONTENT_SOURCES = [
    { Model: Practice, categoryLabel: 'Практики', clientPath: '/client/practice' },
    { Model: ParablesOfLife, categoryLabel: 'Притчи о жизни', clientPath: '/client/parables-of-life' },
    { Model: ScientificDiscoveries, categoryLabel: 'Научные открытия', clientPath: '/client/scientific-discoveries' },
    { Model: HealthLab, categoryLabel: 'Лаборатория здоровья', clientPath: '/client/health-lab' },
    { Model: RelationshipWorkshop, categoryLabel: 'Мастерская отношений', clientPath: '/client/relationship-workshop' },
    { Model: SpiritForge, categoryLabel: 'Кузница Духа', clientPath: '/client/spirit-forge' },
    { Model: MastersTower, categoryLabel: 'Башня мастеров', clientPath: '/client/masters-tower' },
    { Model: FemininityGazebo, categoryLabel: 'Беседка женственности', clientPath: '/client/femininity-gazebo' },
    { Model: ConsciousnessLibrary, categoryLabel: 'Библиотека сознания', clientPath: '/client/consciousness-library' },
    { Model: ProductCatalog, categoryLabel: 'Каталог платных продуктов', clientPath: '/client/product-catalog' },
    { Model: AnalysisHealth, categoryLabel: 'Разборы — Здоровье', clientPath: '/client/analysis-health' },
    { Model: AnalysisRelationships, categoryLabel: 'Разборы — Отношения', clientPath: '/client/analysis-relationships' },
    { Model: AnalysisRealization, categoryLabel: 'Разборы — Реализация', clientPath: '/client/analysis-realization' },
    { Model: Psychodiagnostics, categoryLabel: 'Психодиагностика', clientPath: '/client/psychodiagnostics' },
];

export const search = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) {
            return res.json({ success: true, data: [] });
        }

        const searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

        const searchOne = async ({ Model, categoryLabel, clientPath }) => {
            const filter = { title: searchRegex };
            if (Model.schema.paths.visibility) {
                filter.visibility = true;
            }
            const docs = await Model.find(filter).select('_id title').limit(50).lean();
            return docs.map((doc) => ({
                _id: doc._id.toString(),
                title: doc.title || '',
                categoryLabel,
                link: `${clientPath}/${doc._id}`,
            }));
        };

        const resultsArrays = await Promise.all(CONTENT_SOURCES.map(searchOne));
        const data = resultsArrays.flat();

        res.json({ success: true, data });
    } catch (error) {
        console.error('Ошибка поиска контента:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при поиске контента',
            error: error.message,
        });
    }
};
