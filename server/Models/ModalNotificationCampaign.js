import mongoose from 'mongoose';

/** Метаданные массовой рассылки модальных уведомлений (для статистики и расписания). */
const ModalNotificationCampaignSchema = new mongoose.Schema(
  {
    modalTitle: {
      type: String,
      required: true,
      trim: true,
    },
    /** Запланированное время показа (когда задача должна выполниться). */
    scheduledAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'failed'],
      default: 'scheduled',
      index: true,
    },
    error: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ModalNotificationCampaign', ModalNotificationCampaignSchema);
