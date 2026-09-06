/**
 * End-to-End Automated Test for Employee Portal Flow
 */
const { connectDB } = require('../config/db');
const { seedInitialData } = require('../config/seedData');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payslip = require('../models/Payslip');
const authController = require('../controllers/authController');
const employeePortalController = require('../controllers/employeePortalController');

const runTest = async () => {
  console.log('=== Starting End-to-End Employee Portal Test ===');
  await connectDB();
  await seedInitialData();

  // Mock res helper
  const createMockRes = () => {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      },
    };
  };

  const User = require('../models/User');
  const empUser = await User.findOne({ role: 'employee' }).populate('employeeId');
  const testCode = empUser?.employeeId?.employeeCode || empUser?.email || 'OS26EN001';

  // Test 1: Sign In with Employee ID
  console.log(`\n--- Test 1: Employee ID Sign In (${testCode}) ---`);
  const req1 = {
    body: {
      identifier: testCode,
      password: 'password123',
    },
  };
  const res1 = createMockRes();
  await authController.signin(req1, res1, (err) => { if (err) throw err; });
  console.log('Signin Status:', res1.statusCode);
  console.log('User Role:', res1.body?.user?.role);
  console.log('Employee Code:', res1.body?.user?.employeeCode);
  console.log('Token:', res1.body?.token?.substring(0, 20) + '...');

  if (res1.statusCode !== 200 || res1.body?.user?.role !== 'employee') {
    throw new Error('Test 1 failed: Expected 200 and role = employee');
  }

  const authenticatedUser = res1.body.user;

  // Test 2: Dashboard API
  console.log('\n--- Test 2: Fetch Employee Dashboard ---');
  const req2 = { user: authenticatedUser };
  const res2 = createMockRes();
  await employeePortalController.getDashboard(req2, res2, (err) => { if (err) throw err; });
  console.log('Dashboard Status:', res2.statusCode);
  console.log('Welcome Name:', res2.body?.data?.employee?.fullName);
  console.log('Department:', res2.body?.data?.employee?.department);
  console.log('Leave Balances count:', res2.body?.data?.leaveBalances?.length);
  console.log('Latest Payslip Net Pay:', res2.body?.data?.latestPayslip?.netPay);

  if (res2.statusCode !== 200) {
    throw new Error('Test 2 failed');
  }

  // Clear any existing attendance for today for clean check-in test
  const empId = (typeof authenticatedUser.employeeId === 'object' && authenticatedUser.employeeId?._id)
    ? authenticatedUser.employeeId._id
    : (authenticatedUser.employeeId || authenticatedUser._id);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  await Attendance.deleteMany({
    employeeId: empId,
    $or: [
      { checkIn: { $gte: startOfToday, $lte: endOfToday } },
      { checkOut: null },
    ],
  });

  // Test 3: Check In
  console.log('\n--- Test 3: Employee Check In ---');
  const req3 = { user: authenticatedUser };
  const res3 = createMockRes();
  await employeePortalController.checkIn(req3, res3, (err) => { if (err) throw err; });
  console.log('Check-in Status:', res3.statusCode);
  console.log('Check-in Record ID:', res3.body?.data?._id);
  console.log('Check-in Timestamp:', res3.body?.data?.checkIn);

  if (res3.statusCode !== 201) {
    throw new Error('Test 3 failed');
  }

  // Test 4: Duplicate Check In should be blocked
  console.log('\n--- Test 4: Duplicate Check In Blocked ---');
  const res4 = createMockRes();
  await employeePortalController.checkIn(req3, res4, (err) => { if (err) throw err; });
  console.log('Duplicate Check-in Status (Expected 400):', res4.statusCode);
  console.log('Message:', res4.body?.message);

  if (res4.statusCode !== 400) {
    throw new Error('Test 4 failed: Duplicate check-in was not blocked');
  }

  // Test 5: Check Out
  console.log('\n--- Test 5: Employee Check Out ---');
  const req5 = { user: authenticatedUser };
  const res5 = createMockRes();
  await employeePortalController.checkOut(req5, res5, (err) => { if (err) throw err; });
  console.log('Check-out Status:', res5.statusCode);
  console.log('Worked Hours:', res5.body?.data?.workedHours);
  console.log('Shift Completed checkOut timestamp:', res5.body?.data?.checkOut);

  if (res5.statusCode !== 200 || !res5.body?.data?.checkOut) {
    throw new Error('Test 5 failed');
  }

  // Test 6: Attendance History
  console.log('\n--- Test 6: Fetch Attendance History ---');
  const req6 = { user: authenticatedUser, query: { status: 'all' } };
  const res6 = createMockRes();
  await employeePortalController.getAttendanceHistory(req6, res6, (err) => { if (err) throw err; });
  console.log('History count:', res6.body?.data?.items?.length);
  console.log('Summary Total Days:', res6.body?.data?.summary?.totalDaysLogged);
  console.log('Summary Total Hours:', res6.body?.data?.summary?.totalHoursWorked);

  if (res6.statusCode !== 200 || res6.body?.data?.items?.length === 0) {
    throw new Error('Test 6 failed');
  }

  // Test 7: Leave Overview
  console.log('\n--- Test 7: Fetch Leave Overview ---');
  const req7 = { user: authenticatedUser };
  const res7 = createMockRes();
  await employeePortalController.getLeaveOverview(req7, res7, (err) => { if (err) throw err; });
  console.log('Leave allocations:', res7.body?.data?.allocations?.length);

  if (res7.statusCode !== 200) {
    throw new Error('Test 7 failed');
  }

  // Test 8: Payslips List
  console.log('\n--- Test 8: Fetch Payslips List ---');
  const req8 = { user: authenticatedUser };
  const res8 = createMockRes();
  await employeePortalController.getPayslips(req8, res8, (err) => { if (err) throw err; });
  console.log('Payslips found:', res8.body?.data?.length);

  if (res8.statusCode !== 200 || res8.body?.data?.length === 0) {
    throw new Error('Test 8 failed');
  }

  // Test 9: Profile Self-Service Update
  console.log('\n--- Test 9: Update Contact Info (Phone & Address) ---');
  const req9 = {
    user: authenticatedUser,
    body: {
      phone: '+1 415 555 9999',
      address: '999 Mission St, San Francisco, CA',
    },
  };
  const res9 = createMockRes();
  await employeePortalController.updateProfile(req9, res9, (err) => { if (err) throw err; });
  console.log('Profile update status:', res9.statusCode);
  console.log('Updated phone:', res9.body?.data?.phone);

  if (res9.statusCode !== 200 || res9.body?.data?.phone !== '+1 415 555 9999') {
    throw new Error('Test 9 failed');
  }

  // Test 10: Sign In with Admin Account
  console.log('\n--- Test 10: Admin Sign In ---');
  const { hashPassword } = require('../utils/password');
  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    adminUser = await User.create({
      email: 'admin@peopleos.local',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      isActive: true,
    });
  } else {
    adminUser.passwordHash = hashPassword('admin123');
    await adminUser.save();
  }

  const req10 = {
    body: {
      email: adminUser.email,
      password: 'admin123',
    },
  };
  const res10 = createMockRes();
  await authController.signin(req10, res10, (err) => { if (err) throw err; });
  console.log('Admin Signin Status:', res10.statusCode);
  console.log('Admin Role:', res10.body?.user?.role);

  if (res10.statusCode !== 200 || res10.body?.user?.role !== 'admin') {
    throw new Error('Test 10 failed');
  }

  console.log('\n✅ ALL 10 TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
};

runTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
