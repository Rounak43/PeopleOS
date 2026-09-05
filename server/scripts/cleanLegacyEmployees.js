const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const Contract = require('../models/Contract');
const User = require('../models/User');

const cleanLegacyEmployees = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected to database:', mongoUri);

    // Find employees whose codes do NOT match EMP-101 to EMP-300 pattern
    const legacyEmployees = await Employee.find({
      employeeCode: { $not: /^EMP-(1\d\d|2\d\d|300)$/ }
    });

    console.log(`Found ${legacyEmployees.length} legacy/test employee(s) to remove:`);
    legacyEmployees.forEach((e) => {
      console.log(` - Code: ${e.employeeCode} | Name: ${e.fullName} | Email: ${e.email}`);
    });

    if (legacyEmployees.length > 0) {
      const legacyIds = legacyEmployees.map((e) => e._id);
      const legacyEmails = legacyEmployees.map((e) => e.email.toLowerCase());

      await Contract.deleteMany({ employeeId: { $in: legacyIds } });
      await User.deleteMany({ $or: [{ employeeId: { $in: legacyIds } }, { email: { $in: legacyEmails } }] });
      const delRes = await Employee.deleteMany({ _id: { $in: legacyIds } });

      console.log(`✓ Cleaned up ${delRes.deletedCount} legacy employee document(s), contracts, and user accounts.`);
    }

    const remainingCount = await Employee.countDocuments();
    console.log(`\nRemaining Employees in DB: ${remainingCount}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning legacy employees:', error);
    process.exit(1);
  }
};

cleanLegacyEmployees();
