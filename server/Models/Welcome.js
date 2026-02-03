import mongoose from 'mongoose';

const WelcomeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Заголовок обязателен'],
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Контент обязателен'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Welcome', WelcomeSchema);
