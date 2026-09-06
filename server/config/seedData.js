/**
 * PeopleOS — Initial Sample Data Seeder
 * Populates realistic sample data, salary structures, and employees.
 *
 * NOTE: Payslips are NOT seeded here. They are created via the
 * payroll compute engine (POST /api/payruns/:id/compute).
 */

const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const WorkingSchedule = require('../models/WorkingSchedule');
const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const TimeOffType = require('../models/TimeOffType');
const TimeOffAllocation = require('../models/TimeOffAllocation');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Payslip = require('../models/Payslip');
const Payrun = require('../models/Payrun');
const SalaryRule = require('../models/SalaryRule');
const SalaryStructure = require('../models/SalaryStructure');
const { hashPassword } = require('../utils/password');

/**
 * Seeds a standard Indian payroll SalaryStructure with real SalaryRules.
 * Rules are: BASIC (50%), HRA (25%), CONV (15%), SA (10%),
 * PF (12% of BASIC, deduction), ESI (0.75% of GROSS, conditional on WAGE<=21000),
 * TDS (10% GROSS if >75000, 5% if >50000, else 0).
 *
 * @returns {SalaryStructure} - the created or existing salary structure
 */
const seedSalaryStructure = async () => {
  // Skip if already seeded
  const existing = await SalaryStructure.findOne({ code: 'STANDARD_MONTHLY' });
  if (existing) {
    console.log('[Seed] ✓ Salary structure already seeded, skipping.');
    return existing;
  }

  console.log('[Seed] Seeding SalaryRules and SalaryStructure...');

  // Earnings
  const ruleBasic = await SalaryRule.create({
    code: 'BASIC',
    name: 'Basic Salary',
    category: 'Basic',
    sequence: 10,
    amountType: 'Percentage',
    amountValue: 50,
    percentageBase: 'WAGE',
    isDeduction: false,
    active: true,
  });

  const ruleHRA = await SalaryRule.create({
    code: 'HRA',
    name: 'House Rent Allowance',
    category: 'Allowance',
    sequence: 20,
    amountType: 'Percentage',
    amountValue: 25,
    percentageBase: 'WAGE',
    isDeduction: false,
    active: true,
  });

  const ruleCONV = await SalaryRule.create({
    code: 'CONV',
    name: 'Conveyance Allowance',
    category: 'Allowance',
    sequence: 30,
    amountType: 'Percentage',
    amountValue: 15,
    percentageBase: 'WAGE',
    isDeduction: false,
    active: true,
  });

  const ruleSA = await SalaryRule.create({
    code: 'SA',
    name: 'Special Allowance',
    category: 'Allowance',
    sequence: 40,
    amountType: 'Percentage',
    amountValue: 10,
    percentageBase: 'WAGE',
    isDeduction: false,
    active: true,
  });

  // Gross (computed from earnings, sequence after all earnings)
  const ruleGROSS = await SalaryRule.create({
    code: 'GROSS',
    name: 'Gross Salary',
    category: 'Gross',
    sequence: 50,
    amountType: 'Formula',
    formula: 'BASIC + HRA + CONV + SA',
    isDeduction: false,
    active: true,
  });

  // Deductions
  const rulePF = await SalaryRule.create({
    code: 'PF',
    name: 'Provident Fund (PF)',
    category: 'Deduction',
    sequence: 60,
    amountType: 'Percentage',
    amountValue: 12,
    percentageBase: 'BASIC',
    isDeduction: true,
    active: true,
  });

  const ruleESI = await SalaryRule.create({
    code: 'ESI',
    name: 'Employee State Insurance (ESI)',
    category: 'Deduction',
    sequence: 70,
    amountType: 'Percentage',
    amountValue: 0.75,
    percentageBase: 'GROSS',
    condition: 'WAGE <= 21000',
    isDeduction: true,
    active: true,
  });

  // TDS: split into slab-based conditional rules to avoid ternary operators
  // TDS_HIGH: 10% of GROSS when GROSS > 75000
  const ruleTDS_HIGH = await SalaryRule.create({
    code: 'TDS_HIGH',
    name: 'TDS - High Income Slab (10%)',
    category: 'Deduction',
    sequence: 80,
    amountType: 'Percentage',
    amountValue: 10,
    percentageBase: 'GROSS',
    condition: 'GROSS > 75000',
    isDeduction: true,
    active: true,
  });

  // TDS_MED: 5% of GROSS when 50000 < GROSS <= 75000
  const ruleTDS_MED = await SalaryRule.create({
    code: 'TDS_MED',
    name: 'TDS - Mid Income Slab (5%)',
    category: 'Deduction',
    sequence: 81,
    amountType: 'Percentage',
    amountValue: 5,
    percentageBase: 'GROSS',
    condition: 'GROSS > 50000 && GROSS <= 75000',
    isDeduction: true,
    active: true,
  });

  // Group into a Standard Monthly structure
  const structure = await SalaryStructure.create({
    name: 'Standard Monthly Payroll',
    code: 'STANDARD_MONTHLY',
    description: 'Standard Indian payroll: Basic 50%, HRA 25%, Conveyance 15%, SA 10%, PF 12% of Basic, ESI (if applicable), TDS (slab-based).',
    rules: [ruleBasic._id, ruleHRA._id, ruleCONV._id, ruleSA._id, ruleGROSS._id, rulePF._id, ruleESI._id, ruleTDS_HIGH._id, ruleTDS_MED._id],
  });

  console.log('[Seed] ✓ SalaryStructure "Standard Monthly Payroll" seeded with 9 rules.');
  return structure;
};

const seedInitialData = async () => {
  const existingCount = await Employee.countDocuments();
  let employees = [];

  if (existingCount === 0) {
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
      employeeCode: 'OS26EN001',
      fullName: 'Alexandra Chen',
      email: 'alexandra.chen@peopleos.local',
      phone: '+1 415 555 0101',
      address: '742 Evergreen Terrace, San Francisco, CA',
      departmentId: engDept._id,
      jobPositionId: posLead._id,
      workingScheduleId: schedule._id,
      status: 'active',
      bankDetails: {
        accountNo: '•••• •••• 4521',
        bankName: 'Silicon Valley Bank',
      },
    });

    const empDev = await Employee.create({
      employeeCode: 'OS26EN002',
      fullName: 'Marcus Johnson',
      email: 'marcus.j@peopleos.local',
      phone: '+1 415 555 0102',
      address: '120 Market St, San Francisco, CA',
      departmentId: engDept._id,
      jobPositionId: posDev._id,
      managerId: empLead._id,
      workingScheduleId: schedule._id,
      status: 'active',
      bankDetails: {
        accountNo: '•••• •••• 8912',
        bankName: 'Chase Bank',
      },
    });

    const empHr = await Employee.create({
      employeeCode: 'OS26HU001',
      fullName: 'Elena Rostova',
      email: 'elena.r@peopleos.local',
      phone: '+1 415 555 0103',
      address: '450 Sutter St, San Francisco, CA',
      departmentId: hrDept._id,
      jobPositionId: posHrMgr._id,
      workingScheduleId: schedule._id,
      status: 'active',
      bankDetails: {
        accountNo: '•••• •••• 3341',
        bankName: 'Wells Fargo',
      },
    });

    const empDesigner = await Employee.create({
      employeeCode: 'OS26PR001',
      fullName: 'Sophia Martinez',
      email: 'sophia.m@peopleos.local',
      phone: '+1 415 555 0104',
      address: '88 Colin P Kelly Jr St, San Francisco, CA',
      departmentId: designDept._id,
      jobPositionId: posDesigner._id,
      workingScheduleId: schedule._id,
      status: 'active',
      bankDetails: {
        accountNo: '•••• •••• 9012',
        bankName: 'Bank of America',
      },
    });

    employees = [empLead, empDev, empHr, empDesigner];

    // 6. Contracts (with salary structure attached)
    const salaryStructure = await seedSalaryStructure();
    const wages = [125000, 95000, 88000, 92000];
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      await Contract.create({
        employeeId: emp._id,
        departmentId: emp.departmentId,
        jobPositionId: emp.jobPositionId,
        workingScheduleId: schedule._id,
        salaryStructureId: salaryStructure._id,
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

      // Sample attendance for yesterday
      const now = new Date();
      const pastDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 2, 0);
      const pastCheckOut = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 30, 0);
      await Attendance.create({
        employeeId: emp._id,
        checkIn: pastDate,
        checkOut: pastCheckOut,
        workedHours: 8.47,
        status: 'present',
      });
    }

    console.log('[Seed] ✓ Successfully seeded initial PeopleOS HR demo data!');
  } else {
    employees = await Employee.find({});
  }

  // 7. Seed User accounts if not present
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[Seed] Seeding default User accounts for authentication...');

    // Admin account
    await User.create({
      email: 'admin@peopleos.local',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      isActive: true,
    });

    // Accounts for all employees
    for (const emp of employees) {
      const role = emp.email.includes('elena.r') ? 'hr_manager' : 'employee';
      const user = await User.create({
        email: emp.email.toLowerCase(),
        passwordHash: hashPassword('password123'),
        role,
        employeeId: emp._id,
        isActive: true,
      });

      emp.userId = user._id;
      await emp.save();
    }
    console.log('[Seed] ✓ Successfully seeded User accounts (passwords: admin123 / password123)!');
  }

  // 7b. Seed Alexandra Chen if missing
  let emp001 = await Employee.findOne({ $or: [{ email: 'alexandra.chen@peopleos.local' }, { employeeCode: 'OS26EN001' }] });
  if (!emp001) {
    let engDept = await Department.findOne({ name: 'Engineering' });
    if (!engDept) engDept = await Department.create({ name: 'Engineering' });
    let posLead = await JobPosition.findOne({ title: 'Engineering Lead' });
    if (!posLead) posLead = await JobPosition.create({ title: 'Engineering Lead', departmentId: engDept._id });
    let schedule = await WorkingSchedule.findOne({});
    if (!schedule) {
      schedule = await WorkingSchedule.create({
        name: 'Standard 35h Workweek',
        type: 'full_time',
        totalWeeklyHours: 35,
        lines: [],
      });
    }

    emp001 = await Employee.create({
      employeeCode: 'OS26EN001',
      fullName: 'Alexandra Chen',
      email: 'alexandra.chen@peopleos.local',
      phone: '+1 415 555 0101',
      address: '742 Evergreen Terrace, San Francisco, CA',
      departmentId: engDept._id,
      jobPositionId: posLead._id,
      workingScheduleId: schedule._id,
      status: 'active',
    });

    let u001 = await User.findOne({ email: emp001.email });
    if (!u001) {
      u001 = await User.create({
        email: emp001.email.toLowerCase(),
        passwordHash: hashPassword('password123'),
        role: 'employee',
        employeeId: emp001._id,
        isActive: true,
      });
    }
    emp001.userId = u001._id;
    await emp001.save();
    console.log('[Seed] ✓ Seeded OS26EN001 Alexandra Chen!');
  }

  let contract001 = await Contract.findOne({ employeeId: emp001._id });
  if (!contract001) {
    let engDept = await Department.findOne({ name: 'Engineering' });
    let posLead = await JobPosition.findOne({ title: 'Engineering Lead' });
    let schedule = await WorkingSchedule.findOne({});
    const salaryStructure = await seedSalaryStructure();
    contract001 = await Contract.create({
      employeeId: emp001._id,
      departmentId: engDept?._id,
      jobPositionId: posLead?._id,
      workingScheduleId: schedule?._id,
      salaryStructureId: salaryStructure._id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      wage: 125000,
      status: 'active',
    });
  } else if (!contract001.salaryStructureId) {
    // Backfill salary structure if contract exists but has no structure
    const salaryStructure = await seedSalaryStructure();
    await Contract.findByIdAndUpdate(contract001._id, { salaryStructureId: salaryStructure._id });
  }

  let vacType = await TimeOffType.findOne({ name: 'Paid Vacation' });
  if (!vacType) vacType = await TimeOffType.create({ name: 'Paid Vacation', unit: 'days', requiresAllocation: true });
  let alloc001 = await TimeOffAllocation.findOne({ employeeId: emp001._id });
  if (!alloc001) {
    await TimeOffAllocation.create({
      employeeId: emp001._id,
      timeOffTypeId: vacType._id,
      allocatedAmount: 20,
      takenAmount: 2,
      remainingAmount: 18,
      status: 'approved',
    });
  }

  // NOTE: Payslips are NOT seeded. They are created via:
  //   POST /api/payruns  (create draft)
  //   POST /api/payruns/:id/compute  (run engine)
  // This ensures real computation from SalaryRules is used.

  // 7c. Seed Samarth Suryavamshi (exact match to user request & screenshot)
  let samarth = await Employee.findOne({ $or: [{ email: 'samarth.s@peopleos.local' }, { employeeCode: 'OS26EN003' }] });
  if (!samarth) {
    const engDept = await Department.findOne({ name: 'Engineering' });
    let posEngineer = await JobPosition.findOne({ title: 'Software Engineer' });
    if (!posEngineer && engDept) {
      posEngineer = await JobPosition.create({ title: 'Software Engineer', departmentId: engDept._id });
    }
    const schedule = await WorkingSchedule.findOne({});
    const vacationType = await TimeOffType.findOne({ name: 'Paid Vacation' });
    const sickType = await TimeOffType.findOne({ name: 'Sick Leave' });

    samarth = await Employee.create({
      employeeCode: 'OS26EN003',
      fullName: 'samarth suryavamshi',
      email: 'samarth.s@peopleos.local',
      phone: '+1 415 555 7890',
      address: '42 Wallaby Way, San Francisco, CA',
      departmentId: engDept?._id,
      jobPositionId: posEngineer?._id,
      workingScheduleId: schedule?._id,
      status: 'active',
    });

    const user = await User.create({
      email: 'samarth.s@peopleos.local',
      passwordHash: hashPassword('password123'),
      role: 'employee',
      employeeId: samarth._id,
      isActive: true,
    });
    samarth.userId = user._id;
    await samarth.save();

    const salaryStructure = await seedSalaryStructure();
    await Contract.create({
      employeeId: samarth._id,
      departmentId: engDept?._id,
      jobPositionId: posEngineer?._id,
      workingScheduleId: schedule?._id,
      salaryStructureId: salaryStructure._id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      wage: 105000,
      status: 'active',
    });

    if (vacationType) {
      await TimeOffAllocation.create({
        employeeId: samarth._id,
        timeOffTypeId: vacationType._id,
        allocatedAmount: 20,
        takenAmount: 0,
        remainingAmount: 20,
        status: 'approved',
      });
    }
    if (sickType) {
      await TimeOffAllocation.create({
        employeeId: samarth._id,
        timeOffTypeId: sickType._id,
        allocatedAmount: 5,
        takenAmount: 0,
        remainingAmount: 5,
        status: 'approved',
      });
    }

    const now = new Date();
    const cIn = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 57, 0);
    const cOut = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 21, 0);
    await Attendance.create({
      employeeId: samarth._id,
      checkIn: cIn,
      checkOut: cOut,
      workedHours: 8.40,
      status: 'present',
      notes: 'Standard 8.0h • OT: +0.40 hrs',
    });
    console.log('[Seed] ✓ Seeded Samarth Suryavamshi (EMP-01JOHN20260001 / password123)!');
  }

  // Seed SalaryStructure as a standalone step (safe to call multiple times)
  await seedSalaryStructure();
};

module.exports = { seedInitialData };
