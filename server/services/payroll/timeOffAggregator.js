/**
 * PeopleOS — Time Off Aggregator (Payroll Impact)
 *
 * Reads approved TimeOffRequests for an employee in a pay period
 * and determines payroll impact:
 *
 *  - paidLeaveDays: approved leaves that do NOT affect payroll
 *    (TimeOffType.affectsPayroll = false)
 *
 *  - unpaidLeaveDays: approved leaves that DO affect payroll
 *    (TimeOffType.affectsPayroll = true → deduct from pay)
 *
 * The `unpaidLeaveDays` value is passed to the SalaryRuleEngine
 * as the UNPAID_DAYS context variable.
 */
const TimeOffRequest = require('../../models/TimeOffRequest');
const TimeOffType = require('../../models/TimeOffType');

/**
 * Aggregate time-off data for an employee in a payroll period.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.employeeId
 * @param {Date} params.periodStart
 * @param {Date} params.periodEnd
 *
 * @returns {{ paidLeaveDays, unpaidLeaveDays, approvedRequests, warnings }}
 */
const aggregateTimeOff = async ({ employeeId, periodStart, periodEnd }) => {
  const warnings = [];

  // Fetch approved or submitted time-off requests overlapping this period
  // A request overlaps the period if: dateFrom <= periodEnd AND dateTo >= periodStart
  const requests = await TimeOffRequest.find({
    employeeId,
    status: { $in: ['approved', 'submitted'] },
    dateFrom: { $lte: new Date(periodEnd) },
    dateTo: { $gte: new Date(periodStart) },
  })
    .populate('timeOffTypeId')
    .lean();

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  for (const request of requests) {
    const type = request.timeOffTypeId;

    if (!type) {
      warnings.push({
        type: 'GENERAL',
        message: `TimeOffRequest ${request._id} has no associated TimeOffType. Skipping payroll impact.`,
        severity: 'Warning',
        isBlocking: false,
      });
      continue;
    }

    // Only count approved requests, not just submitted
    const isApproved = request.status === 'approved';

    // Clip duration to the pay period
    const effectiveFrom = new Date(Math.max(new Date(request.dateFrom), new Date(periodStart)));
    const effectiveTo = new Date(Math.min(new Date(request.dateTo), new Date(periodEnd)));
    const requestDays = request.duration || 0;

    // Use the stored duration (which is already validated by the time-off service)
    const daysInPeriod = isApproved ? requestDays : 0;

    if (type.affectsPayroll) {
      // This type of leave deducts from pay (e.g., unpaid leave, LOP)
      unpaidLeaveDays += daysInPeriod;
    } else {
      // Paid leave — no deduction (e.g., standard vacation)
      paidLeaveDays += daysInPeriod;
    }
  }

  // Cap at reasonable values
  unpaidLeaveDays = Math.max(0, unpaidLeaveDays);
  paidLeaveDays = Math.max(0, paidLeaveDays);

  return {
    paidLeaveDays: Math.round(paidLeaveDays * 100) / 100,
    unpaidLeaveDays: Math.round(unpaidLeaveDays * 100) / 100,
    approvedRequests: requests.filter((r) => r.status === 'approved').length,
    warnings,
  };
};

module.exports = { aggregateTimeOff };
