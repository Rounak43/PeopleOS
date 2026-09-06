/**
 * PeopleOS — Time Off Service
 * Manages Time Off Types, Time Off Allocations, and Time Off Requests.
 */

const TimeOffType = require('../models/TimeOffType');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const TimeOffRequest = require('../models/TimeOffRequest');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { buildPaginationMeta } = require('../utils/pagination');

// ─────────────────────────────────────────────
// 1. Time Off Types
// ─────────────────────────────────────────────
const createTimeOffType = async (data) => {
  const existing = await TimeOffType.findOne({ name: data.name });
  if (existing) {
    const err = new Error(`Time off type '${data.name}' already exists`);
    err.statusCode = 400;
    throw err;
  }
  const type = new TimeOffType(data);
  return await type.save();
};

const getTimeOffTypes = async () => {
  return await TimeOffType.find().sort({ createdAt: -1 });
};

const getTimeOffTypeById = async (id) => {
  const type = await TimeOffType.findById(id);
  if (!type) {
    const err = new Error('Time off type not found');
    err.statusCode = 404;
    throw err;
  }
  return type;
};

const updateTimeOffType = async (id, data) => {
  const updated = await TimeOffType.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!updated) {
    const err = new Error('Time off type not found');
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

const deleteTimeOffType = async (id) => {
  const [alloc, req] = await Promise.all([
    TimeOffAllocation.findOne({ timeOffTypeId: id }),
    TimeOffRequest.findOne({ timeOffTypeId: id }),
  ]);

  if (alloc || req) {
    const err = new Error('Cannot delete time off type: It is referenced by allocations or requests');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await TimeOffType.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Time off type not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

// ─────────────────────────────────────────────
// 2. Time Off Allocations
// ─────────────────────────────────────────────
const createAllocation = async (data) => {
  const [employee, type] = await Promise.all([
    Employee.findById(data.employeeId),
    TimeOffType.findById(data.timeOffTypeId),
  ]);

  if (!employee) {
    const err = new Error('Employee does not exist');
    err.statusCode = 400;
    throw err;
  }

  if (!type) {
    const err = new Error('Time off type does not exist');
    err.statusCode = 400;
    throw err;
  }

  const allocatedAmount = parseFloat(data.allocatedAmount) || 0;
  const takenAmount = parseFloat(data.takenAmount) || 0;

  if (allocatedAmount < 0 || takenAmount < 0) {
    const err = new Error('Allocated amount and taken amount cannot be negative');
    err.statusCode = 400;
    throw err;
  }

  const remainingAmount = allocatedAmount - takenAmount;
  if (remainingAmount < 0) {
    const err = new Error('Taken amount cannot exceed allocated amount');
    err.statusCode = 400;
    throw err;
  }

  const allocation = new TimeOffAllocation({
    ...data,
    allocatedAmount,
    takenAmount,
    remainingAmount,
  });

  return await allocation.save();
};

const getAllocations = async ({ employeeId, timeOffTypeId, status, page = 1, limit = 20, skip = 0 }) => {
  const query = {};

  if (employeeId) query.employeeId = employeeId;
  if (timeOffTypeId) query.timeOffTypeId = timeOffTypeId;
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    TimeOffAllocation.find(query)
      .populate('employeeId', 'fullName employeeCode')
      .populate('timeOffTypeId', 'name unit')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    TimeOffAllocation.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getAllocationById = async (id) => {
  const allocation = await TimeOffAllocation.findById(id)
    .populate('employeeId', 'fullName employeeCode')
    .populate('timeOffTypeId', 'name unit');

  if (!allocation) {
    const err = new Error('Time off allocation not found');
    err.statusCode = 404;
    throw err;
  }
  return allocation;
};

const getEmployeeAllocations = async (employeeId) => {
  return await TimeOffAllocation.find({ employeeId })
    .populate('timeOffTypeId', 'name unit requiresAllocation')
    .sort({ createdAt: -1 });
};

const updateAllocation = async (id, data) => {
  const existing = await TimeOffAllocation.findById(id);
  if (!existing) {
    const err = new Error('Time off allocation not found');
    err.statusCode = 404;
    throw err;
  }

  const allocatedAmount = data.allocatedAmount !== undefined ? parseFloat(data.allocatedAmount) : existing.allocatedAmount;
  const takenAmount = data.takenAmount !== undefined ? parseFloat(data.takenAmount) : existing.takenAmount;

  if (allocatedAmount < 0 || takenAmount < 0) {
    const err = new Error('Allocated amount and taken amount cannot be negative');
    err.statusCode = 400;
    throw err;
  }

  const remainingAmount = allocatedAmount - takenAmount;
  if (remainingAmount < 0) {
    const err = new Error('Remaining amount cannot be negative');
    err.statusCode = 400;
    throw err;
  }

  const updateData = {
    ...data,
    allocatedAmount,
    takenAmount,
    remainingAmount,
  };

  return await TimeOffAllocation.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

const deleteAllocation = async (id) => {
  const request = await TimeOffRequest.findOne({ allocationId: id });
  if (request) {
    const err = new Error('Cannot delete allocation: It is referenced by time off requests');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await TimeOffAllocation.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Time off allocation not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

// ─────────────────────────────────────────────
// 3. Time Off Requests
// ─────────────────────────────────────────────
const createRequest = async (data) => {
  const [employee, type] = await Promise.all([
    Employee.findById(data.employeeId),
    TimeOffType.findById(data.timeOffTypeId),
  ]);

  if (!employee) {
    const err = new Error('Employee does not exist');
    err.statusCode = 400;
    throw err;
  }

  if (!type) {
    const err = new Error('Time off type does not exist');
    err.statusCode = 400;
    throw err;
  }

  if (type.requiresAllocation && !data.allocationId) {
    // Attempt auto-linking to employee's active allocation for this type
    const activeAlloc = await TimeOffAllocation.findOne({
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      status: 'approved',
    });

    if (activeAlloc) {
      data.allocationId = activeAlloc._id;
    } else {
      const err = new Error('Allocation ID is required for this time off type');
      err.statusCode = 400;
      throw err;
    }
  }

  const dFrom = new Date(data.dateFrom);
  const dTo = new Date(data.dateTo);

  if (dTo < dFrom) {
    const err = new Error('End date (dateTo) cannot be before start date (dateFrom)');
    err.statusCode = 400;
    throw err;
  }

  let duration = parseFloat(data.duration);
  if (!duration || duration <= 0) {
    const diffTime = Math.abs(dTo - dFrom);
    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  const request = new TimeOffRequest({
    ...data,
    duration,
    status: data.status || 'submitted',
  });

  const savedRequest = await request.save();

  try {
    await Notification.create({
      recipientRole: 'all_hr',
      type: 'time_off_request',
      title: 'New Leave Request Applied',
      message: `${employee.fullName || 'Employee'} applied for ${type.name || 'time off'} (${duration} day(s)).`,
      timeOffRequestId: savedRequest._id,
    });
  } catch (notifErr) {
    console.warn('Could not create HR notification:', notifErr);
  }

  return savedRequest;
};

const getRequests = async ({ employeeId, status, timeOffTypeId, page = 1, limit = 20, skip = 0 }) => {
  const query = {};

  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;
  if (timeOffTypeId) query.timeOffTypeId = timeOffTypeId;

  const [items, total] = await Promise.all([
    TimeOffRequest.find(query)
      .populate('employeeId', 'fullName employeeCode')
      .populate('timeOffTypeId', 'name unit')
      .populate('allocationId', 'allocatedAmount remainingAmount')
      .populate('approverId', 'email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    TimeOffRequest.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getRequestById = async (id) => {
  const request = await TimeOffRequest.findById(id)
    .populate('employeeId', 'fullName employeeCode')
    .populate('timeOffTypeId', 'name unit')
    .populate('allocationId', 'allocatedAmount remainingAmount')
    .populate('approverId', 'email role');

  if (!request) {
    const err = new Error('Time off request not found');
    err.statusCode = 404;
    throw err;
  }
  return request;
};

const submitRequest = async (id) => {
  const request = await TimeOffRequest.findById(id);
  if (!request) {
    const err = new Error('Time off request not found');
    err.statusCode = 404;
    throw err;
  }

  request.status = 'submitted';
  const savedRequest = await request.save();

  try {
    const emp = await Employee.findById(request.employeeId);
    const typeObj = await TimeOffType.findById(request.timeOffTypeId);
    await Notification.create({
      recipientRole: 'all_hr',
      type: 'time_off_request',
      title: 'New Leave Request Applied',
      message: `${emp ? emp.fullName : 'Employee'} applied for ${typeObj ? typeObj.name : 'time off'} (${request.duration} day(s)).`,
      timeOffRequestId: savedRequest._id,
    });
  } catch (notifErr) {
    console.warn('Could not create HR notification:', notifErr);
  }

  return savedRequest;
};

const approveRequest = async (id, approverId) => {
  const request = await TimeOffRequest.findById(id).populate('timeOffTypeId');
  if (!request) {
    const err = new Error('Time off request not found');
    err.statusCode = 404;
    throw err;
  }

  if (request.status === 'approved') {
    const err = new Error('Time off request has already been approved');
    err.statusCode = 400;
    throw err;
  }

  const type = request.timeOffTypeId;

  if (type && type.requiresAllocation) {
    if (!request.allocationId) {
      // Attempt auto-linking to employee's active allocation for this type
      const activeAlloc = await TimeOffAllocation.findOne({
        employeeId: request.employeeId,
        timeOffTypeId: type._id,
      });

      if (activeAlloc) {
        request.allocationId = activeAlloc._id;
      }
    }

    if (request.allocationId) {
      const allocation = await TimeOffAllocation.findById(request.allocationId);
      if (allocation) {
        allocation.takenAmount += request.duration;
        allocation.remainingAmount = Math.max(0, allocation.allocatedAmount - allocation.takenAmount);
        await allocation.save();
      }
    }
  }

  request.status = 'approved';
  request.approverId = approverId || null;
  const updatedRequest = await request.save();

  try {
    const typeName = type ? type.name : 'Time Off';
    await Notification.create({
      recipientRole: 'employee',
      recipientEmployeeId: request.employeeId,
      type: 'time_off_approved',
      title: 'Leave Request Approved',
      message: `Your request for ${typeName} (${request.duration} day(s)) was APPROVED by HR.`,
      timeOffRequestId: request._id,
    });
  } catch (notifErr) {
    console.warn('Could not create employee notification:', notifErr);
  }

  return updatedRequest;
};

const refuseRequest = async (id, approverId, reason = '') => {
  const request = await TimeOffRequest.findById(id);
  if (!request) {
    const err = new Error('Time off request not found');
    err.statusCode = 404;
    throw err;
  }

  request.status = 'refused';
  request.approverId = approverId || null;
  if (reason) request.reason = reason;

  const updatedRequest = await request.save();

  try {
    const typeObj = await TimeOffType.findById(request.timeOffTypeId);
    const typeName = typeObj ? typeObj.name : 'Time Off';
    await Notification.create({
      recipientRole: 'employee',
      recipientEmployeeId: request.employeeId,
      type: 'time_off_rejected',
      title: 'Leave Request Rejected / Denied',
      message: `Your request for ${typeName} was REJECTED / DENIED by HR.${reason ? ' Reason: ' + reason : ''}`,
      timeOffRequestId: request._id,
    });
  } catch (notifErr) {
    console.warn('Could not create employee notification:', notifErr);
  }

  return updatedRequest;
};

const updateRequest = async (id, data) => {
  const request = await TimeOffRequest.findById(id);
  if (!request) {
    const err = new Error('Time off request not found');
    err.statusCode = 404;
    throw err;
  }

  if (request.status === 'approved' || request.status === 'refused') {
    const err = new Error(`Cannot modify a time off request in '${request.status}' status`);
    err.statusCode = 400;
    throw err;
  }

  return await TimeOffRequest.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteRequest = async (id) => {
  const request = await TimeOffRequest.findById(id);
  if (!request) {
    const err = new Error('Time off request not found');
    err.statusCode = 404;
    throw err;
  }

  if (request.status === 'approved') {
    const err = new Error('Cannot delete an approved time off request');
    err.statusCode = 400;
    throw err;
  }

  await TimeOffRequest.findByIdAndDelete(id);
  return true;
};

module.exports = {
  createTimeOffType,
  getTimeOffTypes,
  getTimeOffTypeById,
  updateTimeOffType,
  deleteTimeOffType,

  createAllocation,
  getAllocations,
  getAllocationById,
  getEmployeeAllocations,
  updateAllocation,
  deleteAllocation,

  createRequest,
  getRequests,
  getRequestById,
  submitRequest,
  approveRequest,
  refuseRequest,
  updateRequest,
  deleteRequest,
};
