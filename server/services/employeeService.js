/**
 * PeopleOS — Employee Service
 */

const Employee = require('../models/Employee');
const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const WorkingSchedule = require('../models/WorkingSchedule');
const Contract = require('../models/Contract');
const Attendance = require('../models/Attendance');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const TimeOffRequest = require('../models/TimeOffRequest');
const { buildPaginationMeta } = require('../utils/pagination');

const validateEmployeeReferences = async (data, employeeId = null) => {
  if (data.departmentId) {
    const dept = await Department.findById(data.departmentId);
    if (!dept) {
      const err = new Error('Referenced department does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.jobPositionId) {
    const jobPos = await JobPosition.findById(data.jobPositionId);
    if (!jobPos) {
      const err = new Error('Referenced job position does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.workingScheduleId) {
    const schedule = await WorkingSchedule.findById(data.workingScheduleId);
    if (!schedule) {
      const err = new Error('Referenced working schedule does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.managerId) {
    if (employeeId && data.managerId.toString() === employeeId.toString()) {
      const err = new Error('An employee cannot be their own manager');
      err.statusCode = 400;
      throw err;
    }

    const manager = await Employee.findById(data.managerId);
    if (!manager) {
      const err = new Error('Referenced manager employee does not exist');
      err.statusCode = 400;
      throw err;
    }
  }
};

const createEmployee = async (data) => {
  const existingCode = await Employee.findOne({ employeeCode: data.employeeCode });
  if (existingCode) {
    const err = new Error(`Employee code '${data.employeeCode}' already exists`);
    err.statusCode = 400;
    throw err;
  }

  const existingEmail = await Employee.findOne({ email: data.email });
  if (existingEmail) {
    const err = new Error(`Employee email '${data.email}' already exists`);
    err.statusCode = 400;
    throw err;
  }

  await validateEmployeeReferences(data);

  const employee = new Employee(data);
  return await employee.save();
};

const getEmployees = async ({ search, departmentId, jobPositionId, status, page = 1, limit = 20, skip = 0 }) => {
  const query = {};

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { employeeCode: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (departmentId) query.departmentId = departmentId;
  if (jobPositionId) query.jobPositionId = jobPositionId;
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    Employee.find(query)
      .populate('departmentId', 'name')
      .populate('jobPositionId', 'title')
      .populate('managerId', 'fullName employeeCode')
      .populate('workingScheduleId', 'name totalWeeklyHours')
      .populate('userId', 'email role isActive')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Employee.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getEmployeeById = async (id) => {
  const employee = await Employee.findById(id)
    .populate('departmentId', 'name')
    .populate('jobPositionId', 'title')
    .populate('managerId', 'fullName employeeCode')
    .populate('workingScheduleId', 'name totalWeeklyHours')
    .populate('userId', 'email role isActive');

  if (!employee) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }
  return employee;
};

const updateEmployee = async (id, data) => {
  if (data.employeeCode) {
    const existing = await Employee.findOne({ employeeCode: data.employeeCode, _id: { $ne: id } });
    if (existing) {
      const err = new Error(`Employee code '${data.employeeCode}' already exists`);
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.email) {
    const existing = await Employee.findOne({ email: data.email, _id: { $ne: id } });
    if (existing) {
      const err = new Error(`Employee email '${data.email}' already exists`);
      err.statusCode = 400;
      throw err;
    }
  }

  await validateEmployeeReferences(data, id);

  const updated = await Employee.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('departmentId', 'name')
    .populate('jobPositionId', 'title')
    .populate('managerId', 'fullName employeeCode')
    .populate('workingScheduleId', 'name totalWeeklyHours');

  if (!updated) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

const deleteEmployee = async (id) => {
  const [contract, attendance, allocation, request] = await Promise.all([
    Contract.findOne({ employeeId: id }),
    Attendance.findOne({ employeeId: id }),
    TimeOffAllocation.findOne({ employeeId: id }),
    TimeOffRequest.findOne({ employeeId: id }),
  ]);

  if (contract || attendance || allocation || request) {
    // Soft-delete / terminate if referenced to preserve HR audit history
    const terminated = await Employee.findByIdAndUpdate(id, { status: 'terminated' }, { new: true });
    if (!terminated) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }
    return { terminated: true, message: 'Employee has historical HR records. Status set to terminated.' };
  }

  const deleted = await Employee.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Employee not found');
    err.statusCode = 404;
    throw err;
  }
  return { deleted: true };
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
