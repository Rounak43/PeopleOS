/**
 * PeopleOS — Employee Controller
 */

const employeeService = require('../services/employeeService');
const { sendSuccess } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.createEmployee(req.body);
    return sendSuccess(res, employee, 'Employee created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const { search, departmentId, jobPositionId, status } = req.query;

    const result = await employeeService.getEmployees({
      search,
      departmentId,
      jobPositionId,
      status,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });

    return sendSuccess(res, result.items, 'Employees retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    return sendSuccess(res, employee, 'Employee retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    return sendSuccess(res, employee, 'Employee updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const result = await employeeService.deleteEmployee(req.params.id);
    return sendSuccess(res, result, 'Employee delete request processed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
