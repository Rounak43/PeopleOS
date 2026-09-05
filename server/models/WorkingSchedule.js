const mongoose = require('mongoose');

const scheduleLineSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    startTime: {
      type: String,
      required: true, // e.g. "09:00"
    },
    endTime: {
      type: String,
      required: true, // e.g. "17:00"
    },
    breakMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const workingScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['full_time', 'part_time', 'shift'],
      default: 'full_time',
    },
    totalWeeklyHours: {
      type: Number,
      default: 0,
    },
    lines: [scheduleLineSchema],
  },
  { timestamps: true, collection: 'workingSchedules' }
);

module.exports = mongoose.model('WorkingSchedule', workingScheduleSchema);
