const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const User = require('../models/User');

const listCredentials = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);

    const users = await User.find({})
      .populate('employeeId', 'employeeCode fullName')
      .limit(15)
      .lean();

    console.log('\n--- SAMPLE USER LOGIN CREDENTIALS ---');
    users.forEach((u) => {
      console.log(`Role: [${u.role.toUpperCase()}] | Code: ${u.employeeId?.employeeCode || 'N/A'} | Email: ${u.email} | Password: password123`);
    });
    console.log('-------------------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listCredentials();
