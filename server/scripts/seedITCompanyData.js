/**
 * PeopleOS — IT Company Department + Job Position Seed
 * Creates or updates departments WITH their stable 2-char codes.
 * Codes follow the PeopleOS Employee ID format: OSYYDDNNN
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');

/**
 * IT Company Structure with stable department codes.
 * Codes are permanently assigned — never change them.
 * Regex: ^[A-Z]{2}$
 */
const IT_COMPANY_STRUCTURE = [
  {
    department: 'Software Engineering',
    code: 'SE',
    positions: [
      'Full Stack Developer',
      'Frontend Engineer (React / Next.js)',
      'Backend Engineer (Node.js / Python)',
      'Mobile App Developer (React Native / Flutter)',
      'Senior Software Engineer',
      'Tech Lead',
      'Software Engineer Intern',
    ],
  },
  {
    department: 'DevOps & Cloud Infrastructure',
    code: 'DC',
    positions: [
      'DevOps Engineer',
      'Cloud Solutions Architect (AWS / Azure)',
      'Site Reliability Engineer (SRE)',
      'System Administrator',
    ],
  },
  {
    department: 'Quality Assurance (QA)',
    code: 'QA',
    positions: [
      'QA Automation Engineer',
      'Manual Test Engineer',
      'QA Lead',
    ],
  },
  {
    department: 'Product & Design',
    code: 'PD',
    positions: [
      'Product Manager',
      'UI/UX Designer',
      'Technical Product Owner',
      'Visual Designer',
    ],
  },
  {
    department: 'Data & AI',
    code: 'DA',
    positions: [
      'Data Engineer',
      'AI / Machine Learning Engineer',
      'Data Analyst',
    ],
  },
  {
    department: 'Human Resources (HR)',
    code: 'HR',
    positions: [
      'HR Manager',
      'Tech Recruiter / Talent Acquisition',
      'HR Operations Executive',
      'Employee Experience Specialist',
    ],
  },
  {
    department: 'Finance & Accounts',
    code: 'FA',
    positions: [
      'Finance Manager',
      'Senior Accountant',
      'Payroll & Accounts Executive',
    ],
  },
  {
    department: 'Sales & Business Development',
    code: 'SB',
    positions: [
      'Sales Manager',
      'Business Development Executive (BDE)',
      'Account Executive',
      'Client Relationship Manager',
    ],
  },
  {
    department: 'IT & Customer Support',
    code: 'CS',
    positions: [
      'IT Support Engineer',
      'Technical Support Specialist',
      'Customer Success Manager',
    ],
  },
];

const seedITCompanyData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected to database:', mongoUri);

    // Clean up old test departments with timestamp suffixes (e.g. Finance_17886...)
    const timestampRegex = /_\d{10,}/;
    const oldDepts = await Department.find({ name: { $regex: timestampRegex } });

    if (oldDepts.length > 0) {
      const oldDeptIds = oldDepts.map((d) => d._id);
      await JobPosition.deleteMany({ departmentId: { $in: oldDeptIds } });
      await Department.deleteMany({ _id: { $in: oldDeptIds } });
      console.log(`✓ Cleaned up ${oldDepts.length} old test department(s) with timestamp suffixes.`);
    }

    let createdDeptsCount = 0;
    let updatedDeptsCount = 0;
    let createdPositionsCount = 0;

    for (const group of IT_COMPANY_STRUCTURE) {
      // Find or create department — match by name
      let dept = await Department.findOne({
        name: { $regex: new RegExp(`^${group.department.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });

      if (!dept) {
        // Check if code is already taken by another dept
        const codeConflict = await Department.findOne({ code: group.code });
        if (codeConflict) {
          console.warn(`⚠ Code "${group.code}" already taken by "${codeConflict.name}" — skipping department "${group.department}"`);
          continue;
        }
        dept = await Department.create({ name: group.department.trim(), code: group.code });
        createdDeptsCount++;
        console.log(`+ Created Department: ${dept.name} [${dept.code}]`);
      } else {
        // Department exists — assign code if missing
        if (!dept.code) {
          const codeConflict = await Department.findOne({ code: group.code });
          if (!codeConflict) {
            dept = await Department.findByIdAndUpdate(
              dept._id,
              { $set: { code: group.code } },
              { new: true }
            );
            updatedDeptsCount++;
            console.log(`~ Updated Department Code: ${dept.name} → [${dept.code}]`);
          } else {
            console.warn(`⚠ Existing dept "${dept.name}" has no code and target code "${group.code}" is taken. Manual review needed.`);
          }
        } else {
          console.log(`= Department Exists: ${dept.name} [${dept.code}]`);
        }
      }

      // Add positions for department
      for (const posTitle of group.positions) {
        const existingPos = await JobPosition.findOne({
          departmentId: dept._id,
          title: { $regex: new RegExp(`^${posTitle.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });

        if (!existingPos) {
          await JobPosition.create({
            title: posTitle.trim(),
            departmentId: dept._id,
          });
          createdPositionsCount++;
          console.log(`  + Created Position: "${posTitle}" in [${dept.name}]`);
        }
      }
    }

    console.log('\n====================================================');
    console.log(`🎉 SEEDING COMPLETE!`);
    console.log(`✓ Departments Processed: ${IT_COMPANY_STRUCTURE.length}`);
    console.log(`✓ New Departments Added: ${createdDeptsCount}`);
    console.log(`✓ Existing Departments Updated (code added): ${updatedDeptsCount}`);
    console.log(`✓ New Job Positions Added: ${createdPositionsCount}`);
    console.log('\nDepartment Code Map:');
    IT_COMPANY_STRUCTURE.forEach((g) => console.log(`  ${g.code}  →  ${g.department}`));
    console.log('====================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding IT company departments and positions:', error);
    process.exit(1);
  }
};

seedITCompanyData();
