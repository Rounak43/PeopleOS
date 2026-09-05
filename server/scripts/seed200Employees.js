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
const { hashPassword } = require('../utils/password');

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Neha', 'Amit', 'Sneha', 'Karan', 'Pooja',
  'Aditya', 'Riya', 'Rahul', 'Kavya', 'Siddharth', 'Ishita', 'Varun', 'Meera', 'Dev', 'Shreya',
  'Arjun', 'Tanvi', 'Manish', 'Divya', 'Deepak', 'Swati', 'Rajesh', 'Ankita', 'Nikhil', 'Bhavna',
  'Gaurav', 'Simran', 'Sanjay', 'Tarun', 'Nisha', 'Abhishek', 'Pallavi', 'Akash', 'Komal', 'Harsh',
  'Preeti', 'Kunal', 'Rashmi', 'Vivek', 'Shruti', 'Saurabh', 'Sakshi', 'Mayank', 'Rachna', 'Yash',
  'Aarti', 'Alok', 'Deepika', 'Rohit', 'Geeta', 'Sachin', 'Monika', 'Sunil', 'Kiran', 'Pankaj'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Nair', 'Patel', 'Singh', 'Trivedi', 'Joshi', 'Mehta', 'Kumar',
  'Reddy', 'Chaudhary', 'Iyer', 'Deshmukh', 'Saxena', 'Kapoor', 'Bhat', 'Rao', 'Agarwal', 'Puri',
  'Kulkarni', 'Mishra', 'Pandey', 'Sen', 'Banerjee', 'Dutta', 'Das', 'Roy', 'Chatterjee', 'Ghosh',
  'Mukherjee', 'Thakur', 'Chauhan', 'Rathore', 'Solanki', 'Yadav', 'Verma', 'Shetty', 'Hegde', 'Gowda'
];

const WORK_LOCATIONS = [
  'Hybrid (3 Days Office)',
  'Hybrid (3 Days Office)',
  'On-site (Full Office)',
  'Full Remote (WFH)'
];

const DURATION_TYPES = ['Permanent', 'Permanent', 'Permanent', 'Fixed Term', 'Intern', 'Part-time'];
const FREQUENCIES = ['Monthly', 'Monthly', 'Monthly', 'Hourly'];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seed200Employees = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected to database:', mongoUri);

    // Fetch existing departments and positions
    const departments = await Department.find({}).lean();
    if (departments.length === 0) {
      console.error('No departments found. Please run seedITCompanyData.js first.');
      process.exit(1);
    }

    const jobPositions = await JobPosition.find({}).lean();
    if (jobPositions.length === 0) {
      console.error('No job positions found. Please run seedITCompanyData.js first.');
      process.exit(1);
    }

    const salaryStructures = await SalaryStructure.find({}).lean();
    const workingSchedules = await WorkingSchedule.find({}).lean();

    const defaultSalaryStructureId = salaryStructures.length > 0 ? salaryStructures[0]._id : null;
    const defaultScheduleId = workingSchedules.length > 0 ? workingSchedules[0]._id : null;

    // Group positions by department ID
    const deptPosMap = {};
    departments.forEach((d) => {
      deptPosMap[d._id.toString()] = jobPositions.filter(
        (p) => p.departmentId.toString() === d._id.toString()
      );
    });

    const defaultPasswordHash = hashPassword('password123');
    const createdManagers = [];

    console.log('\n--- SEEDING 200 EMPLOYEES (EMP-101 to EMP-300) ---');

    for (let i = 101; i <= 300; i++) {
      const code = `EMP-${i}`;
      const firstName = getRandomItem(FIRST_NAMES);
      const lastName = getRandomItem(LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@peopleos.com`;
      const phone = `+91 ${Math.floor(6000000000 + Math.random() * 3999999999)}`;
      const address = `Block ${Math.floor(Math.random() * 50 + 1)}, IT Tech Park, Sector ${Math.floor(Math.random() * 100 + 1)}, Tech Hub City`;

      // Select Department & Position
      const dept = getRandomItem(departments);
      const positionsInDept = deptPosMap[dept._id.toString()] || [];
      const pos = positionsInDept.length > 0 ? getRandomItem(positionsInDept) : getRandomItem(jobPositions);

      // Select Manager from previously created employees (if available)
      const managerId = createdManagers.length > 5 && Math.random() > 0.3
        ? getRandomItem(createdManagers)
        : null;

      // Create Employee
      const employeeData = {
        fullName,
        email,
        phone,
        address,
        dateJoined: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28 + 1)),
        employeeCode: code,
        departmentId: dept._id,
        jobPositionId: pos._id,
        managerId,
        status: 'active',
        bankDetails: {
          accountNo: `${Math.floor(100000000000 + Math.random() * 899999999999)}`,
          bankName: getRandomItem(['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'State Bank of India', 'Kotak Mahindra Bank']),
        },
      };

      const employee = await Employee.findOneAndUpdate(
        { employeeCode: code },
        employeeData,
        { upsert: true, new: true }
      );

      createdManagers.push(employee._id);

      // Determine Duration & Wage
      const durationType = getRandomItem(DURATION_TYPES);
      const wageFrequency = durationType === 'Part-time' ? 'Hourly' : getRandomItem(FREQUENCIES);
      const wage = wageFrequency === 'Hourly'
        ? Math.floor(Math.random() * 400 + 300) // ₹300 - ₹700 / hr
        : Math.floor(Math.random() * 90000 + 35000); // ₹35,000 - ₹1,25,000 / month

      let endDate = null;
      if (durationType === 'Fixed Term') {
        endDate = new Date(employee.dateJoined.getTime() + 365 * 24 * 60 * 60 * 1000);
      } else if (durationType === 'Intern') {
        endDate = new Date(employee.dateJoined.getTime() + 180 * 24 * 60 * 60 * 1000);
      }

      // Create Contract
      const contractData = {
        employeeId: employee._id,
        contractCode: `CTR-${i}`,
        startDate: employee.dateJoined,
        endDate,
        durationType,
        departmentId: dept._id,
        jobPositionId: pos._id,
        wage,
        wageFrequency,
        salaryStructureId: defaultSalaryStructureId,
        workingScheduleId: defaultScheduleId,
        workLocation: getRandomItem(WORK_LOCATIONS),
        probationPeriodMonths: durationType === 'Intern' ? 0 : (durationType === 'Fixed Term' ? 3 : 3),
        noticePeriodDays: durationType === 'Intern' ? 15 : 30,
        overtimeAllowed: true,
        status: 'active',
      };

      await Contract.findOneAndUpdate(
        { contractCode: `CTR-${i}` },
        contractData,
        { upsert: true, new: true }
      );

      // Create User account linked to employee
      const isHR = dept.name.toLowerCase().includes('hr') || pos.title.toLowerCase().includes('hr');
      const role = isHR ? 'hr_manager' : 'employee';

      await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          email: email.toLowerCase(),
          passwordHash: defaultPasswordHash,
          role,
          employeeId: employee._id,
          isActive: true,
        },
        { upsert: true, new: true }
      );

      if ((i - 100) % 25 === 0 || i === 300) {
        console.log(`✓ Seeded ${i - 100} / 200 Employees (Current: ${code} - ${fullName} [${dept.name}])`);
      }
    }

    const totalEmployees = await Employee.countDocuments();
    const totalContracts = await Contract.countDocuments();

    console.log('\n====================================================');
    console.log(`🎉 200 EMPLOYEES SEEDED SUCCESSFULLY!`);
    console.log(`✓ Employee Code Sequence: EMP-101 to EMP-300`);
    console.log(`✓ Total Employees in DB: ${totalEmployees}`);
    console.log(`✓ Total Active Contracts in DB: ${totalContracts}`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding 200 employees:', error);
    process.exit(1);
  }
};

seed200Employees();
