/**
 * PeopleOS — Initial Sample Data Seeder
 * Populates realistic sample data if the database is empty.
 */

const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const WorkingSchedule = require('../models/WorkingSchedule');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const TimeOffType = require('../models/TimeOffType');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const Attendance = require('../models/Attendance');

const seedInitialData = async () => {
  const existingCount = await Employee.countDocuments();
  if (existingCount > 0) {
    return; // Already has data
  }

  console.log('[Seed] Seeding initial PeopleOS HR demo data...');

  // 1. Departments
  const engDept = await Department.create({ name: 'Engineering' });
  const hrDept = await Department.create({ name: 'Human Resources' });
  const designDept = await Department.create({ name: 'Product & Design' });
  const salesDept = await Department.create({ name: 'Sales & Marketing' });

  // 2. Job Positions
  const posLead = await JobPosition.create({ title: 'Engineering Lead', departmentId: engDept._id });
  const posDev = await JobPosition.create({ title: 'Full Stack Engineer', departmentId: engDept._id });
  const posHrMgr = await JobPosition.create({ title: 'People & Culture Manager', departmentId: hrDept._id });
  const posDesigner = await JobPosition.create({ title: 'Product Designer', departmentId: designDept._id });
  const posSales = await JobPosition.create({ title: 'Account Executive', departmentId: salesDept._id });

  // 3. Working Schedule
  const schedule = await WorkingSchedule.create({
    name: 'Standard 35h Workweek',
    type: 'full_time',
    totalWeeklyHours: 35,
    lines: [
      { dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'tuesday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'wednesday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'thursday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      { dayOfWeek: 'friday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
    ],
  });

  // 4. Time Off Types
  const vacationType = await TimeOffType.create({
    name: 'Paid Vacation',
    unit: 'days',
    requiresAllocation: true,
    approvalRequired: true,
    affectsPayroll: true,
  });

  const sickType = await TimeOffType.create({
    name: 'Sick Leave',
    unit: 'days',
    requiresAllocation: true,
    approvalRequired: false,
    affectsPayroll: false,
  });

  // 5. Employees
  const empLead = await Employee.create({
    employeeCode: 'EMP-001',
    fullName: 'Alexandra Chen',
    email: 'alexandra.chen@peopleos.local',
    phone: '+1 415 555 0101',
    departmentId: engDept._id,
    jobPositionId: posLead._id,
    workingScheduleId: schedule._id,
    status: 'active',
  });

  const empDev = await Employee.create({
    employeeCode: 'EMP-002',
    fullName: 'Marcus Johnson',
    email: 'marcus.j@peopleos.local',
    phone: '+1 415 555 0102',
    departmentId: engDept._id,
    jobPositionId: posDev._id,
    managerId: empLead._id,
    workingScheduleId: schedule._id,
    status: 'active',
  });

  const empHr = await Employee.create({
    employeeCode: 'EMP-003',
    fullName: 'Elena Rostova',
    email: 'elena.r@peopleos.local',
    phone: '+1 415 555 0103',
    departmentId: hrDept._id,
    jobPositionId: posHrMgr._id,
    workingScheduleId: schedule._id,
    status: 'active',
  });

  const empDesigner = await Employee.create({
    employeeCode: 'EMP-004',
    fullName: 'Sophia Martinez',
    email: 'sophia.m@peopleos.local',
    phone: '+1 415 555 0104',
    departmentId: designDept._id,
    jobPositionId: posDesigner._id,
    workingScheduleId: schedule._id,
    status: 'active',
  });

  const employees = [empLead, empDev, empHr, empDesigner];

  // 6. Contracts
  const wages = [125000, 95000, 88000, 92000];
  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    await Contract.create({
      employeeId: emp._id,
      departmentId: emp.departmentId,
      jobPositionId: emp.jobPositionId,
      workingScheduleId: schedule._id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      wage: wages[i],
      status: 'active',
    });

    // Allocations
    await TimeOffAllocation.create({
      employeeId: emp._id,
      timeOffTypeId: vacationType._id,
      allocatedAmount: 20,
      takenAmount: 2,
      remainingAmount: 18,
      status: 'approved',
    });

    await TimeOffAllocation.create({
      employeeId: emp._id,
      timeOffTypeId: sickType._id,
      allocatedAmount: 10,
      takenAmount: 1,
      remainingAmount: 9,
      status: 'approved',
    });

    // Sample attendance for today
    const now = new Date();
    const morningCheckIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    const eveningCheckOut = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
    await Attendance.create({
      employeeId: emp._id,
      checkIn: morningCheckIn,
      checkOut: eveningCheckOut,
      workedHours: 7.0,
      status: 'present',
    });
  }

  console.log('[Seed] ✓ Successfully seeded initial PeopleOS HR demo data!');
};

module.exports = { seedInitialData };
