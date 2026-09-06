/**
 * Script to remove duplicate payslips for Samarth Suryavamshi
 * Retains 1 payslip for period 2026-09-01 to 2026-09-30 and deletes duplicates.
 */
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Payslip = require('../models/Payslip');

const run = async () => {
  await mongoose.connect('mongodb://localhost:27017/peopleos');
  console.log('Connected to MongoDB');

  const samarth = await Employee.findOne({ email: 'samarth.s@peopleos.local' });
  if (!samarth) {
    console.log('Employee Samarth not found');
    process.exit(1);
  }

  const slips = await Payslip.find({ employee: samarth._id }).sort({ createdAt: 1 });
  console.log(`Found ${slips.length} payslip(s) for Samarth Suryavamshi.`);

  if (slips.length > 1) {
    const keepSlip = slips[0];
    const deleteIds = slips.slice(1).map((s) => s._id);

    console.log(`Keeping payslip ID: ${keepSlip._id}`);
    console.log(`Deleting ${deleteIds.length} duplicate payslips...`);

    const res = await Payslip.deleteMany({ _id: { $in: deleteIds } });
    console.log(`Successfully deleted ${res.deletedCount} duplicate payslip(s).`);
  }

  const remaining = await Payslip.find({ employee: samarth._id });
  console.log('\n--- REMAINING PAYSLIP(S) FOR SAMARTH ---');
  console.log(JSON.stringify(remaining.map((s) => ({
    id: s._id,
    employeeName: s.employeeNameSnapshot,
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    grossPay: s.grossPay,
    totalDeductions: s.totalDeductions,
    netPay: s.netPay,
    state: s.state,
  })), null, 2));

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
