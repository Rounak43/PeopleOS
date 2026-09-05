/**
 * PeopleOS — 404 Not Found Middleware
 *
 * Catches any request that did not match a registered route.
 */

const { sendError } = require('../utils/response');

const notFound = (req, res) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
};

module.exports = notFound;
