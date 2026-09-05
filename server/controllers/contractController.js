/**
 * PeopleOS — Contract Controller
 */

const contractService = require('../services/contractService');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createContract = async (req, res, next) => {
  try {
    const contract = await contractService.createContract(req.body);
    return sendSuccess(res, contract, 'Contract created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getContracts = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const { employeeId, status, durationType, search, startDate, endDate } = req.query;

    const result = await contractService.getContracts({
      employeeId,
      status,
      durationType,
      search,
      startDate,
      endDate,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });

    return sendSuccess(res, result.items, 'Contracts retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getContractById = async (req, res, next) => {
  try {
    const contract = await contractService.getContractById(req.params.id);
    return sendSuccess(res, contract, 'Contract retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getEmployeeContracts = async (req, res, next) => {
  try {
    const contracts = await contractService.getEmployeeContracts(req.params.employeeId);
    return sendSuccess(res, contracts, 'Employee contracts retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getActiveEmployeeContract = async (req, res, next) => {
  try {
    const contract = await contractService.getActiveEmployeeContract(req.params.employeeId);
    return sendSuccess(res, contract, 'Active employee contract retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateContract = async (req, res, next) => {
  try {
    const contract = await contractService.updateContract(req.params.id, req.body);
    return sendSuccess(res, contract, 'Contract updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteContract = async (req, res, next) => {
  try {
    await contractService.deleteContract(req.params.id);
    return sendSuccess(res, null, 'Contract deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContract,
  getContracts,
  getContractById,
  getEmployeeContracts,
  getActiveEmployeeContract,
  updateContract,
  deleteContract,
};
