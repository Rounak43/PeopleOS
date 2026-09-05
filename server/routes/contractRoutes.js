/**
 * PeopleOS — Contract Routes
 */

const express = require('express');
const contractController = require('../controllers/contractController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(authenticate);

router
  .route('/')
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'), contractController.getContracts)
  .post(authorize('admin', 'hr_manager'), contractController.createContract);

router
  .route('/:id')
  .all(validateObjectId('id'))
  .get(authorize('admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'), contractController.getContractById)
  .put(authorize('admin', 'hr_manager'), contractController.updateContract)
  .delete(authorize('admin', 'hr_manager'), contractController.deleteContract);

module.exports = router;
