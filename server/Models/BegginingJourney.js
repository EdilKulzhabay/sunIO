import mongoose from 'mongoose';

const BegginingJourneySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Заголовок обязателен'],
      trim: true,
    },
    firstText: {
      type: String,
      required: [true, 'Первый текст обязателен'],
      trim: true,
    },
    secondText: {
      type: String,
      required: [true, 'Второй текст обязателен'],
      trim: true,
    },
    video: {
        mainUrl: {
            type: String,
            trim: true,
            default: null,
        },
        reserveUrl: {
            type: String,
            trim: true,
            default: null,
        },
        duration: {
            type: Number,
            min: 0,
            default: 0,
        },
        points: {
            type: Number,
            min: 0,
            default: 0,
        },
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('BegginingJourney', BegginingJourneySchema);
