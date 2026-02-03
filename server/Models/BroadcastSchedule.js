import mongoose from 'mongoose';

const BroadcastScheduleSchema = new mongoose.Schema(
  {
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'failed'],
      default: 'scheduled',
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('BroadcastSchedule', BroadcastScheduleSchema);

