import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    telegramId: {
        type: String,
    },
    telegramUserName: {
        type: String,
        default: '',
    },
    mail: {
        type: String,
    },
    password: {
        type: String,
    },
    fullName: {
        type: String,
    },
    userName: {
        type: String,
    },
    phone: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'content_manager', 'client_manager'],
        default: 'user'
    },
    products: [
        {
            productId: {
                type: String,
                required: true,
            },
            type: {
                type: String,
                enum: ['subscription', 'one-time', 'free'],
                required: true,
            },
            paymentDate: {
                type: Date,
                default: null,
            },
            paymentAmount: {
                type: Number,
                default: 0,
            },
            invoiceId: {
                type: String,
                default: null,
            },
            paymentStatus: {
                type: String,
                enum: ['pending', 'paid', 'failed'],
                default: 'pending',
            },
        },
    ],
    bonus: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['anonym', 'guest', 'registered', 'active', 'client'],
        default: 'guest',
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    currentToken: {
        type: String,
        default: null,
    },
    refreshToken: {
        type: String,
        default: null,
    },
    // Поля для отслеживания оплаты через Robokassa
    hasPaid: {
        type: Boolean,
        default: false,
    },
    paymentDate: {
        type: Date,
        default: null,
    },
    paymentAmount: {
        type: Number,
        default: 0,
    },
    invoiceId: {
        type: String,
        default: null,
    },
    emailConfirmed: {
        type: Boolean,
        default: false,
    },
    invitedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    inviteesCount: {
        type: Number,
        default: 0,
    },
    subscriptionEndDate: {
        type: Date,
        default: null,
    },
    locatedInRussia: {
        type: Boolean,
        default: false,
    },
    notifyPermission: {
        type: Boolean,
        default: true,
    },
    profilePhotoUrl: {
        type: String,
        default: null,
    },
    previousStatus: {
        type: String,
        enum: ['anonym', 'guest', 'registered', 'active', 'client'],
        default: null,
    },
    paymentLink: {
        type: String,
        default: null,
    },
    paymentId: {
        type: String,
        default: null,
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    },
    modalNotifications: [
        {
            modalTitle: {
                type: String,
                required: true,
            },
            modalDescription: {
                type: String,
                required: true,
            },
            modalButtonText: {
                type: String,
                required: true,
            },
            modalButtonLink: {
                type: String,
            },
        }
    ],
    lastActiveDate: {
        type: Date,
        default: null,
    },
    scheduleSubscriptions: [
        {
            scheduleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Schedule',
            },
        },
    ],
}, {
    timestamps: true
});

export default mongoose.model("User", UserSchema);