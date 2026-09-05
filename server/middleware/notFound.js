const { sendError } = require('../utils/response');

const notFound = (req, res) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
};

module.exports = notFound;
