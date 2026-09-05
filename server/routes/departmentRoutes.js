/**
 * PeopleOS — Department Routes
 */

const express = require('express');
const departmentController = require('../controllers/departmentController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), departmentController.getDepartments)
  .post(authorize('admin', 'hr_manager'), departmentController.createDepartment);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), departmentController.getDepartmentById)
  .put(authorize('admin', 'hr_manager'), departmentController.updateDepartment)
  .delete(authorize('admin', 'hr_manager'), departmentController.deleteDepartment);

module.exports = router;
