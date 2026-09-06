/**
 * PeopleOS — Payroll Validation Service
 *
 * Pre-validates a set of computed payslips before the payrun
 * can be marked as Validated.
 *
 * Validation checks:
 *  1. All payslips are in Computed state
 *  2. No payslip has blocking errors
 *  3. Net pay is not negative
 *  4. Employee bank details are present
 *  5. No duplicate payslips for same employee in same period
 *
 * Blocking errors prevent the payrun from being validated.
 * Non-blocking warnings are informational.
 */
const Payslip = require('../../models/Payslip');
const Employee = require('../../models/Employee');

/**
 * Validate all payslips in a payrun before marking as Validated.
 *
 * @param {string|ObjectId} payrunId
 * @returns {{ valid: boolean, errors: Array, warnings: Array, payslipSummary: Array }}
 */
const validatePayrun = async (payrunId) => {
  const blockingErrors = [];
  const nonBlockingWarnings = [];

  const payslips = await Payslip.find({ payrun: payrunId })
    .populate('employee', 'fullName employeeCode bankDetails')
    .lean();

  if (payslips.length === 0) {
    blockingErrors.push({
      type: 'PAYROLL_CONFIGURATION_ERROR',
      message: 'Payrun has no payslips. Run Compute first.',
      isBlocking: true,
    });
    return {
      valid: false,
      errors: blockingErrors,
      warnings: nonBlockingWarnings,
      payslipSummary: [],
    };
  }

  const payslipSummary = [];

  for (const payslip of payslips) {
    const empName = payslip.employeeNameSnapshot || payslip.employee?.fullName || 'Unknown';
    const empCode = payslip.employeeCodeSnapshot || payslip.employee?.employeeCode || '';

    // Check: Must be in Computed state to validate
    if (!['Computed', 'Validated'].includes(payslip.state)) {
      blockingErrors.push({
        type: 'PAYROLL_CONFIGURATION_ERROR',
        message: `Payslip for ${empName} (${empCode}) is in state "${payslip.state}" and cannot be validated.`,
        isBlocking: true,
        payslipId: payslip._id,
      });
    }

    // Check: No existing blocking errors on the payslip
    const existingBlocking = (payslip.warnings || []).filter((w) => w.isBlocking && !w.resolved);
    for (const warn of existingBlocking) {
      blockingErrors.push({
        ...warn,
        payslipId: payslip._id,
        employeeName: empName,
      });
    }

    // Check: Net pay must not be negative
    if (payslip.netPay < 0) {
      blockingErrors.push({
        type: 'PAYROLL_CONFIGURATION_ERROR',
        message: `Payslip for ${empName} (${empCode}) has negative net pay: ${payslip.netPay}. Review deduction rules.`,
        isBlocking: true,
        payslipId: payslip._id,
      });
    }

    // Check: Employee bank details
    const bankDetails = payslip.employee?.bankDetails;
    if (!bankDetails || !bankDetails.accountNo || bankDetails.accountNo.trim() === '') {
      nonBlockingWarnings.push({
        type: 'MISSING_BANK_DETAILS',
        message: `Employee ${empName} (${empCode}) has no bank account details on file. Payment may fail.`,
        isBlocking: false,
        payslipId: payslip._id,
      });
    }

    payslipSummary.push({
      payslipId: payslip._id,
      employeeName: empName,
      employeeCode: empCode,
      netPay: payslip.netPay,
      state: payslip.state,
      hasBlockingErrors: existingBlocking.length > 0,
    });
  }

  // Check: Duplicate payslips (same employee in same payrun)
  const employeeIdsSeen = new Set();
  for (const ps of payslips) {
    const empId = ps.employee?._id?.toString() || ps.employee?.toString();
    if (empId && employeeIdsSeen.has(empId)) {
      blockingErrors.push({
        type: 'DUPLICATE_PAYSLIP',
        message: `Employee ${empId} has multiple payslips in this payrun. This is a data integrity error.`,
        isBlocking: true,
      });
    }
    if (empId) employeeIdsSeen.add(empId);
  }

  const valid = blockingErrors.length === 0;

  return {
    valid,
    errors: blockingErrors,
    warnings: nonBlockingWarnings,
    payslipSummary,
  };
};

module.exports = { validatePayrun };
