import mongoose from 'mongoose';

const DiarySchema = new mongoose.Schema(
  {
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    discovery: {
      type: String,
      trim: true,
    },
    achievement: {
      type: String,
      trim: true,
    },
    gratitude: {
      type: String,
      trim: true,
    },
    uselessTask: {
      type: Boolean,
      default: false,
    },
    wasUselessTaskAchieved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Diary', DiarySchema);

