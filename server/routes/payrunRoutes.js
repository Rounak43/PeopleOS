/**
 * PeopleOS — Payrun API Routes
 */

const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', payrunController.getPayruns);
router.post('/', payrunController.createPayrunBatch);
router.put('/payslips/status', payrunController.updatePayslipsStatus);
router.get('/:id', payrunController.getPayrunById);
router.put('/:id/state', payrunController.updatePayrunState);
router.delete('/:id', payrunController.deletePayrun);

module.exports = router;
