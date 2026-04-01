import mongoose from 'mongoose';

/** Сохранённый черновик модального окна для повторного использования (как сохранённые рассылки). */
const ModalNotificationTemplateSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Название шаблона обязательно'],
            trim: true,
            unique: true,
        },
        modalTitle: {
            type: String,
            required: true,
            trim: true,
        },
        modalDescription: {
            type: String,
            required: true,
        },
        modalButtonText: {
            type: String,
            required: true,
            trim: true,
        },
        modalButtonLink: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('ModalNotificationTemplate', ModalNotificationTemplateSchema);
