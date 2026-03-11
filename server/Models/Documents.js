import mongoose from 'mongoose';

const DocumentsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Название обязательно'],
            trim: true,
        },
        link: {
            type: String,
            required: [true, 'Ссылка обязательна'],
            trim: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('Documents', DocumentsSchema);
