/**
 * PeopleOS — Master Seed Script (100+ Employees + August & September Payroll Batches + Varied Attendance + Time Off Requests)
 *
 * Seeds 115+ Employees across ALL departments.
 * Every employee gets:
 * 1. User login account with password "password123"
 * 2. Active Employment Contract with Salary Structure
 * 3. 30 Days of VARIED Attendance Records (Present, Late, Overtime, Absent, Missing Checkout)
 * 4. Time Off Allocations & Live Employee Time Off Requests sent to HR
 * 5. Historical Paid Payslips for August 2026 AND September 2026
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const User = require('../models/User');
const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const SalaryStructure = require('../models/SalaryStructure');
const WorkingSchedule = require('../models/WorkingSchedule');
const Attendance = require('../models/Attendance');
const TimeOffType = require('../models/TimeOffType');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const TimeOffRequest = require('../models/TimeOffRequest');
const Notification = require('../models/Notification');
const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');
const { hashPassword } = require('../utils/password');
const { generateEmployeeCode } = require('../services/employeeIdService');

// ─────────────────────────────────────────────────────────────
// Master Name & Data Pools
// ─────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Neha', 'Amit', 'Sneha', 'Karan', 'Pooja',
  'Aditya', 'Riya', 'Rahul', 'Kavya', 'Siddharth', 'Ishita', 'Varun', 'Meera', 'Dev', 'Shreya',
  'Arjun', 'Tanvi', 'Manish', 'Divya', 'Deepak', 'Swati', 'Rajesh', 'Ankita', 'Nikhil', 'Bhavna',
  'Gaurav', 'Simran', 'Sanjay', 'Tarun', 'Nisha', 'Abhishek', 'Pallavi', 'Akash', 'Komal', 'Harsh',
  'Preeti', 'Kunal', 'Rashmi', 'Vivek', 'Shruti', 'Saurabh', 'Sakshi', 'Mayank', 'Rachna', 'Yash',
  'Aarti', 'Alok', 'Deepika', 'Rohit', 'Geeta', 'Sachin', 'Monika', 'Sunil', 'Kiran', 'Pankaj',
  'Sameer', 'Nandini', 'Rishabh', 'Tarini', 'Pranav', 'Payal', 'Ishan', 'Anjali', 'Yogesh', 'Bhakti',
  'Siddhesh', 'Gargi', 'Chinmay', 'Esha', 'Tushar', 'Aditi', 'Ritesh', 'Archana', 'Naveen', 'Chitra',
  'Kartik', 'Sonia', 'Manav', 'Vandana', 'Harshit', 'Smriti', 'Utkarsh', 'Richa', 'Shashank', 'Meenal'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Nair', 'Patel', 'Singh', 'Trivedi', 'Joshi', 'Mehta', 'Kumar',
  'Reddy', 'Chaudhary', 'Iyer', 'Deshmukh', 'Saxena', 'Kapoor', 'Bhat', 'Rao', 'Agarwal', 'Puri',
  'Kulkarni', 'Mishra', 'Pandey', 'Sen', 'Banerjee', 'Dutta', 'Das', 'Roy', 'Chatterjee', 'Ghosh',
  'Mukherjee', 'Thakur', 'Chauhan', 'Rathore', 'Solanki', 'Yadav', 'Shetty', 'Hegde', 'Gowda', 'Menon',
  'Pillai', 'Nambiar', 'Bhattacharya', 'Chakraborty', 'Mahajan', 'Kashyap', 'Chawla', 'Sood', 'Bhasin'
];

const DEPARTMENT_STRUCTURE = [
  { name: 'Software Engineering', code: 'SE', positions: ['Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'Senior Software Engineer', 'Tech Lead'] },
  { name: 'DevOps & Cloud Infrastructure', code: 'DC', positions: ['DevOps Engineer', 'Cloud Solutions Architect', 'Site Reliability Engineer', 'System Administrator'] },
  { name: 'Quality Assurance (QA)', code: 'QA', positions: ['QA Automation Engineer', 'Manual Test Engineer', 'QA Lead'] },
  { name: 'Product & Design', code: 'PD', positions: ['Product Manager', 'UI/UX Designer', 'Technical Product Owner'] },
  { name: 'Data & AI', code: 'DA', positions: ['Data Engineer', 'AI / Machine Learning Engineer', 'Data Analyst'] },
  { name: 'Human Resources (HR)', code: 'HR', positions: ['HR Manager', 'Tech Recruiter', 'HR Operations Executive', 'Employee Experience Specialist'] },
  { name: 'Finance & Accounts', code: 'FA', positions: ['Finance Manager', 'Senior Accountant', 'Payroll & Accounts Executive'] },
  { name: 'Sales & Business Development', code: 'SB', positions: ['Sales Manager', 'Business Development Executive', 'Account Executive'] },
  { name: 'IT Support & Cybersecurity', code: 'IT', positions: ['IT Support Specialist', 'Cybersecurity Analyst', 'Network Administrator'] },
  { name: 'Marketing & Operations', code: 'MO', positions: ['Growth Marketing Manager', 'Content Strategist', 'Operations Coordinator'] },
];

const WORK_LOCATIONS = ['Hybrid (3 Days Office)', 'On-site (Full Office)', 'Full Remote (WFH)'];
const BANKS = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India', 'Kotak Mahindra Bank'];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const runMasterSeed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('\n====================================================');
    console.log('🚀 STARTING MASTER SEED (100+ EMPLOYEES + VARIED ATTENDANCE + TIME OFF)');
    console.log('====================================================\n');

    const defaultPasswordHash = hashPassword('password123');

    // ─────────────────────────────────────────────────────────────
    // Step 1: Ensure Departments & Job Positions Exist
    // ─────────────────────────────────────────────────────────────
    console.log('📦 Step 1: Seeding Departments and Job Positions...');
    const deptDocMap = {};
    const posDocMap = {};

    for (const dSpec of DEPARTMENT_STRUCTURE) {
      let dept = await Department.findOne({ code: dSpec.code });
      if (!dept) {
        dept = await Department.create({ name: dSpec.name, code: dSpec.code });
      } else if (dept.name !== dSpec.name) {
        dept.name = dSpec.name;
        await dept.save();
      }
      deptDocMap[dSpec.code] = dept;

      for (const posTitle of dSpec.positions) {
        let pos = await JobPosition.findOne({ title: posTitle, departmentId: dept._id });
        if (!pos) {
          pos = await JobPosition.create({ title: posTitle, departmentId: dept._id });
        }
        if (!posDocMap[dSpec.code]) posDocMap[dSpec.code] = [];
        posDocMap[dSpec.code].push(pos);
      }
    }
    console.log(`✓ 10 Departments verified/created.`);

    // ─────────────────────────────────────────────────────────────
    // Step 2: Ensure Salary Structures & Working Schedules Exist
    // ─────────────────────────────────────────────────────────────
    console.log('\n📦 Step 2: Seeding Salary Structures & Working Schedules...');
    let defaultStructure = await SalaryStructure.findOne({ code: 'IT_DEV_STD' });
    if (!defaultStructure) {
      defaultStructure = await SalaryStructure.create({
        name: 'IT Software Engineer Standard Structure',
        code: 'IT_DEV_STD',
        description: 'Standard IT package with Basic, HRA, Special Allowance, PF, and Tax.',
      });
    }

    let defaultSchedule = await WorkingSchedule.findOne({ name: { $regex: /Morning Shift/i } });
    if (!defaultSchedule) {
      defaultSchedule = await WorkingSchedule.create({
        name: 'Morning Shift (Mon-Fri, 9:00 AM - 6:00 PM)',
        type: 'full_time',
        totalWeeklyHours: 40,
        lines: [
          { dayOfWeek: 'monday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 'tuesday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 'wednesday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 'thursday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
          { dayOfWeek: 'friday', startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
        ],
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Step 3: Ensure Time Off Types Exist
    // ─────────────────────────────────────────────────────────────
    console.log('\n📦 Step 3: Seeding Time Off Types...');
    let paidLeaveType = await TimeOffType.findOne({ name: 'Paid Leave' });
    if (!paidLeaveType) {
      paidLeaveType = await TimeOffType.create({ name: 'Paid Leave', unit: 'days', requiresAllocation: true, approvalRequired: true, affectsPayroll: true });
    }
    let sickLeaveType = await TimeOffType.findOne({ name: 'Sick Leave' });
    if (!sickLeaveType) {
      sickLeaveType = await TimeOffType.create({ name: 'Sick Leave', unit: 'days', requiresAllocation: true, approvalRequired: true, affectsPayroll: true });
    }
    let casualLeaveType = await TimeOffType.findOne({ name: 'Casual Leave' });
    if (!casualLeaveType) {
      casualLeaveType = await TimeOffType.create({ name: 'Casual Leave', unit: 'days', requiresAllocation: true, approvalRequired: true, affectsPayroll: true });
    }

    // ─────────────────────────────────────────────────────────────
    // Step 4: Seed 115 Employees across all departments
    // ─────────────────────────────────────────────────────────────
    console.log('\n👥 Step 4: Seeding 115+ Employees with Users, Contracts, & Allocations...');

    const PRESERVED_PROFILES = [
      {
        fullName: 'Elena Rostova',
        email: 'elena.r@peopleos.local',
        deptCode: 'HR',
        posTitle: 'HR Manager',
        role: 'hr_manager',
        wage: 110000,
      },
      {
        fullName: 'Samarth Sharma',
        email: 'samarth.s@peopleos.local',
        deptCode: 'SE',
        posTitle: 'Full Stack Developer',
        role: 'employee',
        wage: 75000,
      },
      {
        fullName: 'System Administrator',
        email: 'admin@peopleos.local',
        deptCode: 'IT',
        posTitle: 'IT Support Specialist',
        role: 'admin',
        wage: 120000,
      },
    ];

    const seededEmployeeList = [];
    const seededContractList = [];
    const allocationMap = {};
    let managerRefId = null;

    for (const p of PRESERVED_PROFILES) {
      const dept = deptDocMap[p.deptCode];
      const pos = (posDocMap[p.deptCode] || []).find((x) => x.title === p.posTitle) || posDocMap[p.deptCode][0];

      let employee = await Employee.findOne({ email: p.email.toLowerCase() });
      if (!employee) {
        const empCode = await generateEmployeeCode(2026, dept.code);
        employee = await Employee.create({
          fullName: p.fullName,
          email: p.email.toLowerCase(),
          phone: '+91 9876543210',
          address: 'Building 4, PeopleOS HQ, Tech City',
          dateJoined: new Date(2025, 0, 15),
          employeeCode: empCode,
          departmentId: dept._id,
          jobPositionId: pos._id,
          status: 'active',
          bankDetails: { accountNo: '998877665544', bankName: 'HDFC Bank' },
        });
      }
      if (p.email.includes('elena')) managerRefId = employee._id;

      let user = await User.findOne({ email: p.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          email: p.email.toLowerCase(),
          passwordHash: defaultPasswordHash,
          role: p.role,
          employeeId: employee._id,
          isActive: true,
        });
      } else {
        user.passwordHash = defaultPasswordHash;
        user.role = p.role;
        user.employeeId = employee._id;
        await user.save();
      }

      employee.userId = user._id;
      await employee.save();

      let contract = await Contract.findOne({ employeeId: employee._id });
      if (!contract) {
        contract = await Contract.create({
          employeeId: employee._id,
          contractCode: `CTR-SPEC-${employee.employeeCode}`,
          startDate: employee.dateJoined,
          durationType: 'Permanent',
          departmentId: dept._id,
          jobPositionId: pos._id,
          wage: p.wage,
          wageFrequency: 'Monthly',
          salaryStructureId: defaultStructure._id,
          workingScheduleId: defaultSchedule._id,
          workLocation: 'Hybrid (3 Days Office)',
          probationPeriodMonths: 3,
          noticePeriodDays: 30,
          status: 'active',
        });
      }

      let alloc = await TimeOffAllocation.findOne({ employeeId: employee._id, timeOffTypeId: paidLeaveType._id });
      if (!alloc) {
        alloc = await TimeOffAllocation.create({
          employeeId: employee._id,
          timeOffTypeId: paidLeaveType._id,
          allocatedAmount: 20,
          takenAmount: 2,
          remainingAmount: 18,
          status: 'approved',
        });
      }
      allocationMap[employee._id.toString()] = alloc;

      seededEmployeeList.push(employee);
      seededContractList.push(contract);
    }

    const TARGET_EMPLOYEES = 115;
    const totalToGenerate = TARGET_EMPLOYEES - seededEmployeeList.length;

    for (let i = 1; i <= totalToGenerate; i++) {
      const dSpec = DEPARTMENT_STRUCTURE[(i - 1) % DEPARTMENT_STRUCTURE.length];
      const dept = deptDocMap[dSpec.code];
      const pos = getRandomItem(posDocMap[dSpec.code]);

      const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i - 1) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@peopleos.local`;
      const phone = `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;
      const address = `Apartment ${Math.floor(Math.random() * 80 + 1)}, Sector ${Math.floor(Math.random() * 90 + 1)}, Tech City`;

      let employee = await Employee.findOne({ email: email.toLowerCase() });
      if (!employee) {
        const dateJoined = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28 + 1));
        const empCode = await generateEmployeeCode(dateJoined.getFullYear(), dept.code);

        employee = await Employee.create({
          fullName,
          email: email.toLowerCase(),
          phone,
          address,
          dateJoined,
          employeeCode: empCode,
          departmentId: dept._id,
          jobPositionId: pos._id,
          managerId: managerRefId,
          status: 'active',
          bankDetails: {
            accountNo: `${Math.floor(100000000000 + Math.random() * 899999999999)}`,
            bankName: getRandomItem(BANKS),
          },
        });
      }

      const isHR = dSpec.code === 'HR';
      const role = isHR ? 'hr_manager' : 'employee';

      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await User.create({
          email: email.toLowerCase(),
          passwordHash: defaultPasswordHash,
          role,
          employeeId: employee._id,
          isActive: true,
        });
      } else {
        user.passwordHash = defaultPasswordHash;
        await user.save();
      }

      employee.userId = user._id;
      await employee.save();

      const monthlyWage = Math.floor(Math.random() * 75000 + 40000);
      let contract = await Contract.findOne({ employeeId: employee._id });
      if (!contract) {
        contract = await Contract.create({
          employeeId: employee._id,
          contractCode: `CTR-${String(i).padStart(3, '0')}`,
          startDate: employee.dateJoined,
          durationType: 'Permanent',
          departmentId: dept._id,
          jobPositionId: pos._id,
          wage: monthlyWage,
          wageFrequency: 'Monthly',
          salaryStructureId: defaultStructure._id,
          workingScheduleId: defaultSchedule._id,
          workLocation: getRandomItem(WORK_LOCATIONS),
          probationPeriodMonths: 3,
          noticePeriodDays: 30,
          status: 'active',
        });
      }

      let alloc = await TimeOffAllocation.findOne({ employeeId: employee._id, timeOffTypeId: paidLeaveType._id });
      if (!alloc) {
        alloc = await TimeOffAllocation.create({
          employeeId: employee._id,
          timeOffTypeId: paidLeaveType._id,
          allocatedAmount: 20,
          takenAmount: 2,
          remainingAmount: 18,
          status: 'approved',
        });
      }
      allocationMap[employee._id.toString()] = alloc;

      await TimeOffAllocation.updateOne(
        { employeeId: employee._id, timeOffTypeId: sickLeaveType._id },
        { $setOnInsert: { allocatedAmount: 10, takenAmount: 1, remainingAmount: 9, status: 'approved' } },
        { upsert: true }
      );

      seededEmployeeList.push(employee);
      seededContractList.push(contract);

      if (i % 25 === 0 || i === totalToGenerate) {
        console.log(`  ✓ Processed ${seededEmployeeList.length} / ${TARGET_EMPLOYEES} Employees...`);
      }
    }

    console.log(`✓ Total Employees Seeded: ${seededEmployeeList.length}`);

    // ─────────────────────────────────────────────────────────────
    // Step 5: Seed VARIED 30 Days Attendance for all employees
    // ─────────────────────────────────────────────────────────────
    console.log('\n📅 Step 5: Seeding VARIED 30 Days Attendance (Present, Late, Overtime, Absent)...');
    await Attendance.deleteMany({});

    const now = new Date();
    const attendanceRecords = [];

    for (let dayOffset = 1; dayOffset <= 25; dayOffset++) {
      const workDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOffset);
      const dayOfWeek = workDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (let idx = 0; idx < seededEmployeeList.length; idx++) {
        const emp = seededEmployeeList[idx];

        // Pseudo-random deterministic roll based on employee index and day offset
        const roll = (idx * 7 + dayOffset * 13) % 100;

        let checkIn, checkOut, workedHours, status, notes;

        if (roll < 75) {
          // 75% Present - Normal Work Hours (8.5 hrs)
          checkIn = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate(), 9, 0, 0);
          checkOut = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate(), 17, 30, 0);
          workedHours = 8.5;
          status = 'present';
          notes = 'Standard Working Hours';
        } else if (roll < 87) {
          // 12% Late Arrival (10:15 AM - 6:00 PM, 7.75 hrs)
          checkIn = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate(), 10, 15, 0);
          checkOut = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate(), 18, 0, 0);
          workedHours = 7.75;
          status = 'late';
          notes = 'Late arrival due to traffic';
        } else if (roll < 95) {
          // 8% Overtime Shift (9:00 AM - 9:30 PM, 12.5 hrs)
          checkIn = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate(), 9, 0, 0);
          checkOut = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate(), 21, 30, 0);
          workedHours = 12.5;
          status = 'overtime';
          notes = 'Project release overtime shift';
        } else if (roll < 98) {
          // 3% Absent
          checkIn = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate(), 0, 0, 0);
          checkOut = null;
          workedHours = 0;
          status = 'absent';
          notes = 'Unplanned absence';
        } else {
          // 2% Missing Checkout
          checkIn = new Date(workDate.getFullYear(), workDate.getMonth(), workDate.getDate(), 9, 0, 0);
          checkOut = null;
          workedHours = 0;
          status = 'missing_checkout';
          notes = 'Employee forgot to check out';
        }

        attendanceRecords.push({
          employeeId: emp._id,
          checkIn,
          checkOut,
          workedHours,
          status,
          notes,
        });
      }
    }

    for (let b = 0; b < attendanceRecords.length; b += 500) {
      const batch = attendanceRecords.slice(b, b + 500);
      await Attendance.insertMany(batch, { ordered: false }).catch(() => {});
    }
    console.log(`✓ Varied attendance records populated (${attendanceRecords.length} entries).`);

    // ─────────────────────────────────────────────────────────────
    // Step 5.5: Seed Time Off Requests & HR Notifications
    // ─────────────────────────────────────────────────────────────
    console.log('\n✉️ Step 5.5: Seeding Employee Time Off Requests to HR...');
    await TimeOffRequest.deleteMany({});
    await Notification.deleteMany({ recipientRole: 'all_hr' });

    const LEAVE_REASONS = [
      'Medical checkup and doctor appointment',
      'Personal family emergency and travel',
      'Annual vacation and rest leave',
      'Attending technical developer conference',
      'Home maintenance and relocation',
    ];

    const timeOffRequestsToCreate = [];
    const notificationsToCreate = [];

    // Create 20 requests across random non-HR employees
    for (let r = 1; r <= 20; r++) {
      const empIndex = (r * 5) % seededEmployeeList.length;
      const emp = seededEmployeeList[empIndex];
      const alloc = allocationMap[emp._id.toString()];

      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (r % 10) - 2);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + (r % 3 + 1));
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Status distribution: 10 submitted (pending HR review), 6 approved, 4 refused
      let reqStatus = 'submitted';
      if (r > 10 && r <= 16) reqStatus = 'approved';
      if (r > 16) reqStatus = 'refused';

      const reasonText = LEAVE_REASONS[r % LEAVE_REASONS.length];

      const reqDoc = {
        employeeId: emp._id,
        timeOffTypeId: paidLeaveType._id,
        allocationId: alloc ? alloc._id : null,
        dateFrom: startDate,
        dateTo: endDate,
        duration,
        status: reqStatus,
        reason: reasonText,
      };
      timeOffRequestsToCreate.push(reqDoc);
    }

    const savedRequests = await TimeOffRequest.insertMany(timeOffRequestsToCreate);

    // Create HR Notifications for pending requests
    for (const sReq of savedRequests) {
      if (sReq.status === 'submitted') {
        const emp = seededEmployeeList.find((e) => e._id.toString() === sReq.employeeId.toString());
        notificationsToCreate.push({
          recipientRole: 'all_hr',
          type: 'time_off_request',
          title: 'New Leave Request Submitted',
          message: `${emp?.fullName || 'Employee'} submitted a Paid Leave request for ${sReq.duration} day(s).`,
          timeOffRequestId: sReq._id,
          read: false,
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }
    console.log(`✓ ${savedRequests.length} Time Off Requests created (${notificationsToCreate.length} pending HR notifications).`);

    // ─────────────────────────────────────────────────────────────
    // Step 6: Create Paid Payrun Batches for August 2026 & September 2026
    // ─────────────────────────────────────────────────────────────
    console.log('\n💰 Step 6: Creating Paid Payruns & Payslips for August 2026 AND September 2026...');

    await Payrun.deleteMany({});
    await Payslip.deleteMany({});

    const PAYRUN_PERIODS = [
      {
        name: 'August 2026 Monthly Payroll',
        periodStart: new Date(2026, 7, 1, 0, 0, 0, 0),
        periodEnd: new Date(2026, 7, 31, 23, 59, 59, 999),
        state: 'Paid',
      },
      {
        name: 'September 2026 Monthly Payroll',
        periodStart: new Date(2026, 8, 1, 0, 0, 0, 0),
        periodEnd: new Date(2026, 8, 30, 23, 59, 59, 999),
        state: 'Paid',
      },
    ];

    const payrunEmployeesRef = seededEmployeeList.map((emp, idx) => ({
      employee: emp._id,
      contract: seededContractList[idx]._id,
    }));

    for (const pConfig of PAYRUN_PERIODS) {
      const payrun = await Payrun.create({
        name: pConfig.name,
        periodStart: pConfig.periodStart,
        periodEnd: pConfig.periodEnd,
        salaryStructureId: defaultStructure._id,
        state: pConfig.state,
        paymentDate: new Date(),
        employees: payrunEmployeesRef,
        notes: `Finalized payroll batch for ${pConfig.name}.`,
        paidAt: new Date(),
      });

      let totalBatchGross = 0;
      let totalBatchDeductions = 0;
      let totalBatchNet = 0;
      const payslipDocs = [];

      for (let idx = 0; idx < seededEmployeeList.length; idx++) {
        const emp = seededEmployeeList[idx];
        const ctr = seededContractList[idx];

        const monthlyWage = ctr.wage || 60000;
        const basicPay = Math.round(monthlyWage * 0.5);
        const hra = Math.round(monthlyWage * 0.25);
        const specialAllowance = Math.round(monthlyWage * 0.25);
        const grossPay = basicPay + hra + specialAllowance;

        const pfDeduction = Math.round(basicPay * 0.12);
        const taxDeduction = Math.round(grossPay * 0.05);
        const totalDeductions = pfDeduction + taxDeduction;
        const netPay = grossPay - totalDeductions;

        totalBatchGross += grossPay;
        totalBatchDeductions += totalDeductions;
        totalBatchNet += netPay;

        const lines = [
          { code: 'BASIC', name: 'Basic Salary', category: 'Basic', sequence: 10, amount: basicPay },
          { code: 'HRA', name: 'House Rent Allowance', category: 'Allowance', sequence: 20, amount: hra },
          { code: 'SPECIAL', name: 'Special Allowance', category: 'Allowance', sequence: 30, amount: specialAllowance },
          { code: 'PF', name: 'Provident Fund (PF)', category: 'Deduction', sequence: 40, amount: pfDeduction },
          { code: 'TAX', name: 'Professional Tax', category: 'Deduction', sequence: 50, amount: taxDeduction },
          { code: 'NET', name: 'Net Payable Salary', category: 'Net', sequence: 100, amount: netPay },
        ];

        payslipDocs.push({
          payrun: payrun._id,
          employee: emp._id,
          contract: ctr._id,
          salaryStructureId: defaultStructure._id,
          employeeNameSnapshot: emp.fullName,
          employeeCodeSnapshot: emp.employeeCode,
          wageSnapshot: monthlyWage,
          salaryStructureNameSnapshot: defaultStructure.name,
          periodStart: pConfig.periodStart,
          periodEnd: pConfig.periodEnd,
          workedDays: 22,
          regularHours: 176,
          overtimeHours: 0,
          grossPay,
          totalDeductions,
          netPay,
          state: 'Paid',
          paymentDate: new Date(),
          lines,
        });
      }

      await Payslip.insertMany(payslipDocs);

      payrun.summary = {
        totalGross: totalBatchGross,
        totalDeductions: totalBatchDeductions,
        totalNet: totalBatchNet,
        employeeCount: seededEmployeeList.length,
      };
      await payrun.save();

      console.log(`✓ Payrun created: "${payrun.name}" with ${seededEmployeeList.length} Payslips (State: ${payrun.state}).`);
    }

    const totalPayslipsCount = await Payslip.countDocuments();
    console.log(`\n✓ Total Payslips in DB across all payruns: ${totalPayslipsCount}`);

    console.log('\n====================================================');
    console.log(`🎉 MASTER SEED COMPLETED SUCCESSFULLY!`);
    console.log(`✓ Total Employees in Database: ${seededEmployeeList.length}`);
    console.log(`✓ All employee accounts set with password: password123`);
    console.log(`✓ August 2026 & September 2026 Payruns & Payslips created for ALL employees!`);
    console.log(`✓ Varied attendance & Employee Time-Off Requests seeded!`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during master seed:', error);
    process.exit(1);
  }
};

runMasterSeed();
