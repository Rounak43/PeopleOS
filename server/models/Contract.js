const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    contractCode: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    durationType: {
      type: String,
      enum: ['Permanent', 'Intern', 'Part-time', 'Fixed Term'],
      default: 'Permanent',
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
    wage: {
      type: Number,
      required: true,
      min: 0,
    },
    wageFrequency: {
      type: String,
      enum: ['Monthly', 'Bi-weekly', 'Hourly'],
      default: 'Monthly',
    },
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null,
    },
    workingScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      default: null,
    },
    workLocation: {
      type: String,
      enum: ['Hybrid (3 Days Office)', 'On-site (Full Office)', 'Full Remote (WFH)'],
      default: 'Hybrid (3 Days Office)',
    },
    probationPeriodMonths: {
      type: Number,
      default: 3,
    },
    noticePeriodDays: {
      type: Number,
      default: 30,
    },
    overtimeAllowed: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'expired', 'terminated'],
      default: 'active',
    },
    terminationReason: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true, collection: 'contracts' }
);

contractSchema.index({ employeeId: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Contract', contractSchema);
