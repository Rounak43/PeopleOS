/**
 * PeopleOS — Global Error Handler Middleware
 */

const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.code || 'SERVER_ERROR';

  return sendError(res, message, statusCode, errorCode);
};

module.exports = errorHandler;
