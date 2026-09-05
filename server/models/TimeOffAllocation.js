const mongoose = require('mongoose');

const timeOffAllocationSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    timeOffType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffType',
      required: true,
    },
    allocatedDays: {
      type: Number,
      required: true,
      min: 0,
    },
    usedDays: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TimeOffAllocation', timeOffAllocationSchema);
