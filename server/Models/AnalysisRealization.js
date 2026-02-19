import mongoose from 'mongoose';

const AnalysisRealizationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Название обязательно'],
      trim: true,
    },
    shortDescription: {
      type: String,
      maxlength: [500, 'Краткое описание не должно превышать 500 символов'],
    },
    imageUrl: {
      type: String,
    },
    accessType: {
      type: String,
      enum: ['free', 'paid', 'subscription', 'stars'],
      default: 'free',
    },
    starsRequired: {
      type: Number,
      min: 0,
      default: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    allowRepeatBonus: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      enum: ['top', 'bottom'],
      default: 'bottom',
    },
    redirectToPage: {
      type: String,
      trim: true,
      default: null,
    },
    content: [
      {
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
        },
        text: {
          type: String,
          trim: true,
          default: null,
        },
        image: {
          type: String,
          trim: true,
          default: null,
        },
        linkButton: {
          linkButtonText: { type: String, trim: true, default: null },
          linkButtonLink: { type: String, trim: true, default: null },
          linkButtonType: { type: String, enum: ['internal', 'external'], default: 'internal' },
        },
      }
    ],
    visibility: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('AnalysisRealization', AnalysisRealizationSchema);
