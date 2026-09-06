/**
 * PeopleOS — Attendance Aggregator
 *
 * Reads real attendance records for an employee over a pay period
 * and computes:
 *  - workedDays: distinct calendar days with a check-in
 *  - regularHours: total worked hours (capped at standard daily hours)
 *  - overtimeHours: total overtime hours (worked beyond standard daily hours)
 *  - workingDaysInPeriod: total expected working days in the period
 *  - warnings: incomplete records (missing checkout, etc.)
 *
 * This data feeds into the SalaryRuleEngine context as
 * DAYS, HOURS, OT_HOURS, TOTAL_DAYS variables.
 */
const Attendance = require('../../models/Attendance');

// Standard working hours per day (used if no working schedule linked)
const DEFAULT_STANDARD_HOURS_PER_DAY = 8;

/**
 * Count weekdays (Mon–Fri) in a date range.
 * Used as the baseline for expected working days in a period.
 */
const countWeekdays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const day = current.getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * Get standard daily hours from a working schedule.
 * @param {Object|null} workingSchedule - populated WorkingSchedule document
 * @returns {number}
 */
const getStandardDailyHours = (workingSchedule) => {
  if (!workingSchedule || !workingSchedule.totalWeeklyHours) {
    return DEFAULT_STANDARD_HOURS_PER_DAY;
  }

  const workDaysPerWeek = workingSchedule.lines
    ? workingSchedule.lines.filter((l) => l.dayOfWeek !== 'saturday' && l.dayOfWeek !== 'sunday').length
    : 5;

  if (workDaysPerWeek === 0) return DEFAULT_STANDARD_HOURS_PER_DAY;

  return workingSchedule.totalWeeklyHours / workDaysPerWeek;
};

/**
 * Aggregate attendance data for an employee in a payroll period.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.employeeId
 * @param {Date} params.periodStart
 * @param {Date} params.periodEnd
 * @param {Object|null} params.workingSchedule - populated WorkingSchedule document
 *
 * @returns {{ workedDays, regularHours, overtimeHours, workingDaysInPeriod, warnings }}
 */
const aggregateAttendance = async ({
  employeeId,
  periodStart,
  periodEnd,
  workingSchedule = null,
}) => {
  const warnings = [];

  // Fetch all attendance records in period
  const records = await Attendance.find({
    employeeId,
    checkIn: {
      $gte: new Date(periodStart),
      $lte: new Date(periodEnd),
    },
  })
    .sort({ checkIn: 1 })
    .lean();

  const standardDailyHours = getStandardDailyHours(workingSchedule);
  const workingDaysInPeriod = countWeekdays(periodStart, periodEnd);

  // Aggregate across records
  const workedDatesSet = new Set();
  let totalRegularHours = 0;
  let totalOvertimeHours = 0;

  for (const record of records) {
    // Warn on missing checkout
    if (!record.checkOut) {
      warnings.push({
        type: 'MISSING_CHECKOUT',
        message: `Attendance record on ${record.checkIn.toISOString().slice(0, 10)} has no check-out time. Hours may be underreported.`,
        severity: 'Warning',
        isBlocking: false,
      });
      // Use workedHours if stored, otherwise skip this record for hour calculation
      if (record.workedHours && record.workedHours > 0) {
        const hours = record.workedHours;
        const regular = Math.min(hours, standardDailyHours);
        const overtime = Math.max(0, hours - standardDailyHours);
        totalRegularHours += regular;
        totalOvertimeHours += overtime;
        workedDatesSet.add(record.checkIn.toISOString().slice(0, 10));
      }
      continue;
    }

    const checkIn = new Date(record.checkIn);
    const checkOut = new Date(record.checkOut);
    const hoursWorked = record.workedHours > 0
      ? record.workedHours
      : (checkOut - checkIn) / (1000 * 60 * 60);

    const regular = Math.min(hoursWorked, standardDailyHours);
    const overtime = Math.max(0, hoursWorked - standardDailyHours);

    totalRegularHours += regular;
    totalOvertimeHours += overtime;
    workedDatesSet.add(checkIn.toISOString().slice(0, 10));
  }

  // Warn if no attendance records at all
  if (records.length === 0) {
    warnings.push({
      type: 'ATTENDANCE_INCOMPLETE',
      message: `No attendance records found for this pay period. Attendance-based calculations will default to full period.`,
      severity: 'Warning',
      isBlocking: false,
    });
  }

  const workedDays = workedDatesSet.size;

  return {
    workedDays: workedDays > 0 ? workedDays : workingDaysInPeriod,
    regularHours: Math.round(totalRegularHours * 100) / 100,
    overtimeHours: Math.round(totalOvertimeHours * 100) / 100,
    workingDaysInPeriod,
    warnings,
  };
};

module.exports = { aggregateAttendance, countWeekdays, getStandardDailyHours };
