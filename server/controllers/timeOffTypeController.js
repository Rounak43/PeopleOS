/**
 * PeopleOS — Time Off Type Controller
 */

const timeOffService = require('../services/timeOffService');
const { sendSuccess } = require('../utils/apiResponse');

const createTimeOffType = async (req, res, next) => {
  try {
    const type = await timeOffService.createTimeOffType(req.body);
    return sendSuccess(res, type, 'Time off type created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getTimeOffTypes = async (req, res, next) => {
  try {
    const types = await timeOffService.getTimeOffTypes();
    return sendSuccess(res, types, 'Time off types retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getTimeOffTypeById = async (req, res, next) => {
  try {
    const type = await timeOffService.getTimeOffTypeById(req.params.id);
    return sendSuccess(res, type, 'Time off type retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateTimeOffType = async (req, res, next) => {
  try {
    const type = await timeOffService.updateTimeOffType(req.params.id, req.body);
    return sendSuccess(res, type, 'Time off type updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteTimeOffType = async (req, res, next) => {
  try {
    await timeOffService.deleteTimeOffType(req.params.id);
    return sendSuccess(res, null, 'Time off type deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTimeOffType,
  getTimeOffTypes,
  getTimeOffTypeById,
  updateTimeOffType,
  deleteTimeOffType,
};
