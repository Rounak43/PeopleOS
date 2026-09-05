const mongoose = require('mongoose');

const timeOffRequestSchema = new mongoose.Schema(
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
    allocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffAllocation',
      default: null,
    },
    dateFrom: {
      type: Date,
      required: true,
    },
    dateTo: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0.5,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'refused'],
      default: 'draft',
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true, collection: 'timeOffRequests' }
);

timeOffRequestSchema.index({ employeeId: 1, status: 1 });

module.exports = mongoose.model('TimeOffRequest', timeOffRequestSchema);
