/**
 * PeopleOS — Role-Based Access Control (RBAC) Middleware
 *
 * Allowed roles:
 * - employee
 * - hr_manager
 * - hr_payroll_user
 * - hr_payroll_manager
 * - admin
 */

const { sendError } = require('../utils/apiResponse');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
    }

    const userRole = req.user.role;

    // Admin has superuser access
    if (userRole === 'admin') {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return sendError(
      res,
      `Access denied: Role '${userRole}' is not authorized to access this resource`,
      403,
      'FORBIDDEN'
    );
  };
};

// Check employee ownership boundary (e.g. employee accessing their own profile/attendance/timeoff)
const authorizeEmployeeSelfOrHR = (paramName = 'employeeId') => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
    }

    const userRole = req.user.role;

    if (['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'].includes(userRole)) {
      return next();
    }

    const targetEmployeeId = req.params[paramName] || req.body[paramName] || req.query[paramName];

    if (userRole === 'employee' && req.user.employeeId && targetEmployeeId && req.user.employeeId.toString() === targetEmployeeId.toString()) {
      return next();
    }

    return sendError(
      res,
      'Access denied: You can only view or manage your own records',
      403,
      'FORBIDDEN'
    );
  };
};

module.exports = {
  authorize,
  authorizeEmployeeSelfOrHR,
};
