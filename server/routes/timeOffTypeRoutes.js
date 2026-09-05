/**
 * PeopleOS — Time Off Type Routes
 */

const express = require('express');
const timeOffTypeController = require('../controllers/timeOffTypeController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), timeOffTypeController.getTimeOffTypes)
  .post(authorize('admin', 'hr_manager'), timeOffTypeController.createTimeOffType);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), timeOffTypeController.getTimeOffTypeById)
  .put(authorize('admin', 'hr_manager'), timeOffTypeController.updateTimeOffType)
  .delete(authorize('admin', 'hr_manager'), timeOffTypeController.deleteTimeOffType);

module.exports = router;
