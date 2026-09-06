/**
 * PeopleOS — Salary Rule Routes
 */
const express = require('express');
const salaryRuleController = require('../controllers/salaryRuleController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'), salaryRuleController.getSalaryRules)
  .post(authorize('admin', 'hr_manager'), salaryRuleController.createSalaryRule);

router
  .route('/:id')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'), salaryRuleController.getSalaryRuleById)
  .put(authorize('admin', 'hr_manager'), salaryRuleController.updateSalaryRule)
  .delete(authorize('admin', 'hr_manager'), salaryRuleController.deleteSalaryRule);

module.exports = router;
