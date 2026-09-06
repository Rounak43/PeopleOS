/**
 * PeopleOS — Payrun Controller
 *
 * Handles HTTP request/response for payroll lifecycle endpoints.
 * All business logic lives in payrunService.js and domain services.
 */
const payrunService = require('../services/payrunService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────
// GET /api/payruns
// ─────────────────────────────────────────────────────────────
const getPayruns = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const skip = (page - 1) * limit;

    const result = await payrunService.getPayruns({ page, limit, skip });
    return sendSuccess(res, result.items, 'Payruns retrieved successfully', 200, result.pagination);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payruns/:id
// ─────────────────────────────────────────────────────────────
const getPayrunById = async (req, res, next) => {
  try {
    const result = await payrunService.getPayrunById(req.params.id);
    return sendSuccess(res, result, 'Payrun retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payruns
// Creates a Draft payrun — does NOT compute payslips
// ─────────────────────────────────────────────────────────────
const createPayrunBatch = async (req, res, next) => {
  try {
    const { name, periodStart, periodEnd, employeeIds, salaryStructureId, notes } = req.body;

    const result = await payrunService.createPayrun({
      name,
      periodStart,
      periodEnd,
      employeeIds: employeeIds || [],
      salaryStructureId: salaryStructureId || null,
      notes: notes || '',
      createdBy: req.user?.id || null,
    });

    return sendSuccess(
      res,
      { payrun: result.payrun, eligibleCount: result.eligibleCount },
      `Draft payrun created successfully with ${result.eligibleCount} eligible employees`,
      201
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payruns/:id/compute
// Runs the full payroll computation engine for this payrun
// ─────────────────────────────────────────────────────────────
const computePayrun = async (req, res, next) => {
  try {
    const result = await payrunService.computePayrun(
      req.params.id,
      req.user?.id || null
    );

    return sendSuccess(
      res,
      {
        payrun: result.payrun,
        computationSummary: result.computationSummary,
        payslipsCount: result.payslips.length,
      },
      `Payrun computed successfully. ${result.computationSummary.computed} payslips computed, ${result.computationSummary.skipped} skipped.`
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payruns/:id/validate
// Validates all payslips and transitions to Validated state
// ─────────────────────────────────────────────────────────────
const validatePayrun = async (req, res, next) => {
  try {
    const { payrun, validation } = await payrunService.validatePayrunBatch(
      req.params.id,
      req.user?.id || null
    );

    const message = validation.valid
      ? 'Payrun validated successfully. All payslips are ready for payment.'
      : `Payrun validation failed with ${validation.errors.length} blocking error(s). Please resolve before proceeding.`;

    return sendSuccess(res, { payrun, validation }, message, validation.valid ? 200 : 422);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payruns/:id/mark-paid
// Marks all Validated payslips as Paid
// ─────────────────────────────────────────────────────────────
const markPayrunPaid = async (req, res, next) => {
  try {
    const { payrun } = await payrunService.markPayrunPaid(
      req.params.id,
      req.user?.id || null
    );

    return sendSuccess(res, { payrun }, 'Payrun marked as Paid. All payslips are now finalized.');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/payruns/:id/state   (LEGACY — kept for frontend compat)
// ─────────────────────────────────────────────────────────────
const updatePayrunState = async (req, res, next) => {
  try {
    const { state } = req.body;
    const payrun = await payrunService.updatePayrunState(req.params.id, state);
    return sendSuccess(res, payrun, `Payrun state updated to ${payrun.state}`);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/payruns/:id
// Only Draft or Cancelled payruns can be deleted
// ─────────────────────────────────────────────────────────────
const deletePayrun = async (req, res, next) => {
  try {
    await payrunService.deletePayrun(req.params.id);
    return sendSuccess(res, null, 'Payrun deleted successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payruns/all-payslips
// Get all payslips across all payruns (HR view)
// ─────────────────────────────────────────────────────────────
const getAllPayslips = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 500, 1000);
    const skip = (page - 1) * limit;

    const result = await payrunService.getAllPayslips({
      search: req.query.search || '',
      state: req.query.state || '',
      page,
      limit,
      skip,
    });
    return sendSuccess(res, result.items, 'All payslips retrieved successfully', 200, result.pagination);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payruns/payslips/:id
// Get single payslip detail (read-only, no recalculation)
// ─────────────────────────────────────────────────────────────
const getPayslipById = async (req, res, next) => {
  try {
    const payslip = await payrunService.getPayslipById(req.params.id);
    return sendSuccess(res, payslip, 'Payslip retrieved successfully');
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/payruns/payslips/status   (LEGACY)
// Bulk update payslip states
// ─────────────────────────────────────────────────────────────
const updatePayslipsStatus = async (req, res, next) => {
  try {
    const { payslipIds, state } = req.body;
    const result = await payrunService.updatePayslipsStatus(payslipIds, state);
    return sendSuccess(res, result, `${result.modifiedCount} payslip(s) updated to ${state}`);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payruns/employee/my-payslips   (Employee Portal)
// Returns the authenticated employee's own payslips
// ─────────────────────────────────────────────────────────────
const getMyPayslips = async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return sendError(res, 'Employee profile not linked to this account', 400, 'NO_EMPLOYEE_PROFILE');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const skip = (page - 1) * limit;

    const result = await payrunService.getPayslipsByEmployee(employeeId, { page, limit, skip });
    return sendSuccess(res, result.items, 'Your payslips retrieved successfully', 200, result.pagination);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payruns/employee/payslips/:id   (Employee Portal)
// Returns a specific payslip, validated to belong to the logged-in employee
// ─────────────────────────────────────────────────────────────
const getMyPayslipById = async (req, res, next) => {
  try {
    const employeeId = req.user?.employeeId;
    if (!employeeId) {
      return sendError(res, 'Employee profile not linked to this account', 400, 'NO_EMPLOYEE_PROFILE');
    }

    const payslip = await payrunService.getPayslipById(req.params.id);

    // Security: verify this payslip belongs to the requesting employee
    const payslipEmpId = payslip.employee?._id?.toString() || payslip.employee?.toString();
    if (payslipEmpId !== employeeId.toString()) {
      return sendError(res, 'Access denied. This payslip does not belong to your account.', 403, 'FORBIDDEN');
    }

    return sendSuccess(res, payslip, 'Payslip retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/payruns/clean-duplicates
 * Purge 0-rupee and duplicate payslips from database.
 */
const cleanDuplicateAndZeroPayslips = async (req, res, next) => {
  try {
    const result = await payrunService.cleanDuplicateAndZeroPayslips();
    return sendSuccess(res, result, 'Successfully purged 0-rupee and duplicate payslips');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPayruns,
  getPayrunById,
  createPayrunBatch,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  updatePayrunState,
  deletePayrun,
  getPayslipById,
  getAllPayslips,
  updatePayslipsStatus,
  getMyPayslips,
  getMyPayslipById,
  cleanDuplicateAndZeroPayslips,
};

