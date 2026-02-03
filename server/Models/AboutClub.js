import mongoose from 'mongoose';

const AboutClubSchema = new mongoose.Schema(
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

export default mongoose.model('AboutClub', AboutClubSchema);
