const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema(
  {
    accountNo: { type: String, default: '' },
    bankName: { type: String, default: '' },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
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
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    workingScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkingSchedule',
      default: null,
    },
    dateJoined: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
    },
    address: {
      type: String,
      default: '',
    },
    bankDetails: {
      type: bankDetailsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true, collection: 'employees' }
);

employeeSchema.index({ departmentId: 1 });

module.exports = mongoose.model('Employee', employeeSchema);
