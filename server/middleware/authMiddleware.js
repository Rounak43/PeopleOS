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

    let targetUserId = req.headers['x-user-id'];
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Token format: session_<userId>_<timestamp>
      if (token && token.startsWith('session_')) {
        const parts = token.split('_');
        if (parts.length >= 2 && parts[1].length === 24) {
          targetUserId = parts[1];
        }
      }
    }

    if (targetUserId && targetUserId.length === 24) {
      try {
        const user = await User.findById(targetUserId).select('-passwordHash');
        if (user && user.isActive) {
          req.user = {
            id: user._id.toString(),
            _id: user._id,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId ? user.employeeId.toString() : null,
          };
          return next();
        }
      } catch {
        // Fall through
      }
    }

    // Allow explicit testing header overrides
    const roleHeader = req.headers['x-user-role'];
    const employeeIdHeader = req.headers['x-employee-id'];

    if (roleHeader || employeeIdHeader) {
      req.user = {
        id: targetUserId || '000000000000000000000001',
        role: roleHeader || 'admin',
        employeeId: employeeIdHeader || null,
        email: 'header@peopleos.local',
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please sign in to access this resource.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
};
