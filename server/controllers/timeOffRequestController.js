/**
 * PeopleOS — Time Off Request Controller
 */

const timeOffService = require('../services/timeOffService');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createRequest = async (req, res, next) => {
  try {
    const requestData = {
      ...req.body,
      employeeId: req.body.employeeId || (req.user ? req.user.employeeId : null),
    };

    if (!requestData.employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required' });
    }

    const request = await timeOffService.createRequest(requestData);
    return sendSuccess(res, request, 'Time off request created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getRequests = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const { employeeId, status, timeOffTypeId } = req.query;

    const result = await timeOffService.getRequests({
      employeeId,
      status,
      timeOffTypeId,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });

    return sendSuccess(res, result.items, 'Time off requests retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getRequestById = async (req, res, next) => {
  try {
    const request = await timeOffService.getRequestById(req.params.id);
    return sendSuccess(res, request, 'Time off request retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const submitRequest = async (req, res, next) => {
  try {
    const request = await timeOffService.submitRequest(req.params.id);
    return sendSuccess(res, request, 'Time off request submitted successfully');
  } catch (error) {
    next(error);
  }
};

const approveRequest = async (req, res, next) => {
  try {
    const approverId = req.user ? req.user.id : null;
    const request = await timeOffService.approveRequest(req.params.id, approverId);
    return sendSuccess(res, request, 'Time off request approved successfully');
  } catch (error) {
    next(error);
  }
};

const refuseRequest = async (req, res, next) => {
  try {
    const approverId = req.user ? req.user.id : null;
    const { reason } = req.body;
    const request = await timeOffService.refuseRequest(req.params.id, approverId, reason);
    return sendSuccess(res, request, 'Time off request refused successfully');
  } catch (error) {
    next(error);
  }
};

const updateRequest = async (req, res, next) => {
  try {
    const request = await timeOffService.updateRequest(req.params.id, req.body);
    return sendSuccess(res, request, 'Time off request updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteRequest = async (req, res, next) => {
  try {
    await timeOffService.deleteRequest(req.params.id);
    return sendSuccess(res, null, 'Time off request deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  getRequestById,
  submitRequest,
  approveRequest,
  refuseRequest,
  updateRequest,
  deleteRequest,
};
