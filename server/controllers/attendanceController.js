/**
 * PeopleOS — Attendance Controller
 */

const attendanceService = require('../services/attendanceService');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.createAttendance(req.body);
    return sendSuccess(res, attendance, 'Attendance record created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getAttendance = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const { employeeId, status, startDate, endDate } = req.query;

    const result = await attendanceService.getAttendance({
      employeeId,
      status,
      startDate,
      endDate,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });

    return sendSuccess(res, result.items, 'Attendance records retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getAttendanceById = async (req, res, next) => {
  try {
    const attendance = await attendanceService.getAttendanceById(req.params.id);
    return sendSuccess(res, attendance, 'Attendance record retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.updateAttendance(req.params.id, req.body);
    return sendSuccess(res, attendance, 'Attendance record updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteAttendance = async (req, res, next) => {
  try {
    await attendanceService.deleteAttendance(req.params.id);
    return sendSuccess(res, null, 'Attendance record deleted successfully');
  } catch (error) {
    next(error);
  }
};

const checkIn = async (req, res, next) => {
  try {
    const employeeId = req.body.employeeId || (req.user ? req.user.employeeId : null);
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required for check-in' });
    }

    const attendance = await attendanceService.checkIn(employeeId);
    return sendSuccess(res, attendance, 'Checked in successfully', 201);
  } catch (error) {
    next(error);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkOut(req.params.id);
    return sendSuccess(res, attendance, 'Checked out successfully');
  } catch (error) {
    next(error);
  }
};

const correctAttendance = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const attendance = await attendanceService.correctAttendance(req.params.id, req.body, userId);
    return sendSuccess(res, attendance, 'Attendance record corrected successfully');
  } catch (error) {
    next(error);
  }
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
