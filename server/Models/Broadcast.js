import mongoose from 'mongoose';

const BroadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Название рассылки обязательно'],
      trim: true,
      unique: true,
    },
    imgUrl: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Содержание рассылки обязательно'],
    },
    buttonText: {
      type: String,
      trim: true,
    },
    buttonUrl: {
      type: String,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    /** Время ежедневной отправки (МСК), формат "HH:mm". Используется для рассылки diaryCheck. */
    dailyScheduleTime: {
      type: String,
      default: '20:00',
      trim: true,
    },
    /** Дата последней отправки ежедневной рассылки (для diaryCheck), чтобы не слать дважды за день. */
    lastDiaryCheckSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Broadcast', BroadcastSchema);

