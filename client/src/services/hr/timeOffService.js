
import http from '../common/http';

const TYPES = '/api/time-off-types';
const ALLOCATIONS = '/api/time-off-allocations';
const REQUESTS = '/api/time-off-requests';

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
};

// ── Types ──────────────────────────────────────
export const getTimeOffTypes = () => http.get(TYPES);
export const getTimeOffTypeById = (id) => http.get(`${TYPES}/${id}`);
export const createTimeOffType = (data) => http.post(TYPES, data);
export const updateTimeOffType = (id, data) => http.put(`${TYPES}/${id}`, data);
export const deleteTimeOffType = (id) => http.del(`${TYPES}/${id}`);

// ── Allocations ────────────────────────────────
export const getAllocations = (params = {}) => http.get(`${ALLOCATIONS}${buildQueryString(params)}`);
export const getAllocationById = (id) => http.get(`${ALLOCATIONS}/${id}`);
export const createAllocation = (data) => http.post(ALLOCATIONS, data);
export const updateAllocation = (id, data) => http.put(`${ALLOCATIONS}/${id}`, data);
export const deleteAllocation = (id) => http.del(`${ALLOCATIONS}/${id}`);
export const getEmployeeAllocations = (employeeId) => http.get(`/api/employees/${employeeId}/time-off-allocations`);

// ── Requests ───────────────────────────────────
export const getRequests = (params = {}) => http.get(`${REQUESTS}${buildQueryString(params)}`);
export const getRequestById = (id) => http.get(`${REQUESTS}/${id}`);
export const createRequest = (data) => http.post(REQUESTS, data);
export const updateRequest = (id, data) => http.put(`${REQUESTS}/${id}`, data);
export const deleteRequest = (id) => http.del(`${REQUESTS}/${id}`);

export const submitRequest = (id) => http.post(`${REQUESTS}/${id}/submit`, {});
export const approveRequest = (id) => http.post(`${REQUESTS}/${id}/approve`, {});
export const refuseRequest = (id, data = {}) => http.post(`${REQUESTS}/${id}/refuse`, data);
export const getEmployeeRequests = (employeeId, params = {}) =>
  http.get(`/api/employees/${employeeId}/time-off-requests${buildQueryString(params)}`);

const timeOffService = {
  getTimeOffTypes,
  getTimeOffTypeById,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
  getAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  getEmployeeAllocations,
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  submitRequest,
  approveRequest,
  refuseRequest,
  getEmployeeRequests,
};

export default timeOffService;

