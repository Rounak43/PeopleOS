/**
 * PeopleOS — Attendance Routes
 */

const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

// Special Action Endpoints
router.post('/check-in', attendanceController.checkIn);
router.post('/:id/check-out', validateObjectId('id'), attendanceController.checkOut);
router.post('/:id/correction', validateObjectId('id'), authorize('admin', 'hr_manager'), attendanceController.correctAttendance);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), attendanceController.getAttendance)
  .post(authorize('admin', 'hr_manager'), attendanceController.createAttendance);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager', 'employee'), attendanceController.getAttendanceById)
  .put(authorize('admin', 'hr_manager'), attendanceController.updateAttendance)
  .delete(authorize('admin', 'hr_manager'), attendanceController.deleteAttendance);

module.exports = router;
