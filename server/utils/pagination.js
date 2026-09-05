/**
 * PeopleOS — Pagination Utility
 */

const getPagination = (req) => {
  const page = parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
  const limit = parseInt(req.query.limit, 10) > 0 ? Math.min(parseInt(req.query.limit, 10), 100) : 20;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    limit,
    total,
    totalPages,
  };
};

module.exports = {
  getPagination,
  buildPaginationMeta,
};
