/**
 * PeopleOS — Working Schedule Routes
 */

const express = require('express');
const workingScheduleController = require('../controllers/workingScheduleController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), workingScheduleController.getWorkingSchedules)
  .post(authorize('admin', 'hr_manager'), workingScheduleController.createWorkingSchedule);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), workingScheduleController.getWorkingScheduleById)
  .put(authorize('admin', 'hr_manager'), workingScheduleController.updateWorkingSchedule)
  .delete(authorize('admin', 'hr_manager'), workingScheduleController.deleteWorkingSchedule);

module.exports = router;
