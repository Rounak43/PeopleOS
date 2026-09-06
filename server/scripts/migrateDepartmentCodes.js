/**
 * PeopleOS — Department Code Migration Script
 *
 * One-time migration: assigns stable 2-character codes to existing departments
 * that were created before the department `code` field was added.
 *
 * Run ONCE: node server/scripts/migrateDepartmentCodes.js
 *
 * Rules:
 *  - Only updates departments that are MISSING a code (code field is null/undefined)
 *  - Does NOT update departments that already have a code
 *  - Does NOT touch any Employee records (IDs remain intact)
 *  - Uses the same known mapping as seedITCompanyData.js
 *  - For unrecognized departments, auto-suggests a unique code
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect directly to avoid circular imports
const connectAndMigrate = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/peopleos';
  await mongoose.connect(mongoUri);
  console.log('[MongoDB] Connected:', mongoUri);

  // Import models directly to avoid service layer
  const Department = mongoose.models.Department || require('../models/Department');

  // Known department → code mapping (matches seedITCompanyData.js)
  const KNOWN_CODES = {
    'software engineering': 'SE',
    'devops & cloud infrastructure': 'DC',
    'devops and cloud infrastructure': 'DC',
    'quality assurance': 'QA',
    'quality assurance (qa)': 'QA',
    'product & design': 'PD',
    'product and design': 'PD',
    'data & ai': 'DA',
    'data and ai': 'DA',
    'human resources': 'HR',
    'human resources (hr)': 'HR',
    'finance & accounts': 'FA',
    'finance and accounts': 'FA',
    'finance': 'FA',
    'sales & business development': 'SB',
    'sales and business development': 'SB',
    'it & customer support': 'CS',
    'it and customer support': 'CS',
    'customer support': 'CS',
    'engineering': 'EN',
    'marketing': 'MK',
    'operations': 'OP',
    'cybersecurity': 'CY',
    'cybersecurity & it security': 'CY',
    'data science & analytics': 'DS',
    'data science and analytics': 'DS',
  };

  /**
   * Generate a unique 2-char code for a department name not in the known map.
   */
  const autoSuggest = async (name, usedCodes) => {
    const stopWords = new Set(['and', 'or', 'the', 'of', 'for', 'in', 'at', 'to', 'a', '&']);
    const clean = name.replace(/\(.*?\)/g, '').trim();
    const words = clean
      .split(/[\s&\/\-+]+/)
      .map((w) => w.replace(/[^a-zA-Z]/g, ''))
      .filter((w) => w.length >= 2 && !stopWords.has(w.toLowerCase()));

    let base;
    if (words.length === 0) base = clean.toUpperCase().slice(0, 2);
    else if (words.length === 1) base = words[0].toUpperCase().slice(0, 2);
    else base = (words[0][0] + words[1][0]).toUpperCase();

    if (!usedCodes.has(base)) return base;

    // Try variations
    for (let i = 65; i < 91; i++) {
      const variant = base[0] + String.fromCharCode(i);
      if (!usedCodes.has(variant)) return variant;
    }
    for (let i = 65; i < 91; i++) {
      for (let j = 65; j < 91; j++) {
        const variant = String.fromCharCode(i) + String.fromCharCode(j);
        if (!usedCodes.has(variant)) return variant;
      }
    }
    throw new Error('No available 2-char codes remaining');
  };

  console.log('\n====================================================');
  console.log('  PeopleOS — Department Code Migration');
  console.log('====================================================\n');

  const allDepts = await Department.find({}).lean();
  console.log(`Total departments found: ${allDepts.length}`);

  // Build a set of codes already in use
  const usedCodes = new Set(allDepts.filter((d) => d.code).map((d) => d.code));

  let alreadyHaveCode = 0;
  let updatedWithKnown = 0;
  let updatedWithSuggested = 0;
  let errors = 0;

  for (const dept of allDepts) {
    if (dept.code) {
      alreadyHaveCode++;
      console.log(`  ✓ ${dept.name} → [${dept.code}] (already set)`);
      continue;
    }

    // Look up in known map
    const key = dept.name.toLowerCase().trim();
    let assignedCode = KNOWN_CODES[key];

    if (assignedCode) {
      if (usedCodes.has(assignedCode)) {
        console.warn(`  ⚠ Known code "${assignedCode}" for "${dept.name}" is already taken. Auto-suggesting...`);
        try {
          assignedCode = await autoSuggest(dept.name, usedCodes);
        } catch (e) {
          console.error(`  ✗ Failed to assign code for "${dept.name}": ${e.message}`);
          errors++;
          continue;
        }
      }
    } else {
      // Unknown department — auto-suggest
      try {
        assignedCode = await autoSuggest(dept.name, usedCodes);
        console.log(`  ~ Auto-suggested code for unknown dept "${dept.name}": ${assignedCode}`);
      } catch (e) {
        console.error(`  ✗ Failed to assign code for "${dept.name}": ${e.message}`);
        errors++;
        continue;
      }
    }

    // Apply the code directly bypassing the service (migration-only path)
    await mongoose.connection.collection('departments').updateOne(
      { _id: dept._id },
      { $set: { code: assignedCode } }
    );

    usedCodes.add(assignedCode);

    if (KNOWN_CODES[dept.name.toLowerCase().trim()]) {
      updatedWithKnown++;
      console.log(`  ✓ ${dept.name} → [${assignedCode}] (known mapping)`);
    } else {
      updatedWithSuggested++;
      console.log(`  ~ ${dept.name} → [${assignedCode}] (auto-suggested)`);
    }
  }

  console.log('\n====================================================');
  console.log('  Migration Complete');
  console.log(`  Already had code:      ${alreadyHaveCode}`);
  console.log(`  Updated (known map):   ${updatedWithKnown}`);
  console.log(`  Updated (auto-suggest): ${updatedWithSuggested}`);
  console.log(`  Errors:                ${errors}`);
  console.log('====================================================\n');

  if (errors > 0) {
    console.error(`⚠ ${errors} department(s) could not be assigned a code. Review above.`);
  } else {
    console.log('✅ All departments now have a 2-character code.\n');
    console.log('You can now onboard employees using the OSYYDDNNN ID format.');
  }

  await mongoose.disconnect();
};

connectAndMigrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
