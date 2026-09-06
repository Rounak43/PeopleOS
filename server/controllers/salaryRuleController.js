/**
 * PeopleOS — Salary Rule Controller
 */
const salaryRuleService = require('../services/salaryRuleService');
const { sendSuccess } = require('../utils/apiResponse');

const getSalaryRules = async (req, res, next) => {
  try {
    const rules = await salaryRuleService.getSalaryRules();
    return sendSuccess(res, rules, 'Salary rules retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getSalaryRuleById = async (req, res, next) => {
  try {
    const rule = await salaryRuleService.getSalaryRuleById(req.params.id);
    return sendSuccess(res, rule, 'Salary rule retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createSalaryRule = async (req, res, next) => {
  try {
    const rule = await salaryRuleService.createSalaryRule(req.body);
    return sendSuccess(res, rule, 'Salary rule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateSalaryRule = async (req, res, next) => {
  try {
    const rule = await salaryRuleService.updateSalaryRule(req.params.id, req.body);
    return sendSuccess(res, rule, 'Salary rule updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSalaryRule = async (req, res, next) => {
  try {
    const result = await salaryRuleService.deleteSalaryRule(req.params.id);
    return sendSuccess(res, result, 'Salary rule deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
};
