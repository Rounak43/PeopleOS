/**
 * PeopleOS — Contract Resolver
 *
 * Resolves the correct, period-applicable active contract for an employee
 * given a payrun period (periodStart → periodEnd).
 *
 * Business Rule:
 *   A contract is applicable if:
 *   - contract.status is 'active'
 *   - contract.startDate <= periodEnd
 *   - contract.endDate is null (permanent) OR contract.endDate >= periodStart
 *
 * Returns structured errors to allow callers to generate proper payslip warnings
 * rather than crashing the entire payrun computation.
 */
const Contract = require('../../models/Contract');
const SalaryStructure = require('../../models/SalaryStructure');

/**
 * Resolve the applicable contract for an employee for a given period.
 *
 * @param {string|ObjectId} employeeId
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @returns {{ contract: ContractDoc, salaryStructure: SalaryStructureDoc|null, warnings: Array }}
 * @throws {Error} with .code = 'MISSING_CONTRACT' if no applicable contract found
 */
const resolveContract = async (employeeId, periodStart, periodEnd) => {
  const warnings = [];

  // Query contracts applicable to this pay period
  const applicableContracts = await Contract.find({
    employeeId,
    status: 'active',
    startDate: { $lte: new Date(periodEnd) },
    $or: [
      { endDate: null },
      { endDate: { $gte: new Date(periodStart) } },
    ],
  })
    .sort({ startDate: -1 }) // Most recent first
    .populate('salaryStructureId')
    .populate('workingScheduleId')
    .lean();

  // Case 1: No applicable contract
  if (applicableContracts.length === 0) {
    const err = new Error(
      `No active contract found for employee ${employeeId} covering period ${periodStart.toISOString().slice(0, 10)} to ${periodEnd.toISOString().slice(0, 10)}`
    );
    err.code = 'MISSING_CONTRACT';
    err.employeeId = employeeId.toString();
    throw err;
  }

  // Case 2: Multiple overlapping contracts (data integrity issue)
  if (applicableContracts.length > 1) {
    warnings.push({
      type: 'OVERLAPPING_CONTRACT',
      message: `Employee has ${applicableContracts.length} overlapping active contracts for this period. Using most recent start date.`,
      severity: 'Warning',
      isBlocking: false,
    });
  }

  const contract = applicableContracts[0];

  // Warn if no working schedule linked
  if (!contract.workingScheduleId) {
    warnings.push({
      type: 'MISSING_SCHEDULE',
      message: 'No working schedule linked to this contract. Attendance hours may be incomplete.',
      severity: 'Warning',
      isBlocking: false,
    });
  }

  // Warn if no salary structure — payrun-level structure will be used
  let salaryStructure = contract.salaryStructureId || null;
  if (!salaryStructure) {
    warnings.push({
      type: 'MISSING_SALARY_STRUCTURE',
      message: 'Contract has no salary structure. Payrun-level salary structure will be used.',
      severity: 'Warning',
      isBlocking: false,
    });
  }

  return { contract, salaryStructure, warnings };
};

module.exports = { resolveContract };
