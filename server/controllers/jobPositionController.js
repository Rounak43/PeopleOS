/**
 * PeopleOS — Job Position Controller
 */

const jobPositionService = require('../services/jobPositionService');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createJobPosition = async (req, res, next) => {
  try {
    const jobPosition = await jobPositionService.createJobPosition(req.body);
    return sendSuccess(res, jobPosition, 'Job position created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getJobPositions = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const { search, departmentId } = req.query;

    const result = await jobPositionService.getJobPositions({
      search,
      departmentId,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });

    return sendSuccess(res, result.items, 'Job positions retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getJobPositionById = async (req, res, next) => {
  try {
    const jobPosition = await jobPositionService.getJobPositionById(req.params.id);
    return sendSuccess(res, jobPosition, 'Job position retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateJobPosition = async (req, res, next) => {
  try {
    const jobPosition = await jobPositionService.updateJobPosition(req.params.id, req.body);
    return sendSuccess(res, jobPosition, 'Job position updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteJobPosition = async (req, res, next) => {
  try {
    await jobPositionService.deleteJobPosition(req.params.id);
    return sendSuccess(res, null, 'Job position deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJobPosition,
  getJobPositions,
  getJobPositionById,
  updateJobPosition,
  deleteJobPosition,
};
