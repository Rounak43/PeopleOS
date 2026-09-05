/**
 * PeopleOS — Onboarding & Job Position Verification Script
 */

require('dotenv').config();
const { connectDB, mongoose } = require('../config/db');

const departmentService = require('../services/departmentService');
const jobPositionService = require('../services/jobPositionService');
const workingScheduleService = require('../services/workingScheduleService');
const salaryStructureService = require('../services/salaryStructureService');
const employeeService = require('../services/employeeService');
const contractService = require('../services/contractService');

const runOnboardingTest = async () => {
  console.log('====================================================');
  console.log('  PeopleOS Onboarding & Job Position Verification Test');
  console.log('====================================================');

  await connectDB();
  console.log('✓ 1. MongoDB Connected.');

  const ts = Date.now();

  try {
    // 1. Create Department
    const dept1 = await departmentService.createDepartment({ name: `Engineering_${ts}` });
    const dept2 = await departmentService.createDepartment({ name: `Finance_${ts}` });
    console.log(`✓ 2. Created Departments: ${dept1.name}, ${dept2.name}`);

    // 2. Create Job Position
    const pos1 = await jobPositionService.createJobPosition({
      title: `DevOps Engineer_${ts}`,
      departmentId: dept1._id,
    });
    console.log(`✓ 3. Created Job Position: ${pos1.title} in ${dept1.name}`);

    // 3. Test Duplicate Job Position Protection (Expect 409)
    try {
      await jobPositionService.createJobPosition({
        title: `DevOps Engineer_${ts}`,
        departmentId: dept1._id,
      });
      throw new Error('Duplicate Job Position creation was NOT rejected!');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log(`✓ 4. Duplicate Job Position check passed (409 Conflict returned: "${err.message}")`);
      } else {
        throw err;
      }
    }

    // 4. Test Job Position Department Mismatch Check (Expect 400)
    try {
      await employeeService.createEmployee({
        fullName: `Test Mismatch_${ts}`,
        email: `mismatch_${ts}@test.com`,
        departmentId: dept2._id, // Finance
        jobPositionId: pos1._id, // DevOps Engineer (in Engineering)
      });
      throw new Error('Job Position department mismatch was NOT rejected!');
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes('belong')) {
        console.log(`✓ 5. Job Position department mismatch check passed (400 Bad Request returned: "${err.message}")`);
      } else {
        throw err;
      }
    }

    // 5. Fetch Salary Structures & Working Schedule
    const structures = await salaryStructureService.getSalaryStructures();
    console.log(`✓ 6. Retrieved Salary Structures from API: ${structures.length} structure(s) available.`);

    const schedules = await workingScheduleService.getWorkingSchedules({});
    const schedId = schedules.items?.[0]?._id || null;

    // 6. Test Atomic Employee + Contract Onboarding Creation
    const onboardingResult = await employeeService.createEmployee({
      fullName: `Rahul Sharma_${ts}`,
      email: `rahul_${ts}@example.com`,
      phone: '+919876543210',
      departmentId: dept1._id,
      jobPositionId: pos1._id,
      workingScheduleId: schedId,
      status: 'active',
      address: '123 Tech Park',
      bankDetails: { accountNo: '1234567890', bankName: 'HDFC Bank' },
      contract: {
        startDate: '2026-09-01',
        endDate: null,
        durationType: 'Permanent',
        wage: 50000,
        wageFrequency: 'Monthly',
        salaryStructureId: structures[0]?._id,
        workingScheduleId: schedId,
      },
    });

    console.log(`✓ 7. Onboarded Employee successfully: ${onboardingResult.fullName} (${onboardingResult.employeeCode})`);
    console.log(`✓ 8. Created Initial Contract: Code ${onboardingResult.contract.contractCode}, Status: ${onboardingResult.contract.status}, Wage: ₹${onboardingResult.contract.wage}/${onboardingResult.contract.wageFrequency}`);

    if (onboardingResult.contract.employeeId.toString() !== onboardingResult._id.toString()) {
      throw new Error('Contract employeeId does not match created employee _id!');
    }

    // 7. Test Overlapping Active Contract Protection (Expect 409)
    try {
      await contractService.createContract({
        employeeId: onboardingResult._id,
        departmentId: dept1._id,
        jobPositionId: pos1._id,
        startDate: '2026-09-15',
        wage: 60000,
        status: 'active',
      });
      throw new Error('Overlapping contract creation was NOT rejected!');
    } catch (err) {
      if (err.statusCode === 409) {
        console.log(`✓ 9. Active Contract overlap check passed (409 Conflict returned: "${err.message}")`);
      } else {
        throw err;
      }
    }

    console.log('====================================================');
    console.log('  🎉 ONBOARDING & JOB POSITION TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

runOnboardingTest();
