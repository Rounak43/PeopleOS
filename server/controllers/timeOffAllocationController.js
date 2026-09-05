/**
 * PeopleOS — Time Off Allocation Controller
 */

const timeOffService = require('../services/timeOffService');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createAllocation = async (req, res, next) => {
  try {
    const allocation = await timeOffService.createAllocation(req.body);
    return sendSuccess(res, allocation, 'Time off allocation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getAllocations = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const { employeeId, timeOffTypeId, status } = req.query;

    const result = await timeOffService.getAllocations({
      employeeId,
      timeOffTypeId,
      status,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });

    return sendSuccess(res, result.items, 'Time off allocations retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getAllocationById = async (req, res, next) => {
  try {
    const allocation = await timeOffService.getAllocationById(req.params.id);
    return sendSuccess(res, allocation, 'Time off allocation retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getEmployeeAllocations = async (req, res, next) => {
  try {
    const allocations = await timeOffService.getEmployeeAllocations(req.params.employeeId);
    return sendSuccess(res, allocations, 'Employee time off allocations retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateAllocation = async (req, res, next) => {
  try {
    const allocation = await timeOffService.updateAllocation(req.params.id, req.body);
    return sendSuccess(res, allocation, 'Time off allocation updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteAllocation = async (req, res, next) => {
  try {
    await timeOffService.deleteAllocation(req.params.id);
    return sendSuccess(res, null, 'Time off allocation deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAllocation,
  getAllocations,
  getAllocationById,
  getEmployeeAllocations,
  updateAllocation,
  deleteAllocation,
};
