/**
 * PeopleOS — EmployeeSequence Model
 * Atomic counter for generating sequential employee IDs per year + department code.
 *
 * Document format:
 * {
 *   _id: "2026-CY",          // compound key: year-deptCode
 *   year: 2026,
 *   departmentCode: "CY",
 *   sequence: 10             // incremented atomically via $inc
 * }
 */

const mongoose = require('mongoose');

const employeeSequenceSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // e.g. "2026-CY"
    },
    year: {
      type: Number,
      required: true,
    },
    departmentCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    // No timestamps needed — this is a pure counter collection
    collection: 'employeeSequences',
  }
);

module.exports = mongoose.model('EmployeeSequence', employeeSequenceSchema);
