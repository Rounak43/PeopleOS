const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    /**
     * Stable 2-character uppercase department code.
     * Used as part of the PeopleOS Employee ID: OSYYDDNNN
     *
     * Rules:
     *  - Exactly 2 uppercase alphabetic characters [A-Z]{2}
     *  - Must be unique across all departments
     *  - Once assigned, NEVER changed (employee IDs reference it)
     *
     * Examples: CY, DS, HR, FN, SE, DC, QA, PD, DA, FA, SB, CS
     */
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{2}$/, 'Department code must be exactly 2 uppercase alphabetic characters (e.g. CY, HR, DS)'],
    },
    parentDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    managerEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
  },
  { timestamps: true, collection: 'departments' }
);

module.exports = mongoose.model('Department', departmentSchema);
