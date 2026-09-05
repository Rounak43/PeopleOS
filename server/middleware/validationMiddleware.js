/**
 * PeopleOS — Validation Middleware
 */

const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName] || req.body[paramName] || req.query[paramName];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return sendError(res, `Invalid ObjectId format for parameter '${paramName}'`, 400, 'INVALID_INPUT');
      }
    }
    next();
  };
};

module.exports = {
  validateObjectId,
};
