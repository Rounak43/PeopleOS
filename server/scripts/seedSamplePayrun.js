/**
 * PeopleOS — Seed Sample September 2026 Payrun Batch
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const payrunService = require('../services/payrunService');
const Employee = require('../models/Employee');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos');
    console.log('MongoDB connected for payrun seeding...');

    // Fetch first 25 active employees
    const employees = await Employee.find({ status: 'active' }).limit(25).lean();
    if (employees.length === 0) {
      console.log('No active employees found.');
      process.exit(0);
    }

    const empIds = employees.map((e) => e._id.toString());
    console.log(`Found ${empIds.length} active employees. Generating payrun batch...`);

    const result = await payrunService.createPayrunBatch({
      name: 'September 2026 Monthly Payroll Batch',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      employeeIds: empIds,
    });

    console.log(`Successfully created Payrun Batch: ${result.payrun.name}`);
    console.log(`Generated ${result.payslipsCount} itemized payslips.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding payrun batch:', err);
    process.exit(1);
  }
};

run();
