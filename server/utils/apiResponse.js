/**
 * PeopleOS — Standard API Response Helpers
 */

const sendSuccess = (res, data = null, message = 'Success', statusCode = 200, pagination = null) => {
  const body = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    body.data = data;
  }

  if (pagination) {
    body.pagination = pagination;
  }

  return res.status(statusCode).json(body);
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errorCode = 'SERVER_ERROR', errors = null) => {
  const body = {
    success: false,
    message,
    error: errorCode,
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

module.exports = {
  sendSuccess,
  sendError,
};
