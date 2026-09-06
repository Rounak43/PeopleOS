/**
 * PeopleOS — Employee Code Migration Script
 *
 * Scans all Employee documents in MongoDB and updates any legacy/non-conforming
 * employee codes (e.g. EMP-001, EMP-101, etc.) to the official OSYYDDNNN format (e.g. OS26DS010).
 *
 * Run: node server/scripts/migrateEmployeeCodes.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const Department = require('../models/Department');
const { generateEmployeeCode, isValidEmployeeCode } = require('../services/employeeIdService');

const migrateEmployeeCodes = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
  await mongoose.connect(mongoUri);
  console.log('[MongoDB] Connected:', mongoUri);

  console.log('\n====================================================');
  console.log('  PeopleOS — Employee ID / Code Migration (OSYYDDNNN)');
  console.log('====================================================\n');

  const employees = await Employee.find({}).populate('departmentId');
  console.log(`Found ${employees.length} employee record(s) in total.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const emp of employees) {
    if (isValidEmployeeCode(emp.employeeCode)) {
      skippedCount++;
      console.log(`  ✓ ${emp.fullName} (${emp.email}): [${emp.employeeCode}] already matches official format.`);
      continue;
    }

    const oldCode = emp.employeeCode || 'NONE';
    const dept = emp.departmentId;

    if (!dept) {
      console.warn(`  ⚠️ Employee "${emp.fullName}" (${emp._id}) has no department assigned. Skipping...`);
      errorCount++;
      continue;
    }

    // Ensure department code exists
    let deptCode = dept.code;
    if (!deptCode || deptCode.length !== 2) {
      deptCode = (dept.name.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'DS').toUpperCase();
    }

    const joinYear = emp.dateJoined ? new Date(emp.dateJoined).getFullYear() : 2026;

    try {
      const newCode = await generateEmployeeCode(joinYear, deptCode);
      emp.employeeCode = newCode;
      await emp.save();
      updatedCount++;
      console.log(`  🔄 ${emp.fullName}: Transformed [${oldCode}] ➔ [${newCode}] (Dept: ${dept.name})`);
    } catch (err) {
      console.error(`  ❌ Failed to generate employee code for ${emp.fullName}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n====================================================');
  console.log('  Employee Code Migration Summary');
  console.log(`  Already conforming: ${skippedCount}`);
  console.log(`  Updated to OSYYDDNNN: ${updatedCount}`);
  console.log(`  Errors / Skipped: ${errorCount}`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

migrateEmployeeCodes().catch((err) => {
  console.error('Migration execution error:', err);
  process.exit(1);
});
