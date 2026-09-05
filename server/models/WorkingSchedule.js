const mongoose = require('mongoose');

const workingScheduleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hoursPerWeek: {
      type: Number,
      default: 40,
    },
    dailyHours: {
      type: Number,
      default: 8,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkingSchedule', workingScheduleSchema);
