/**
 * PeopleOS — Job Position Service
 */

const JobPosition = require('../models/JobPosition');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const { buildPaginationMeta } = require('../utils/pagination');

const createJobPosition = async (data) => {
  if (!data.title || !data.title.trim()) {
    const err = new Error('Job Position title is required');
    err.statusCode = 400;
    throw err;
  }

  const department = await Department.findById(data.departmentId);
  if (!department) {
    const err = new Error('Department does not exist');
    err.statusCode = 400;
    throw err;
  }

  const cleanTitle = data.title.trim();

  // Duplicate protection: check if same position exists in this department
  const existingPos = await JobPosition.findOne({
    departmentId: data.departmentId,
    title: { $regex: new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });

  if (existingPos) {
    const err = new Error(`"${cleanTitle}" already exists in ${department.name}.`);
    err.statusCode = 409;
    throw err;
  }

  const jobPosition = new JobPosition({
    title: cleanTitle,
    departmentId: data.departmentId,
  });
  return await jobPosition.save();
};

const getJobPositions = async ({ search, departmentId, page = 1, limit = 20, skip = 0 }) => {
  const query = {};

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  if (departmentId) {
    query.departmentId = departmentId;
  }

  const [items, total] = await Promise.all([
    JobPosition.find(query)
      .populate('departmentId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    JobPosition.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getJobPositionById = async (id) => {
  const jobPosition = await JobPosition.findById(id).populate('departmentId', 'name');
  if (!jobPosition) {
    const err = new Error('Job Position not found');
    err.statusCode = 404;
    throw err;
  }
  return jobPosition;
};

const updateJobPosition = async (id, data) => {
  if (data.departmentId) {
    const department = await Department.findById(data.departmentId);
    if (!department) {
      const err = new Error('Department does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  const jobPosition = await JobPosition.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!jobPosition) {
    const err = new Error('Job Position not found');
    err.statusCode = 404;
    throw err;
  }
  return jobPosition;
};

const deleteJobPosition = async (id) => {
  const [employee, contract] = await Promise.all([
    Employee.findOne({ jobPositionId: id }),
    Contract.findOne({ jobPositionId: id }),
  ]);

  if (employee || contract) {
    const err = new Error('Cannot delete job position: It is referenced by existing employees or contracts');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await JobPosition.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Job Position not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

module.exports = {
  createJobPosition,
  getJobPositions,
  getJobPositionById,
  updateJobPosition,
  deleteJobPosition,
};
