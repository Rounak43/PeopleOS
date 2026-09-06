/**
 * PeopleOS — Comprehensive Payslip Cleanup Script
 * Deletes all 0-rupee / zero net pay slips and all duplicate payslips across all employees & payruns.
 * Also recalculates Payrun totals.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const Payrun = require('../models/Payrun');
const Payslip = require('../models/Payslip');

const runCleanup = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
  await mongoose.connect(uri);
  console.log('\n====================================================');
  console.log('🧹 PAYSLIP CLEANUP: DELETING 0 RUPEES & DUPLICATE SLIPS');
  console.log('====================================================\n');

  const totalBefore = await Payslip.countDocuments();
  console.log(`Total payslips in database before cleanup: ${totalBefore}`);

  // ── Step 1: Delete all 0-rupee / 0 net pay payslips ──────────
  console.log('\n🔍 Step 1: Scanning for 0-rupee / invalid payslips...');
  const zeroSlips = await Payslip.find({
    $or: [
      { netPay: { $lte: 0 } },
      { grossPay: { $lte: 0 } },
      { netPay: null },
      { grossPay: null },
    ],
  }).lean();

  const zeroIds = zeroSlips.map((s) => s._id);
  console.log(`Found ${zeroIds.length} zero-rupee payslips.`);

  let zeroDeletedCount = 0;
  if (zeroIds.length > 0) {
    const res = await Payslip.deleteMany({ _id: { $in: zeroIds } });
    zeroDeletedCount = res.deletedCount;
    console.log(`✓ Deleted ${zeroDeletedCount} 0-rupee payslips.`);
  }

  // ── Step 2: Delete duplicate payslips ─────────────────────────
  console.log('\n🔍 Step 2: Scanning for duplicate payslips (same employee + same period)...');
  const remainingSlips = await Payslip.find({})
    .sort({ createdAt: -1 }) // newest first
    .lean();

  console.log(`Remaining valid payslips before deduplication: ${remainingSlips.length}`);

  const groupMap = {};
  const duplicateIdsToDelete = [];

  for (const slip of remainingSlips) {
    const empId = slip.employee ? slip.employee.toString() : 'unknown';
    const pStart = slip.periodStart ? new Date(slip.periodStart).toISOString().slice(0, 10) : 'none';
    const pEnd = slip.periodEnd ? new Date(slip.periodEnd).toISOString().slice(0, 10) : 'none';
    const key = `${empId}_${pStart}_${pEnd}`;

    if (!groupMap[key]) {
      // Retain this payslip
      groupMap[key] = slip;
    } else {
      // Compare netPay: retain the one with higher netPay, delete the other
      const existing = groupMap[key];
      if ((slip.netPay || 0) > (existing.netPay || 0)) {
        duplicateIdsToDelete.push(existing._id);
        groupMap[key] = slip;
      } else {
        duplicateIdsToDelete.push(slip._id);
      }
    }
  }

  console.log(`Found ${duplicateIdsToDelete.length} duplicate payslips to delete.`);

  let dupDeletedCount = 0;
  if (duplicateIdsToDelete.length > 0) {
    const res = await Payslip.deleteMany({ _id: { $in: duplicateIdsToDelete } });
    dupDeletedCount = res.deletedCount;
    console.log(`✓ Deleted ${dupDeletedCount} duplicate payslips.`);
  }

  // ── Step 3: Clean up empty or duplicate Payruns ──────────────
  console.log('\n🔍 Step 3: Cleaning up empty payruns & updating Payrun totals...');
  const payruns = await Payrun.find({});

  for (const payrun of payruns) {
    const slipsForPayrun = await Payslip.find({ payrun: payrun._id });
    
    if (slipsForPayrun.length === 0) {
      console.log(`Removing empty payrun batch: "${payrun.name}" (${payrun._id})`);
      await Payrun.deleteOne({ _id: payrun._id });
    } else {
      const totalGross = slipsForPayrun.reduce((s, p) => s + (p.grossPay || 0), 0);
      const totalDeductions = slipsForPayrun.reduce((s, p) => s + (p.totalDeductions || 0), 0);
      const totalNet = slipsForPayrun.reduce((s, p) => s + (p.netPay || 0), 0);
      const employeeCount = slipsForPayrun.length;

      payrun.totalGross = totalGross;
      payrun.totalDeductions = totalDeductions;
      payrun.totalNet = totalNet;
      payrun.employeeCount = employeeCount;
      payrun.employees = slipsForPayrun.map(p => ({
        employee: p.employee,
        contract: p.contract || null,
      }));
      await payrun.save();
    }
  }

  const totalAfter = await Payslip.countDocuments();
  const payrunsAfter = await Payrun.countDocuments();

  console.log('\n====================================================');
  console.log('🎉 PAYSLIP CLEANUP COMPLETE');
  console.log(`✓ 0-Rupee Slips Deleted: ${zeroDeletedCount}`);
  console.log(`✓ Duplicate Slips Deleted: ${dupDeletedCount}`);
  console.log(`✓ Total Slips Deleted: ${zeroDeletedCount + dupDeletedCount}`);
  console.log(`✓ Retained Clean Payslips: ${totalAfter}`);
  console.log(`✓ Retained Payruns: ${payrunsAfter}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

runCleanup().catch((err) => {
  console.error('❌ Error during cleanup:', err);
  process.exit(1);
});
