import Documents from '../Models/Documents.js';
import { addAdminAction } from '../utils/addAdminAction.js';

export const create = async (req, res) => {
    try {
        const user = req.user;
        const { title, link, order } = req.body;

        if (!title || !link) {
            return res.status(400).json({
                success: false,
                message: 'Название и ссылка обязательны',
            });
        }

        const doc = new Documents({ title, link, order: order != null ? Number(order) : 0 });
        await doc.save();

        await addAdminAction(user._id, `Создал(а) документ: "${title}"`);

        res.status(201).json({
            success: true,
            data: doc,
            message: 'Документ успешно создан',
        });
    } catch (error) {
        console.error('Ошибка в DocumentsController.create:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при создании документа',
            error: error.message,
        });
    }
};

export const getAll = async (req, res) => {
    try {
        const docs = await Documents.find().sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            data: docs,
            count: docs.length,
        });
    } catch (error) {
        console.error('Ошибка в DocumentsController.getAll:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении документов',
            error: error.message,
        });
    }
};

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Documents.findById(id);

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Документ не найден',
            });
        }

        res.json({
            success: true,
            data: doc,
        });
    } catch (error) {
        console.error('Ошибка в DocumentsController.getById:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении документа',
            error: error.message,
        });
    }
};

export const update = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { title, link, order } = req.body;

        const updateData = { title, link };
        if (order !== undefined) updateData.order = Number(order);

        const doc = await Documents.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Документ не найден',
            });
        }

        await addAdminAction(user._id, `Обновил(а) документ: "${doc.title}"`);

        res.json({
            success: true,
            data: doc,
            message: 'Документ успешно обновлен',
        });
    } catch (error) {
        console.error('Ошибка в DocumentsController.update:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при обновлении документа',
            error: error.message,
        });
    }
};

export const remove = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;

        const doc = await Documents.findByIdAndDelete(id);

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Документ не найден',
            });
        }

        await addAdminAction(user._id, `Удалил(а) документ: "${doc.title}"`);

        res.json({
            success: true,
            message: 'Документ успешно удален',
        });
    } catch (error) {
        console.error('Ошибка в DocumentsController.remove:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении документа',
            error: error.message,
        });
    }
};
