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

const DEFAULT_IT_SCHEDULES = [
  {
    name: 'Morning Shift (Mon-Fri, 9:00 AM - 6:00 PM)',
    type: 'full_time',
    totalWeeklyHours: 40,
    lines: [
      { dayOfWeek: 'monday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'tuesday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'wednesday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'thursday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'friday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    ],
  },
  {
    name: 'Evening Shift (Mon-Fri, 2:00 PM - 11:00 PM)',
    type: 'full_time',
    totalWeeklyHours: 40,
    lines: [
      { dayOfWeek: 'monday', startTime: '14:00', endTime: '23:00', breakMinutes: 60 },
      { dayOfWeek: 'tuesday', startTime: '14:00', endTime: '23:00', breakMinutes: 60 },
      { dayOfWeek: 'wednesday', startTime: '14:00', endTime: '23:00', breakMinutes: 60 },
      { dayOfWeek: 'thursday', startTime: '14:00', endTime: '23:00', breakMinutes: 60 },
      { dayOfWeek: 'friday', startTime: '14:00', endTime: '23:00', breakMinutes: 60 },
    ],
  },
  {
    name: 'Night Shift (Mon-Fri, 10:00 PM - 7:00 AM)',
    type: 'shift',
    totalWeeklyHours: 40,
    lines: [
      { dayOfWeek: 'monday', startTime: '22:00', endTime: '07:00', breakMinutes: 60 },
      { dayOfWeek: 'tuesday', startTime: '22:00', endTime: '07:00', breakMinutes: 60 },
      { dayOfWeek: 'wednesday', startTime: '22:00', endTime: '07:00', breakMinutes: 60 },
      { dayOfWeek: 'thursday', startTime: '22:00', endTime: '07:00', breakMinutes: 60 },
      { dayOfWeek: 'friday', startTime: '22:00', endTime: '07:00', breakMinutes: 60 },
    ],
  },
  {
    name: 'Part-Time Hourly Shift (Mon-Fri, 10:00 AM - 2:00 PM, Paid Per Hr)',
    type: 'part_time',
    totalWeeklyHours: 20,
    lines: [
      { dayOfWeek: 'monday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
      { dayOfWeek: 'tuesday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
      { dayOfWeek: 'wednesday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
      { dayOfWeek: 'thursday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
      { dayOfWeek: 'friday', startTime: '10:00', endTime: '14:00', breakMinutes: 0 },
    ],
  },
];

const seedITSchedulesIfMissing = async () => {
  for (const sched of DEFAULT_IT_SCHEDULES) {
    await WorkingSchedule.updateOne(
      { name: sched.name },
      { $setOnInsert: sched },
      { upsert: true }
    );
  }
};

const getWorkingSchedules = async ({ page = 1, limit = 20, skip = 0 } = {}) => {
  await seedITSchedulesIfMissing();
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
