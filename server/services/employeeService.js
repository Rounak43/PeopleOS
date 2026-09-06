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
const { generateEmployeeCode } = require('./employeeIdService');

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
    if (data.departmentId && jobPos.departmentId.toString() !== data.departmentId.toString()) {
      const err = new Error('Selected job position does not belong to the selected department');
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
  const contractData = data.contract || null;

  // Build clean employee payload — strip contract sub-document
  const employeePayload = { ...data };
  delete employeePayload.contract;

  // ==============================================================
  // EMPLOYEE CODE: Always backend-generated. NEVER trust the client.
  // Remove any frontend-submitted employeeCode entirely.
  // ==============================================================
  delete employeePayload.employeeCode;

  // Validate required references first (department must exist + have a code)
  await validateEmployeeReferences(employeePayload);

  // Resolve department to get its code for ID generation
  const department = await Department.findById(employeePayload.departmentId);
  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 400;
    throw err;
  }

  if (!department.code) {
    const err = new Error(
      `Department "${department.name}" does not have a department code assigned. ` +
      `Please update the department with a valid 2-character code before onboarding employees.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Determine the year from dateJoined (or today if not provided)
  const joinDate = employeePayload.dateJoined
    ? new Date(employeePayload.dateJoined)
    : new Date();

  const joinYear = joinDate.getFullYear();

  // ==============================================================
  // ATOMIC ID GENERATION
  // Format: OSYYDDNNN (e.g. OS26CY010)
  // ==============================================================
  const generatedCode = await generateEmployeeCode(joinYear, department.code);
  employeePayload.employeeCode = generatedCode;

  // Check email uniqueness
  const existingEmail = await Employee.findOne({ email: employeePayload.email });
  if (existingEmail) {
    const err = new Error(`Employee email '${employeePayload.email}' already exists`);
    err.statusCode = 400;
    throw err;
  }

  const employee = new Employee(employeePayload);
  const savedEmployee = await employee.save();

  // Auto-provision User login account for newly onboarded employee
  try {
    const User = require('../models/User');
    const { hashPassword } = require('../utils/password');
    const existingUser = await User.findOne({ email: savedEmployee.email.toLowerCase() });
    if (!existingUser) {
      const passwordHash = hashPassword('password123');
      const newUser = await User.create({
        email: savedEmployee.email.toLowerCase(),
        passwordHash,
        role: 'employee',
        employeeId: savedEmployee._id,
        isActive: true,
      });
      savedEmployee.userId = newUser._id;
      await savedEmployee.save();
    }
  } catch (userErr) {
    console.error('Non-critical: User account auto-provisioning warning:', userErr.message);
  }

  // ALWAYS provision an active contract so newly created employees are ready for payroll
  try {
    const contractService = require('./contractService');
    const defaultStartDate = contractData?.startDate
      ? new Date(contractData.startDate)
      : (savedEmployee.dateJoined ? new Date(savedEmployee.dateJoined) : new Date());

    const savedContract = await contractService.createContract({
      employeeId: savedEmployee._id,
      departmentId: savedEmployee.departmentId,
      jobPositionId: savedEmployee.jobPositionId,
      workingScheduleId: contractData?.workingScheduleId || savedEmployee.workingScheduleId || null,
      startDate: defaultStartDate,
      endDate: contractData?.endDate || null,
      durationType: contractData?.durationType || 'Permanent',
      wage: contractData?.wage !== undefined ? Number(contractData.wage) : 50000,
      wageFrequency: contractData?.wageFrequency || 'Monthly',
      salaryStructureId: contractData?.salaryStructureId || null,
      workLocation: contractData?.workLocation || 'Hybrid (3 Days Office)',
      probationPeriodMonths: Number(contractData?.probationPeriodMonths ?? 3),
      noticePeriodDays: Number(contractData?.noticePeriodDays ?? 30),
      overtimeAllowed: contractData?.overtimeAllowed !== undefined ? Boolean(contractData.overtimeAllowed) : true,
      status: 'active',
    });

    const result = savedEmployee.toObject();
    result.contract = savedContract;
    return result;
  } catch (contractErr) {
    console.error('Non-critical: Contract auto-provision warning:', contractErr.message);
  }

  return savedEmployee;
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
      .populate('departmentId', 'name code')
      .populate('jobPositionId', 'title')
      .populate('managerId', 'fullName employeeCode')
      .populate('workingScheduleId', 'name totalWeeklyHours')
      .populate('userId', 'email role isActive')
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ employeeCode: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getEmployeeById = async (id) => {
  const employee = await Employee.findById(id)
    .populate('departmentId', 'name code')
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
  // ==============================================================
  // EMPLOYEE CODE IS IMMUTABLE — reject any attempt to change it
  // ==============================================================
  if (data.employeeCode !== undefined) {
    const currentEmployee = await Employee.findById(id);
    if (currentEmployee && data.employeeCode !== currentEmployee.employeeCode) {
      const err = new Error(
        `Employee code "${currentEmployee.employeeCode}" cannot be changed once assigned. ` +
        `Employee codes are permanent identifiers in PeopleOS.`
      );
      err.statusCode = 400;
      throw err;
    }
    // Remove from payload regardless — never allow client to set it
    delete data.employeeCode;
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
    .populate('departmentId', 'name code')
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
