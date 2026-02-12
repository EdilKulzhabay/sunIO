import mongoose from 'mongoose';

const PointsAwardingPolicySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Заголовок обязателен'],
      trim: true,
    },
    list: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        content: {
          type: String,
          required: true,
        },
      }
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('PointsAwardingPolicy', PointsAwardingPolicySchema);
