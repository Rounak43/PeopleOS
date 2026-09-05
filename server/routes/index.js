/**
 * PeopleOS — Central API Route Registration
 *
 * All backend routes are registered here.
 * Module routes will be added by Member 1 as each module is implemented.
 *
 * OWNER: Member 1 (Backend)
 */

const express = require('express');
const { sendSuccess } = require('../utils/response');

const router = express.Router();

// ─────────────────────────────────────────────
// Health Check
// GET /api/health
// ─────────────────────────────────────────────
router.get('/health', (req, res) => {
  sendSuccess(res, { timestamp: new Date().toISOString() }, 'PeopleOS API is running');
});

// ─────────────────────────────────────────────
// Future module routes — added by Member 1
// ─────────────────────────────────────────────
// router.use('/auth',              require('./auth'));
// router.use('/employees',         require('./employees'));
// router.use('/departments',       require('./departments'));
// router.use('/job-positions',     require('./jobPositions'));
// router.use('/working-schedules', require('./workingSchedules'));
// router.use('/contracts',         require('./contracts'));
// router.use('/attendance',        require('./attendance'));
// router.use('/time-off',          require('./timeOff'));
// router.use('/salary-structures', require('./salaryStructures'));
// router.use('/salary-rules',      require('./salaryRules'));
// router.use('/payruns',           require('./payruns'));
// router.use('/payslips',          require('./payslips'));
// router.use('/dashboard',         require('./dashboard'));

module.exports = router;
