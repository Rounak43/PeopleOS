const Employee = require('../models/Employee');
const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const WorkingSchedule = require('../models/WorkingSchedule');
const Attendance = require('../models/Attendance');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const TimeOffRequest = require('../models/TimeOffRequest');
const TimeOffType = require('../models/TimeOffType');
const Contract = require('../models/Contract');
const Payslip = require('../models/Payslip');
const Payrun = require('../models/Payrun');
const Notification = require('../models/Notification');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Helper to resolve the authenticated employee document
 */
const resolveAuthEmployee = async (req) => {
  if (!req.user) return null;

  if (req.user.employeeId) {
    const emp = await Employee.findById(req.user.employeeId)
      .populate('departmentId', 'name')
      .populate('jobPositionId', 'title')
      .populate('managerId', 'fullName email')
      .populate('workingScheduleId', 'name type totalWeeklyHours lines');
    if (emp) return emp;
  }

  // Fallback lookup by email
  if (req.user.email) {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase() })
      .populate('departmentId', 'name')
      .populate('jobPositionId', 'title')
      .populate('managerId', 'fullName email')
      .populate('workingScheduleId', 'name type totalWeeklyHours lines');
    if (emp) {
      req.user.employeeId = emp._id.toString();
      return emp;
    }
  }

  return null;
};

/**
 * GET /api/employee/dashboard
 * Aggregated dashboard metrics for authenticated employee
 */
const getDashboard = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee record not found for authenticated user', 404, 'NOT_FOUND');
    }

    const employeeId = employee._id;

    // Today's attendance range (start of day to end of day server time)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayAttendance = await Attendance.findOne({
      employeeId,
      checkIn: { $gte: startOfToday, $lte: endOfToday },
    }).sort({ checkIn: -1 });

    // Monthly attendance calculations
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthAttendances = await Attendance.find({
      employeeId,
      checkIn: { $gte: startOfMonth, $lte: endOfToday },
    });

    let totalWorkedHoursThisMonth = 0;
    let totalOvertimeThisMonth = 0;
    let daysPresentThisMonth = 0;

    monthAttendances.forEach((record) => {
      const hours = record.workedHours || 0;
      totalWorkedHoursThisMonth += hours;
      if (hours > 8) {
        totalOvertimeThisMonth += (hours - 8);
      }
      if (record.status === 'present' || record.checkIn) {
        daysPresentThisMonth += 1;
      }
    });

    totalWorkedHoursThisMonth = Math.round(totalWorkedHoursThisMonth * 100) / 100;
    totalOvertimeThisMonth = Math.round(totalOvertimeThisMonth * 100) / 100;

    // ── Monthly Attendance Breakdown (Graph Data Jan 2026 - Present) ──
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const yearlyAttendances = await Attendance.find({
      employeeId,
      checkIn: { $gte: startOfYear, $lte: endOfToday },
    }).sort({ checkIn: 1 });

    const monthMap = {};
    const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = now.getMonth();

    for (let m = 0; m <= currentMonthIndex; m++) {
      const monthKey = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
      monthMap[monthKey] = {
        key: monthKey,
        monthName: monthsList[m],
        year: now.getFullYear(),
        label: `${monthsList[m]} ${now.getFullYear()}`,
        totalHours: 0,
        presentDays: 0,
        absentDays: 0,
        overtimeHours: 0,
        daysCount: 0,
      };
    }

    yearlyAttendances.forEach((record) => {
      if (!record.checkIn) return;
      const d = new Date(record.checkIn);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[mKey]) {
        const hrs = record.workedHours || 0;
        monthMap[mKey].totalHours += hrs;
        monthMap[mKey].daysCount += 1;
        if (record.status === 'absent' || hrs === 0) {
          monthMap[mKey].absentDays += 1;
        } else {
          monthMap[mKey].presentDays += 1;
          if (hrs > 8) {
            monthMap[mKey].overtimeHours += (hrs - 8);
          }
        }
      }
    });

    const rawGraphItems = Object.values(monthMap).map((m) => ({
      ...m,
      totalHours: Math.round(m.totalHours * 10) / 10,
      overtimeHours: Math.round(m.overtimeHours * 10) / 10,
    }));

    const maxMonthHours = Math.max(...rawGraphItems.map((g) => g.totalHours), 1);
    const monthlyAttendanceGraph = rawGraphItems.map((g) => ({
      ...g,
      percentage: Math.min(Math.round((g.totalHours / maxMonthHours) * 100), 100),
    }));

    const totalYtdHours = Math.round(rawGraphItems.reduce((acc, g) => acc + g.totalHours, 0) * 10) / 10;

    // Leave Balances
    const leaveAllocations = await TimeOffAllocation.find({
      employeeId,
      status: 'approved',
    }).populate('timeOffTypeId', 'name unit');

    // Latest Payslip
    const latestPayslip = await Payslip.findOne({
      employee: employeeId,
    })
      .sort({ createdAt: -1 })
      .populate('payrun', 'name periodStart periodEnd')
      .populate('contract', 'wage');

    // Active Contract
    const activeContract = await Contract.findOne({
      employeeId,
      status: 'active',
    });

    const dashboardData = {
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        department: employee.departmentId ? employee.departmentId.name : 'General',
        jobTitle: employee.jobPositionId ? employee.jobPositionId.title : 'Team Member',
        manager: employee.managerId ? employee.managerId.fullName : 'Direct Supervisor',
        dateJoined: employee.dateJoined,
        workingSchedule: employee.workingScheduleId ? employee.workingScheduleId.name : 'Standard 35h Workweek',
        salary: activeContract ? activeContract.wage : null,
      },
      todayAttendance: todayAttendance
        ? {
            id: todayAttendance._id,
            checkIn: todayAttendance.checkIn,
            checkOut: todayAttendance.checkOut,
            workedHours: todayAttendance.workedHours || 0,
            status: todayAttendance.status,
            isCompleted: !!todayAttendance.checkOut,
          }
        : null,
      monthlyStats: {
        monthName: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalDaysLogged: monthAttendances.length,
        daysPresent: daysPresentThisMonth,
        totalHoursWorked: totalWorkedHoursThisMonth,
        overtimeHours: totalOvertimeThisMonth,
      },
      monthlyAttendanceGraph,
      totalYtdHours,
      leaveBalances: leaveAllocations.map((alloc) => ({
        id: alloc._id,
        typeName: alloc.timeOffTypeId ? alloc.timeOffTypeId.name : 'Leave',
        allocated: alloc.allocatedAmount,
        taken: alloc.takenAmount,
        remaining: alloc.remainingAmount,
        unit: alloc.timeOffTypeId ? alloc.timeOffTypeId.unit : 'days',
      })),
      latestPayslip: latestPayslip
        ? {
            id: latestPayslip._id,
            grossPay: latestPayslip.grossPay,
            netPay: latestPayslip.netPay,
            state: latestPayslip.state,
            period: latestPayslip.payrun?.name || now.toLocaleString('default', { month: 'long', year: 'numeric' }),
            date: latestPayslip.createdAt,
          }
        : null,
    };

    return sendSuccess(res, dashboardData, 'Dashboard data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/employee/me
 * Profile of authenticated employee
 */
const getProfile = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const activeContract = await Contract.findOne({
      employeeId: employee._id,
      status: 'active',
    });

    const profileData = {
      id: employee._id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      department: employee.departmentId ? employee.departmentId.name : '',
      departmentId: employee.departmentId ? employee.departmentId._id : null,
      jobTitle: employee.jobPositionId ? employee.jobPositionId.title : '',
      jobPositionId: employee.jobPositionId ? employee.jobPositionId._id : null,
      manager: employee.managerId ? employee.managerId.fullName : 'None',
      managerEmail: employee.managerId ? employee.managerId.email : '',
      dateJoined: employee.dateJoined,
      employmentStatus: employee.status,
      workingSchedule: employee.workingScheduleId ? employee.workingScheduleId.name : 'Standard 35h Workweek',
      scheduleDetails: employee.workingScheduleId || null,
      salary: activeContract ? activeContract.wage : null,
      bankDetails: employee.bankDetails || {},
    };

    return sendSuccess(res, profileData, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/employee/me
 * Self-service updates for allowed fields only: phone, address, bankDetails
 */
const updateProfile = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    // Only allow updating safe fields
    const { phone, address, bankDetails } = req.body;

    if (phone !== undefined) employee.phone = String(phone).trim();
    if (address !== undefined) employee.address = String(address).trim();
    if (bankDetails && typeof bankDetails === 'object') {
      employee.bankDetails = {
        accountNo: bankDetails.accountNo ? String(bankDetails.accountNo).trim() : employee.bankDetails?.accountNo || '',
        bankName: bankDetails.bankName ? String(bankDetails.bankName).trim() : employee.bankDetails?.bankName || '',
      };
    }

    await employee.save();

    return sendSuccess(res, {
      id: employee._id,
      phone: employee.phone,
      address: employee.address,
      bankDetails: employee.bankDetails,
    }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/employee/attendance/today
 * Today's attendance record
 */
const getTodayAttendance = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const record = await Attendance.findOne({
      employeeId: employee._id,
      checkIn: { $gte: startOfToday, $lte: endOfToday },
    }).sort({ checkIn: -1 });

    return sendSuccess(res, {
      attendance: record || null,
      hasCheckedIn: !!record,
      hasCheckedOut: !!(record && record.checkOut),
    }, 'Today attendance retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/employee/attendance/check-in
 * Secure server-side check-in for authenticated employee
 */
const checkIn = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const employeeId = employee._id;

    // Check if open session exists
    const openSession = await Attendance.findOne({ employeeId, checkOut: null });
    if (openSession) {
      return sendError(res, "You're already checked in for today.", 400, 'ALREADY_CHECKED_IN');
    }

    // Check if completed today's shift already
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const existingToday = await Attendance.findOne({
      employeeId,
      checkIn: { $gte: startOfToday, $lte: endOfToday },
    });

    if (existingToday && existingToday.checkOut) {
      return sendError(res, 'Your shift has already been completed for today.', 400, 'SHIFT_COMPLETED');
    }

    // Determine status (e.g. check if late after 9:30 AM)
    const checkInTime = new Date();
    let status = 'present';
    if (checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30)) {
      status = 'late';
    }

    const newAttendance = await Attendance.create({
      employeeId,
      checkIn: checkInTime,
      checkOut: null,
      workedHours: 0,
      status,
    });

    return sendSuccess(res, newAttendance, 'Checked in successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/employee/attendance/check-out
 * Secure server-side check-out for authenticated employee
 */
const checkOut = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const employeeId = employee._id;

    // Find active open session
    const openSession = await Attendance.findOne({
      employeeId,
      checkOut: null,
    }).sort({ checkIn: -1 });

    if (!openSession) {
      return sendError(res, 'Please check in before checking out.', 400, 'NO_ACTIVE_SESSION');
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(openSession.checkIn);

    if (checkOutTime <= checkInTime) {
      return sendError(res, 'Check-out time cannot be earlier than check-in time.', 400, 'INVALID_TIME');
    }

    const diffMs = checkOutTime - checkInTime;
    const workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    openSession.checkOut = checkOutTime;
    openSession.workedHours = workedHours;

    if (workedHours > 8) {
      openSession.status = 'overtime';
    }

    await openSession.save();

    return sendSuccess(res, openSession, 'Checked out successfully. Shift completed.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/employee/attendance/re-entry
 * Re-open shift if employee checked out by mistake
 */
const requestReentry = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const employeeId = employee._id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Find today's attendance record (even if completed)
    const todayRecord = await Attendance.findOne({
      employeeId,
      checkIn: { $gte: startOfToday, $lte: endOfToday },
    }).sort({ checkIn: -1 });

    if (!todayRecord) {
      // If no check-in exists at all today, create a new one
      const newAttendance = await Attendance.create({
        employeeId,
        checkIn: new Date(),
        checkOut: null,
        workedHours: 0,
        status: 'present',
      });
      return sendSuccess(res, newAttendance, 'Re-entry approved! Shift started.', 201);
    }

    // Re-open existing record: clear checkOut
    todayRecord.checkOut = null;
    todayRecord.status = 'present';
    await todayRecord.save();

    return sendSuccess(res, todayRecord, 'Re-entry approved! Your shift has been resumed.');
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/employee/attendance
 * History of attendance records for authenticated employee only
 */
const getAttendanceHistory = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const { status, month, year, startDate, endDate } = req.query;
    const query = { employeeId: employee._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.checkIn = {};
      if (startDate) query.checkIn.$gte = new Date(startDate);
      if (endDate) query.checkIn.$lte = new Date(endDate);
    } else if (month && year) {
      const m = parseInt(month, 10) - 1;
      const y = parseInt(year, 10);
      const start = new Date(y, m, 1, 0, 0, 0, 0);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
      query.checkIn = { $gte: start, $lte: end };
    }

    const items = await Attendance.find(query)
      .sort({ checkIn: -1 })
      .limit(100);

    // Summary calculations
    let totalHours = 0;
    let overtimeHours = 0;
    let daysPresent = 0;
    let lateMinutes = 0;

    items.forEach((item) => {
      const hrs = item.workedHours || 0;
      totalHours += hrs;
      if (hrs > 8) overtimeHours += (hrs - 8);
      if (item.status === 'present' || item.status === 'overtime' || item.status === 'late') {
        daysPresent += 1;
      }
      if (item.status === 'late' && item.checkIn) {
        const cDate = new Date(item.checkIn);
        const shiftStart = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate(), 9, 0, 0);
        if (cDate > shiftStart) {
          lateMinutes += Math.round((cDate - shiftStart) / (1000 * 60));
        }
      }
    });

    const summary = {
      totalDaysLogged: items.length,
      daysPresent,
      totalHoursWorked: Math.round(totalHours * 100) / 100,
      overtimeEarned: Math.round(overtimeHours * 100) / 100,
      totalLateMinutes: lateMinutes,
    };

    return sendSuccess(res, { items, summary }, 'Attendance history retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/employee/leave
 * Returns leave balance and leave requests for authenticated employee
 */
const getLeaveOverview = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const [allocations, requests, leaveTypes] = await Promise.all([
      TimeOffAllocation.find({ employeeId: employee._id }).populate('timeOffTypeId', 'name unit requiresAllocation'),
      TimeOffRequest.find({ employeeId: employee._id })
        .populate('timeOffTypeId', 'name unit')
        .sort({ dateFrom: -1 }),
      TimeOffType.find({}),
    ]);

    return sendSuccess(res, {
      allocations,
      requests,
      leaveTypes,
    }, 'Leave overview retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/employee/leave/requests
 * Submit new leave request for authenticated employee
 */
const submitLeaveRequest = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const { timeOffTypeId, dateFrom, dateTo, reason } = req.body;

    if (!timeOffTypeId || !dateFrom || !dateTo) {
      return sendError(res, 'Leave type, start date, and end date are required', 400, 'VALIDATION_ERROR');
    }

    const dFrom = new Date(dateFrom);
    const dTo = new Date(dateTo);

    if (dTo < dFrom) {
      return sendError(res, 'End date cannot be earlier than start date', 400, 'VALIDATION_ERROR');
    }

    const diffDays = Math.ceil((dTo - dFrom) / (1000 * 60 * 60 * 24)) + 1;

    const newRequest = await TimeOffRequest.create({
      employeeId: employee._id,
      timeOffTypeId,
      dateFrom: dFrom,
      dateTo: dTo,
      duration: diffDays,
      reason: reason || '',
      status: 'submitted',
    });

    const populated = await TimeOffRequest.findById(newRequest._id).populate('timeOffTypeId', 'name unit');

    try {
      await Notification.create({
        recipientRole: 'all_hr',
        type: 'time_off_request',
        title: 'New Leave Request Applied',
        message: `${employee.fullName || 'An employee'} applied for ${populated?.timeOffTypeId?.name || 'leave'} (${diffDays} day(s)).`,
        timeOffRequestId: newRequest._id,
      });
    } catch (notifErr) {
      console.warn('Could not generate HR notification:', notifErr);
    }

    return sendSuccess(res, populated, 'Leave request submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/employee/payslips
 * Returns all payslips for authenticated employee
 */
const getPayslips = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const payslips = await Payslip.find({ employee: employee._id })
      .populate('payrun', 'name periodStart periodEnd state')
      .populate('contract', 'wage startDate endDate')
      .sort({ createdAt: -1 });

    return sendSuccess(res, payslips, 'Payslips retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/employee/payslips/:id
 * Detailed payslip viewer for authenticated employee
 */
const getPayslipById = async (req, res, next) => {
  try {
    const employee = await resolveAuthEmployee(req);
    if (!employee) {
      return sendError(res, 'Employee profile not found', 404, 'NOT_FOUND');
    }

    const payslip = await Payslip.findById(req.params.id)
      .populate('payrun', 'name periodStart periodEnd state')
      .populate('contract', 'wage startDate endDate')
      .populate('employee', 'fullName employeeCode email departmentId jobPositionId');

    if (!payslip) {
      return sendError(res, 'Payslip not found', 404, 'NOT_FOUND');
    }

    // Security check: Employee can only view their own payslip
    if (payslip.employee._id.toString() !== employee._id.toString() && req.user.role === 'employee') {
      return sendError(res, 'Access denied: You can only view your own payslips', 403, 'FORBIDDEN');
    }

    return sendSuccess(res, payslip, 'Payslip details retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getTodayAttendance,
  checkIn,
  checkOut,
  requestReentry,
  getAttendanceHistory,
  getLeaveOverview,
  submitLeaveRequest,
  getPayslips,
  getPayslipById,
};
