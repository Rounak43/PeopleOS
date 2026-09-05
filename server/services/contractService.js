/**
 * PeopleOS — Contract Service
 */

const Contract = require('../models/Contract');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const WorkingSchedule = require('../models/WorkingSchedule');
const { buildPaginationMeta } = require('../utils/pagination');

const checkContractOverlap = async (employeeId, startDate, endDate, excludeContractId = null) => {
  const newStart = new Date(startDate);
  const newEnd = endDate ? new Date(endDate) : null;

  const query = {
    employeeId,
    status: 'active',
  };

  if (excludeContractId) {
    query._id = { $ne: excludeContractId };
  }

  const activeContracts = await Contract.find(query);

  for (const existing of activeContracts) {
    const exStart = new Date(existing.startDate);
    const exEnd = existing.endDate ? new Date(existing.endDate) : null;

    // Overlap condition:
    // existing.startDate <= new.endDate (or new is open-ended)
    // AND (existing.endDate >= new.startDate OR existing.endDate is null)

    const cond1 = newEnd === null || exStart <= newEnd;
    const cond2 = exEnd === null || exEnd >= newStart;

    if (cond1 && cond2) {
      return true;
    }
  }

  return false;
};

const createContract = async (data) => {
  const employee = await Employee.findById(data.employeeId);
  if (!employee) {
    const err = new Error('Employee does not exist');
    err.statusCode = 400;
    throw err;
  }

  if (data.departmentId) {
    const dept = await Department.findById(data.departmentId);
    if (!dept) {
      const err = new Error('Department does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.jobPositionId) {
    const jobPos = await JobPosition.findById(data.jobPositionId);
    if (!jobPos) {
      const err = new Error('Job Position does not exist');
      err.statusCode = 400;
      throw err;
    }
    if (data.departmentId && jobPos.departmentId.toString() !== data.departmentId.toString()) {
      const err = new Error('Selected job position does not belong to the selected department');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.workingScheduleId) {
    const schedule = await WorkingSchedule.findById(data.workingScheduleId);
    if (!schedule) {
      const err = new Error('Working Schedule does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  const status = data.status || 'active';

  if (status === 'active') {
    const isOverlapping = await checkContractOverlap(data.employeeId, data.startDate, data.endDate);
    if (isOverlapping) {
      const err = new Error('This employee already has an overlapping active contract.');
      err.statusCode = 409;
      throw err;
    }
  }

  if (!data.contractCode) {
    data.contractCode = `CTR-${Date.now().toString().slice(-6)}`;
  }

  data.status = status;
  const contract = new Contract(data);
  return await contract.save();
};

const getContracts = async ({ employeeId, status, durationType, search, startDate, endDate, page = 1, limit = 20, skip = 0 }) => {
  const query = {};

  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;
  if (durationType) query.durationType = durationType;

  if (search) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { contractCode: searchRegex },
      { durationType: searchRegex },
      { workLocation: searchRegex },
    ];
  }

  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }

  const [items, total] = await Promise.all([
    Contract.find(query)
      .collation({ locale: 'en', numericOrdering: true })
      .populate('employeeId', 'fullName email employeeCode firstName lastName')
      .populate('departmentId', 'name')
      .populate('jobPositionId', 'title')
      .populate('workingScheduleId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ contractCode: 1, createdAt: 1 }),
    Contract.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getContractById = async (id) => {
  const contract = await Contract.findById(id)
    .populate('employeeId', 'fullName employeeCode')
    .populate('departmentId', 'name')
    .populate('jobPositionId', 'title')
    .populate('workingScheduleId', 'name');

  if (!contract) {
    const err = new Error('Contract not found');
    err.statusCode = 404;
    throw err;
  }
  return contract;
};

const getEmployeeContracts = async (employeeId) => {
  return await Contract.find({ employeeId })
    .populate('departmentId', 'name')
    .populate('jobPositionId', 'title')
    .populate('workingScheduleId', 'name')
    .sort({ startDate: -1 });
};

const getActiveEmployeeContract = async (employeeId) => {
  const activeContract = await Contract.findOne({ employeeId, status: 'active' })
    .populate('departmentId', 'name')
    .populate('jobPositionId', 'title')
    .populate('workingScheduleId', 'name');

  if (!activeContract) {
    const err = new Error('No active contract found for this employee');
    err.statusCode = 404;
    throw err;
  }
  return activeContract;
};

const updateContract = async (id, data) => {
  const existing = await Contract.findById(id);
  if (!existing) {
    const err = new Error('Contract not found');
    err.statusCode = 404;
    throw err;
  }

  const newStatus = data.status || existing.status;
  const newStart = data.startDate || existing.startDate;
  const newEnd = data.endDate !== undefined ? data.endDate : existing.endDate;
  const targetEmployeeId = data.employeeId || existing.employeeId;

  if (newStatus === 'active') {
    const isOverlapping = await checkContractOverlap(targetEmployeeId, newStart, newEnd, id);
    if (isOverlapping) {
      const err = new Error('An active contract already exists for this employee in the specified date range');
      err.statusCode = 400;
      throw err;
    }
  }

  return await Contract.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('employeeId', 'fullName employeeCode')
    .populate('departmentId', 'name')
    .populate('jobPositionId', 'title')
    .populate('workingScheduleId', 'name');
};

const deleteContract = async (id) => {
  const deleted = await Contract.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Contract not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

/**
 * Reusable contract resolution service for payroll backend
 */
const resolveApplicableContract = async (employeeId, periodStart, periodEnd) => {
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  const contract = await Contract.findOne({
    employeeId,
    status: 'active',
    startDate: { $lte: pEnd },
    $or: [
      { endDate: null },
      { endDate: { $gte: pStart } },
    ],
  }).populate('workingScheduleId departmentId jobPositionId');

  return contract;
};

module.exports = {
  createContract,
  getContracts,
  getContractById,
  getEmployeeContracts,
  getActiveEmployeeContract,
  updateContract,
  deleteContract,
  resolveApplicableContract,
};
