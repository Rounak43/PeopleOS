const mongoose = require('mongoose');

const payslipLineSchema = new mongoose.Schema({
  rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryRule',
  },
  code: String,
  name: String,
  category: String,
  amount: Number,
});

const payslipWarningSchema = new mongoose.Schema({
  message: String,
  severity: {
    type: String,
    enum: ['Warning', 'Error'],
    default: 'Warning',
  },
});

const payslipSchema = new mongoose.Schema(
  {
    payrun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payrun',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    grossPay: {
      type: Number,
      default: 0,
    },
    netPay: {
      type: Number,
      default: 0,
    },
    state: {
      type: String,
      enum: ['Draft', 'Verified', 'Paid'],
      default: 'Draft',
    },
    lines: [payslipLineSchema],
    warnings: [payslipWarningSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payslip', payslipSchema);
