/**
 * PeopleOS — Concurrency Test for New Employee ID System
 * Verifies OSYYDDNNN format, atomic sequence, no duplicates
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const EmployeeSequence = require('../models/EmployeeSequence');
const { generateEmployeeCode, isValidEmployeeCode, EMPLOYEE_CODE_REGEX } = require('../services/employeeIdService');

const runTest = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
  await mongoose.connect(mongoUri);
  console.log('[MongoDB] Connected\n');

  console.log('====================================================');
  console.log('  PeopleOS — Employee ID System Verification Test');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const log = (label, ok, msg) => {
    const icon = ok ? '✅' : '❌';
    console.log(`${icon} ${label}${msg ? `: ${msg}` : ''}`);
    if (ok) passed++; else failed++;
  };

  // 1. Format regex test
  const validCodes = ['OS26CY001', 'OS26SE010', 'OS27DA999', 'OS25HR001'];
  const invalidCodes = ['EMP-001', 'OS2026CY001', 'OS26cy001', 'OS26CY01', 'OS26CY0001', 'CY26OS001'];

  for (const code of validCodes) {
    log(`Valid code ${code}`, isValidEmployeeCode(code), isValidEmployeeCode(code) ? 'PASS' : 'FAIL');
  }
  for (const code of invalidCodes) {
    log(`Invalid code ${code} rejected`, !isValidEmployeeCode(code), !isValidEmployeeCode(code) ? 'PASS' : 'Should have been rejected');
  }

  // 2. Department code check
  const depts = await Department.find({ code: { $exists: true, $ne: null } });
  log(`All departments have codes`, depts.length > 0, `${depts.length} departments with codes`);

  const deptsWithoutCode = await Department.find({ $or: [{ code: null }, { code: { $exists: false } }] });
  log(`No departments missing codes`, deptsWithoutCode.length === 0,
    deptsWithoutCode.length === 0 ? 'PASS' : `${deptsWithoutCode.length} departments missing codes: ${deptsWithoutCode.map(d => d.name).join(', ')}`
  );

  // 3. Concurrency test — generate 10 IDs for same dept/year simultaneously
  console.log('\n--- Concurrency Test: 10 simultaneous SE/2026 IDs ---');
  const testDept = await Department.findOne({ code: 'SE' });
  if (!testDept) {
    console.log('⚠ No SE department found — skipping concurrency test');
  } else {
    // Record current sequence before test
    const seqBefore = await EmployeeSequence.findById('2026-SE');
    const startSeq = seqBefore?.sequence || 0;

    // Generate 10 IDs concurrently
    const promises = Array.from({ length: 10 }, () => generateEmployeeCode(2026, 'SE'));
    const results = await Promise.all(promises);

    console.log('Generated IDs:', results);

    // Verify all unique
    const unique = new Set(results);
    log('All 10 IDs are unique', unique.size === 10, `${unique.size}/10 unique`);

    // Verify all match format
    const allValid = results.every(isValidEmployeeCode);
    log('All 10 IDs match OSYYDDNNN format', allValid, allValid ? 'PASS' : results.filter(c => !isValidEmployeeCode(c)).join(', '));

    // Verify all are SE codes
    const allSE = results.every(c => c.startsWith('OS26SE'));
    log('All 10 IDs have correct dept+year prefix OS26SE', allSE, allSE ? 'PASS' : 'Some have wrong prefix');

    // Verify sequential (might not be in order due to async, but should be startSeq+1..startSeq+10)
    const seqs = results.map(c => parseInt(c.slice(6, 9), 10)).sort((a, b) => a - b);
    const expectedStart = startSeq + 1;
    const sequential = seqs.every((seq, i) => seq === expectedStart + i);
    log('IDs are sequential (no gaps)', sequential,
      sequential ? `${seqs[0]}..${seqs[seqs.length - 1]}` : `Got: ${seqs.join(', ')}`
    );
  }

  // 4. Immutability test — verify updateEmployee blocks code change
  console.log('\n--- Immutability Test ---');
  const employeeService = require('../services/employeeService');
  const sampleEmployee = await Employee.findOne({ employeeCode: { $regex: /^OS/ } });
  if (sampleEmployee) {
    try {
      await employeeService.updateEmployee(sampleEmployee._id, { employeeCode: 'OS00XX000' });
      log('employeeCode immutability check', false, 'Should have rejected code change');
    } catch (err) {
      log('employeeCode immutability check', err.statusCode === 400, err.message);
    }
  } else {
    console.log('⚠ No OS-format employees exist yet — skipping immutability test (only EMP- format in DB)');
  }

  // 5. Verify existing employees
  const totalEmployees = await Employee.countDocuments();
  const newFormatCount = await Employee.countDocuments({ employeeCode: { $regex: /^OS/ } });
  const oldFormatCount = await Employee.countDocuments({ employeeCode: { $regex: /^EMP/ } });
  console.log(`\n--- Employee Format Distribution ---`);
  console.log(`Total employees in DB:  ${totalEmployees}`);
  console.log(`New format (OS...):     ${newFormatCount}`);
  console.log(`Old format (EMP-...):   ${oldFormatCount}`);
  console.log(`(Old-format employees are existing seed data, not migrated)`);

  console.log('\n====================================================');
  console.log(`  Test Results: ${passed} passed / ${failed} failed`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
};

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
