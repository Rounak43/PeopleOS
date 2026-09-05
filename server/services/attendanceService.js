const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { buildPaginationMeta } = require('../utils/pagination');

const createAttendance = async (data) => {
  const employee = await Employee.findById(data.employeeId);
  if (!employee) {
    const err = new Error('Employee does not exist');
    err.statusCode = 400;
    throw err;
  }

  const attendance = new Attendance(data);
  return await attendance.save();
};

const getAttendance = async ({ employeeId, status, startDate, endDate, page = 1, limit = 20, skip = 0 }) => {
  const query = {};

  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.checkIn = {};
    if (startDate) query.checkIn.$gte = new Date(startDate);
    if (endDate) query.checkIn.$lte = new Date(endDate);
  }

  const [items, total] = await Promise.all([
    Attendance.find(query)
      .populate('employeeId', 'fullName employeeCode')
      .populate('correctedBy', 'email role')
      .skip(skip)
      .limit(limit)
      .sort({ checkIn: -1 }),
    Attendance.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getAttendanceById = async (id) => {
  const attendance = await Attendance.findById(id)
    .populate('employeeId', 'fullName employeeCode')
    .populate('correctedBy', 'email role');

  if (!attendance) {
    const err = new Error('Attendance record not found');
    err.statusCode = 404;
    throw err;
  }
  return attendance;
};

const updateAttendance = async (id, data) => {
  const updated = await Attendance.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('employeeId', 'fullName employeeCode');

  if (!updated) {
    const err = new Error('Attendance record not found');
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

const deleteAttendance = async (id) => {
  const deleted = await Attendance.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Attendance record not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

const checkIn = async (employeeId) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    const err = new Error('Employee does not exist');
    err.statusCode = 400;
    throw err;
  }

  // Prevent duplicate open attendance check-ins
  const openRecord = await Attendance.findOne({ employeeId, checkOut: null });
  if (openRecord) {
    const err = new Error('Employee already has an active open check-in session');
    err.statusCode = 400;
    throw err;
  }

  const attendance = new Attendance({
    employeeId,
    checkIn: new Date(),
    checkOut: null,
    workedHours: 0,
    status: 'present',
  });

  return await attendance.save();
};

const checkOut = async (attendanceId) => {
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    const err = new Error('Attendance record not found');
    err.statusCode = 404;
    throw err;
  }

  if (attendance.checkOut) {
    const err = new Error('Attendance session has already been checked out');
    err.statusCode = 400;
    throw err;
  }

  const checkOutTime = new Date();
  const checkInTime = new Date(attendance.checkIn);

  if (checkOutTime <= checkInTime) {
    const err = new Error('Check-out time must be after check-in time');
    err.statusCode = 400;
    throw err;
  }

  const diffMs = checkOutTime - checkInTime;
  const workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  attendance.checkOut = checkOutTime;
  attendance.workedHours = workedHours;

  return await attendance.save();
};

const correctAttendance = async (attendanceId, { checkIn: newCheckIn, checkOut: newCheckOut, status, notes }, userId) => {
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) {
    const err = new Error('Attendance record not found');
    err.statusCode = 404;
    throw err;
  }

  const cIn = newCheckIn ? new Date(newCheckIn) : attendance.checkIn;
  const cOut = newCheckOut ? new Date(newCheckOut) : attendance.checkOut;

  let workedHours = attendance.workedHours;
  if (cIn && cOut) {
    if (cOut <= cIn) {
      const err = new Error('Check-out time must be after check-in time');
      err.statusCode = 400;
      throw err;
    }
    const diffMs = cOut - cIn;
    workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  attendance.checkIn = cIn;
  attendance.checkOut = cOut;
  attendance.workedHours = workedHours;
  if (status) attendance.status = status;
  if (notes) attendance.notes = notes;

  attendance.isManualCorrection = true;
  attendance.correctedBy = userId || null;

  return await attendance.save();
};

module.exports = {
  createAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
  checkIn,
  checkOut,
  correctAttendance,
};
