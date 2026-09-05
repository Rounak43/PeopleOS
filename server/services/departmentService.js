/**
 * PeopleOS — Department Service
 */

const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const Employee = require('../models/Employee');
const { buildPaginationMeta } = require('../utils/pagination');

const createDepartment = async (data) => {
  if (data.parentDepartmentId) {
    const parent = await Department.findById(data.parentDepartmentId);
    if (!parent) {
      const err = new Error('Parent department does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.managerEmployeeId) {
    const manager = await Employee.findById(data.managerEmployeeId);
    if (!manager) {
      const err = new Error('Manager employee does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  const department = new Department(data);
  return await department.save();
};

const getDepartments = async ({ search, page = 1, limit = 20, skip = 0 }) => {
  const query = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    Department.find(query)
      .populate('parentDepartmentId', 'name')
      .populate('managerEmployeeId', 'fullName employeeCode')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Department.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getDepartmentById = async (id) => {
  const department = await Department.findById(id)
    .populate('parentDepartmentId', 'name')
    .populate('managerEmployeeId', 'fullName employeeCode');

  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }
  return department;
};

const updateDepartment = async (id, data) => {
  if (data.parentDepartmentId && data.parentDepartmentId.toString() === id.toString()) {
    const err = new Error('A department cannot be its own parent');
    err.statusCode = 400;
    throw err;
  }

  if (data.parentDepartmentId) {
    const parent = await Department.findById(data.parentDepartmentId);
    if (!parent) {
      const err = new Error('Parent department does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  const department = await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }
  return department;
};

const deleteDepartment = async (id) => {
  const [childDept, jobPos, employee] = await Promise.all([
    Department.findOne({ parentDepartmentId: id }),
    JobPosition.findOne({ departmentId: id }),
    Employee.findOne({ departmentId: id }),
  ]);

  if (childDept || jobPos || employee) {
    const err = new Error('Cannot delete department: It is referenced by child departments, job positions, or employees');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await Department.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
