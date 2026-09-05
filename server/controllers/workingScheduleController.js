/**
 * PeopleOS — Working Schedule Controller
 */

const workingScheduleService = require('../services/workingScheduleService');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createWorkingSchedule = async (req, res, next) => {
  try {
    const schedule = await workingScheduleService.createWorkingSchedule(req.body);
    return sendSuccess(res, schedule, 'Working schedule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getWorkingSchedules = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const result = await workingScheduleService.getWorkingSchedules({
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });
    return sendSuccess(res, result.items, 'Working schedules retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getWorkingScheduleById = async (req, res, next) => {
  try {
    const schedule = await workingScheduleService.getWorkingScheduleById(req.params.id);
    return sendSuccess(res, schedule, 'Working schedule retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateWorkingSchedule = async (req, res, next) => {
  try {
    const schedule = await workingScheduleService.updateWorkingSchedule(req.params.id, req.body);
    return sendSuccess(res, schedule, 'Working schedule updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteWorkingSchedule = async (req, res, next) => {
  try {
    await workingScheduleService.deleteWorkingSchedule(req.params.id);
    return sendSuccess(res, null, 'Working schedule deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkingSchedule,
  getWorkingSchedules,
  getWorkingScheduleById,
  updateWorkingSchedule,
  deleteWorkingSchedule,
};
