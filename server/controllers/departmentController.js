/**
 * PeopleOS — Department Controller
 */

const departmentService = require('../services/departmentService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { getPagination } = require('../utils/pagination');

const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(req.body);
    return sendSuccess(res, department, 'Department created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const pagination = getPagination(req);
    const { search } = req.query;

    const result = await departmentService.getDepartments({
      search,
      page: pagination.page,
      limit: pagination.limit,
      skip: pagination.skip,
    });

    return sendSuccess(res, result.items, 'Departments retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    return sendSuccess(res, department, 'Department retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.updateDepartment(req.params.id, req.body);
    return sendSuccess(res, department, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    await departmentService.deleteDepartment(req.params.id);
    return sendSuccess(res, null, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
