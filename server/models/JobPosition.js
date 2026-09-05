const mongoose = require('mongoose');

const jobPositionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
  },
  { timestamps: true, collection: 'jobPositions' }
);

module.exports = mongoose.model('JobPosition', jobPositionSchema);
