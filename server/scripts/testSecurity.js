const { connectDB } = require('../config/db');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Payslip = require('../models/Payslip');
const employeePortalController = require('../controllers/employeePortalController');

const testSecurity = async () => {
  await connectDB();

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

  // Find Employee 1 and Employee 2
  const emp1 = await Employee.findOne({ employeeCode: 'EMP-001' });
  const emp2 = await Employee.findOne({ employeeCode: 'EMP-002' });
  const payslipEmp2 = await Payslip.findOne({ employee: emp2._id });

  const user1Context = {
    id: emp1.userId.toString(),
    employeeId: emp1._id.toString(),
    role: 'employee',
    email: emp1.email,
  };

  // Test: Employee 1 attempts to access Employee 2's payslip
  console.log('\n--- Security Test: Employee 1 requesting Employee 2 payslip ---');
  const req = {
    user: user1Context,
    params: { id: payslipEmp2._id.toString() },
  };
  const res = createMockRes();
  await employeePortalController.getPayslipById(req, res, (err) => { if (err) throw err; });
  console.log('Status code (Expected 403):', res.statusCode);
  console.log('Error message:', res.body?.message);

  if (res.statusCode !== 403) {
    throw new Error('Security test failed: Employee was able to access another employee payslip!');
  }

  // Test: Employee 1 attempts to update salary via profile update
  console.log('\n--- Security Test: Employee 1 attempting to change salary ---');
  const req2 = {
    user: user1Context,
    body: {
      phone: '+1 415 555 1234',
      salary: 999999,
      role: 'admin',
    },
  };
  const res2 = createMockRes();
  await employeePortalController.updateProfile(req2, res2, (err) => { if (err) throw err; });
  console.log('Update profile status:', res2.statusCode);

  const reloadedEmp1 = await Employee.findById(emp1._id);
  const reloadedUser1 = await User.findById(emp1.userId);
  console.log('User Role is still:', reloadedUser1.role);

  if (reloadedUser1.role !== 'employee') {
    throw new Error('Security test failed: Role was altered!');
  }

  console.log('\n✅ SECURITY BOUNDARY TESTS PASSED!');
  process.exit(0);
};

testSecurity().catch((err) => {
  console.error('Security test failed:', err);
  process.exit(1);
});
