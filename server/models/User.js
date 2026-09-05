const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['employee', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'admin'],
      default: 'employee',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
