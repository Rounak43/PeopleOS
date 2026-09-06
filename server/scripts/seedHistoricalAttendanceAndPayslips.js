/**
 * PeopleOS — Historical Attendance & Payslip Seeder Script
 *
 * Populates complete historical attendance and contract-based payslips
 * for all employees from contract start date (Jan 1, 2026) to present.
 *
 * Features:
 *  - Preserves all existing attendance records ("if present leave it and add old data")
 *  - Generates varied attendance logs (Present, Overtime +2h, Undertime/Early Checkout -2h, Late, Absent)
 *  - Computes monthly payruns (Jan 2026 – Sep 2026) using real contract wage + real attendance logs
 *  - Marks historical payruns & payslips as Paid
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const SalaryStructure = require('../models/SalaryStructure');
const Attendance = require('../models/Attendance');
const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');

const { computePayrun, cleanDuplicateAndZeroPayslips } = require('../services/payrunService');

const runHistoricalSeeder = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('\n====================================================');
    console.log('🚀 SEEDING HISTORICAL ATTENDANCE & PAYSLIPS (JAN 2026 - PRESENT)');
    console.log('====================================================\n');

    const employees = await Employee.find({ status: 'active' }).lean();
    console.log(`Found ${employees.length} active employees.`);

    if (employees.length === 0) {
      console.log('No active employees found. Exiting.');
      process.exit(0);
    }

    const contracts = await Contract.find({ status: 'active' }).lean();
    const contractMap = {};
    for (const c of contracts) {
      contractMap[c.employeeId.toString()] = c;
    }

    // Default salary structure
    let defaultStructure = await SalaryStructure.findOne({ code: 'STANDARD_MONTHLY' });
    if (!defaultStructure) {
      defaultStructure = await SalaryStructure.findOne({});
    }

    // ─────────────────────────────────────────────────────────────
    // Step 1: Generate Historical Attendance (Jan 1, 2026 to Present)
    // Preserve any existing attendance records ("if present is made leave it")
    // ─────────────────────────────────────────────────────────────
    console.log('\n📅 Step 1: Generating Historical Attendance Logs (Jan 1, 2026 to Present)...');
    
    // Fetch all existing attendance checkIn dates per employee
    const existingAttendances = await Attendance.find({}).lean();
    const existingMap = new Set();
    for (const att of existingAttendances) {
      if (att.checkIn) {
        const dateKey = `${att.employeeId.toString()}_${att.checkIn.toISOString().slice(0, 10)}`;
        existingMap.add(dateKey);
      }
    }
    console.log(`Preserving ${existingAttendances.length} existing attendance records...`);

    const startDate = new Date(2026, 0, 1); // Jan 1, 2026
    const today = new Date();

    const attendanceToInsert = [];

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      const dateStr = d.toISOString().slice(0, 10);

      for (let idx = 0; idx < employees.length; idx++) {
        const emp = employees[idx];
        const dateKey = `${emp._id.toString()}_${dateStr}`;

        // "if present is made leave it and add old data" -> Skip if record already exists!
        if (existingMap.has(dateKey)) continue;

        // Pseudo-random deterministic roll for varied status (present, overtime, undertime, late, absent)
        const dayNum = d.getDate();
        const monthNum = d.getMonth();
        const roll = (idx * 11 + dayNum * 7 + monthNum * 13) % 100;

        let checkIn, checkOut, workedHours, status, notes;

        if (roll < 65) {
          // 65% Present - Standard 8.0 hrs
          checkIn = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
          checkOut = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 17, 0, 0);
          workedHours = 8.0;
          status = 'present';
          notes = 'Standard 8.0h Shift';
        } else if (roll < 80) {
          // 15% Overtime Shift (+2.0 hrs OT -> 10.0 hrs total)
          checkIn = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
          checkOut = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 19, 0, 0);
          workedHours = 10.0;
          status = 'overtime';
          notes = 'Overtime Shift (+2.0 hrs OT)';
        } else if (roll < 90) {
          // 10% Undertime / Early Checkout (6.0 hrs worked -> 2.0 hrs early checkout)
          checkIn = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
          checkOut = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 15, 0, 0);
          workedHours = 6.0;
          status = 'present';
          notes = 'Early Checkout (2.0 hrs undertime)';
        } else if (roll < 96) {
          // 6% Late Arrival (10:30 AM to 6:00 PM -> 7.5 hrs worked)
          checkIn = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 30, 0);
          checkOut = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0, 0);
          workedHours = 7.5;
          status = 'late';
          notes = 'Late Arrival (0.5 hrs undertime)';
        } else {
          // 4% Absent
          checkIn = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 0, 0);
          checkOut = null;
          workedHours = 0;
          status = 'absent';
          notes = 'Unplanned Absence';
        }

        attendanceToInsert.push({
          employeeId: emp._id,
          checkIn,
          checkOut,
          workedHours,
          status,
          notes,
        });
      }
    }

    if (attendanceToInsert.length > 0) {
      console.log(`Inserting ${attendanceToInsert.length} new historical attendance records...`);
      for (let b = 0; b < attendanceToInsert.length; b += 1000) {
        const batch = attendanceToInsert.slice(b, b + 1000);
        await Attendance.insertMany(batch, { ordered: false }).catch(() => {});
      }
      console.log('✓ Historical attendance insertion complete!');
    } else {
      console.log('✓ All attendance records up to date.');
    }

    // ─────────────────────────────────────────────────────────────
    // Step 2: Compute Monthly Payruns & Payslips according to Contract & Attendance
    // For months: Jan 2026 through Sep 2026
    // ─────────────────────────────────────────────────────────────
    console.log('\n💰 Step 2: Generating Contract & Attendance-based Monthly Payruns & Payslips...');

    const MONTHS = [
      { name: 'January 2026 Monthly Payroll', start: '2026-01-01', end: '2026-01-31' },
      { name: 'February 2026 Monthly Payroll', start: '2026-02-01', end: '2026-02-28' },
      { name: 'March 2026 Monthly Payroll', start: '2026-03-01', end: '2026-03-31' },
      { name: 'April 2026 Monthly Payroll', start: '2026-04-01', end: '2026-04-30' },
      { name: 'May 2026 Monthly Payroll', start: '2026-05-01', end: '2026-05-31' },
      { name: 'June 2026 Monthly Payroll', start: '2026-06-01', end: '2026-06-30' },
      { name: 'July 2026 Monthly Payroll', start: '2026-07-01', end: '2026-07-31' },
      { name: 'August 2026 Monthly Payroll', start: '2026-08-01', end: '2026-08-31' },
      { name: 'September 2026 Monthly Payroll', start: '2026-09-01', end: '2026-09-30' },
    ];

    const empRefs = employees.map((e) => ({
      employee: e._id,
      contract: contractMap[e._id.toString()]?._id || null,
    }));

    for (const m of MONTHS) {
      const pStart = new Date(`${m.start}T00:00:00.000Z`);
      const pEnd = new Date(`${m.end}T23:59:59.999Z`);

      let payrun = await Payrun.findOne({
        periodStart: { $gte: new Date(`${m.start}T00:00:00.000Z`) },
        periodEnd: { $lte: new Date(`${m.end}T23:59:59.999Z`) },
      });

      if (!payrun) {
        payrun = new Payrun({
          name: m.name,
          periodStart: pStart,
          periodEnd: pEnd,
          salaryStructureId: defaultStructure?._id || null,
          state: 'Draft',
          employees: empRefs,
          notes: `Monthly payroll batch for ${m.name}`,
        });
        await payrun.save();
      } else {
        payrun.state = 'Draft';
        await payrun.save();
      }

      // Compute using real computePayrun orchestrator!
      console.log(`Computing payroll for ${m.name}...`);
      await computePayrun(payrun._id);

      // Transition payrun and payslips to Paid
      await Payslip.updateMany(
        { payrun: payrun._id },
        { state: 'Paid', paymentDate: new Date(pEnd) }
      );

      payrun.state = 'Paid';
      payrun.paymentDate = new Date(pEnd);
      payrun.paidAt = new Date(pEnd);
      await payrun.save();

      console.log(`✓ Payrun "${m.name}" computed and marked as Paid.`);
    }

    // Run duplicate & 0-rupee cleanup
    await cleanDuplicateAndZeroPayslips();

    const totalPayslips = await Payslip.countDocuments();
    const totalAttendance = await Attendance.countDocuments();


    console.log('\n====================================================');
    console.log('🎉 HISTORICAL SEEDING COMPLETED SUCCESSFULLY!');
    console.log(`✓ Total Attendance Logs in DB: ${totalAttendance}`);
    console.log(`✓ Total Payslips in DB: ${totalPayslips}`);
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during historical seeding:', err);
    process.exit(1);
  }
};

runHistoricalSeeder();
