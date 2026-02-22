import mongoose from 'mongoose';

const ACTIVATION_TITLES = ['Активация тела', 'Активация здоровья', 'Активация Рода', 'Пробуждение Духа'];

const ActivationLinkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        enum: ACTIVATION_TITLES,
        unique: true,
    },
    link: {
        type: String,
        required: true,
    },
    linkType: {
        type: String,
        enum: ['internal', 'external'],
        default: 'external',
    },
}, { timestamps: true });

export default mongoose.model('ActivationLink', ActivationLinkSchema);
export { ACTIVATION_TITLES };