/**
 * PeopleOS — Salary Structure Service
 */
const SalaryStructure = require('../models/SalaryStructure');

const DEFAULT_STRUCTURES = [
  {
    name: 'IT Software Engineer Standard Structure',
    code: 'IT_DEV_STD',
    description: 'Standard IT engineering package with Basic, HRA, Special Allowance, Tech Bonus, and PF',
  },
  {
    name: 'IT Tech Lead & Engineering Manager Structure',
    code: 'IT_LEAD_EXEC',
    description: 'Executive tech package including Leadership Bonus, Special Allowance, HRA, and PF',
  },
  {
    name: 'IT Intern / Trainee Stipend Structure',
    code: 'IT_INTERN',
    description: 'Consolidated monthly stipend structure with internet & learning allowance for interns',
  },
  {
    name: 'IT Sales & Business Development Structure',
    code: 'IT_SALES',
    description: 'Sales compensation package with base salary, variable performance commission, and travel allowance',
  },
  {
    name: 'IT Operations & Support Shift Structure',
    code: 'IT_OPS_SUPP',
    description: 'IT support & helpdesk package with Night Shift & Rotational Shift allowances included',
  },
];

const seedDefaultStructuresIfEmpty = async () => {
  for (const struct of DEFAULT_STRUCTURES) {
    await SalaryStructure.updateOne(
      { code: struct.code },
      { $setOnInsert: struct },
      { upsert: true }
    );
  }
};

const getSalaryStructures = async () => {
  await seedDefaultStructuresIfEmpty();
  return await SalaryStructure.find().populate('rules').sort({ name: 1 });
};

const getSalaryStructureById = async (id) => {
  const structure = await SalaryStructure.findById(id).populate('rules');
  if (!structure) {
    const err = new Error('Salary Structure not found');
    err.statusCode = 404;
    throw err;
  }
  return structure;
};

const createSalaryStructure = async (data) => {
  if (!data.name || !data.code) {
    const err = new Error('Name and Code are required for Salary Structure');
    err.statusCode = 400;
    throw err;
  }
  const existing = await SalaryStructure.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    const err = new Error(`Salary Structure with code '${data.code}' already exists`);
    err.statusCode = 400;
    throw err;
  }
  const structure = new SalaryStructure(data);
  return await structure.save();
};

const updateSalaryStructure = async (id, data) => {
  const structure = await SalaryStructure.findById(id);
  if (!structure) {
    const err = new Error('Salary Structure not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.code && data.code.toUpperCase() !== structure.code) {
    const existing = await SalaryStructure.findOne({ code: data.code.toUpperCase(), _id: { $ne: id } });
    if (existing) {
      const err = new Error(`Salary Structure with code '${data.code}' already exists`);
      err.statusCode = 400;
      throw err;
    }
  }

  Object.assign(structure, data);
  return await structure.save();
};

const deleteSalaryStructure = async (id) => {
  const structure = await SalaryStructure.findByIdAndDelete(id);
  if (!structure) {
    const err = new Error('Salary Structure not found');
    err.statusCode = 404;
    throw err;
  }
  return { id };
};

module.exports = {
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
};
