/**
 * PeopleOS — Authentication Middleware Foundation
 *
 * Reads authenticated user state from req.user or request headers (x-user-id, x-user-role, x-employee-id).
 * Provides fallback mock admin context if no headers/tokens are provided, enabling seamless API testing.
 */

const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    if (req.user) {
      return next();
    }

    const userIdHeader = req.headers['x-user-id'];
    const roleHeader = req.headers['x-user-role'];
    const employeeIdHeader = req.headers['x-employee-id'];

    if (userIdHeader) {
      const user = await User.findById(userIdHeader).select('-passwordHash');
      if (user) {
        req.user = {
          id: user._id.toString(),
          _id: user._id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId ? user.employeeId.toString() : null,
        };
        return next();
      }
    }

    // Default or header-specified user context for RBAC testing
    req.user = {
      id: userIdHeader || '000000000000000000000001',
      role: roleHeader || 'admin',
      employeeId: employeeIdHeader || null,
      email: 'admin@peopleos.local',
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
};
