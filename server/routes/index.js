const express = require('express');
const { mongoose } = require('../config/db');

const router = express.Router();

router.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    success: true,
    message: 'PeopleOS API is running',
    database: isConnected ? 'connected' : 'disconnected',
  });
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
