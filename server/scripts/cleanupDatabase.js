/**
 * Database Cleanup Script
 * Retains ONLY Elena Rostova, Samarth Suryavamshi, and Admin user.
 * Deletes all other sample data seeds.
 */
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Contract = require('../models/Contract');
const Attendance = require('../models/Attendance');
const TimeOffRequest = require('../models/TimeOffRequest');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const { hashPassword } = require('../utils/password');

const runCleanup = async () => {
  console.log('--- Connecting to MongoDB ---');
  await mongoose.connect('mongodb://localhost:27017/peopleos');
  console.log('Connected! Starting Database Cleanup...');

  const keepEmpEmails = ['elena.r@peopleos.local', 'samarth.s@peopleos.local'];
  const keepUserEmails = ['admin@peopleos.local', 'elena.r@peopleos.local', 'samarth.s@peopleos.local'];

  // Find employees to keep
  const empsToKeep = await Employee.find({ email: { $in: keepEmpEmails } });
  const keepEmpIds = empsToKeep.map((e) => e._id);

  console.log('Keeping Employees:', empsToKeep.map((e) => `${e.fullName} (${e.email})`));

  // Delete all other employees
  const delEmps = await Employee.deleteMany({ _id: { $nin: keepEmpIds } });
  console.log(`Deleted ${delEmps.deletedCount} employee(s).`);

  // Delete all other users
  const delUsers = await User.deleteMany({ email: { $nin: keepUserEmails } });
  console.log(`Deleted ${delUsers.deletedCount} user(s).`);

  // Delete related data for deleted employees
  const delContracts = await Contract.deleteMany({ employeeId: { $nin: keepEmpIds } });
  console.log(`Deleted ${delContracts.deletedCount} contract(s).`);

  const delAttendance = await Attendance.deleteMany({ employeeId: { $nin: keepEmpIds } });
  console.log(`Deleted ${delAttendance.deletedCount} attendance record(s).`);

  const delTimeOff = await TimeOffRequest.deleteMany({ employeeId: { $nin: keepEmpIds } });
  console.log(`Deleted ${delTimeOff.deletedCount} time off request(s).`);

  const delAlloc = await TimeOffAllocation.deleteMany({ employeeId: { $nin: keepEmpIds } });
  console.log(`Deleted ${delAlloc.deletedCount} time off allocation(s).`);

  const delPayslips = await Payslip.deleteMany({ employee: { $nin: keepEmpIds } });
  console.log(`Deleted ${delPayslips.deletedCount} payslip(s).`);

  // Clear old payruns
  await Payrun.deleteMany({});
  console.log('Cleared all payrun batches.');

  // Reset password to 'password123' for remaining accounts
  const defaultPasswordHash = await hashPassword('password123');
  await User.updateMany({ email: { $in: keepUserEmails } }, { password: defaultPasswordHash });
  console.log('Updated passwords for retained accounts to "password123".');

  // Verify remaining data
  const finalEmps = await Employee.find();
  const finalUsers = await User.find().select('-password');

  console.log('\n--- RETAINED EMPLOYEES ---');
  console.log(JSON.stringify(finalEmps.map((e) => ({ id: e._id, name: e.fullName, code: e.employeeCode, email: e.email })), null, 2));

  console.log('\n--- RETAINED USERS & LOGINS ---');
  console.log(JSON.stringify(finalUsers.map((u) => ({ id: u._id, email: u.email, role: u.role, employeeId: u.employeeId })), null, 2));

  process.exit(0);
};

runCleanup().catch((err) => {
  console.error('Cleanup Error:', err);
  process.exit(1);
});
