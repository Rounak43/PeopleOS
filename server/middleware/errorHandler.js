/**
 * PeopleOS — Global Error Handler Middleware
 *
 * Catches any error passed to next(err) in Express routes.
 * Returns a consistent JSON error response.
 */

const { sendError } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the full error on the server (never expose stack to client)
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);

  // Respect a status code set on the error object, default to 500
  const statusCode = err.statusCode || err.status || 500;

  // Only expose the message for expected/operational errors
  const message =
    statusCode < 500
      ? err.message || 'Request error'
      : 'Internal Server Error';

  return sendError(res, message, statusCode);
};

module.exports = errorHandler;
