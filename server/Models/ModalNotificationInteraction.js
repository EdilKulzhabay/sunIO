import mongoose from 'mongoose';

/** Одно действие пользователя по кампании: закрыл модалку или нажал кнопку (первое событие фиксируется). */
const ModalNotificationInteractionSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ModalNotificationCampaign',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['dismiss', 'button'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ModalNotificationInteractionSchema.index({ campaignId: 1, userId: 1 }, { unique: true });

export default mongoose.model('ModalNotificationInteraction', ModalNotificationInteractionSchema);
