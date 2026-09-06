/**
 * PeopleOS — Payslip Model
 *
 * Represents an immutable historical financial snapshot for one employee
 * for one payroll period. Once Validated or Paid, the computed values must
 * not be silently recalculated on retrieval.
 *
 * Snapshot fields (employeeNameSnapshot, employeeCodeSnapshot, wageSnapshot)
 * preserve historical accuracy even if the live Employee/Contract records change.
 */
const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// Payslip Line Sub-Schema
// Each line represents the result of one Salary Rule execution.
// ─────────────────────────────────────────────────────────────
const payslipLineSchema = new mongoose.Schema(
  {
    salaryRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryRule',
      default: null,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Basic', 'Allowance', 'Deduction', 'Gross', 'Net', 'Earnings'],
      required: true,
    },
    sequence: {
      type: Number,
      default: 10,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Payroll Warning Sub-Schema
// ─────────────────────────────────────────────────────────────
const payslipWarningSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'MISSING_BANK_DETAILS',
        'MISSING_CONTRACT',
        'OVERLAPPING_CONTRACT',
        'DUPLICATE_PAYSLIP',
        'MISSING_SCHEDULE',
        'MISSING_CHECKOUT',
        'ATTENDANCE_INCOMPLETE',
        'SALARY_RULE_ERROR',
        'PAYROLL_CONFIGURATION_ERROR',
        'MISSING_SALARY_STRUCTURE',
        'GENERAL',
      ],
      default: 'GENERAL',
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['Warning', 'Error'],
      default: 'Warning',
    },
    isBlocking: {
      type: Boolean,
      default: false,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Main Payslip Schema
// ─────────────────────────────────────────────────────────────
const payslipSchema = new mongoose.Schema(
  {
    // Parent payrun batch
    payrun: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payrun',
      required: true,
    },

    // Employee reference
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    // Contract used for this payslip computation
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },

    // Salary structure used for this computation
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null,
    },

    // ─── Historical Snapshot Fields ───────────────────────────
    // These preserve accuracy even if the live records change later.
    employeeNameSnapshot: {
      type: String,
      default: '',
    },
    employeeCodeSnapshot: {
      type: String,
      default: '',
    },
    wageSnapshot: {
      type: Number,
      default: 0,
    },
    salaryStructureNameSnapshot: {
      type: String,
      default: '',
    },

    // ─── Pay Period ───────────────────────────────────────────
    periodStart: {
      type: Date,
      default: null,
    },
    periodEnd: {
      type: Date,
      default: null,
    },

    // ─── Attendance Summary ───────────────────────────────────
    workedDays: {
      type: Number,
      default: 0,
    },
    regularHours: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },

    // ─── Computed Payroll Figures ─────────────────────────────
    grossPay: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },
    netPay: {
      type: Number,
      default: 0,
    },

    // ─── Payslip Status Lifecycle ─────────────────────────────
    // Draft → Computed → Validated → Paid
    state: {
      type: String,
      enum: ['Draft', 'Computed', 'Validated', 'Paid'],
      default: 'Draft',
    },

    // ─── Salary Rule Breakdown Lines ─────────────────────────
    lines: [payslipLineSchema],

    // ─── Payroll Warnings ────────────────────────────────────
    warnings: [payslipWarningSchema],

    // ─── Payment Date ─────────────────────────────────────────
    paymentDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, collection: 'payslips' }
);

// Indexes for efficient querying
payslipSchema.index({ payrun: 1 });
payslipSchema.index({ employee: 1, periodStart: 1, periodEnd: 1 });
payslipSchema.index({ employee: 1, state: 1 });

module.exports = mongoose.model('Payslip', payslipSchema);
