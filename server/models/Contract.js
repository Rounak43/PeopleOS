const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    employee: {
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
    contractType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contractor', 'Intern'],
      default: 'Full-Time',
    },
    salaryStructure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Expired', 'Terminated'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);
