/**
 * PeopleOS — Salary Rule Model
 *
 * A Salary Rule defines a single component of salary computation.
 * Rules are grouped into a SalaryStructure and executed in order (sequence).
 *
 * Types:
 *   Fixed      — a flat amount (e.g. Rs. 5000 transport)
 *   Percentage — a % of a base code (e.g. 50% of WAGE → BASIC)
 *   Formula    — a safe expression referencing other computed codes
 */
const mongoose = require('mongoose');

const salaryRuleSchema = new mongoose.Schema(
  {
    // Short unique code used as key in the rule engine context
    // e.g. 'BASIC', 'HRA', 'PF', 'TDS'
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Human-readable name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Payslip line category
    category: {
      type: String,
      enum: ['Basic', 'Allowance', 'Deduction', 'Gross', 'Net', 'Earnings'],
      required: true,
    },

    // Execution order within a salary structure (lower = earlier)
    sequence: {
      type: Number,
      required: true,
      default: 10,
    },

    // Computation type
    amountType: {
      type: String,
      enum: ['Fixed', 'Percentage', 'Formula'],
      required: true,
    },

    // Flat amount for Fixed type
    amountValue: {
      type: Number,
      default: 0,
    },

    // For Percentage type: which accumulated code to base the % on
    // Allowed values: 'WAGE' (contract wage), 'BASIC', 'HRA', 'GROSS', 'NET'
    // If empty, defaults to 'WAGE'
    percentageBase: {
      type: String,
      default: 'WAGE',
      trim: true,
      uppercase: true,
    },

    // For Formula type: a safe expression string
    // Allowed variable references: any previously computed rule code + WAGE, HOURS, DAYS
    // Example: "BASIC + HRA + CONV + SA" (for GROSS computation)
    // Example: "GROSS * 0.10" (for TDS)
    formula: {
      type: String,
      default: '',
    },

    // Condition: only compute this rule if condition is true
    // Expressed as a safe expression (same safety as formula)
    // Example: "WAGE <= 21000" (for ESI eligibility)
    condition: {
      type: String,
      default: '',
    },

    // Whether this rule is enabled and should be executed
    active: {
      type: Boolean,
      default: true,
    },

    // If true, this rule produces a negative (deduction) line
    isDeduction: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: 'salaryrules' }
);

salaryRuleSchema.index({ category: 1, sequence: 1 });

module.exports = mongoose.model('SalaryRule', salaryRuleSchema);
