const mongoose = require('mongoose');

const payrunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    state: {
      type: String,
      enum: ['Draft', 'Processing', 'Done', 'Cancelled'],
      default: 'Draft',
    },
    employees: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        contract: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Contract',
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payrun', payrunSchema);
