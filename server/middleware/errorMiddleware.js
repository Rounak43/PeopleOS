
const { sendError } = require('../utils/apiResponse');

const errorMiddleware = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errorCode = err.code || 'SERVER_ERROR';

  return sendError(res, message, statusCode, errorCode);
};

module.exports = errorMiddleware;
