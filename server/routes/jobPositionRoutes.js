/**
 * PeopleOS — Job Position Routes
 */

const express = require('express');
const jobPositionController = require('../controllers/jobPositionController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), jobPositionController.getJobPositions)
  .post(authorize('admin', 'hr_manager'), jobPositionController.createJobPosition);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), jobPositionController.getJobPositionById)
  .put(authorize('admin', 'hr_manager'), jobPositionController.updateJobPosition)
  .delete(authorize('admin', 'hr_manager'), jobPositionController.deleteJobPosition);

module.exports = router;
