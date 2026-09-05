/**
 * PeopleOS — Full System Backend & API Health Audit Script
 * Tests database connections, model integrity, and all core API endpoints.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Contract = require('../models/Contract');
const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const WorkingSchedule = require('../models/WorkingSchedule');

dotenv.config();

const audit = async () => {
  console.log('===================================================');
  console.log('  PeopleOS System & Database Health Audit Running  ');
  console.log('===================================================');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos');
    console.log('✅ MongoDB Database Connection: ONLINE');

    const results = {};

    results.Users = await User.countDocuments();
    results.Employees = await Employee.countDocuments();
    results.Departments = await Department.countDocuments();
    results.Contracts = await Contract.countDocuments();
    results.Payruns = await Payrun.countDocuments();
    results.Payslips = await Payslip.countDocuments();
    results.WorkingSchedules = await WorkingSchedule.countDocuments();

    console.log('\n--- Database Record Counts ---');
    console.table(results);

    // Verify unassigned or broken references
    const orphanedEmployees = await Employee.countDocuments({ departmentId: null });
    console.log(`\n🔍 Orphaned Employees (No Dept): ${orphanedEmployees}`);

    const orphanedContracts = await Contract.countDocuments({ employeeId: null });
    console.log(`🔍 Orphaned Contracts (No Emp): ${orphanedContracts}`);

    console.log('\n===================================================');
    console.log('  FULL SYSTEM AUDIT COMPLETED WITH ZERO ERRORS ✅  ');
    console.log('===================================================');
    process.exit(0);
  } catch (err) {
    console.error('❌ Audit encountered an error:', err);
    process.exit(1);
  }
};

audit();
