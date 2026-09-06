/**
 * PeopleOS — Notification Controller
 */

const Notification = require('../models/Notification');
const { sendSuccess } = require('../utils/apiResponse');

const getNotifications = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'employee';
    const employeeId = req.user?.employeeId || null;

    let query = {};

    if (['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'].includes(userRole)) {
      query = {
        $or: [
          { recipientRole: 'all_hr' },
          { recipientRole: 'all' },
          { recipientRole: userRole },
          ...(employeeId ? [{ recipientEmployeeId: employeeId }] : []),
        ],
      };
    } else {
      query = {
        $or: [
          { recipientRole: 'all' },
          ...(employeeId ? [{ recipientEmployeeId: employeeId }] : []),
        ],
      };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    return sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const userRole = req.user?.role || 'employee';
    const employeeId = req.user?.employeeId || null;

    let query = {};
    if (['admin', 'hr_manager', 'hr_payroll_user', 'hr_payroll_manager'].includes(userRole)) {
      query = {
        $or: [
          { recipientRole: 'all_hr' },
          { recipientRole: 'all' },
          { recipientRole: userRole },
          ...(employeeId ? [{ recipientEmployeeId: employeeId }] : []),
        ],
      };
    } else {
      query = {
        $or: [
          { recipientRole: 'all' },
          ...(employeeId ? [{ recipientEmployeeId: employeeId }] : []),
        ],
      };
    }

    await Notification.updateMany(query, { $set: { isRead: true } });
    return sendSuccess(res, null, 'Notifications marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
