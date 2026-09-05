const User = require('../models/User');
const Employee = require('../models/Employee');
const { hashPassword, verifyPassword } = require('../utils/password');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Sign In
 * Supports Employee ID (e.g. EMP-001) OR Email + Password.
 * Backend determines user's role and associated employee profile.
 */
const signin = async (req, res, next) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.email || '';
    const password = req.body.password || '';

    if (!rawIdentifier.trim() || !password) {
      return sendError(res, 'Email/Employee ID and password are required', 400, 'VALIDATION_ERROR');
    }

    const identifier = rawIdentifier.trim();
    let user = null;
    let employee = null;

    // Check if identifier is an employee code (does not have @ or matches EMP pattern)
    if (!identifier.includes('@')) {
      // Clean up common format variations like EMP001 -> EMP-001
      const normalizedCode = identifier.includes('-')
        ? identifier
        : identifier.replace(/^(emp)(\d+)$/i, '$1-$2');

      employee = await Employee.findOne({
        employeeCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') },
      }).populate('departmentId jobPositionId');

      if (employee) {
        user = await User.findOne({
          $or: [
            { employeeId: employee._id },
            { email: employee.email.toLowerCase() },
          ],
        });
      }
    }

    // If not found yet, search User directly by email
    if (!user) {
      user = await User.findOne({ email: identifier.toLowerCase() });
      if (user && user.employeeId) {
        employee = await Employee.findById(user.employeeId).populate('departmentId jobPositionId');
      } else if (user) {
        // Also check if an employee exists with matching email
        employee = await Employee.findOne({ email: user.email.toLowerCase() }).populate('departmentId jobPositionId');
        if (employee && !user.employeeId) {
          user.employeeId = employee._id;
          await user.save();
        }
      }
    }

    if (!user) {
      return sendError(res, 'Invalid credentials provided', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      return sendError(res, 'This account is currently deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    const isValidPassword = verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return sendError(res, 'Invalid credentials provided', 401, 'INVALID_CREDENTIALS');
    }

    // Generate secure session token
    const token = `session_${user._id}_${Date.now()}`;

    const userPayload = {
      id: user._id.toString(),
      employeeId: employee ? employee._id.toString() : null,
      employeeCode: employee ? employee.employeeCode : null,
      name: employee ? employee.fullName : user.email.split('@')[0],
      email: user.email,
      role: user.role,
      department: employee?.departmentId?.name || '',
      designation: employee?.jobPositionId?.title || '',
    };

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      token,
      user: userPayload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sign Up (Account Registration)
 */
const signup = async (req, res, next) => {
  try {
    const { email, password, role = 'employee', employeeCode, fullName } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400, 'VALIDATION_ERROR');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists', 409, 'CONFLICT');
    }

    let employeeId = null;
    let employee = null;

    if (employeeCode) {
      employee = await Employee.findOne({
        employeeCode: { $regex: new RegExp(`^${employeeCode.trim()}$`, 'i') },
      }).populate('departmentId jobPositionId');
      if (employee) {
        employeeId = employee._id;
      }
    } else {
      employee = await Employee.findOne({ email: email.toLowerCase().trim() }).populate('departmentId jobPositionId');
      if (employee) {
        employeeId = employee._id;
      }
    }

    const passwordHash = hashPassword(password);
    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'employee',
      employeeId,
      isActive: true,
    });

    if (employee && !employee.userId) {
      employee.userId = newUser._id;
      await employee.save();
    }

    const token = `session_${newUser._id}_${Date.now()}`;
    const userPayload = {
      id: newUser._id.toString(),
      employeeId: employee ? employee._id.toString() : null,
      employeeCode: employee ? employee.employeeCode : null,
      name: employee ? employee.fullName : (fullName || newUser.email.split('@')[0]),
      email: newUser.email,
      role: newUser.role,
      department: employee?.departmentId?.name || '',
      designation: employee?.jobPositionId?.title || '',
    };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: userPayload,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Current Authenticated User (GET /api/auth/me)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return sendError(res, 'Unauthenticated', 401, 'UNAUTHORIZED');
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return sendError(res, 'User record not found', 404, 'NOT_FOUND');
    }

    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId).populate('departmentId jobPositionId');
    } else {
      employee = await Employee.findOne({ email: user.email }).populate('departmentId jobPositionId');
    }

    const userPayload = {
      id: user._id.toString(),
      employeeId: employee ? employee._id.toString() : null,
      employeeCode: employee ? employee.employeeCode : null,
      name: employee ? employee.fullName : user.email.split('@')[0],
      email: user.email,
      role: user.role,
      department: employee?.departmentId?.name || '',
      designation: employee?.jobPositionId?.title || '',
    };

    return sendSuccess(res, { user: userPayload }, 'Session verified');
  } catch (error) {
    next(error);
  }
};

/**
 * Log Out
 */
const logout = async (_req, res) => {
  return sendSuccess(res, null, 'Logged out successfully');
};

module.exports = {
  signin,
  signup,
  getCurrentUser,
  logout,
};
