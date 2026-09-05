const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    wage: {
      type: Number,
      required: true,
      min: 0,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    jobPositionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosition',
      required: true,
    },
    workingScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      default: null,
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'expired', 'terminated'],
      default: 'draft',
    },
  },
  { timestamps: true, collection: 'contracts' }
);

contractSchema.index({ employeeId: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Contract', contractSchema);
