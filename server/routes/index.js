/**
 * PeopleOS — Central API Route Registration
 */

const express = require('express');
const { mongoose } = require('../config/db');

const authRoutes = require('./authRoutes');
const employeePortalRoutes = require('./employeePortalRoutes');
const departmentRoutes = require('./departmentRoutes');
const jobPositionRoutes = require('./jobPositionRoutes');
const workingScheduleRoutes = require('./workingScheduleRoutes');
const employeeRoutes = require('./employeeRoutes');
const contractRoutes = require('./contractRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const timeOffTypeRoutes = require('./timeOffTypeRoutes');
const timeOffAllocationRoutes = require('./timeOffAllocationRoutes');
const timeOffRequestRoutes = require('./timeOffRequestRoutes');
const salaryStructureRoutes = require('./salaryStructureRoutes');
const payrunRoutes = require('./payrunRoutes');

const router = express.Router();

// ─────────────────────────────────────────────
// Health Check
// GET /api/health
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    success: true,
    message: 'PeopleOS API is running',
    database: isConnected ? 'connected' : 'disconnected',
  });
});

// ─────────────────────────────────────────────
// Authentication & Employee Portal Routes
// ─────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/employee', employeePortalRoutes);

// ─────────────────────────────────────────────
// HR Management Routes
// ─────────────────────────────────────────────
router.use('/departments', departmentRoutes);
router.use('/job-positions', jobPositionRoutes);
router.use('/working-schedules', workingScheduleRoutes);
router.use('/salary-structures', salaryStructureRoutes);
router.use('/payruns', payrunRoutes);
router.use('/employees', employeeRoutes);
router.use('/contracts', contractRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/time-off-types', timeOffTypeRoutes);
router.use('/time-off-allocations', timeOffAllocationRoutes);
router.use('/time-off-requests', timeOffRequestRoutes);

module.exports = router;
