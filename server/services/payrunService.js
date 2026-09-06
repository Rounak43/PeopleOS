/**
 * PeopleOS — Payrun & Payslip Orchestration Service
 *
 * This is the top-level orchestrator for the payroll lifecycle.
 * It delegates to domain services for specific computations:
 *
 *   contractResolver   → which contract applies for the period
 *   salaryRuleEngine   → computes salary breakdown from MongoDB rules
 *   attendanceAggregator → real attendance hours and days
 *   timeOffAggregator  → approved leave impact on pay
 *   payrollValidationService → blocking/non-blocking validation
 *
 * Payrun Lifecycle:
 *   Draft → Computed → Validated → Paid
 *   (Any state → Cancelled)
 *
 * CRITICAL: GET endpoints return STORED data. They do NOT recalculate.
 * Recalculation only happens via POST /compute.
 */

const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const WorkingSchedule = require('../models/WorkingSchedule');
const SalaryStructure = require('../models/SalaryStructure');
const SalaryRule = require('../models/SalaryRule');
const { buildPaginationMeta } = require('../utils/pagination');

const { resolveContract } = require('./payroll/contractResolver');
const { executeSalaryRules, resolveSalaryStructureId } = require('./payroll/salaryRuleEngine');
const { aggregateAttendance } = require('./payroll/attendanceAggregator');
const { aggregateTimeOff } = require('./payroll/timeOffAggregator');
const { validatePayrun: runValidation } = require('./payroll/payrollValidationService');

// ─────────────────────────────────────────────────────────────
// Valid state transitions
// ─────────────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
  Draft: ['Computed', 'Cancelled'],
  Computed: ['Validated', 'Draft', 'Cancelled'],
  Validated: ['Paid', 'Computed', 'Cancelled'],
  Paid: [],         // Terminal state — no transitions
  Cancelled: [],    // Terminal state — no transitions
};

const assertStateTransition = (current, next) => {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    const err = new Error(
      `Invalid state transition: "${current}" → "${next}". Allowed next states: [${allowed.join(', ') || 'none'}]`
    );
    err.statusCode = 409;
    err.code = 'INVALID_STATE_TRANSITION';
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────
// Step 1: Create Draft Payrun
// ─────────────────────────────────────────────────────────────

/**
 * Create a new payrun in Draft state.
 * Does NOT compute payslips — use computePayrun() for that.
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string|Date} params.periodStart
 * @param {string|Date} params.periodEnd
 * @param {Array<string>} [params.employeeIds] - specific employees, or all active
 * @param {string|null} [params.salaryStructureId] - default structure for this payrun
 * @param {string|null} [params.notes]
 * @param {string|null} [params.createdBy] - user ID
 *
 * @returns {{ payrun: PayrunDoc, eligibleCount: number }}
 */
const createPayrun = async ({ name, periodStart, periodEnd, employeeIds = [], salaryStructureId = null, notes = '', createdBy = null }) => {
  if (!name || !periodStart || !periodEnd) {
    const err = new Error('Payrun Name, Period Start, and Period End are required');
    err.statusCode = 400;
    throw err;
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    const err = new Error('Invalid date format for periodStart or periodEnd');
    err.statusCode = 400;
    throw err;
  }

  if (start > end) {
    const err = new Error('periodStart must be before or equal to periodEnd');
    err.statusCode = 400;
    throw err;
  }

  // Find target employees
  let targetEmployees = [];
  if (Array.isArray(employeeIds) && employeeIds.length > 0) {
    targetEmployees = await Employee.find({ _id: { $in: employeeIds }, status: 'active' }).lean();
  } else {
    targetEmployees = await Employee.find({ status: 'active' }).lean();
  }

  if (targetEmployees.length === 0) {
    const err = new Error('No active employees found for this payrun');
    err.statusCode = 400;
    throw err;
  }

  // Create payrun in Draft state with employee references (contracts resolved during compute)
  const payrunEmpRefs = targetEmployees.map((emp) => ({
    employee: emp._id,
    contract: null,
  }));

  const payrun = new Payrun({
    name,
    periodStart: start,
    periodEnd: end,
    salaryStructureId: salaryStructureId || null,
    state: 'Draft',
    employees: payrunEmpRefs,
    notes: notes || '',
    createdBy: createdBy || null,
  });

  await payrun.save();

  return {
    payrun,
    eligibleCount: targetEmployees.length,
  };
};

// ─────────────────────────────────────────────────────────────
// Step 2: Compute Payrun
// ─────────────────────────────────────────────────────────────

/**
 * Compute payslips for all employees in a payrun.
 * This is the ONLY place where salary calculation happens.
 * Idempotent: re-computing a payrun deletes existing Computed payslips and recomputes.
 *
 * @param {string} payrunId
 * @param {string|null} computedBy - user ID
 * @returns {{ payrun: PayrunDoc, payslips: Array, computationSummary: Object }}
 */
const computePayrun = async (payrunId, computedBy = null) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.statusCode = 404;
    throw err;
  }

  // Allow recompute from Draft or Computed states only
  if (!['Draft', 'Computed'].includes(payrun.state)) {
    const err = new Error(`Cannot compute payrun in state "${payrun.state}". Only Draft or Computed payruns can be recomputed.`);
    err.statusCode = 409;
    throw err;
  }

  // Delete any previously computed payslips (idempotent recompute - remove all state payslips for payrun)
  await Payslip.deleteMany({ payrun: payrunId });

  const employees = await Employee.find({
    _id: { $in: payrun.employees.map((ref) => ref.employee) },
    status: 'active',
  })
    .populate('workingScheduleId')
    .lean();

  const computedPayslips = [];
  const skipped = [];

  // Resolve payrun-level salary structure
  const payrunStructureId = payrun.salaryStructureId
    ? payrun.salaryStructureId.toString()
    : null;

  for (const employee of employees) {
    const allWarnings = [];
    let contract = null;
    let salaryStructureId = null;
    let computationResult = null;

    // ── Step A: Resolve Contract ────────────────────────────
    try {
      const resolved = await resolveContract(employee._id, payrun.periodStart, payrun.periodEnd);
      contract = resolved.contract;
      allWarnings.push(...resolved.warnings);

      // Update payrun employee ref with resolved contract
      const empRef = payrun.employees.find(
        (ref) => ref.employee.toString() === employee._id.toString()
      );
      if (empRef) empRef.contract = contract._id;
    } catch (contractErr) {
      if (contractErr.code === 'MISSING_CONTRACT') {
        skipped.push({
          employeeId: employee._id,
          employeeName: employee.fullName,
          reason: contractErr.message,
        });
        // Skip creating a 0-rupee payslip for employees without contracts
        continue;
      }
      throw contractErr;
    }

    // ── Check Duplicate Payment (Employee Already Paid for Period) ──
    const existingPaidPayslip = await Payslip.findOne({
      employee: employee._id,
      state: { $in: ['Paid', 'Validated'] },
      payrun: { $ne: payrun._id },
      periodStart: { $lte: payrun.periodEnd },
      periodEnd: { $gte: payrun.periodStart },
    });

    if (existingPaidPayslip) {
      skipped.push({
        employeeId: employee._id,
        employeeName: employee.fullName,
        reason: `Employee ${employee.fullName} was already paid for period ${existingPaidPayslip.periodStart ? new Date(existingPaidPayslip.periodStart).toISOString().slice(0, 10) : ''} to ${existingPaidPayslip.periodEnd ? new Date(existingPaidPayslip.periodEnd).toISOString().slice(0, 10) : ''}. Skipped duplicate payment.`,
      });
      continue; // Skip creating a duplicate / $0.00 payslip
    }

    // ── Step B: Resolve Salary Structure ────────────────────
    const rawContractStructId = contract.salaryStructureId
      ? (typeof contract.salaryStructureId === 'object' && contract.salaryStructureId._id ? contract.salaryStructureId._id : contract.salaryStructureId)
      : null;

    salaryStructureId = await resolveSalaryStructureId({
      contractStructureId: rawContractStructId,
      payrunStructureId,
    });

    const cleanSalaryStructureId = (typeof salaryStructureId === 'object' && salaryStructureId?._id)
      ? salaryStructureId._id
      : (salaryStructureId && salaryStructureId.toString() !== '[object Object]' ? salaryStructureId : null);

    if (!cleanSalaryStructureId) {
      allWarnings.push({
        type: 'MISSING_SALARY_STRUCTURE',
        message: 'No salary structure found for this employee or payrun. Cannot compute salary.',
        severity: 'Error',
        isBlocking: true,
      });
    }

    // ── Step C: Aggregate Attendance ────────────────────────
    const attendanceData = await aggregateAttendance({
      employeeId: employee._id,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      workingSchedule: employee.workingScheduleId || contract.workingScheduleId || null,
    });
    allWarnings.push(...attendanceData.warnings);

    // ── Step D: Aggregate Time Off ──────────────────────────
    const timeOffData = await aggregateTimeOff({
      employeeId: employee._id,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
    });
    allWarnings.push(...timeOffData.warnings);

    // ── Step E: Execute Salary Rules ────────────────────────
    if (cleanSalaryStructureId) {
      try {
        computationResult = await executeSalaryRules({
          salaryStructureId: cleanSalaryStructureId,
          wage: contract.wage,
          wageFrequency: contract.wageFrequency || 'Monthly',
          workedDays: attendanceData.workedDays,
          regularHours: attendanceData.regularHours,
          overtimeHours: attendanceData.overtimeHours,
          unpaidLeaveDays: timeOffData.unpaidLeaveDays,
          workingDaysInPeriod: attendanceData.workingDaysInPeriod,
        });
        allWarnings.push(...computationResult.warnings);
      } catch (engineErr) {
        allWarnings.push({
          type: 'SALARY_RULE_ERROR',
          message: `Salary rule engine error: ${engineErr.message}`,
          severity: 'Error',
          isBlocking: true,
        });
      }
    }

    // ── Step F: Warn on Missing Bank Details ─────────────────
    if (!employee.bankDetails || !employee.bankDetails.accountNo) {
      allWarnings.push({
        type: 'MISSING_BANK_DETAILS',
        message: 'Employee has no bank account details. Payment processing may fail.',
        severity: 'Warning',
        isBlocking: false,
      });
    }

    // ── Step G: Save Payslip ────────────────────────────────
    const hasBlockingErrors = allWarnings.some((w) => w.isBlocking);

    const payslipData = {
      payrun: payrun._id,
      employee: employee._id,
      contract: contract._id,
      salaryStructureId: cleanSalaryStructureId || null,
      employeeNameSnapshot: employee.fullName,
      employeeCodeSnapshot: employee.employeeCode,
      wageSnapshot: contract.wage,
      salaryStructureNameSnapshot: computationResult?.structureName || '',
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      workedDays: attendanceData.workedDays,
      regularHours: attendanceData.regularHours,
      overtimeHours: attendanceData.overtimeHours,
      grossPay: computationResult?.grossSalary || 0,
      totalDeductions: computationResult?.totalDeductions || 0,
      netPay: computationResult?.netSalary || 0,
      state: hasBlockingErrors ? 'Draft' : 'Computed',
      lines: computationResult?.lines || [],
      warnings: allWarnings,
    };

    const payslip = new Payslip(payslipData);
    await payslip.save();
    computedPayslips.push(payslip);
  }

  // ── Update Payrun Summary and State ──────────────────────────
  const successfulPayslips = computedPayslips.filter((ps) => ps.state === 'Computed');

  const summary = {
    totalGross: successfulPayslips.reduce((s, ps) => s + ps.grossPay, 0),
    totalDeductions: successfulPayslips.reduce((s, ps) => s + ps.totalDeductions, 0),
    totalNet: successfulPayslips.reduce((s, ps) => s + ps.netPay, 0),
    employeeCount: computedPayslips.length,
  };

  payrun.state = 'Computed';
  payrun.summary = summary;
  payrun.computedBy = computedBy || null;
  payrun.computedAt = new Date();
  await payrun.save();

  return {
    payrun,
    payslips: computedPayslips,
    computationSummary: {
      total: computedPayslips.length,
      computed: successfulPayslips.length,
      skipped: skipped.length,
      skippedDetails: skipped,
      ...summary,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// Step 3: Validate Payrun
// ─────────────────────────────────────────────────────────────

/**
 * Validate a Computed payrun — checks all payslips for blocking errors.
 * Transitions payrun state to Validated if valid.
 *
 * @param {string} payrunId
 * @param {string|null} validatedBy - user ID
 * @returns {{ payrun: PayrunDoc, validation: Object }}
 */
const validatePayrunBatch = async (payrunId, validatedBy = null) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.statusCode = 404;
    throw err;
  }

  assertStateTransition(payrun.state, 'Validated');

  const validation = await runValidation(payrunId);

  if (validation.valid) {
    // Mark all Computed payslips as Validated
    await Payslip.updateMany(
      { payrun: payrunId, state: 'Computed' },
      { state: 'Validated' }
    );

    payrun.state = 'Validated';
    payrun.validatedBy = validatedBy || null;
    payrun.validatedAt = new Date();
    await payrun.save();
  }

  return { payrun, validation };
};

// ─────────────────────────────────────────────────────────────
// Step 4: Mark Payrun as Paid
// ─────────────────────────────────────────────────────────────

/**
 * Mark a Validated payrun as Paid.
 *
 * @param {string} payrunId
 * @param {string|null} paidBy - user ID
 * @returns {{ payrun: PayrunDoc }}
 */
const markPayrunPaid = async (payrunId, paidBy = null) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.statusCode = 404;
    throw err;
  }

  assertStateTransition(payrun.state, 'Paid');

  const paymentDate = new Date();

  await Payslip.updateMany(
    { payrun: payrunId, state: 'Validated' },
    { state: 'Paid', paymentDate }
  );

  payrun.state = 'Paid';
  payrun.paymentDate = paymentDate;
  payrun.paidBy = paidBy || null;
  payrun.paidAt = paymentDate;
  await payrun.save();

  return { payrun };
};

// ─────────────────────────────────────────────────────────────
// Read Operations (GET — never recalculates)
// ─────────────────────────────────────────────────────────────

/**
 * Get all payruns with pagination.
 */
const getPayruns = async ({ page = 1, limit = 20, skip = 0 }) => {
  const [items, total] = await Promise.all([
    Payrun.find({})
      .populate('salaryStructureId', 'name code')
      .populate('createdBy', 'email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Payrun.countDocuments({}),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

/**
 * Get a single payrun with its payslips.
 * Does NOT trigger any recalculation.
 */
const getPayrunById = async (id) => {
  const payrun = await Payrun.findById(id)
    .populate('salaryStructureId', 'name code')
    .populate('createdBy', 'email')
    .populate('computedBy', 'email')
    .populate('validatedBy', 'email')
    .populate('paidBy', 'email')
    .populate('employees.employee', 'fullName employeeCode email')
    .populate('employees.contract', 'contractCode wage wageFrequency');

  if (!payrun) {
    const err = new Error('Payrun not found');
    err.statusCode = 404;
    throw err;
  }

  const payslips = await Payslip.find({ payrun: id })
    .populate({
      path: 'employee',
      select: 'fullName employeeCode email bankDetails departmentId jobPositionId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'jobPositionId', select: 'title name' },
      ],
    })
    .populate('contract', 'contractCode wage wageFrequency durationType workLocation')
    .populate('salaryStructureId', 'name code')
    .sort({ employeeNameSnapshot: 1 });

  return { payrun, payslips };
};

/**
 * Get a single payslip by ID (read-only).
 * Does NOT trigger any recalculation.
 */
const getPayslipById = async (id) => {
  const payslip = await Payslip.findById(id)
    .populate('payrun', 'name periodStart periodEnd state')
    .populate('salaryStructureId', 'name code')
    .populate('contract', 'contractCode wage wageFrequency durationType workLocation')
    .populate({
      path: 'employee',
      select: 'fullName employeeCode email bankDetails departmentId jobPositionId',
      populate: [
        { path: 'departmentId', select: 'name' },
        { path: 'jobPositionId', select: 'title name' },
      ],
    });

  if (!payslip) {
    const err = new Error('Payslip not found');
    err.statusCode = 404;
    throw err;
  }

  return payslip;
};

/**
 * Get all payslips across all payruns (HR view).
 */
const getAllPayslips = async ({ search = '', state = '', periodStart = '', periodEnd = '', page = 1, limit = 500, skip = 0 } = {}) => {
  const query = {};
  if (state && state !== 'ALL') {
    if (state.includes(',')) {
      query.state = { $in: state.split(',').map((s) => s.trim()) };
    } else {
      query.state = state;
    }
  }
  if (periodStart && periodEnd) {
    query.periodStart = { $lte: new Date(periodEnd) };
    query.periodEnd = { $gte: new Date(periodStart) };
  }
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [
      { employeeNameSnapshot: regex },
      { employeeCodeSnapshot: regex },
    ];
  }

  const [items, total] = await Promise.all([
    Payslip.find(query)
      .populate('payrun', 'name periodStart periodEnd state')
      .populate('salaryStructureId', 'name code')
      .populate('employee', 'fullName employeeCode email departmentId jobPositionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payslip.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

/**
 * Get payslips for a specific employee (for employee portal).
 */
const getPayslipsByEmployee = async (employeeId, { page = 1, limit = 12, skip = 0 } = {}) => {
  const [items, total] = await Promise.all([
    Payslip.find({ employee: employeeId, state: { $in: ['Computed', 'Validated', 'Paid'] } })
      .populate('payrun', 'name periodStart periodEnd state')
      .populate('salaryStructureId', 'name')
      .sort({ periodStart: -1 })
      .skip(skip)
      .limit(limit),
    Payslip.countDocuments({
      employee: employeeId,
      state: { $in: ['Computed', 'Validated', 'Paid'] },
    }),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

// ─────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────

/**
 * Cancel a payrun (only Draft or Computed can be cancelled).
 */
const cancelPayrun = async (payrunId) => {
  const payrun = await Payrun.findById(payrunId);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.statusCode = 404;
    throw err;
  }

  assertStateTransition(payrun.state, 'Cancelled');

  // Revert payslips to Draft on cancellation
  await Payslip.updateMany(
    { payrun: payrunId, state: { $in: ['Draft', 'Computed'] } },
    { state: 'Draft' }
  );

  payrun.state = 'Cancelled';
  await payrun.save();

  return payrun;
};

/**
 * Delete a payrun (only Draft or Cancelled).
 */
const deletePayrun = async (id) => {
  const payrun = await Payrun.findById(id);
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.statusCode = 404;
    throw err;
  }

  if (!['Draft', 'Cancelled'].includes(payrun.state)) {
    const err = new Error(`Cannot delete a payrun in state "${payrun.state}". Only Draft or Cancelled payruns can be deleted.`);
    err.statusCode = 409;
    throw err;
  }

  await Payslip.deleteMany({ payrun: id });
  await Payrun.findByIdAndDelete(id);
  return true;
};

/**
 * Mark individual payslip(s) as Paid (for selective payment).
 * @deprecated Use markPayrunPaid for batch operations
 */
const updatePayslipsStatus = async (payslipIds = [], state = 'Paid') => {
  if (!Array.isArray(payslipIds) || payslipIds.length === 0) {
    const err = new Error('No payslip IDs provided');
    err.statusCode = 400;
    throw err;
  }

  const validStates = ['Computed', 'Validated', 'Paid'];
  if (!validStates.includes(state)) {
    const err = new Error(`Invalid state "${state}". Allowed: ${validStates.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const updated = await Payslip.updateMany(
    { _id: { $in: payslipIds } },
    { state, paymentDate: state === 'Paid' ? new Date() : undefined }
  );

  return { modifiedCount: updated.modifiedCount, state };
};

// Legacy compatibility: kept for frontend transition
const updatePayrunState = async (id, state) => {
  const validLegacyStates = { Processing: 'Computed', Done: 'Paid', Verified: 'Validated' };
  const normalizedState = validLegacyStates[state] || state;

  if (normalizedState === 'Paid') return markPayrunPaid(id);
  if (normalizedState === 'Validated') return validatePayrunBatch(id);

  const payrun = await Payrun.findByIdAndUpdate(id, { state: normalizedState }, { new: true });
  if (!payrun) {
    const err = new Error('Payrun not found');
    err.statusCode = 404;
    throw err;
  }
  await Payslip.updateMany({ payrun: id }, { state: normalizedState === 'Paid' ? 'Paid' : 'Computed' });
  return payrun;
};

/**
 * Cleanup function: deletes all 0-rupee payslips and duplicate payslips across DB,
 * and updates Payrun totals.
 */
const cleanDuplicateAndZeroPayslips = async () => {
  const zeroRes = await Payslip.deleteMany({
    $or: [
      { netPay: { $lte: 0 } },
      { grossPay: { $lte: 0 } },
      { netPay: null },
      { grossPay: null },
    ],
  });

  const remainingSlips = await Payslip.find({}).sort({ createdAt: -1 }).lean();
  const groupMap = {};
  const duplicateIdsToDelete = [];

  for (const slip of remainingSlips) {
    const empId = slip.employee ? slip.employee.toString() : 'unknown';
    const pStart = slip.periodStart ? new Date(slip.periodStart).toISOString().slice(0, 10) : 'none';
    const pEnd = slip.periodEnd ? new Date(slip.periodEnd).toISOString().slice(0, 10) : 'none';
    const key = `${empId}_${pStart}_${pEnd}`;

    if (!groupMap[key]) {
      groupMap[key] = slip;
    } else {
      const existing = groupMap[key];
      if ((slip.netPay || 0) > (existing.netPay || 0)) {
        duplicateIdsToDelete.push(existing._id);
        groupMap[key] = slip;
      } else {
        duplicateIdsToDelete.push(slip._id);
      }
    }
  }

  let dupCount = 0;
  if (duplicateIdsToDelete.length > 0) {
    const dupRes = await Payslip.deleteMany({ _id: { $in: duplicateIdsToDelete } });
    dupCount = dupRes.deletedCount;
  }

  // Recalculate payrun totals
  const payruns = await Payrun.find({});
  for (const payrun of payruns) {
    const slipsForPayrun = await Payslip.find({ payrun: payrun._id });
    if (slipsForPayrun.length === 0) {
      await Payrun.deleteOne({ _id: payrun._id });
    } else {
      payrun.totalGross = slipsForPayrun.reduce((s, p) => s + (p.grossPay || 0), 0);
      payrun.totalDeductions = slipsForPayrun.reduce((s, p) => s + (p.totalDeductions || 0), 0);
      payrun.totalNet = slipsForPayrun.reduce((s, p) => s + (p.netPay || 0), 0);
      payrun.employeeCount = slipsForPayrun.length;
      payrun.employees = slipsForPayrun.map((p) => ({
        employee: p.employee,
        contract: p.contract || null,
      }));
      await payrun.save();
    }
  }

  return {
    deletedZeroCount: zeroRes.deletedCount || 0,
    deletedDuplicateCount: dupCount,
    totalDeletedCount: (zeroRes.deletedCount || 0) + dupCount,
    remainingPayslips: await Payslip.countDocuments(),
    remainingPayruns: await Payrun.countDocuments(),
  };
};

module.exports = {
  // Lifecycle
  createPayrun,
  computePayrun,
  validatePayrunBatch,
  markPayrunPaid,
  cancelPayrun,

  // Read
  getPayruns,
  getPayrunById,
  getPayslipById,
  getAllPayslips,
  getPayslipsByEmployee,

  // Cleanup & Mutations
  cleanDuplicateAndZeroPayslips,
  deletePayrun,
  updatePayslipsStatus,

  // Legacy compat
  createPayrunBatch: createPayrun,   // alias
  updatePayrunState,
};

