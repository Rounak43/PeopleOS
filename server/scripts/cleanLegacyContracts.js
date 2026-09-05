const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Contract = require('../models/Contract');
const Employee = require('../models/Employee');

const cleanLegacyContracts = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected:', mongoUri);

    const validEmployees = await Employee.find({}).select('_id employeeCode').lean();
    const validEmpIdSet = new Set(validEmployees.map((e) => e._id.toString()));

    const allContracts = await Contract.find({});
    const legacyContracts = allContracts.filter((c) => {
      const isCodeValid = /^CTR-[1-3][0-9]{2}$/.test(c.contractCode);
      const isEmpValid = c.employeeId && validEmpIdSet.has(c.employeeId.toString());
      return !isCodeValid || !isEmpValid;
    });

    console.log(`Found ${legacyContracts.length} legacy contract(s) to remove.`);
    for (const ctr of legacyContracts) {
      await Contract.findByIdAndDelete(ctr._id);
      console.log(` - Deleted Contract ${ctr.contractCode} (ID: ${ctr._id})`);
    }

    const remaining = await Contract.countDocuments();
    console.log(`✓ Cleaned up legacy contracts. Remaining in DB: ${remaining}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning legacy contracts:', err);
    process.exit(1);
  }
};

cleanLegacyContracts();
