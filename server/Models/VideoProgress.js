import mongoose from 'mongoose';

const VideoProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['meditation', 'practice', 'videoLesson'],
      required: true,
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    currentTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    lastWatched: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Составной индекс для быстрого поиска прогресса пользователя по конкретному контенту
VideoProgressSchema.index({ userId: 1, contentType: 1, contentId: 1 }, { unique: true });

export default mongoose.model('VideoProgress', VideoProgressSchema);

