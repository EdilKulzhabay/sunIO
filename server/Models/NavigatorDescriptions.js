import mongoose from 'mongoose';

const navigatorDescriptionsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    content: [
        {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            }
        }
    ],
    link: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const NavigatorDescriptions = mongoose.model('NavigatorDescriptions', navigatorDescriptionsSchema);

export default NavigatorDescriptions;