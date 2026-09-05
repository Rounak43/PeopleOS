const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      default: null,
    },
    workedHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'overtime', 'missing_checkout'],
      default: 'present',
    },
    isManualCorrection: {
      type: Boolean,
      default: false,
    },
    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true, collection: 'attendance' }
);

attendanceSchema.index({ employeeId: 1, checkIn: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
