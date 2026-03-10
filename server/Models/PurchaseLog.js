import mongoose from "mongoose";

const PurchaseLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userFullName: {
        type: String,
        default: '',
    },
    productId: {
        type: String,
        default: null,
    },
    productTitle: {
        type: String,
        default: '',
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentType: {
        type: String,
        enum: ['stars', 'balance'],
        default: 'stars',
    },
}, {
    timestamps: true,
});

export default mongoose.model("PurchaseLog", PurchaseLogSchema);
