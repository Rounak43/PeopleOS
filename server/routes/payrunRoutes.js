/**
 * PeopleOS — Payrun & Payslip API Routes
 *
 * Lifecycle endpoints:
 *   POST   /api/payruns                       Create Draft payrun
 *   GET    /api/payruns                       List payruns
 *   GET    /api/payruns/:id                   Get payrun with payslips
 *   POST   /api/payruns/:id/compute           Compute payroll (runs engine)
 *   POST   /api/payruns/:id/validate          Validate payslips
 *   POST   /api/payruns/:id/mark-paid         Mark payrun as Paid
 *   PUT    /api/payruns/:id/state             LEGACY: kept for frontend compat
 *   DELETE /api/payruns/:id                   Delete Draft/Cancelled payrun
 *
 * Payslip endpoints:
 *   GET    /api/payruns/payslips/:id          Get single payslip (HR)
 *   PUT    /api/payruns/payslips/status       LEGACY: bulk payslip status
 *
 * Employee portal endpoints:
 *   GET    /api/payruns/employee/my-payslips  Employee's own payslips
 *   GET    /api/payruns/employee/payslips/:id Employee's own payslip detail
 */

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payrunController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// ─── Employee portal (must come before /:id to avoid conflict) ─────────────
router.get('/employee/my-payslips', ctrl.getMyPayslips);
router.get('/employee/payslips/:id', ctrl.getMyPayslipById);

// ─── Payslip endpoints ──────────────────────────────────────────────────────
router.get('/all-payslips', ctrl.getAllPayslips);
router.get('/payslips/:id', ctrl.getPayslipById);
router.put('/payslips/status', ctrl.updatePayslipsStatus);   // LEGACY

// ─── Payrun list & create ───────────────────────────────────────────────────
router.get('/', ctrl.getPayruns);
router.post('/', ctrl.createPayrunBatch);

// ─── Payrun lifecycle (order matters — specific before general) ─────────────
router.post('/:id/compute', ctrl.computePayrun);
router.post('/:id/validate', ctrl.validatePayrun);
router.post('/:id/mark-paid', ctrl.markPayrunPaid);
router.put('/:id/state', ctrl.updatePayrunState);            // LEGACY
router.delete('/:id', ctrl.deletePayrun);
router.get('/:id', ctrl.getPayrunById);

module.exports = router;
