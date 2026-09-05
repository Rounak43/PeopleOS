const mongoose = require('mongoose');

const timeOffAllocationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    timeOffTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffType',
      required: true,
    },
    allocatedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    takenAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validTo: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'expired'],
      default: 'approved',
    },
  },
  { timestamps: true, collection: 'timeOffAllocations' }
);

timeOffAllocationSchema.index({ employeeId: 1, timeOffTypeId: 1 });

module.exports = mongoose.model('TimeOffAllocation', timeOffAllocationSchema);
