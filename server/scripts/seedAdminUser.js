/**
 * PeopleOS — Seed HR Admin User Script
 */
require('dotenv').config();
const { connectDB, mongoose } = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');

const seedAdmin = async () => {
  await connectDB();
  const email = 'admin@peopleos.com';
  const existing = await User.findOne({ email });
  const passwordHash = hashPassword('admin123');

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
    console.log(`✓ Admin user '${email}' updated (password: admin123).`);
  } else {
    await User.create({
      email,
      passwordHash,
      role: 'admin',
      isActive: true,
    });
    console.log(`✓ Admin user '${email}' created (password: admin123).`);
  }

  await mongoose.connection.close();
};

seedAdmin();
