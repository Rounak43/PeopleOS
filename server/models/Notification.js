/**
 * PeopleOS — Notification Model
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientRole: {
      type: String,
      enum: ['admin', 'hr_manager', 'employee', 'all_hr', 'all'],
      default: 'employee',
    },
    recipientEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    type: {
      type: String,
      enum: ['time_off_request', 'time_off_approved', 'time_off_rejected'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    timeOffRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TimeOffRequest',
      default: null,
    },
  },
  { timestamps: true, collection: 'notifications' }
);

notificationSchema.index({ recipientEmployeeId: 1, recipientRole: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
