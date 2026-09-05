const mongoose = require('mongoose');

const salaryRuleSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Basic', 'Allowance', 'Deduction', 'Gross', 'Net'],
      required: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 10,
    },
    amountType: {
      type: String,
      enum: ['Fixed', 'Percentage', 'Formula'],
      required: true,
    },
    amountValue: {
      type: Number,
      default: 0,
    },
    formula: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalaryRule', salaryRuleSchema);
