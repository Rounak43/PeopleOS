/**
 * PeopleOS — Fix HR User Account Roles Script
 */
require('dotenv').config();
const { connectDB, mongoose } = require('../config/db');
const User = require('../models/User');
const Employee = require('../models/Employee');
require('../models/Department');
require('../models/JobPosition');
const { hashPassword } = require('../utils/password');

const fixRoles = async () => {
  await connectDB();
  console.log('[Fix] Checking and updating HR account roles in database...');

  // 1. Admin account
  let adminUser = await User.findOne({ email: 'admin@peopleos.com' });
  if (!adminUser) adminUser = await User.findOne({ email: 'admin@peopleos.local' });

  if (adminUser) {
    adminUser.role = 'admin';
    adminUser.passwordHash = hashPassword('admin123');
    await adminUser.save();
    console.log('✓ Updated admin account to role: admin (password: admin123).');
  } else {
    await User.create({
      email: 'admin@peopleos.com',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      isActive: true,
    });
    console.log('✓ Created admin account (email: admin@peopleos.com, password: admin123).');
  }

  // 2. Elena Rostova / HR Manager
  let hrEmp = await Employee.findOne({ email: /elena\.r/i });
  if (!hrEmp) hrEmp = await Employee.findOne({ employeeCode: 'EMP-003' });

  if (hrEmp) {
    let hrUser = await User.findOne({
      $or: [{ employeeId: hrEmp._id }, { email: hrEmp.email.toLowerCase() }],
    });

    if (hrUser) {
      hrUser.role = 'hr_manager';
      hrUser.passwordHash = hashPassword('password123');
      await hrUser.save();
      console.log(`✓ Updated Elena Rostova (${hrEmp.email}) to role: hr_manager (password: password123).`);
    } else {
      hrUser = await User.create({
        email: hrEmp.email.toLowerCase(),
        passwordHash: hashPassword('password123'),
        role: 'hr_manager',
        employeeId: hrEmp._id,
        isActive: true,
      });
      hrEmp.userId = hrUser._id;
      await hrEmp.save();
      console.log(`✓ Created HR Manager user for Elena Rostova (email: ${hrEmp.email}, password: password123).`);
    }
  }

  await mongoose.connection.close();
  console.log('[Fix] Complete!');
};

fixRoles();
