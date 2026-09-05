/**
 * PeopleOS — Time Off Allocation Routes
 */

const express = require('express');
const timeOffAllocationController = require('../controllers/timeOffAllocationController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), timeOffAllocationController.getAllocations)
  .post(authorize('admin', 'hr_manager'), timeOffAllocationController.createAllocation);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), timeOffAllocationController.getAllocationById)
  .put(authorize('admin', 'hr_manager'), timeOffAllocationController.updateAllocation)
  .delete(authorize('admin', 'hr_manager'), timeOffAllocationController.deleteAllocation);

module.exports = router;
