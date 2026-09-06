/**
 * PeopleOS — Salary Rule Backend Service
 */
const SalaryRule = require('../models/SalaryRule');

const getSalaryRules = async () => {
  return await SalaryRule.find().sort({ sequence: 1, name: 1 });
};

const getSalaryRuleById = async (id) => {
  const rule = await SalaryRule.findById(id);
  if (!rule) {
    const err = new Error('Salary Rule not found');
    err.statusCode = 404;
    throw err;
  }
  return rule;
};

const createSalaryRule = async (data) => {
  if (!data.name || !data.code || !data.category || !data.amountType) {
    const err = new Error('Name, Code, Category, and Amount Type are required for Salary Rule');
    err.statusCode = 400;
    throw err;
  }
  const existing = await SalaryRule.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    const err = new Error(`Salary Rule with code '${data.code}' already exists`);
    err.statusCode = 400;
    throw err;
  }

  if (data.category === 'Deduction') {
    data.isDeduction = true;
  }

  const rule = new SalaryRule(data);
  return await rule.save();
};

const updateSalaryRule = async (id, data) => {
  const rule = await SalaryRule.findById(id);
  if (!rule) {
    const err = new Error('Salary Rule not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.code && data.code.toUpperCase() !== rule.code) {
    const existing = await SalaryRule.findOne({ code: data.code.toUpperCase(), _id: { $ne: id } });
    if (existing) {
      const err = new Error(`Salary Rule with code '${data.code}' already exists`);
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.category === 'Deduction') {
    data.isDeduction = true;
  }

  Object.assign(rule, data);
  return await rule.save();
};

const deleteSalaryRule = async (id) => {
  const rule = await SalaryRule.findByIdAndDelete(id);
  if (!rule) {
    const err = new Error('Salary Rule not found');
    err.statusCode = 404;
    throw err;
  }
  return { id };
};

module.exports = {
  getSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
};
