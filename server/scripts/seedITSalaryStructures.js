const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SalaryStructure = require('../models/SalaryStructure');

const IT_SALARY_STRUCTURES = [
  {
    name: 'IT Software Engineer Standard Structure',
    code: 'IT_DEV_STD',
    description: 'Standard IT engineering package with Basic, HRA, Special Allowance, Tech Bonus, and PF.',
  },
  {
    name: 'IT Tech Lead & Engineering Manager Structure',
    code: 'IT_LEAD_EXEC',
    description: 'Executive tech package including Leadership Bonus, Special Allowance, HRA, and PF.',
  },
  {
    name: 'IT Intern / Trainee Stipend Structure',
    code: 'IT_INTERN',
    description: 'Consolidated monthly stipend structure with internet & learning allowance for interns.',
  },
  {
    name: 'IT Sales & Business Development Structure',
    code: 'IT_SALES',
    description: 'Sales compensation package with base salary, variable performance commission, and travel allowance.',
  },
  {
    name: 'IT Operations & Support Shift Structure',
    code: 'IT_OPS_SUPP',
    description: 'IT support & helpdesk package with Night Shift & Rotational Shift allowances included.',
  },
];

const seedITSalaryStructures = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected to database:', mongoUri);

    let createdCount = 0;
    for (const structData of IT_SALARY_STRUCTURES) {
      const existing = await SalaryStructure.findOne({ code: structData.code });
      if (!existing) {
        await SalaryStructure.create(structData);
        createdCount++;
        console.log(`+ Created Salary Structure: [${structData.code}] ${structData.name}`);
      } else {
        console.log(`= Structure Exists: [${structData.code}] ${structData.name}`);
      }
    }

    console.log(`\n✓ Successfully seeded ${createdCount} IT Salary Structure(s).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding IT salary structures:', error);
    process.exit(1);
  }
};

seedITSalaryStructures();
