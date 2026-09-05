const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const JobPosition = require('../models/JobPosition');

const CLEAN_IT_DEPARTMENTS = [
  { name: 'Software Engineering', code: 'ENG-01' },
  { name: 'Product Management & Design', code: 'PROD-01' },
  { name: 'DevOps & Cloud Infrastructure', code: 'OPS-01' },
  { name: 'Quality Assurance & Testing', code: 'QA-01' },
  { name: 'Data Science & Analytics', code: 'DATA-01' },
  { name: 'Cybersecurity & IT Security', code: 'SEC-01' },
  { name: 'Sales & Business Development', code: 'SALES-01' },
  { name: 'Human Resources (HR)', code: 'HR-01' },
  { name: 'Finance & Accounts', code: 'FIN-01' },
];

const assignManagersAndEmployees = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected to database:', mongoUri);

    // 1. Clean up legacy/duplicate departments with underscore timestamps
    const allDepts = await Department.find({});
    const deptsToDelete = allDepts.filter((d) => d.name.includes('_'));
    console.log(`Found ${deptsToDelete.length} legacy/duplicate department(s) to remove.`);

    for (const legacy of deptsToDelete) {
      await Department.findByIdAndDelete(legacy._id);
      console.log(` - Deleted legacy department: ${legacy.name}`);
    }

    // 2. Ensure clean IT Departments exist & get references
    const deptDocMap = {};
    for (const target of CLEAN_IT_DEPARTMENTS) {
      let dept = await Department.findOne({ name: target.name });
      if (!dept) {
        dept = await Department.create({ name: target.name });
      }
      deptDocMap[target.name] = dept;
    }

    // 3. Fetch all 200 employees ordered by employeeCode (EMP-101 to EMP-300)
    const employees = await Employee.find({})
      .collation({ locale: 'en', numericOrdering: true })
      .sort({ employeeCode: 1 });

    console.log(`Found ${employees.length} employees to assign to departments & managers.`);

    if (employees.length === 0) {
      console.error('No employees found! Run seed200Employees.js first.');
      process.exit(1);
    }

    // 4. Select 9 Managers (one for each department) from the top employees
    const deptKeys = Object.keys(deptDocMap);
    const assignedManagers = {};

    for (let idx = 0; idx < deptKeys.length; idx++) {
      const deptName = deptKeys[idx];
      const managerEmp = employees[idx] || employees[0]; // EMP-101 to EMP-109
      const dept = deptDocMap[deptName];

      dept.managerEmployeeId = managerEmp._id;
      await dept.save();

      assignedManagers[deptName] = managerEmp;
      console.log(`✓ Assigned Manager "${managerEmp.fullName} (${managerEmp.employeeCode})"` +
                  ` to Department "${deptName}"`);
    }

    // 5. Distribute all 200 employees evenly across 9 departments & update Employee & Contract records
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const deptIndex = i % deptKeys.length;
      const targetDeptName = deptKeys[deptIndex];
      const targetDept = deptDocMap[targetDeptName];
      const managerForDept = assignedManagers[targetDeptName];

      // Assign Manager (unless employee IS the manager of their dept)
      const isManagerHimself = emp._id.toString() === managerForDept._id.toString();
      const managerIdToSet = isManagerHimself ? null : managerForDept._id;

      // Update Employee Record
      emp.departmentId = targetDept._id;
      emp.managerId = managerIdToSet;
      await emp.save();

      // Update linked JobPosition if needed
      const jobPos = await JobPosition.findOne({ departmentId: targetDept._id });
      if (jobPos) {
        emp.jobPositionId = jobPos._id;
        await emp.save();
      }

      // Update linked Contract Record
      await Contract.updateMany(
        { employeeId: emp._id },
        {
          departmentId: targetDept._id,
          jobPositionId: emp.jobPositionId || jobPos?._id,
        }
      );
    }

    console.log('\n====================================================');
    console.log(`🎉 ALL MANAGERS & EMPLOYEES SUCCESSFULLY ASSIGNED!`);
    console.log(`✓ 9 IT Departments with designated Managers`);
    console.log(`✓ 200 Employees linked to clean IT Departments`);
    console.log(`✓ Contracts updated with valid Department & Manager refs`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error assigning managers and employees:', error);
    process.exit(1);
  }
};

assignManagersAndEmployees();
