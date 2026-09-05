const mongoose = require('mongoose');

const timeOffTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    unit: {
      type: String,
      enum: ['days', 'hours'],
      default: 'days',
    },
    requiresAllocation: {
      type: Boolean,
      default: true,
    },
    approvalRequired: {
      type: Boolean,
      default: true,
    },
    affectsPayroll: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: 'timeOffTypes' }
);

module.exports = mongoose.model('TimeOffType', timeOffTypeSchema);
