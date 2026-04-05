import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema(
  {
    eventTitle: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
    },
    eventLink: {
      type: String,
      trim: true,
    },
    eventLinkType: {
      type: String,
      enum: ['internal', 'external'],
      default: 'internal',
    },
    googleCalendarLink: {
      type: String,
      trim: true,
    },
    appleCalendarLink: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    priority: {
      type: Boolean,
      default: false,
    },
    reminder24hSentAt: {
      type: Date,
      default: null,
    },
    reminder1hSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Schedule', ScheduleSchema);

