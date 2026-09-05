/**
 * PeopleOS — Employee Routes
 */

const express = require('express');
const employeeController = require('../controllers/employeeController');
const contractController = require('../controllers/contractController');
const attendanceController = require('../controllers/attendanceController');
const timeOffAllocationController = require('../controllers/timeOffAllocationController');
const timeOffRequestController = require('../controllers/timeOffRequestController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, authorizeEmployeeSelfOrHR } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'), employeeController.getEmployees)
  .post(authorize('admin', 'hr_manager'), employeeController.createEmployee);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorizeEmployeeSelfOrHR('id'), employeeController.getEmployeeById)
  .put(authorize('admin', 'hr_manager'), employeeController.updateEmployee)
  .delete(authorize('admin', 'hr_manager'), employeeController.deleteEmployee);

// Nested Employee Sub-routes
router.get('/:employeeId/contracts', validateObjectId('employeeId'), authorizeEmployeeSelfOrHR('employeeId'), contractController.getEmployeeContracts);
router.get('/:employeeId/contracts/active', validateObjectId('employeeId'), authorizeEmployeeSelfOrHR('employeeId'), contractController.getActiveEmployeeContract);
router.get('/:employeeId/attendance', validateObjectId('employeeId'), authorizeEmployeeSelfOrHR('employeeId'), attendanceController.getAttendance);
router.get('/:employeeId/time-off-allocations', validateObjectId('employeeId'), authorizeEmployeeSelfOrHR('employeeId'), timeOffAllocationController.getEmployeeAllocations);
router.get('/:employeeId/time-off-requests', validateObjectId('employeeId'), authorizeEmployeeSelfOrHR('employeeId'), timeOffRequestController.getRequests);

module.exports = router;
