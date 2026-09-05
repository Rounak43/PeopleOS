const express = require('express');
const employeePortalController = require('../controllers/employeePortalController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// All employee portal routes require authentication
router.use(authenticate);

// ── Dashboard ───────────────────────────
router.get('/dashboard', employeePortalController.getDashboard);

// ── Profile Self-Service ───────────────
router.get('/me', employeePortalController.getProfile);
router.put('/me', employeePortalController.updateProfile);

// ── Attendance ──────────────────────────
router.get('/attendance/today', employeePortalController.getTodayAttendance);
router.post('/attendance/check-in', employeePortalController.checkIn);
router.post('/attendance/check-out', employeePortalController.checkOut);
router.post('/attendance/re-entry', employeePortalController.requestReentry);
router.get('/attendance', employeePortalController.getAttendanceHistory);

// ── Leave Management ────────────────────
router.get('/leave', employeePortalController.getLeaveOverview);
router.post('/leave/requests', employeePortalController.submitLeaveRequest);

// ── Payroll / Payslips ──────────────────
router.get('/payslips', employeePortalController.getPayslips);
router.get('/payslips/:id', employeePortalController.getPayslipById);

module.exports = router;
