/**
 * PeopleOS — Salary Structure Routes
 */
const express = require('express');
const salaryStructureController = require('../controllers/salaryStructureController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'), salaryStructureController.getSalaryStructures)
  .post(authorize('admin', 'hr_manager'), salaryStructureController.createSalaryStructure);

module.exports = router;
