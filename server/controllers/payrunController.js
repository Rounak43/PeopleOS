/**
 * PeopleOS — Payrun Controller
 */

const payrunService = require('../services/payrunService');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createPayrunBatch = async (req, res, next) => {
  try {
    const result = await payrunService.createPayrunBatch(req.body);
    return sendSuccess(res, result, 'Payrun batch created and payslips calculated successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getPayruns = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const result = await payrunService.getPayruns({
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });
    return sendSuccess(res, result.items, 'Payrun batches retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getPayrunById = async (req, res, next) => {
  try {
    const result = await payrunService.getPayrunById(req.params.id);
    return sendSuccess(res, result, 'Payrun details retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updatePayrunState = async (req, res, next) => {
  try {
    const { state } = req.body;
    const payrun = await payrunService.updatePayrunState(req.params.id, state || 'Done');
    return sendSuccess(res, payrun, 'Payrun status updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePayrun = async (req, res, next) => {
  try {
    await payrunService.deletePayrun(req.params.id);
    return sendSuccess(res, null, 'Payrun batch deleted successfully');
  } catch (error) {
    next(error);
  }
};

const updatePayslipsStatus = async (req, res, next) => {
  try {
    const { payslipIds, state } = req.body;
    const result = await payrunService.updatePayslipsStatus(payslipIds, state || 'Paid');
    return sendSuccess(res, result, `Payment processed and marked received for ${result.modifiedCount} employee(s)`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayrunBatch,
  getPayruns,
  getPayrunById,
  updatePayrunState,
  deletePayrun,
  updatePayslipsStatus,
};
