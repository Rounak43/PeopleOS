/**
 * PeopleOS — Working Schedule Service
 */

const WorkingSchedule = require('../models/WorkingSchedule');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const { buildPaginationMeta } = require('../utils/pagination');

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
};

const calculateTotalWeeklyHours = (lines) => {
  if (!Array.isArray(lines) || lines.length === 0) return 0;

  const seenDays = new Set();
  let totalMinutes = 0;

  for (const line of lines) {
    const day = (line.dayOfWeek || '').toLowerCase();
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    if (!validDays.includes(day)) {
      const err = new Error(`Invalid dayOfWeek '${line.dayOfWeek}'`);
      err.statusCode = 400;
      throw err;
    }

    if (seenDays.has(day)) {
      const err = new Error(`Duplicate dayOfWeek '${line.dayOfWeek}' in schedule lines`);
      err.statusCode = 400;
      throw err;
    }
    seenDays.add(day);

    const startMins = parseTimeToMinutes(line.startTime);
    const endMins = parseTimeToMinutes(line.endTime);

    if (startMins === null || endMins === null) {
      const err = new Error(`Invalid time format for line on ${day}. Use 'HH:MM'`);
      err.statusCode = 400;
      throw err;
    }

    if (endMins <= startMins) {
      const err = new Error(`endTime (${line.endTime}) must be greater than startTime (${line.startTime}) on ${day}`);
      err.statusCode = 400;
      throw err;
    }

    const breakMins = parseInt(line.breakMinutes, 10) || 0;
    if (breakMins < 0) {
      const err = new Error(`breakMinutes cannot be negative on ${day}`);
      err.statusCode = 400;
      throw err;
    }

    const shiftDuration = endMins - startMins - breakMins;
    if (shiftDuration < 0) {
      const err = new Error(`breakMinutes exceeds shift duration on ${day}`);
      err.statusCode = 400;
      throw err;
    }

    totalMinutes += shiftDuration;
  }

  return Math.round((totalMinutes / 60) * 100) / 100;
};

const createWorkingSchedule = async (data) => {
  const lines = data.lines || [];
  const calculatedHours = calculateTotalWeeklyHours(lines);

  const scheduleData = {
    ...data,
    totalWeeklyHours: calculatedHours,
  };

  const schedule = new WorkingSchedule(scheduleData);
  return await schedule.save();
};

const getWorkingSchedules = async ({ page = 1, limit = 20, skip = 0 }) => {
  const [items, total] = await Promise.all([
    WorkingSchedule.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    WorkingSchedule.countDocuments(),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getWorkingScheduleById = async (id) => {
  const schedule = await WorkingSchedule.findById(id);
  if (!schedule) {
    const err = new Error('Working Schedule not found');
    err.statusCode = 404;
    throw err;
  }
  return schedule;
};

const updateWorkingSchedule = async (id, data) => {
  const existing = await WorkingSchedule.findById(id);
  if (!existing) {
    const err = new Error('Working Schedule not found');
    err.statusCode = 404;
    throw err;
  }

  const lines = data.lines !== undefined ? data.lines : existing.lines;
  const calculatedHours = calculateTotalWeeklyHours(lines);

  const updateData = {
    ...data,
    totalWeeklyHours: calculatedHours,
  };

  return await WorkingSchedule.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const deleteWorkingSchedule = async (id) => {
  const [employee, contract] = await Promise.all([
    Employee.findOne({ workingScheduleId: id }),
    Contract.findOne({ workingScheduleId: id }),
  ]);

  if (employee || contract) {
    const err = new Error('Cannot delete working schedule: It is assigned to existing employees or contracts');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await WorkingSchedule.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Working Schedule not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

module.exports = {
  createWorkingSchedule,
  getWorkingSchedules,
  getWorkingScheduleById,
  updateWorkingSchedule,
  deleteWorkingSchedule,
};
