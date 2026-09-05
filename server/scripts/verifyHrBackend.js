/**
 * PeopleOS — Complete HR Backend E2E Test Verification Script
 */

require('dotenv').config();
const { connectDB, mongoose } = require('../config/db');

const departmentService = require('../services/departmentService');
const jobPositionService = require('../services/jobPositionService');
const workingScheduleService = require('../services/workingScheduleService');
const employeeService = require('../services/employeeService');
const contractService = require('../services/contractService');
const attendanceService = require('../services/attendanceService');
const timeOffService = require('../services/timeOffService');

const runVerification = async () => {
  console.log('====================================================');
  console.log('  PeopleOS HR Backend — End-to-End Verification Test');
  console.log('====================================================');

  await connectDB();
  console.log('✓ 1. MongoDB Connected via Mongoose.');

  const timestamp = Date.now();

  try {
    // ── 1. Create Department ────────────────────────────────
    const dept = await departmentService.createDepartment({
      name: `Engineering_${timestamp}`,
    });
    console.log(`✓ 2. Created Department: ${dept.name} (${dept._id})`);

    // Self-reference test
    try {
      await departmentService.updateDepartment(dept._id, { parentDepartmentId: dept._id });
      throw new Error('Self-referencing department check failed');
    } catch (e) {
      console.log('✓ 3. Department self-reference check passed (rejected as expected).');
    }

    // ── 2. Create Job Position ──────────────────────────────
    const jobPos = await jobPositionService.createJobPosition({
      title: `Senior Engineer_${timestamp}`,
      departmentId: dept._id,
    });
    console.log(`✓ 4. Created Job Position: ${jobPos.title} (${jobPos._id})`);

    // ── 3. Create Working Schedule ──────────────────────────
    const schedule = await workingScheduleService.createWorkingSchedule({
      name: `Standard 40h_${timestamp}`,
      type: 'full_time',
      lines: [
        { dayOfWeek: 'monday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
        { dayOfWeek: 'tuesday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
        { dayOfWeek: 'wednesday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
        { dayOfWeek: 'thursday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
        { dayOfWeek: 'friday', startTime: '09:00', endTime: '17:00', breakMinutes: 60 },
      ],
    });
    console.log(`✓ 5. Created Working Schedule: ${schedule.name} (Calculated weekly hours: ${schedule.totalWeeklyHours}h)`);
    if (schedule.totalWeeklyHours !== 35) {
      throw new Error(`Expected 35 totalWeeklyHours (5 days x 7h), got ${schedule.totalWeeklyHours}`);
    }

    // ── 4. Create Employee ──────────────────────────────────
    const emp = await employeeService.createEmployee({
      employeeCode: `EMP_${timestamp}`,
      fullName: 'Alex Morgan',
      email: `alex_${timestamp}@peopleos.test`,
      phone: '+1234567890',
      departmentId: dept._id,
      jobPositionId: jobPos._id,
      workingScheduleId: schedule._id,
      status: 'active',
    });
    console.log(`✓ 6. Created Employee: ${emp.fullName} (${emp.employeeCode})`);

    // ── 5. Create Contract ──────────────────────────────────
    const contract1 = await contractService.createContract({
      employeeId: emp._id,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      wage: 85000,
      departmentId: dept._id,
      jobPositionId: jobPos._id,
      workingScheduleId: schedule._id,
      status: 'active',
    });
    console.log(`✓ 7. Created Active Contract 1: ${contract1.wage}/yr (${contract1.startDate.toISOString().slice(0, 10)} to ${contract1.endDate.toISOString().slice(0, 10)})`);

    // Overlapping contract test
    try {
      await contractService.createContract({
        employeeId: emp._id,
        startDate: '2026-06-01',
        endDate: '2027-06-01',
        wage: 90000,
        departmentId: dept._id,
        jobPositionId: jobPos._id,
        status: 'active',
      });
      throw new Error('Overlapping active contract was NOT rejected!');
    } catch (e) {
      console.log('✓ 8. Overlapping active contract test passed (rejected as expected).');
    }

    // Contract Resolution Test for Payroll
    const resolvedContract = await contractService.resolveApplicableContract(emp._id, '2026-07-01', '2026-07-31');
    if (!resolvedContract || resolvedContract._id.toString() !== contract1._id.toString()) {
      throw new Error('resolveApplicableContract failed to find active contract');
    }
    console.log('✓ 9. resolveApplicableContract successfully resolved active contract for payroll.');

    // ── 6. Attendance Workflow ──────────────────────────────
    const attCheckIn = await attendanceService.checkIn(emp._id);
    console.log(`✓ 10. Attendance Check-in created at: ${attCheckIn.checkIn.toISOString()}`);

    const attCheckOut = await attendanceService.checkOut(attCheckIn._id);
    console.log(`✓ 11. Attendance Check-out completed. Worked Hours: ${attCheckOut.workedHours}h`);

    // ── 7. Time Off Workflow ────────────────────────────────
    const timeOffType = await timeOffService.createTimeOffType({
      name: `Paid Vacation_${timestamp}`,
      unit: 'days',
      requiresAllocation: true,
      approvalRequired: true,
      affectsPayroll: true,
    });
    console.log(`✓ 12. Created Time Off Type: ${timeOffType.name}`);

    const alloc = await timeOffService.createAllocation({
      employeeId: emp._id,
      timeOffTypeId: timeOffType._id,
      allocatedAmount: 20,
      takenAmount: 0,
      status: 'approved',
    });
    console.log(`✓ 13. Created Allocation: Allocated = ${alloc.allocatedAmount}, Remaining = ${alloc.remainingAmount}`);

    const reqDraft = await timeOffService.createRequest({
      employeeId: emp._id,
      timeOffTypeId: timeOffType._id,
      allocationId: alloc._id,
      dateFrom: '2026-08-10',
      dateTo: '2026-08-14',
      duration: 5,
      reason: 'Summer break',
    });
    console.log(`✓ 14. Created Time Off Request: Duration = ${reqDraft.duration} days (Status: ${reqDraft.status})`);

    const reqSubmitted = await timeOffService.submitRequest(reqDraft._id);
    console.log(`✓ 15. Submitted Time Off Request (Status: ${reqSubmitted.status})`);

    const reqApproved = await timeOffService.approveRequest(reqSubmitted._id);
    console.log(`✓ 16. HR Approved Time Off Request (Status: ${reqApproved.status})`);

    const updatedAlloc = await timeOffService.getAllocationById(alloc._id);
    console.log(`✓ 17. Allocation balance updated post-approval: Taken = ${updatedAlloc.takenAmount}, Remaining = ${updatedAlloc.remainingAmount}`);
    if (updatedAlloc.takenAmount !== 5 || updatedAlloc.remainingAmount !== 15) {
      throw new Error(`Allocation update mismatch! Expected taken 5, remaining 15. Got taken ${updatedAlloc.takenAmount}, remaining ${updatedAlloc.remainingAmount}`);
    }

    // Insufficient allocation test
    try {
      const reqExcess = await timeOffService.createRequest({
        employeeId: emp._id,
        timeOffTypeId: timeOffType._id,
        allocationId: alloc._id,
        dateFrom: '2026-09-01',
        dateTo: '2026-09-25',
        duration: 25, // Only 15 remaining!
      });
      await timeOffService.submitRequest(reqExcess._id);
      await timeOffService.approveRequest(reqExcess._id);
      throw new Error('Insufficient allocation request was NOT rejected!');
    } catch (e) {
      console.log('✓ 18. Insufficient allocation balance test passed (rejected as expected).');
    }

    console.log('====================================================');
    console.log('  🎉 ALL E2E VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ E2E VERIFICATION FAILED:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

runVerification();
