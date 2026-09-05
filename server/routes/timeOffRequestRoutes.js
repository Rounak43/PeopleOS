/**
 * PeopleOS — Time Off Request Routes
 */

const express = require('express');
const timeOffRequestController = require('../controllers/timeOffRequestController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

// Workflow Action Endpoints
router.post('/:id/submit', validateObjectId('id'), timeOffRequestController.submitRequest);
router.post('/:id/approve', validateObjectId('id'), authorize('admin', 'hr_manager'), timeOffRequestController.approveRequest);
router.post('/:id/refuse', validateObjectId('id'), authorize('admin', 'hr_manager'), timeOffRequestController.refuseRequest);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), timeOffRequestController.getRequests)
  .post(timeOffRequestController.createRequest);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), timeOffRequestController.getRequestById)
  .put(timeOffRequestController.updateRequest)
  .delete(timeOffRequestController.deleteRequest);

module.exports = router;
