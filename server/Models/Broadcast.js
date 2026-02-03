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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Broadcast', BroadcastSchema);

