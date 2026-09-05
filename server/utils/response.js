/**
 * PeopleOS — API Response Utilities
 * Enforces a consistent response envelope across all endpoints.
 *
 * Success:  { success: true,  data: <payload> }
 * Error:    { success: false, message: "...", errors?: [...] }
 */

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {*} data - Payload to return
 * @param {string} [message] - Optional human-readable message
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, data = null, message = 'OK', statusCode = 200) => {
  const body = { success: true };
  if (message && message !== 'OK') body.message = message;
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string} message - Error message (safe to expose to client)
 * @param {number} [statusCode=500]
 * @param {Array} [errors] - Optional array of validation errors
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
