/**
 * PeopleOS — Payrun (Batch) Model
 *
 * A Payrun groups the payroll computation for multiple employees
 * over a defined period. It acts as the container/batch record.
 *
 * Lifecycle: Draft → Computed → Validated → Paid → (Cancelled)
 */
const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────
// Employee-Contract Reference Sub-Schema
// Stores the list of employees included in this payrun batch
// ─────────────────────────────────────────────────────────────
const payrunEmployeeRefSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      default: null,
    },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Payrun Summary Sub-Schema
// Aggregated financial summary computed after payslip computation
// ─────────────────────────────────────────────────────────────
const payrunSummarySchema = new mongoose.Schema(
  {
    totalGross: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    employeeCount: { type: Number, default: 0 },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Main Payrun Schema
// ─────────────────────────────────────────────────────────────
const payrunSchema = new mongoose.Schema(
  {
    // Human-readable label (e.g. "August 2026 Standard Payrun")
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Pay period bounds
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },

    // Default salary structure for this payrun
    // Individual contracts may override this
    salaryStructureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryStructure',
      default: null,
    },

    // Payrun lifecycle state
    // Draft → Computed → Validated → Paid | Cancelled
    state: {
      type: String,
      enum: ['Draft', 'Computed', 'Validated', 'Paid', 'Cancelled'],
      default: 'Draft',
    },

    // Included employees and their resolved contracts
    employees: [payrunEmployeeRefSchema],

    // Aggregated financial summary (populated after computation)
    summary: {
      type: payrunSummarySchema,
      default: () => ({
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        employeeCount: 0,
      }),
    },

    // Date the payrun was finalized (marked Paid)
    paymentDate: {
      type: Date,
      default: null,
    },

    // Notes/description for this batch
    notes: {
      type: String,
      default: '',
    },

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    computedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    computedAt: { type: Date, default: null },
    validatedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'payruns' }
);

payrunSchema.index({ periodStart: 1, periodEnd: 1 });
payrunSchema.index({ state: 1 });

module.exports = mongoose.model('Payrun', payrunSchema);
